import { serializeError } from "serialize-error";
import formidable from "formidable";
import { BadRequestError, HttpError, NotFoundError } from "./errors.js";

/**
 * @param {URL} url
 * @param {import('node:async_hooks').AsyncLocalStorage<import('./http-server.js').HttpContext>} ctxStorage
 * @param {import("./http-server.js").HttpRouteMap} routeMap
 */
export async function routeHandler(url, ctxStorage, routeMap) {
  const ctx = ctxStorage.getStore();

  if (!ctx) throw new Error("HTTP context storage is undefined!");

  const { req, res } = ctx;

  try {
    if (url.pathname in routeMap) {
      const route = routeMap[url.pathname];

      if (req.req.headers["content-type"] === "application/json") {
        ctx.data = await ctx.req.parseJson();
      }

      if (req.req.headers["content-type"]?.includes("multipart/form-data")) {
        if (!route.incomingForm) {
          throw new BadRequestError("Request cannot be processed without defined incoming form.");
        }

        ctx.data = await formidable(route.incomingForm).parse(req.req);
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
