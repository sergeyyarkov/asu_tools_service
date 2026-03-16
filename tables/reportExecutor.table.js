import sql from "mssql";
import { BaseTable } from "./base.table.js";

/**
 * @typedef {{ id: string | number; report_id: string | number; user_id: string | number; }} ReportExecutorTableCols
 */

export class ReportExecutorTable extends BaseTable {
  static tableName = "gpp_report_api_report_executor";
  static table = new sql.Table(this.tableName);

  static columns = {
    report_id: { type: sql.BigInt, nullable: false },
    user_id: { type: sql.BigInt, nullable: false }
  };
}

ReportExecutorTable.table.create = false;
ReportExecutorTable.init();
