import path from "node:path";
import formidable from "formidable";
import { ctxStorage } from "#root/context.js";
import { handlers as reportsHandlers } from "./reports/index.js";
import { BadRequestError, HttpError, NotFoundError } from "#root/errors/index.js";
import { serializeError } from "serialize-error";

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
      filter: ({ mimetype }) => !!mimetype && mimetype.includes("application/vnd.ms-excel")
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
  const ctx = ctxStorage.getStore();
  const { req, res } = ctx;

  try {
    if (url.pathname in ROUTE_MAP) {
      const route = ROUTE_MAP[url.pathname];

      if (req.req.headers["content-type"] === "application/json") {
        ctx.data = await ctx.req.parseJson();
      }

      if (req.req.headers["content-type"]?.includes("multipart/form-data")) {
        if (!route.incomingForm) {
          throw new BadRequestError("Request cannot be processed without defined incoming form.");
        }

        ctx.data = await route.incomingForm.parse(req.req);
      }

      if (route.method === req.req.method) {
        await route.handle(ctx);
        return;
      }
    }

    throw new NotFoundError("Route not found");
  } catch (error) {
    console.error(error);

    if (error instanceof HttpError) {
      res.sendJson(
        {
          error: {
            name: error.name,
            message: error.message || "Internal Server Error",
            stack: error.stack || null
          }
        },
        error.statusCode || 500
      );
      return;
    }

    const serializedError = serializeError(error);

    res.sendJson(
      {
        error: {
          ...serializedError,
          stack: process.env.NODE_ENV !== "production" ? serializedError.stack : undefined
        }
      },
      500
    );
  }
}

export * from "./reports/parseExcel.handler.js";
