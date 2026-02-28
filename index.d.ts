import type http from "node:http";
import type IncomingForm from "formidable/Formidable.js";

declare global {
  type ReportModel = {
    date: string;
    equipment: string;
    reason_call: string;
    job_description: string;
    root_cause: string;
    applicantName: string;
    executorNames: string;
  };

  type HTTPRequest = {
    parseJson: () => Promise<any>;
    req: http.IncomingMessage;
  };

  type HTTPResponse = {
    sendJson: (data: Record<string, unknown>, statusCode?: number = 200) => http.ServerResponse;
    sendText: (text: string, statusCode?: number = 200) => http.ServerResponse;
    res: http.ServerResponse;
  };

  type HTTPRoute = { method: "POST" | "GET"; handle: HTTPRouteHandler; incomingForm?: IncomingForm };
  type HTTPRouteHandler = (ctx: HTTPContext) => Promise<void>;
  type HTTPRouteMap = Record<string, HTTPRoute>;
  type HTTPContext = { data: any; res: HTTPResponse; req: HTTPRequest };
}
