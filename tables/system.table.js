import sql from "mssql";
import { BaseTable } from "./base.table.js";

export class SystemTable extends BaseTable {
  static tableName = "asu_system_api_systemlist";
  static table = new sql.Table(this.tableName);

  static columns = {
    id: { type: sql.BigInt, nullable: false },
    location_id: { type: sql.BigInt, nullable: true },
    name: { type: sql.VarChar, nullable: true }
  };
}

SystemTable.table.create = false;
SystemTable.init();
