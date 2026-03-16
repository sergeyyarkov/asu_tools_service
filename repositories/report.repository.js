import sql from "mssql";
import db from "#root/db.js";
import { ReportModel } from "#models/index.js";
import { ReportExecutorTable, ReportTable } from "#tables/index.js";

/** @import { ReportColumns } from "#tables/report.table.js" */

export const reportRepository = {
  async getAll() {
    const request = new sql.Request(db);
    const result = await request.query(`select * from dbo.${ReportTable.tableName};`);
    const reports = ReportModel.fromRecordset(result.recordset);

    return reports;
  },

  async getLast() {
    const request = new sql.Request(db);
    const result = await request.query(`select top 1 * from ${ReportTable.tableName} order by id desc`);
    const report = ReportModel.fromRecordset(result.recordset);

    return report[0];
  },

  /**
   * @param {ReportColumns} entry
   */
  async create(entry) {
    const request = new sql.Request(db);
    const report = new ReportModel(entry);

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
   * @param {Record<string | number, Array<string | number>>} links
   * @param {sql.Transaction} [trx]
   */
  async attachExecutors(links, trx) {
    const request = trx ? new sql.Request(trx) : new sql.Request(db);
    const table = ReportExecutorTable.createInstance();

    for (const [rId, executorIds] of Object.entries(links)) {
      executorIds.forEach((eId) => table.rows.add(rId, eId));
    }

    await request.bulk(table);
    return table.rows.length;
  },

  /**
   * @param {ReportColumns[]} entries
   * @param {sql.Transaction} [trx]
   */
  async bulk(entries, trx) {
    const request = trx ? new sql.Request(trx) : new sql.Request(db);
    const table = ReportTable.createInstance();
    const lastReportId = (await this.getLast()).id;
    let nextAddId = Number.parseInt(lastReportId, 10);

    for (const e of entries) {
      table.rows.add(
        ++nextAddId,
        e.date,
        e.reason_call,
        e.job_description,
        e.root_cause,
        e.applicant_id,
        e.equipment_id
      );
    }

    const res = await request.bulk(table);

    return res.rowsAffected;
  }
};
