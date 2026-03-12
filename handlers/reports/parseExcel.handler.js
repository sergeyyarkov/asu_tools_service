import { BadRequestError, ServiceUnavailableError } from "#root/http-server/index.js";
import { clients } from "#root/index.js";
import { reportsService } from "#services/index.js";
import { serializeError } from "serialize-error";

const MAX_CONCURRENT_PARSE_CLIENT = Number.parseInt(process.env.REPORT_CONCURRENT_PARSE_CLIENTS || "3", 10);

/**
 * URL: /api/reports_excel_file_parse
 * Method: POST
 * Description: Принимает на вход файл отчетов в формате Excel, парсит его, проверяет связи с БД,
 *              отдает идентификатор на статус парсинга.
 *
 * @type {import("#root/http-server/types/http-server.js").HttpRouteHandler}
 */
export default async (ctx) => {
  const { res, searchParams } = ctx;
  const [, files] = ctx.data;
  const clientId = searchParams.get("clientId");
  const excelFilepath = files?.report?.at(0)?.filepath;

  if (!ctx.data) {
    throw new BadRequestError("Cannot proceed uploaded file");
  }

  if (!clientId) {
    throw new BadRequestError('"clientId" parameter is required');
  }

  const sseClientCtx = clients.get(clientId);
  const parseProcessClients = clients
    .values()
    .filter((sseClientCtx) => sseClientCtx.local?.isParsing)
    .toArray();

  if (parseProcessClients.length >= MAX_CONCURRENT_PARSE_CLIENT) {
    throw new ServiceUnavailableError(`Maximum concurrent parse clients reached limit`);
  }

  if (!sseClientCtx) {
    throw new ServiceUnavailableError("Cannot proceed request due to unknown client");
  }

  if (sseClientCtx.local.isParsing) {
    throw new ServiceUnavailableError("Your request on parsing is processing");
  }

  /** @param {ParsedReport} report */
  const onParseProgress = async (report) => sseClientCtx.res.sendSSEJson(report, "progress");

  const cancelAnalyzeCond = () => Boolean(sseClientCtx.local?.isClosed);

  if (excelFilepath) {
    try {
      const reports = reportsService.parseExcelFile(excelFilepath);
      const { result, reports: reportsPromises } = reportsService.analyzeParseResult(
        reports,
        cancelAnalyzeCond,
        onParseProgress
      );

      sseClientCtx.local.isParsing = true;
      res.sendJson({ message: "OK" });
      await Promise.all(reportsPromises);
      sseClientCtx.res.sendSSEJson(result, "done");
    } catch (error) {
      console.error(error);
      sseClientCtx.res.sendSSEJson({ error: serializeError(error) }, "parseError");
    } finally {
      sseClientCtx.local.isParsing = false;
    }
  } else {
    throw new BadRequestError();
  }
};
