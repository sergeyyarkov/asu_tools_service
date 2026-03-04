import { clients } from "#root/index.js";
import crypto from "node:crypto";

/**
 * URL: /api/reports_status_parse
 * Method: GET
 * Description: Отправляет частями в формате JSON информацию о текущем статусе парсинга отчетов
 *
 * @type {import("#root/http-server/types/http-server.js").HttpRouteHandler}
 */
export default (ctx) => {
  const { res } = ctx;
  const clientId = crypto.randomUUID();

  clients.set(clientId, ctx.res);

  res.res.setHeaders(
    new Headers({
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream; charset=utf-8"
    })
  );

  res.sendSSEJson({ message: "Connected!", clientId }, "data");

  res.res.on("close", () => {
    clients.delete(clientId);
    console.log(clients);
    res.res.end();
  });
};
