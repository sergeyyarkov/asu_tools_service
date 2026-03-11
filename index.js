import path from "node:path";
import fsp from "node:fs/promises";
import { createServer } from "./http-server/index.js";
import { reportsHandlers } from "#handlers/index.js";
import packageJson from "./package.json" with { type: "json" };
import db from "./db.js";

const SERVER_PORT = Number.parseInt(`${process.env.PORT || "3000"}`, 10);

/** @type {Map<string, import("./http-server/types/http-server.js").HttpContext>} */
export const clients = new Map();

/** @type {import("./http-server/http-server.js").HttpServerOptions['cors']} */
const cors = {
  allow: "*",
  methods: "GET,POST,DELETE,UPDATE,PUT,PATCH",
  headers: "Content-Type,Accept"
};

const server = createServer({ cors });

server.listen(SERVER_PORT, async () => {
  console.log(`Service ${packageJson.name} is running at port ${SERVER_PORT}.`);
  await fsp.mkdir(path.join(process.cwd(), "/uploads"), { recursive: true });
  await db.connect().then(() => console.log("Database connected!"));
});

server.router.prefix("/api", (router) => {
  router.define("GET", "/reports_status_parse", reportsHandlers.statusParseHandler);
  router.define("POST", "/reports_excel_file_parse", reportsHandlers.parseExcelHandler, {
    incomingForm: {
      maxFields: 1,
      maxFiles: 1,
      filename: (_, ext) => `gpp-reports${ext}`,
      keepExtensions: true,
      uploadDir: path.join(process.cwd(), "./uploads"),
      filter: ({ mimetype }) => !!mimetype && mimetype.includes("application/vnd.ms-excel")
    }
  });
  router.define("POST", "/reports_sync", reportsHandlers.syncParsedHandler);
});

server.router.define("GET", "/", ({ res }) => res.sendText("Сервис инструментов таблицы АСУ."));
