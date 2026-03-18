import { AsyncLocalStorage } from "node:async_hooks";
import sql from "mssql";
import db from "#root/db.js";

export class UOW {
  /** @type {AsyncLocalStorage<sql.Transaction>} */
  static #als = new AsyncLocalStorage();

  /** @param {() => Promise<unknown>} callback */
  static async run(callback) {
    const trx = new sql.Transaction(db);
    try {
      await trx.begin();
      const ret = await this.#als.run(trx, callback);
      await trx.commit();
      return ret;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static get request() {
    const trx = this.#als.getStore();
    return trx ? new sql.Request(trx) : new sql.Request(db);
  }
}
