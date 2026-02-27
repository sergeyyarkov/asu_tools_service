/** @type {HTTPResponse} */
export default {
  res: null,
  sendJson(data, statusCode = 200) {
    this.res.writeHead(statusCode, { "content-type": "application/json" });
    return this.res.end(JSON.stringify(data, null, 2));
  },
  sendText(text, statusCode = 200) {
    this.res.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
    return this.res.end(text);
  },
};
