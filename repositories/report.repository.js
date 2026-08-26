import { ReportModel } from "#models/index.js";
import { ReportExecutorTable, ReportTable } from "#tables/index.js";
import { UOW } from "./index.js";

/** @import { ReportColumns } from "#models/types.js" */

export const reportRepository = {
  async getAll() {
    const request = UOW.request;
    const result = await request.query(`select * from dbo.${ReportTable.tableName};`);
    const reports = ReportModel.fromRecordset(result.recordset);

    return reports;
  },

  async getLast() {
    const request = UOW.request;
    const result = await request.query(`select top 1 * from ${ReportTable.tableName} order by id desc`);
    const report = ReportModel.fromRecordset(result.recordset);

    return report.at(0);
  },

  async delAll() {
    await UOW.run(async () => {
      const request = UOW.request;

      await request.query(`delete from ${ReportExecutorTable.tableName};`);
      await request.query(`delete from ${ReportTable.tableName};`);
      await request.query(`DBCC CHECKIDENT ('${ReportExecutorTable.tableName}', RESEED, 0);`);
      await request.query(`DBCC CHECKIDENT ('${ReportTable.tableName}', RESEED, 0);`);
    });
  },

  /**
   * @param {ReportColumns} entry
   */
  async create(entry) {
    const request = UOW.request;
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
   * @param {Record<string, Array<string | number>>[]} links
   */
  async attachExecutors(links) {
    const request = UOW.request;
    const table = ReportExecutorTable.createInstance();

    for (const report of Object.values(links)) {
      for (const [rId, executorIds] of Object.entries(report)) {
        executorIds.forEach((eId) => table.rows.add(rId, eId));
      }
    }

    await request.bulk(table);
    return table.rows.length;
  },

  /**
   * @param {ReportColumns[]} entries
   */
  async bulk(entries) {
    const request = UOW.request;
    const table = ReportTable.createInstance();
    const lastReportId = (await this.getLast())?.id || 0;
    let nextAddId = typeof lastReportId === "string" ? Number.parseInt(lastReportId, 10) : lastReportId;

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

    return { rowsAffected: res.rowsAffected, addedRowIds: table.rows.map((r) => r[0]) };
  }
};
