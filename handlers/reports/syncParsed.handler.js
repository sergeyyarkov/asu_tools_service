import { BadRequestError } from "#root/http-server/index.js";
import { reportsService } from "#root/services/reports.service.js";
import { reportsSchema } from "#schemas/report.schema.js";

/** @import { HttpRouteHandler } from "#root/http-server/types/http-server.js" */

/**
 * URL: /api/reports_sync
 * Method: POST
 * Description: Синхронизирует принятые отчеты с отчетами в БД
 *
 * @type {import("#root/http-server/types/http-server.js").HttpRouteHandler}
 */
export default async ({ res, data }) => {
  const payload = await reportsSchema.validate(data).catch((err) => {
    throw new BadRequestError(err.message);
  });

  const rows = await reportsService.syncReportsWithDatabase(payload);
  res.sendJson({ data: { rows } });

  return;
};
