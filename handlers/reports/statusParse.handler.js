import { clients } from "#root/index.js";
import crypto from "node:crypto";

/** @type {import("#root/http-server/types/http-server.js").HttpRouteHandler} */
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
