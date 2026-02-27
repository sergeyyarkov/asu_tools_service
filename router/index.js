import { ctxAsyncLocalStorage } from "#root/context.js";
import handleExcelReportsFileParse from "./reportsFileParse.handler.js";
import handleReportsSyncParsed from "./reportsSyncParsed.handler.js";

/**
 * @type {HTTPRouteMap}
 */
export const ROUTE_MAP = {
  "/api/reports_excel_file_parse": {
    method: "POST",
    handle: handleExcelReportsFileParse,
  },
  "/api/reports_sync": {
    method: "POST",
    handle: handleReportsSyncParsed,
  },
};

/**
 * @param {URL} url
 */
export async function routeHandler(url) {
  /** @type {HTTPContext} */
  const ctx = ctxAsyncLocalStorage.getStore();
  const { req, res } = ctx;

  if (url.pathname in ROUTE_MAP) {
    if (req.headers["content-type"] === "application/json") {
      ctx.data = await getJsonData();
    }

    const route = ROUTE_MAP[url.pathname];
    if (route.method === req.method) route.handle(ctx);
    return;
  }

  res.sendText("Указанный URL не имеет обработчика.", 200);
}

function getJsonData() {
  /** @type {HTTPContext} */
  const { req } = ctxAsyncLocalStorage.getStore();

  return new Promise((resolve, reject) => {
    let body = [];
    req.on("data", (chunk) => body.push(chunk));
    req.on("end", () => resolve(JSON.parse(Buffer.concat(body).toString())));
    req.on("error", (err) => reject(err));
  });
}

export * from "./reportsFileParse.handler.js";
