/**
 * @param {import('node:http').ServerResponse} res
 * @returns {HTTPResponse}
 */
export function createResponse(res) {
  return {
    get res() {
      return res;
    },

    sendSSEJson(data, eventName) {
      this.res.write(`event: ${eventName}\n`);
      this.res.write(`data: ${JSON.stringify(data)}`);
      this.res.write("\n\n");
    },

    sendJson(data, statusCode = 200) {
      this.res.writeHead(statusCode, { "content-type": "application/json" });
      return this.res.end(JSON.stringify(data, null, 2));
    },

    sendText(text, statusCode = 200) {
      this.res.writeHead(statusCode, {
        "content-type": "text/plain; charset=utf-8"
      });
      return this.res.end(text);
    }
  };
}
