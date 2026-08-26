import { clients } from "#root/index.js";
import crypto from "node:crypto";

/** @import { HttpRouteHandler } from "#root/http-server/types/http-server.js" */

/**
 * URL: /api/reports_status_parse
 * Method: GET
 * Description: Отправляет частями в формате JSON информацию о текущем статусе парсинга отчетов
 *
 * @type {HttpRouteHandler}
 */
export default async (ctx) => {
  const { res } = ctx;
  const clientId = crypto.randomUUID();

  clients.set(clientId, ctx);
  ctx.local.isClosed = false;

  res.res.setHeaders(
    new Headers({
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream; charset=utf-8"
    })
  );

  res.sendSSEJson({ message: "Connected!", clientId }, "data");

  res.res.on("close", () => {
    ctx.local.isClosed = true;
    clients.delete(clientId);
    res.res.end();
  });

  return;
};
