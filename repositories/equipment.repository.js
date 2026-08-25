import { UOW } from "./index.js";
import sql from "mssql";

export const equipmentRepository = {
  /**
   * @param {{ filter?: { systemIds?: string[] | number[] } }} [options]
   */
  async getAll(options) {
    const request = UOW.request;
    const systemIds = options?.filter?.systemIds;
    const hasFilterBySystemIds = systemIds !== undefined && systemIds.length !== 0;

    let whereClause = "";

    if (hasFilterBySystemIds) {
      const idsString = systemIds.map(Number).filter(Boolean).join(",");
      request.input("sysIdsString", sql.VarChar, idsString);

      whereClause = `WHERE systemsTbl.id IN (SELECT value FROM STRING_SPLIT(@sysIdsString, ','))`;
    }

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
					plcModelTbl.name as nameModel
					FROM asu_system_api_plc as plcTbl
					  left join asu_system_api_plc_model as plcModelTbl on plcModelTbl.id = plcTbl.name_id
					  left join asu_system_api_subsystemlist_plc as jtPLC on jtPLC.plc_id = plcTbl.id
					where jtPLC.subsystemlist_id = subSystemsTbl.id
					FOR JSON PATH) as plcs,

          (select 
					hmiTbl.hmi_name as name,
					hmiModelTbl.name as nameModel
					FROM asu_system_api_hmi as hmiTbl
					  left join asu_system_api_hmi_model as hmiModelTbl on hmiModelTbl.id = hmiTbl.name_id
					  left join asu_system_api_subsystemlist_hmi as jtHMI on jtHMI.hmi_id = hmiTbl.id
					where jtHMI.subsystemlist_id = subSystemsTbl.id
					FOR JSON PATH) as hmis,

          (select 
					fgTbl.fg_name as name,
					fgModelTbl.name as nameModel
					FROM asu_system_api_fg as fgTbl
					  left join asu_system_api_fg_model as fgModelTbl on fgModelTbl.id = fgTbl.name_id
					  left join asu_system_api_subsystemlist_fg as jtFG on jtFG.fg_id = fgTbl.id
					where jtFG.subsystemlist_id = subSystemsTbl.id
					FOR JSON PATH) as fgs,

          (select pcTbl.pc_name as name
					FROM asu_system_api_pc as pcTbl
						left join asu_system_api_subsystemlist_pc as jtPC on jtPC.subsystemlist_id = subSystemsTbl.id
            where jtPC.pc_id = pcTbl.id
					FOR JSON PATH) as pcs

                  from asu_system_api_subsystemlist as subSystemsTbl
                    inner join asu_system_api_systemlist_subsystem_name as jt  on subSystemsTbl.id = jt.subsystemlist_id
                    left join asu_system_api_location as locTbl on locTbl.id = subSystemsTbl.location_id
                    where jt.systemlist_id = systemsTbl.id
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
