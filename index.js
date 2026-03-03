import http from "node:http";
import { routeHandler } from "./router/index.js";
import packageJson from "./package.json" with { type: "json" };
import { ctxStorage } from "./context.js";
import db from "./db.js";
import { createResponse } from "./response.js";
import { createRequest } from "./request.js";

const SERVER_PORT = 3000;

function application() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(`http://localhost:${SERVER_PORT}${req.url}`);

      res.setHeaders(
        new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST",
          "Access-Control-Allow-Headers": "Content-Type"
        })
      );

      /** @type {HTTPContext} */
      const ctx = {
        data: null,
        req: createRequest(req),
        res: createResponse(res)
      };

      ctxStorage.run(ctx, () =>
        routeHandler(url).then(() => {
          console.log(`${new Date().toISOString()} Request: ${url.pathname}`);
        })
      );
    } catch (error) {
      console.error(error);
    }
  });

  return {
    /**
     * @param {number} port
     */
    async run(port = 3000) {
      await db.connect().then(() => console.log("Database connected!"));
      server.listen(port, () => {
        console.log(`Service ${packageJson.name} is running at port ${SERVER_PORT}.`);
      });
    }
  };
}

application().run(SERVER_PORT);
