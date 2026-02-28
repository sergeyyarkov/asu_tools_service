/** @type {HTTPRequest} */
export default {
  req: null,
  async parseJson() {
    return new Promise((resolve, reject) => {
      let body = [];
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
