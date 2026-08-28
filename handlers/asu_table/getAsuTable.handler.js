import { dbExporterService, XlsExporterAdapter } from "#root/services/dbExporter.service.js";

/** @import { HttpRouteHandler } from "#root/http-server/types/http-server.js" */

/**
 * URL: /api/asu_table_xls
 * Method: GET
 * Description: Генерирует файл Excel на основе БД АСУ промплощадки
 *
 * @type {HttpRouteHandler}
 */
export default async (ctx) => {
  const { res, searchParams } = ctx;
  const systemIdsParam = searchParams.get("systemIds")?.split(",");
  const subSystemIdsParam = searchParams.get("subSystemIds")?.split(",");
  const filename = encodeURIComponent("АСУ промплощадка.xlsx");
  const exportResult = await dbExporterService.export(XlsExporterAdapter, {
    filter: { systemIds: systemIdsParam, subsystemIds: subSystemIdsParam }
  });

  res.res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.res.setHeader("Content-Disposition", `attachment; filename=${filename}; filename*=UTF-8''${filename}`);
  res.res.setHeader("Content-Length", exportResult.byteLength);
  res.res.end(exportResult);

  return;
};
