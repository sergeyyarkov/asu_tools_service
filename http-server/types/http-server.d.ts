import type http from "node:http";
import type IncomingForm from "formidable/Formidable.js";
import formidable from "formidable";

export interface HttpServer {
  listen: (port: number, cb: () => void) => void;
}

export interface HttpServerOptions {
  routeMap: HttpRouteMap;
  enableCors?: boolean;
}

export interface HttpRoute {
  method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
  handle: HttpRouteHandler;
  incomingForm?: formidable.Options;
}

export interface HttpRequest {
  parseJson: () => Promise<any>;
  req: http.IncomingMessage;
}

export interface HttpContext {
  data: any;
  res: HttpResponse;
  req: HttpRequest;
  params: URLSearchParams;
  local: Record<string, unknown>;
}

export interface HttpResponse {
  sendJson: (data: Record<string, unknown>, statusCode?: number) => http.ServerResponse;
  sendSSEJson: (data: Record<string, unknown>, eventName: string, statusCode?: number) => void;
  sendText: (text: string, statusCode?: number) => http.ServerResponse;
  res: http.ServerResponse;
}

export type HttpRouteHandler = (ctx: HttpContext) => any;
export type HttpRouteMap = Record<string, HttpRoute>;
export type HttpCreateServer = (options: { routeMap: HttpRouteMap }) => HttpServer;
