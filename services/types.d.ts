import { SystemDbRecord } from "#root/repositories/equipment.repository.js";

export interface ExporterAdapterInterface {
  export: (database: Array<SystemDbRecord>) => Promise<any>;
}
