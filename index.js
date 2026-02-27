import http from "node:http";
import { routeHandler } from "./router/index.js";
import packageJson from "./package.json" with { type: "json" };
import { ctxAsyncLocalStorage } from "./context.js";
import db from "./db.js";
import response from "./response.js";
import request from "./request.js";

const SERVER_PORT = 3001;

await db.connect().then(() => console.log("Database connected!"));

http
  .createServer((req, res) => {
    try {
      const url = new URL(`http://localhost:${SERVER_PORT}${req.url}`);

      /** @type {HTTPContext} */
      const ctx = { data: null, req: Object.create(request), res: Object.create(response) };
      ctx.req.req = req;
      ctx.res.res = res;

      ctxAsyncLocalStorage.run(ctx, () => routeHandler(url));
    } catch (error) {
      console.error(error);
    }
  })
  .listen(SERVER_PORT, () => {
    console.log(`Service ${packageJson.name} is running at port ${SERVER_PORT}.`);
  });
