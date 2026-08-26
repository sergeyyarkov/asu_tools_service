import sql from "mssql";

export class BaseTable {
  static tableName = "";
  static table = new sql.Table(this.tableName);

  /** @type {Record<string, { type: (() => sql.ISqlType) | sql.ISqlType } & sql.IColumnOptions>} */
  static columns = {};

  /**
   * @template {typeof BaseTable} T
   * @this {T}
   * @param {keyof T['columns']} name
   */
  static getColumn(name) {
    const col = this.table.columns.find((col) => col.name === name);
    if (!col) throw new Error(`Unknown column with name "${String(name)}"`);
    return col;
  }

  /**
   * @param {sql.Table} [table]
   */
  static init(table) {
    table = table || this.table;
    Object.entries(this.columns).forEach(([name, { type, ...opts }]) => table.columns.add(name, type, opts));
  }

  static createInstance() {
    const table = new sql.Table(this.tableName);
    this.init(table);
    return table;
  }
}
