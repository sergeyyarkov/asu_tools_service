/** @import { IncomingMessage } from "node:http" */
/** @import { HttpRequest } from "./types/http-server.js" */

/**
 * @param {IncomingMessage} req
 * @returns {HttpRequest}
 */
export function createRequest(req) {
  return {
    get req() {
      return req;
    },

    get url() {
      return new URL(`http://${req.headers.host || `localhost`}${req.url}`);
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
