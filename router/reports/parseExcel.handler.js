import path from "node:path";
import xlsx from "xlsx";
import formidable from "formidable";

/**
 * Читает Excel файл отчетов и возвращает его в формате JSON
 *
 * @type {HTTPRouteHandler}
 */
export default async (ctx) => {
  const { req, res } = ctx;
  const sheetName = "Отчеты";

  /** @type {{ markedReports: ReportModel[], reports: ReportModel[] }} */
  const ret = { reports: [], markedReports: [] };

  /** @type {xlsx.ParsingOptions} */
  const xlsxParseOptions = {
    sheets: sheetName,
    cellHTML: false,
    cellFormula: false,
    cellDates: true,
    dateNF: "yyyy-mm-dd",
  };

  const form = formidable({
    maxFields: 1,
    maxFiles: 1,
    filename: (_, ext) => `gpp-reports${ext}`,
    keepExtensions: true,
    uploadDir: path.join(process.cwd(), "./uploads"),
    filter: ({ mimetype }) => mimetype && mimetype.includes("application/vnd.ms-excel"),
  });

  const [, files] = await form.parse(req.req);
  const excelFilePath = files?.report?.at(0)?.filepath;

  if (excelFilePath) {
    const workbook = xlsx.readFile(excelFilePath, xlsxParseOptions);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error("Invalid reports workbook.", { cause: { statusCode: 400 } });
    }

    const data = xlsx.utils.sheet_to_json(sheet, { raw: false, blankrows: true });

    for (let i = 0; i < data.length; i++) {
      const cols = Object.keys(data[i]);

      if (i === 0) continue;

      /** Несинхронизированные помеченные отчеты */
      if ("__EMPTY_3" in data[i] && data[i]["__EMPTY_3"] === "r") {
        ret.markedReports.push({
          date: data[i][cols[0]],
          equipment: data[i][cols[1]],
          reason_call: data[i][cols[3]].split("\r\r\n")[1] || "",
          job_description: data[i][cols[4]].split("\r\r\n")[1] || "",
          root_cause: data[i]["__EMPTY_2"] || "",
          applicantName: data[i][cols[3]].split("\r\r\n")[0] || "",
          executorNames: data[i][cols[4]].split("\r\r\n")[0] || "",
        });

        continue;
      }

      const parseReasonCallAndJobDesc = (str = "") => {
        const splitted = splitLongSpacedSentence(str);
        if (splitted.length > 1) return splitted.slice(1).join(" ");
        return str.split("\r\n").slice(1).join(" ");
      };

      const parseNames = (str = "") => {
        const splitted = splitLongSpacedSentence(str);
        if (splitted.length > 1) return splitted[0];
        return str.split("\r\n")[0];
      };

      /** Остальные отчеты */
      ret.reports.push({
        date: data[i][cols[0]],
        equipment: data[i][cols[1]],
        reason_call: parseReasonCallAndJobDesc(data[i][cols[3]]),
        job_description: parseReasonCallAndJobDesc(data[i][cols[4]]),
        root_cause: data[i]["__EMPTY_2"] || "",
        applicantName: parseNames(data[i][cols[3]]),
        executorNames: parseNames(data[i][cols[4]]),
      });
    }
  } else {
    throw new Error("Bad request", { cause: { statusCode: 400 } });
  }

  res.sendJson({ data: ret });
};

// /**
//  * @param {string} filepath
//  */
// function reportsExcelFileToJson(filepath) {
//   try {

//   } catch (error) {

//   }
// }

/**
 * @param {string} str
 * @param {number} min
 */
function splitLongSpacedSentence(str, min = 5) {
  return str.split(new RegExp(`\\s{${min},}`));
}
