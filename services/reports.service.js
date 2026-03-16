import xlsx from "xlsx";
import pLimit from "p-limit";
import db from "#root/db.js";
import mssql from "mssql";
import { reportRepository } from "#repositories/index.js";
import * as utilsDate from "#utils/date.js";

/** @import { reportsSchema } from "#schemas/report.schema.js" */
/** @import { InferType } from "yup" */

const sheetName = "Отчеты";

/** @type {xlsx.ParsingOptions} */
const xlsxParseOptions = {
  sheets: sheetName,
  cellHTML: false,
  cellFormula: false,
  cellDates: true,
  dateNF: "yyyy-mm-dd"
};

export const reportsService = {
  /**
   * Читает файл Excel и возвращает данные о репорте в массиве
   *
   * @param {string} filepath
   * @returns {ParsedReport[]}
   */
  parseExcelFile(filepath) {
    const workbook = xlsx.readFile(filepath, xlsxParseOptions);
    const sheet = workbook.Sheets[sheetName];

    /** @type {ParsedReport[]} */
    const reports = [];

    if (!sheet) throw new Error("Invalid reports workbook.");

    const data = xlsx.utils.sheet_to_json(sheet, { raw: false, blankrows: true, header: "A" });

    for (let i = 0; i < data.length; i++) {
      const cols = Object.keys(data[i]);

      if (i === 0) continue;

      /** Несинхронизированные помеченные отчеты */
      if ("G" in data[i] && data[i]["G"] === "r") {
        reports.push({
          date: data[i][cols[0]],
          equipment: data[i][cols[1]],
          reason_call: data[i][cols[3]].split("\r\r\n")[1] || "",
          job_description: data[i][cols[4]].split("\r\r\n")[1] || "",
          root_cause: data[i]["F"] || "",
          applicantName: data[i][cols[3]].split("\r\r\n")[0] || "",
          executorNames: data[i][cols[4]].split("\r\r\n")[0] || "",
          rowNum: data[i].__rowNum__ + 1,
          isMarked: true
        });

        continue;
      }

      /** Остальные отчеты */
      reports.push({
        date: data[i][cols[0]],
        equipment: data[i][cols[1]],
        reason_call: parseReasonCallAndJobDesc(data[i][cols[3]]).trim(),
        job_description: parseReasonCallAndJobDesc(data[i][cols[4]]).trim(),
        root_cause: data[i]["F"] || "",
        applicantName: parseNames(data[i][cols[3]]).trim(),
        executorNames: parseNames(data[i][cols[4]]).trim(),
        rowNum: data[i].__rowNum__ + 1
      });
    }

    return reports;
  },

  /**
   * Проверяет отчет на наличие связей с БД АСУ и возвращает
   * этот отчет с устанновленными связями или без них
   *
   * @param {ParsedReport} report
   * @param {() => boolean} cancelCondFn
   * @returns {Promise<ParsedReport>}
   */
  async checkReportLinks(report, cancelCondFn) {
    const executorSurnames = extractSurnamesFromExecutorField(report.executorNames);
    if (cancelCondFn()) return Promise.reject("Report check rejected");

    const equipment = await db.request()
      .query(`select t1.id, t1.name, t1.location_id, t3.name as base_location_name, t2.name as location_name, t2.base_location_id 
              from dbo.asu_system_api_subsystemlist as t1
                left join dbo.asu_system_api_location as t2 on t2.id = t1.location_id 
                left join dbo.asu_system_api_baselocation as t3 on t3.id = t2.base_location_id
              where t1.name like N'%${report.equipment}%';
          `);

    const applicant = await db
      .request()
      .query(
        `select id, name from dbo.gpp_report_api_applicant where name like N'${report.applicantName.split(" ")[0]}%';`
      );

    /** @type {ExecutorModel[]} */
    const executors = [];

    for (const eSurname of executorSurnames) {
      if (eSurname) {
        const executor = await db
          .request()
          .query(
            `select id, surname + ' ' + name + ' ' + patronymic as fullname from user_user where surname like N'%${eSurname}%';`
          );
        if (executor.recordset.length !== 0) {
          executors.push({ id: executor.recordset[0].id, fullname: executor.recordset[0].fullname });
        }
      }
    }

    const hasEquipmentLink = equipment.recordset.length !== 0;
    const hasApplicantLink = applicant.recordset.length !== 0;

    const location =
      hasEquipmentLink && equipment.recordset[0].location_id
        ? {
            id: equipment.recordset[0].location_id,
            name: equipment.recordset[0].location_name,
            base_location_name: equipment.recordset[0].base_location_name,
            base_location: equipment.recordset[0].base_location_id
          }
        : null;

    return {
      ...report,
      executors,
      equipment: hasEquipmentLink
        ? { id: equipment.recordset[0].id, name: equipment.recordset[0].name, location }
        : null,
      applicant: hasApplicantLink ? { id: applicant.recordset[0].id, name: applicant.recordset[0].name } : null
    };
  },

  /**
   * Проверяет связи отчетов с БД и возвращает результат
   *
   * @param {ParsedReport[]} reports
   * @param {() => boolean} cancelCondFn
   * @param {(report: ParsedReport) => Promise<void> | void} [progressCb]
   */
  analyzeParseResult(reports, cancelCondFn, progressCb) {
    const limit = pLimit(10);
    const result = { reportsFullfilled: 0 };

    return {
      result,
      reports: reports.map((report) =>
        limit(async () => {
          const checkedReport = await this.checkReportLinks(report, cancelCondFn);
          const isEquipmentLinked = checkedReport.equipment instanceof Object;
          const isApplicantLinked = checkedReport.applicant instanceof Object;
          const isExecutorsLinked = checkedReport.executors && checkedReport.executors.length !== 0;

          if (isEquipmentLinked && isApplicantLinked && isExecutorsLinked) {
            result.reportsFullfilled++;
          }

          progressCb && (await progressCb(checkedReport));
          return checkedReport;
        })
      )
    };
  },

  /**
   * @param {InferType<typeof reportsSchema>['reports']} inReports
   */
  async syncReportsWithDatabase(inReports) {
    const trx = new mssql.Transaction(db);
    const reports = await reportRepository.getAll();

    /**
     * 3. установить связь добавленных отчетов с исполнителями и завершить транзакцию
     */

    /** Отфильтровывание дубликатов по полям. */
    const filteredInReports = inReports.filter((inputR) => {
      const isDub = reports.some((dbR) => {
        return (
          inputR.reason_call === dbR.reason_call &&
          inputR.job_description === dbR.job_description &&
          inputR.root_cause === dbR.root_cause &&
          inputR.equipment?.id == dbR.equipment_id &&
          inputR.applicant?.id == dbR.applicant_id
        );
      });
      return !isDub;
    });

    if (filteredInReports.length === 0) return 0;

    try {
      await trx.begin();
      const countRows = await reportRepository.bulk(
        filteredInReports.map((r) => {
          const reportDate = new Date(r.date || "");
          return {
            applicant_id: r.applicant?.id || null,
            equipment_id: r.equipment?.id || null,
            date: utilsDate.isDateValid(reportDate) ? reportDate : new Date("2016-10-24"),
            job_description: r.job_description || "",
            reason_call: r.reason_call || "",
            root_cause: r.root_cause || ""
          };
        }),
        trx
      );
      // filteredInReports.map((r) => ({ [r.]: "" }));
      // await reportRepository.attachExecutors()
      await trx.commit();
      return countRows;
    } catch (error) {
      console.error(error);
      await trx.rollback();
      throw error;
    }
  }
};

function parseReasonCallAndJobDesc(str = "") {
  const splitted = splitLongSpacedSentence(str);
  if (splitted.length > 1) return splitted.slice(1).join(" ");
  return str.split("\r\n").slice(1).join(" ");
}

function parseNames(str = "") {
  const splitted = splitLongSpacedSentence(str);
  if (splitted.length > 1) return splitted[0];
  return str.split("\r\n")[0];
}

/** @param {string} str */
function extractSurnamesFromExecutorField(str) {
  return str
    .replaceAll(",", "")
    .split(/(?:.\..\.)|(?:.\..\s)|(?:.\.\s.\.)|(?:.\..)/g)
    .map((s) => s.trim());
}

/**
 * @param {string} str
 * @param {number} min
 */
function splitLongSpacedSentence(str, min = 5) {
  return str.split(new RegExp(`\\s{${min},}`));
}
