import { BadRequestError, ServiceUnavailableError } from "#root/http-server/index.js";
import db from "#root/db.js";
import xlsx from "xlsx";
import pLimit from "p-limit";
import { clients } from "#root/index.js";
import { serializeError } from "serialize-error";

const sheetName = "Отчеты";
const limit = pLimit(10);

/** @type {xlsx.ParsingOptions} */
const xlsxParseOptions = {
  sheets: sheetName,
  cellHTML: false,
  cellFormula: false,
  cellDates: true,
  dateNF: "yyyy-mm-dd"
};

/**
 * URL: /api/reports_excel_file_parse
 * Method: POST
 * Description: Принимает на вход файл отчетов в формате Excel, парсит его, проверяет связи с БД,
 *              отдает идентификатор на статус парсинга.
 *
 * @type {import("#root/http-server/types/http-server.js").HttpRouteHandler}
 */
export default async (ctx) => {
  const { res, params } = ctx;
  const clientId = params.get("clientId");

  if (!ctx.data) throw new BadRequestError("Cannot proceed uploaded file");
  if (!clientId) throw new BadRequestError('"clientId" parameter is required');

  const [, files] = ctx.data;
  const excelFilePath = files?.report?.at(0)?.filepath;
  const sseClientRes = clients.get(clientId);

  if (!sseClientRes) throw new ServiceUnavailableError("Cannot proceed request due to unknown client");

  let isSseClientClosed = false;

  sseClientRes.res.on("close", () => (isSseClientClosed = true));

  /** @type {ReportModel[]} */
  const reports = [];

  let parseResultCount = { equipments: 0, applicants: 0, executors: 0, reportsFullfilled: 0 };

  // res.res.setHeaders(
  //   new Headers({
  //     Connection: "keep-alive",
  //     "Cache-Control": "no-cache",
  //     "Content-Type": "text/event-stream"
  //   })
  // );

  // ctx.res.res.on("close", () => (isReqClosed = true));

  if (excelFilePath) {
    const workbook = xlsx.readFile(excelFilePath, xlsxParseOptions);
    const sheet = workbook.Sheets[sheetName];

    console.log();

    if (!sheet) throw new Error("Invalid reports workbook.", { cause: { statusCode: 400 } });

    res.sendJson({ message: "OK" });

    const data = xlsx.utils.sheet_to_json(sheet, { raw: false, blankrows: true });

    for (let i = 0; i < data.length; i++) {
      const cols = Object.keys(data[i]);

      if (i === 0) continue;

      /** Несинхронизированные помеченные отчеты */
      if ("__EMPTY_3" in data[i] && data[i]["__EMPTY_3"] === "r") {
        reports.push({
          date: data[i][cols[0]],
          equipment: data[i][cols[1]],
          reason_call: data[i][cols[3]].split("\r\r\n")[1] || "",
          job_description: data[i][cols[4]].split("\r\r\n")[1] || "",
          root_cause: data[i]["__EMPTY_2"] || "",
          applicantName: data[i][cols[3]].split("\r\r\n")[0] || "",
          executorNames: data[i][cols[4]].split("\r\r\n")[0] || "",
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
        root_cause: data[i]["__EMPTY_2"] || "",
        applicantName: parseNames(data[i][cols[3]]).trim(),
        executorNames: parseNames(data[i][cols[4]]).trim()
      });
    }

    const requests = reports.map((report) =>
      limit(() => {
        return checkReportAssigments(
          report,
          (checkedReport) => {
            const isEquipmentLinked = checkedReport.equipment instanceof Object;
            const isApplicantLinked = checkedReport.applicant instanceof Object;
            const isExecutorsLinked = checkedReport.executors && checkedReport.executors.length !== 0;

            if (isEquipmentLinked) parseResultCount.equipments++;
            if (isApplicantLinked) parseResultCount.applicants++;
            if (isExecutorsLinked) parseResultCount.executors += checkedReport.executors?.length || 0;
            if (isEquipmentLinked && isApplicantLinked && isExecutorsLinked) parseResultCount.reportsFullfilled++;

            sseClientRes.sendSSEJson(checkedReport, "progress");
          },
          isSseClientClosed
        );
      })
    );

    await Promise.all(requests)
      .then(() => {
        console.log(parseResultCount);
        sseClientRes.sendSSEJson(parseResultCount, "done");
        sseClientRes.res.end();
      })
      .catch((error) => {
        console.error(error);
        sseClientRes.sendSSEJson({ error: serializeError(error) }, "error");
        sseClientRes.res.end();
      })
      .finally(() => res.res.end());
  } else {
    throw new BadRequestError();
  }
};

/**
 * @param {ReportModel} report
 * @param {(report: ReportModel) => void} callback
 * @param {boolean} rejectCond
 */
async function checkReportAssigments(report, callback, rejectCond) {
  if (rejectCond) return Promise.reject(`Report check is rejected`);

  const executorSurnames = extractSurnamesFromExecutorField(report.executorNames);

  const equipment = await db
    .request()
    .query(`select id, name from dbo.asu_system_api_subsystemlist where name like N'%${report.equipment}%';`);

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

  callback({
    ...report,
    executors,
    equipment: hasEquipmentLink ? { id: equipment.recordset[0].id, name: equipment.recordset[0].name } : null,
    applicant: hasApplicantLink ? { id: applicant.recordset[0].id, name: applicant.recordset[0].name } : null
  });
}

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
