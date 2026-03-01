import path from "node:path";
import formidable from "formidable";
import { httpStorage } from "#root/context.js";
import { handlers as reportsHandlers } from "./reports/index.js";

/**
 * @type {HTTPRouteMap}
 */
export const ROUTE_MAP = {
  "/api/reports_excel_file_parse": {
    method: "POST",
    handle: reportsHandlers.parseExcelHandler,
    incomingForm: formidable({
      maxFields: 1,
      maxFiles: 1,
      filename: (_, ext) => `gpp-reports${ext}`,
      keepExtensions: true,
      uploadDir: path.join(process.cwd(), "./uploads"),
      filter: ({ mimetype }) => mimetype && mimetype.includes("application/vnd.ms-excel")
    })
  },
  "/api/reports_sync": {
    method: "POST",
    handle: reportsHandlers.syncParsedHandler
  }
};

/**
 * @param {URL} url
 */
export async function routeHandler(url) {
  /** @type {HTTPContext} */
  const ctx = httpStorage.getStore();
  const { req, res } = ctx;

  try {
    if (url.pathname in ROUTE_MAP) {
      const route = ROUTE_MAP[url.pathname];

      if (req.req.headers["content-type"] === "application/json") {
        ctx.data = await ctx.req.parseJson();
      }

      if (req.req.headers["content-type"]?.includes("multipart/form-data")) {
        if (!route.incomingForm) throw new Error("Request cannot be processed without defined incoming form.");
        ctx.data = await route.incomingForm.parse(req.req);
      }

      if (route.method === req.req.method) {
        await route.handle(ctx);
      }

      return;
    }

    res.sendJson({ error: { message: "Route not found." } }, 404);
  } catch (error) {
    console.error(error);
    res.sendJson(
      {
        error: {
          message: error?.message || "Internal Server Error",
          stack: error?.stack || null
        }
      },
      error?.cause?.statusCode || 500
    );
  }
}

export * from "./reports/parseExcel.handler.js";
