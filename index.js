import path from "node:path";
import { createServer } from "./http-server/index.js";
import { reportsHandlers } from "./handlers/index.js";
import packageJson from "./package.json" with { type: "json" };
import db from "./db.js";

const SERVER_PORT = 3000;

/** @type {Map<string, import("./http-server/types/http-server.js").HttpContext>} */
export const clients = new Map();

/**
 * @type {import("#root/http-server/http-server.js").HttpRouteMap}
 */
export const routeMap = {
  "/": {
    method: "GET",
    handle: (ctx) => ctx.res.sendText("Сервис инструментов таблицы АСУ ТП.")
  },
  "/api/reports_status_parse": {
    method: "GET",
    handle: reportsHandlers.statusParseHandler
  },
  "/api/reports_excel_file_parse": {
    method: "POST",
    handle: reportsHandlers.parseExcelHandler,
    incomingForm: {
      maxFields: 1,
      maxFiles: 1,
      filename: (_, ext) => `gpp-reports${ext}`,
      keepExtensions: true,
      uploadDir: path.join(process.cwd(), "./uploads"),
      filter: ({ mimetype }) => !!mimetype && mimetype.includes("application/vnd.ms-excel")
    }
  },
  "/api/reports_sync": {
    method: "POST",
    handle: reportsHandlers.syncParsedHandler
  }
};

createServer({ routeMap }).listen(SERVER_PORT, async () => {
  console.log(`Service ${packageJson.name} is running at port ${SERVER_PORT}.`);
  await db.connect().then(() => console.log("Database connected!"));
});
