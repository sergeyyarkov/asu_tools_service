import sql from "mssql";
import { BaseTable } from "./base.table.js";

/**
 * @typedef {{ id?: number | string; date: Date; reason_call: string; job_description: string; root_cause: string | null; applicant_id: number | string | null; equipment_id: number | string | null; }} ReportColumns
 */

export class ReportTable extends BaseTable {
  static tableName = "gpp_report_api_report";
  static table = new sql.Table(this.tableName);

  static columns = {
    id: { type: sql.BigInt, nullable: false },
    date: { type: sql.Date, nullable: false },
    reason_call: { type: sql.NVarChar(sql.MAX), nullable: false },
    job_description: { type: sql.NVarChar(sql.MAX), nullable: false },
    root_cause: { type: sql.NVarChar(sql.MAX), nullable: true },
    applicant_id: { type: sql.BigInt, nullable: true },
    equipment_id: { type: sql.BigInt, nullable: true }
  };
}

ReportTable.table.create = false;
ReportTable.init();
