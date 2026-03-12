import sql from "mssql";
import db from "#root/db.js";
import { ReportModel } from "#models/index.js";
import { ReportTable } from "#tables/index.js";

/** @import { ReportColumns } from "#tables/report.table.js" */

export const reportRepository = {
  async getAll() {
    const request = new sql.Request(db);
    console.log(ReportTable.tableName);

    const reports = await request.query(`select * from dbo.${ReportTable.tableName};`);
    console.log(reports);

    return reports.recordset;
  },

  /**
   * @param {Omit<ReportColumns, 'id'>} entry
   */
  async create(entry) {
    const report = new ReportModel(entry);
    const request = new sql.Request(db);

    request.input("date", ReportTable.getColumn("date"), report.date);
    request.input("reasonCall", ReportTable.getColumn("reason_call"), report.reason_call);
    request.input("jobDesc", ReportTable.getColumn("job_description"), report.job_description);
    request.input("rootCause", ReportTable.getColumn("root_cause"), report.root_cause);
    request.input("applicantId", ReportTable.getColumn("applicant_id"), report.applicant_id);
    request.input("eqpId", ReportTable.getColumn("equipment_id"), report.equipment_id);

    const createdReport = await request.query(
      `insert into ${ReportTable.table.name} 
          (date, reason_call, job_description, root_cause, applicant_id, equipment_id)
        output inserted.id
        values (@date, @reasonCall, @jobDesc, @rootCause, @applicantId, @eqpId);
      `
    );

    report.id = Number.parseInt(createdReport.recordset[0].id, 10);

    return report;
  },

  /**
   * @param {Omit<ReportColumns, 'id'>[]} entries
   * @param {sql.Transaction} [trx]
   */
  async bulk(entries, trx) {
    const request = trx ? new sql.Request(trx) : new sql.Request(db);
    const table = ReportTable.createInstance();

    for (const r of entries) {
      table.rows.add(r.date, r.reason_call, r.job_description, r.root_cause, r.applicant_id, r.equipment_id);
    }

    await request.bulk(table);
    return table.rows.length;
  }
};
