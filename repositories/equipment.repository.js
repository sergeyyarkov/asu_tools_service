import { UOW } from "./index.js";
import sql from "mssql";

/**
 * @typedef {{
 * invNumber?: string | null;
 * location?: string | null;
 * purpose?: string | null;
 * name?: string | null;
 * adminLoginPass?: string | null;
 * workerLoginPass?: string | null;
 * promConn?: string | null;
 * compConn?: string | null;
 * locAndRemark?: string | null;
 * upsReq?: string | null;
 * upsAvail?: string | null;
 * lastServiceDate?: string | null;
 * osVersion?: string | null;
 * indSoftInst?: string | null;
 * softAdminLoginPass?: string | null;
 * projectSource?: string | null;
 * projectSourceLink?: string | null;
 * comments?: string | null;
 * projectArchieveLink?: string | null;
 * config?: PCConfigDbRecord[] | null;
 * }} PcEquipmentDbRecord
 */

/**
 * @typedef {{
 *    nameModel?: string | null;
 *    partNum?: string | null;
 *    cabinet?: string | null;
 *    cabinetLocation?: string | null;
 *    purpose?: string | null;
 *    adminLoginPass?: string | null;
 *    workerLoginPass?: string | null;
 *    interface?: string | null;
 *    cableLocation?: string | null;
 *    projectName?: string | null;
 *    projectLink?: string | null;
 *    diskImage?: string | null;
 *    imageLink?: string | null;
 *    connectionSettings?: string | null;
 * }} HmiModelDbRecord
 */

/**
 * @typedef {{
 *    modelName?: string | null;
 *    partNum?: string | null;
 *    motherboard?: string | null;
 *    socket?: string | null;
 *    cpu?: string | null;
 *    mem?: string | null;
 *    memVolume?: string | null;
 *    hdd?: string | null;
 *    hddVolume?: string | null;
 *    expansionCards?: string | null;
 *    externalDevices?: string | null;
 *    caseFan?: string | null;
 *    cpuFan?: string | null;
 *    powerUnit?: string | null;
 * }} PCConfigDbRecord
 */

/**
 * @typedef {{
 *    nameModel?: string | null;
 *    partNum?: string | null;
 *    cabinet?: string | null;
 *    cabinetLocation?: string | null;
 *    purpose?: string | null;
 *    interface?: string | null;
 *    cableLocation?: string | null;
 *    projectName?: string | null;
 *    plcPass?: string | null;
 *    safetyPass?: string | null;
 *    projectLink?: string | null;
 *    nameId?: string | null;
 *    connectionSettings?: string | null;
 * }} PlcModelDbRecord
 */

/**
 * @typedef {{
 *    nameModel?: string | null;
 *    partNum?: string | null;
 *    cabinet?: string | null;
 *    cabinetLocation?: string | null;
 *    purpose?: string | null;
 *    interface?: string | null;
 *    cableLocation?: string | null;
 *    configName?: string | null;
 *    projectLink?: string | null;
 *    nameId?: string | null;
 *    connectionSettings?: string | null;
 * }} FgModelDbRecord
 */

/**
 * @typedef {{  id: string, name?: string,
 *              docLink?: string | null, electrDiagLink?: string | null,
 *              locationName?: string | null, plcs?: Array<PlcModelDbRecord>,
 *              fgs?: Array<FgModelDbRecord>, hmis: Array<HmiModelDbRecord>,
 *              pcs?: Array<PcEquipmentDbRecord>
 *          }} SubSystemDbRecord;
 *
 * @typedef {{ id: string, name: string, baseLocationName: string, subsystems: Array<SubSystemDbRecord> }} SystemDbRecord;
 */

