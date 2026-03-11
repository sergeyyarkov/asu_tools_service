import http from "node:http";
import { createRequest } from "./request.js";
import { createResponse } from "./response.js";
import { createRouter } from "./route.js";

/** @import { HttpServerOptions, HttpServer, HttpContext } from "./types/http-server.js" */

/**
 * @param {HttpServerOptions} options
 * @returns {HttpServer}
 */
export function createServer(options) {
  const router = createRouter();

  const server = http.createServer((req, res) => {
    try {
      const request = createRequest(req);
      const response = createResponse(res);

      /** @type {HttpContext} */
      const ctx = {
        data: null,
        req: request,
        res: response,
        searchParams: request.url.searchParams,
        params: {},
        local: {}
      };

      if (options.cors) {
        res.setHeaders(
          new Headers({
            "Access-Control-Allow-Origin": options.cors.allow,
            "Access-Control-Allow-Methods": options.cors.methods,
            "Access-Control-Allow-Headers": options.cors.headers
          })
        );
      }

      console.log(`${new Date().toISOString()} Request: ${ctx.req.url}`);
      router.handle(ctx);
    } catch (error) {
      console.error(error);
    }
  });

  return {
    listen(port = 3000, cb) {
      server.listen(port, cb);
    },
    router: {
      prefix: router.prefix,
      define: router.define
    }
  };
}
