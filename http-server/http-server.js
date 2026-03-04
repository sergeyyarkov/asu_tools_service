import http from "node:http";
import { AsyncLocalStorage } from "node:async_hooks";
import { createRequest } from "./request.js";
import { createResponse } from "./response.js";
import { routeHandler } from "./route.js";

/**
 * @typedef {import('./types/http-server.js').HttpServer} HttpServer
 * @typedef {import('./types/http-server.js').HttpServerOptions} HttpServerOptions
 * @typedef {import('./types/http-server.js').HttpContext} HttpContext
 * @typedef {import('./types/http-server.js').HttpRouteMap} HttpRouteMap
 */

/**
 * @param {HttpServerOptions} options
 * @returns {HttpServer}
 */
export function createServer(options) {
  const { routeMap, enableCors } = options;
  const ctxStorage = new AsyncLocalStorage();
  let serverPort = 3000;

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(`http://${req.headers.host || `localhost:${serverPort}`}${req.url}`);

      /** @type {HttpContext} */
      const ctx = {
        data: null,
        req: createRequest(req),
        res: createResponse(res),
        params: url.searchParams,
        local: {}
      };

      if (enableCors) {
        res.setHeaders(
          new Headers({
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,UPDATE,PUT,PATCH",
            "Access-Control-Allow-Headers": "Content-Type,Accept"
          })
        );
      }

      ctxStorage.run(ctx, () =>
        routeHandler(url, ctxStorage, routeMap).then(() => {
          console.log(`${new Date().toISOString()} Request: ${url.pathname}`);
        })
      );
    } catch (error) {
      console.error(error);
    }
  });

  return {
    listen(port = 3000, cb) {
      serverPort = port;
      server.listen(port, cb);
      return server;
    }
  };
}
