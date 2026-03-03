import { BadRequestError } from "#root/errors/index.js";
import db from "#root/db.js";
import xlsx from "xlsx";
import pLimit from "p-limit";
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
 *              отдает отчет в формате JSON частями.
 *
 * @type {HTTPRouteHandler}
 */
export default async (ctx) => {
  const { res } = ctx;

  if (!ctx.data) throw new BadRequestError("Cannot proceed uploaded file");

  const [, files] = ctx.data;
  const excelFilePath = files?.report?.at(0)?.filepath;

  /** @type {ReportModel[]} */
  const reports = [];

  let parseResultCount = { equipments: 0, applicants: 0, executors: 0 };
  let isReqClosed = false;

  res.res.setHeaders(
    new Headers({
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream"
    })
  );

  res.res.on("close", () => (isReqClosed = true));

  if (excelFilePath) {
    const workbook = xlsx.readFile(excelFilePath, xlsxParseOptions);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) throw new Error("Invalid reports workbook.", { cause: { statusCode: 400 } });

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

    /** @param {ReportModel} report */
    const checkReportAssigments = async (report) => {
      if (isReqClosed) {
        return Promise.reject("Client closed the connection.");
      }

      const equipment = await db
        .request()
        .query(`select id from dbo.asu_system_api_subsystemlist where name like N'%${report.equipment}%';`);

      const applicant = await db
        .request()
        .query(
          `select id from dbo.gpp_report_api_applicant where name like N'${report.applicantName.split(" ")[0]}%';`
        );

      if (equipment.recordset.length !== 0) parseResultCount.equipments++;
      if (applicant.recordset.length !== 0) parseResultCount.applicants++;

      res.sendSSEJson(
        {
          report: {
            ...report,
            equipment: equipment.recordset.at(0)?.id || null,
            applicant: applicant.recordset.at(0)?.id || null
          }
        },
        "progress"
      );

      return equipment;
    };

    const requests = reports.map((r) => limit(() => checkReportAssigments(r)));

    await Promise.all(requests)
      .then(() => res.sendSSEJson(parseResultCount, "done"))
      .catch((error) => {
        console.error(error);
        res.sendSSEJson({ error: serializeError(error) }, "error");
      })
      .finally(() => res.res.end());
  } else {
    throw new BadRequestError();
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

/**
 * @param {string} str
 * @param {number} min
 */
function splitLongSpacedSentence(str, min = 5) {
  return str.split(new RegExp(`\\s{${min},}`));
}
