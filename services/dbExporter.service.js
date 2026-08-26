import { equipmentRepository } from "#root/repositories/equipment.repository.js";

/** @import { ExporterAdapterInterface } from './types.js' */

export const dbExporterService = {
  /**
   * @param { new () => ExporterAdapterInterface } Adapter
   * @param {{ filter?: { systemIds?: number[] | string[] } }} options
   * */
  async export(Adapter, options) {
    const db = await equipmentRepository.getAll({ filter: options.filter });
    const AdapterInstance = new Adapter();

    /** @type {Buffer} */
    const data = await AdapterInstance.export(db);
    return data;
  }
};

export * from "./exporters/index.js";
