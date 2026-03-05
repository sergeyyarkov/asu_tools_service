/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {import('./types/http-server.js').HttpRequest}
 */
export function createRequest(req) {
  return {
    get req() {
      return req;
    },

    async parseJson() {
      return new Promise((resolve, reject) => {
        /** @type {Buffer[]} */
        const body = [];

        this.req.on("data", (chunk) => {
          // TODO: make body size limit
          body.push(chunk);
        });
        this.req.on("end", () => {
          try {
            const buffer = Buffer.concat(body);
            const parsedJson = JSON.parse(buffer.toString());
            resolve(parsedJson);
          } catch (error) {
            reject(error);
          }
        });
        this.req.on("error", (err) => reject(err));
      });
    }
  };
}
