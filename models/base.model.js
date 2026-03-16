/** @import sql from "mssql" */

export class BaseModel {
  /**
   * @template T
   * @this {new (args: any) => T} Model
   * @param {sql.IRecordSet<any>} recordset
   * @returns {T[]}
   */
  static fromRecordset(recordset) {
    return recordset.map((row) => new this({ ...row }));
  }
}
