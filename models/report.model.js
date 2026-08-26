import { BaseModel } from "./base.model.js";

/** @import { ReportColumns } from "./types.js" */

export class ReportModel extends BaseModel {
  /**
   * @type {ReportColumns['id']}
   */
  id;

  /**
   * @type {ReportColumns['date']}
   */
  date;

  /**
   * @type {ReportColumns['reason_call']}
   */
  reason_call;

  /**
   * @type {ReportColumns['job_description']}
   */
  job_description;

  /**
   * @type {ReportColumns['root_cause']}
   */
  root_cause;

  /**
   * @type {ReportColumns['applicant_id']}
   */
  applicant_id;

  /**
   * @type {ReportColumns['equipment_id']}
   */
  equipment_id;

  /**
   * @param {ReportColumns} columns
   */
  constructor(columns) {
    super();
    this.id = columns.id;
    this.date = columns.date;
    this.reason_call = columns.reason_call;
    this.job_description = columns.job_description;
    this.root_cause = columns.root_cause;
    this.applicant_id = columns.applicant_id;
    this.equipment_id = columns.equipment_id;
  }
}
