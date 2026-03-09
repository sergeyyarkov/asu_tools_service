import { serializeError } from "serialize-error";
import formidable from "formidable";
import { BadRequestError, HttpError, MethodNotAllowedError, NotFoundError } from "./errors.js";

/**
 * @returns {import("./types/http-server.js").HttpRouter}
 */
export function createRouter() {
  return {
    routes: [],
    async handle(ctx) {
      const { req, res } = ctx;

      try {
        for (const route of this.routes) {
          const patternResult = route.pattern.exec(req.url.pathname);

          if (!patternResult) continue;

          if (route.method !== req.req.method) {
            throw new MethodNotAllowedError();
          }

          ctx.params = patternResult.pathname.groups;

          if (req.req.headers["content-type"]?.includes("application/json")) {
            ctx.data = await ctx.req.parseJson();
          }

          if (req.req.headers["content-type"]?.includes("multipart/form-data")) {
            if (!route.options.incomingForm) {
              throw new BadRequestError("Request cannot be processed without defined incoming form.");
            }

            ctx.data = await formidable(route.options.incomingForm).parse(req.req);
          }

          await route.handler(ctx);
          return;
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
    },
    define(method, pathname, handler, options = {}) {
      /** @type {import("./types/http-server.js").HttpRoute} */
      this.routes.push({ method, pattern: new URLPattern({ pathname }), handler, options });
    }
  };
}
