/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {HTTPRequest}
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

        this.req.on("data", (chunk) => body.push(chunk));
        this.req.on("end", () => {
          try {
            const parsedJson = JSON.parse(Buffer.concat(body).toString());
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
