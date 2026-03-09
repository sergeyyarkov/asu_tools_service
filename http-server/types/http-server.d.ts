import type http from "node:http";
import type IncomingForm from "formidable/Formidable.js";
import formidable from "formidable";

export interface HttpServer {
  listen: (port: number, cb: () => void) => { router: HttpRouter };
}

export interface HttpServerOptions {
  cors?: {
    allow?: string;
    methods?: string;
    headers?: string;
  };
}

export type HttpMethod = "POST" | "GET" | "PUT" | "DELETE" | "PATCH";

export interface HttpRouteOptions {
  incomingForm?: formidable.Options;
}

export interface HttpRoute {
  method: HttpMethod;
  pattern: URLPattern;
  handler: HttpRouteHandler;
  options: HttpRouteOptions;
}
export interface HttpRouter {
  routes: Array<HttpRoute>;
  handle: (ctx: HttpContext) => Promise<void>;
  define: (
    method: HttpMethod,
    pathname: string,
    handler: (ctx: HttpContext) => void,
    options?: HttpRouteOptions
  ) => void;
}

export interface HttpRequest {
  parseJson: () => Promise<any>;
  req: http.IncomingMessage;
  url: URL;
}

export interface HttpContext {
  data: any;
  res: HttpResponse;
  req: HttpRequest;
  searchParams: URLSearchParams;
  params: Record<string, unknown>;
  local: Record<string, unknown>;
}

export interface HttpResponse {
  sendJson: (data: Record<string, unknown>, statusCode?: number) => http.ServerResponse;
  sendSSEJson: (data: Record<string, unknown>, eventName: string, statusCode?: number) => void;
  sendText: (text: string, statusCode?: number) => http.ServerResponse;
  res: http.ServerResponse;
}

export type HttpRouteHandler = (ctx: HttpContext) => any;
export type HttpCreateServer = (options: HttpServerOptions) => HttpServer;