export const equipmentRepository = {
  /**
   * @param {{ filter?: { systemIds?: string[] | number[], subsystemIds? : string[] | number[] } }} [options]
   * @returns {Promise<Array<SystemDbRecord>>}
   */
  async getAll(options) {
    const request = UOW.request;
    const systemIds = options?.filter?.systemIds;
    const subsystemIds = options?.filter?.subsystemIds;
    const hasFilterBySystemIds = systemIds !== undefined && systemIds.length !== 0;
    const hasFilterBySubsystemIds = subsystemIds !== undefined && subsystemIds.length !== 0;

    const whereParts = [];

    if (hasFilterBySystemIds) {
      const idsString = systemIds.map(Number).filter(Boolean).join(",");
      request.input("sysIdsString", sql.VarChar, idsString);
      whereParts.push(`systemsTbl.id IN (SELECT value FROM STRING_SPLIT(@sysIdsString, ','))`);
    }

    if (hasFilterBySubsystemIds) {
      const subIdsString = subsystemIds.map(Number).filter(Boolean).join(",");
      request.input("subSysIdsString", sql.VarChar, subIdsString);

      whereParts.push(`systemsTbl.id IN (
        SELECT systemlist_id 
        FROM asu_system_api_systemlist_subsystem_name 
        WHERE subsystemlist_id IN (SELECT value FROM STRING_SPLIT(@subSysIdsString, ','))
      )`);
    } else {
      request.input("subSysIdsString", sql.VarChar, null);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const query = `
       SELECT systemsTbl.id as id, 
              systemsTbl.name as name,
              baseLocTbl.name as baseLocationName,
              (select subSystemsTbl.id as id, 
                  subSystemsTbl.name as name,
                  subSystemsTbl.doc_link as docLink,
                  subSystemsTbl.electr_diag_link as electrDiagLink,
                  locTbl.name as locationName,
				  (select 
					plcTbl.plc_name as name,
					plcModelTbl.name as nameModel,
          plcModelTbl.part_num as partNum,
          plcTbl.cabinet as cabinet,
          plcTbl.cabinet_location as cabinetLocation,
          plcTbl.purpose as purpose,
          plcModelTbl.interface as interface,
          plcTbl.cable_location as cableLocation,
          plcTbl.project_name as projectName,
          plcTbl.plc_pass as plcPass,
          plcTbl.safety_pass as safetyPass,
          plcTbl.project_link as projectLink,
          plcTbl.connection_settings as connectionSettings


					FROM asu_system_api_plc as plcTbl
					  left join asu_system_api_plc_model as plcModelTbl on plcModelTbl.id = plcTbl.name_id
					  left join asu_system_api_subsystemlist_plc as jtPLC on jtPLC.plc_id = plcTbl.id
					where jtPLC.subsystemlist_id = subSystemsTbl.id
					FOR JSON PATH) as plcs,

          (select 
            hmiTbl.hmi_name as name,
            hmiModelTbl.name as nameModel,
            hmiModelTbl.part_num as partNum,
            hmiTbl.cabinet as cabinet,
            hmiTbl.cabinet_location as cabinetLocation,
            hmiTbl.purpose as purpose,
            hmiTbl.admin_login_pass as adminLoginPass,
            hmiTbl.worker_login_pass as workerLoginPass,
            hmiModelTbl.interface as interface,
            hmiTbl.cable_location as cableLocation,
            hmiTbl.project_name as projectName,
            hmiTbl.project_link as projectLink,
            hmiTbl.disk_image as diskImage,
            hmiTbl.image_link as imageLink,
            hmiTbl.connection_settings as connectionSettings

					FROM asu_system_api_hmi as hmiTbl
					  left join asu_system_api_hmi_model as hmiModelTbl on hmiModelTbl.id = hmiTbl.name_id
					  left join asu_system_api_subsystemlist_hmi as jtHMI on jtHMI.hmi_id = hmiTbl.id
					where jtHMI.subsystemlist_id = subSystemsTbl.id
					FOR JSON PATH) as hmis,

          (select 
            fgTbl.fg_name as name,
            fgModelTbl.name as nameModel,
            fgModelTbl.part_num as partNum,
            fgModelTbl.interface as interface,
            fgTbl.cabinet as cabinet,
            fgTbl.cabinet_location as cabinetLocation,
            fgTbl.purpose as purpose,
            fgTbl.cable_location as cableLocation,
            fgTbl.config_name as configName,
            fgTbl.project_link as projectLink,
            fgTbl.name_id as nameId,
            fgTbl.connection_settings as connectionSettings

					FROM asu_system_api_fg as fgTbl
					  left join asu_system_api_fg_model as fgModelTbl on fgModelTbl.id = fgTbl.name_id
					  left join asu_system_api_subsystemlist_fg as jtFG on jtFG.fg_id = fgTbl.id
					where jtFG.subsystemlist_id = subSystemsTbl.id
					FOR JSON PATH) as fgs,

          (select pcTbl.inv_number as invNumber,
                  pcTbl.location as location,
                  pcTbl.purpose as purpose,
                  pcTbl.pc_name as name,
                  pcTbl.admin_login_pass as adminLoginPass,
                  pcTbl.worker_login_pass as workerLoginPass,
                  pcTbl.prom_conn as promConn,
                  pcTbl.comp_conn as compConn,
                  pcTbl.loc_and_remark as locAndRemark,
                  pcTbl.ups_req as upsReq,
                  pcTbl.ups_avail as upsAvail,
                  pcTbl.last_service_date as lastServiceDate,
                  pcTbl.os_version as osVersion,
                  pcTbl.ind_soft_inst as indSoftInst,
                  pcTbl.soft_admin_login_pass as softAdminLoginPass,
                  pcTbl.project_source as projectSource,
                  pcTbl.project_source_link as projectSourceLink,
                  pcTbl.comments as comments,
                  pcTbl.project_archieve_link as projectArchieveLink,
                  (select
                    pcConfigTbl.model as modelName,
                    pcConfigTbl.part_num as partNum,
                    pcConfigTbl.motherboard as motherboard,
                    pcConfigTbl.socket as socket,
                    pcConfigTbl.cpu as cpu,
                    pcConfigTbl.mem as mem,
                    pcConfigTbl.mem_volume as memVolume,
                    pcConfigTbl.hdd as hdd,
                    pcConfigTbl.hdd_volume as hddVolume,
                    pcConfigTbl.expansion_cards as expansionCards,
                    pcConfigTbl.external_devices as externalDevices,
                    pcConfigTbl.case_fan as caseFan,
                    pcConfigTbl.cpu_fan as cpuFan,
                    pcConfigTbl.power_unit as powerUnit
                    from asu_system_api_pcconfig as pcConfigTbl
                      left join asu_system_api_pc_model as jtPCModel on jtPCModel.pc_id = pcTbl.id
                      where pcConfigTbl.id = jtPCModel.pcconfig_id
                    FOR JSON PATH) as config

					FROM asu_system_api_pc as pcTbl
						left join asu_system_api_subsystemlist_pc as jtPC on jtPC.subsystemlist_id = subSystemsTbl.id
            where jtPC.pc_id = pcTbl.id
					FOR JSON PATH) as pcs

                  from asu_system_api_subsystemlist as subSystemsTbl
                    inner join asu_system_api_systemlist_subsystem_name as jt  on subSystemsTbl.id = jt.subsystemlist_id
                    left join asu_system_api_location as locTbl on locTbl.id = subSystemsTbl.location_id
                    where jt.systemlist_id = systemsTbl.id
                      and (@subSysIdsString IS NULL OR subSystemsTbl.id IN (SELECT value FROM STRING_SPLIT(@subSysIdsString, ',')))
                    FOR JSON PATH) as subsystems
            from asu_system_api_systemlist as systemsTbl
            inner join asu_system_api_baselocation as baseLocTbl on systemsTbl.location_id = baseLocTbl.id
            ${whereClause}
            FOR JSON PATH
    `;

    const result = await request.query(query);

    const jsonStringData = result.recordset.map((row) => Object.values(row)[0]).join("");

    return JSON.parse(jsonStringData || "[]");
  }
};
