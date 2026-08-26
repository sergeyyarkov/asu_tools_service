import { BaseModel } from "./base.model.js";

/** @import { SystemModelTableCols } from "./types.js" */

/**
 * @implements { SystemModelTableCols }
 */
export class SystemModel extends BaseModel {
  id;
  location_id;
  name;

  /** @param {SystemModelTableCols} columns */
  constructor(columns) {
    super();
    this.id = columns.id;
    this.location_id = columns.location_id;
    this.name = columns.name;
  }
}
