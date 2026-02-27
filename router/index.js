import { ctxAsyncLocalStorage } from "#root/context.js";
import handleExcelReportsFileParse from "./reports/parseExcel.handler.js";
import handleReportsSyncParsed from "./reports/syncParsed.handler.js";

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

  try {
    if (url.pathname in ROUTE_MAP) {
      const route = ROUTE_MAP[url.pathname];
      if (req.headers["content-type"] === "application/json") ctx.data = await getJsonData();
      if (route.method === req.method) await route.handle(ctx);
      return;
    }

    res.sendText("Указанный URL не имеет обработчика.", 200);
  } catch (error) {
    console.error(error);
    res.sendJson(
      {
        error: {
          message: error?.message || "Internal Server Error",
          stack: error?.stack || null,
        },
      },
      error?.cause?.statusCode || 500,
    );
  }
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

export * from "./reports/parseExcel.handler.js";
