import { UOW } from "./index.js";

export const equipmentRepository = {
  async getAll() {
    const request = UOW.request;
    const result = await request.query(`
       SELECT systemsTbl.id as id, 
              systemsTbl.name as name,
              baseLocTbl.name as baseLocationName,
              (select subSystemsTbl.id as id, 
                  subSystemsTbl.name as name,
                  subSystemsTbl.doc_link as docLink,
                  subSystemsTbl.electr_diag_link as electrDiagLink,
                  locTbl.name as locationName,
				  (select plcTbl.plc_name as name
					FROM asu_system_api_plc as plcTbl
						left join asu_system_api_subsystemlist_plc as jtPLC on jtPLC.subsystemlist_id = subSystemsTbl.id
            where jtPLC.plc_id = plcTbl.id
					FOR JSON PATH) as plcs,

          (select hmiTbl.hmi_name as name
					FROM asu_system_api_hmi as hmiTbl
						left join asu_system_api_subsystemlist_hmi as jtHMI on jtHMI.subsystemlist_id = subSystemsTbl.id
            where jtHMI.hmi_id = hmiTbl.id
					FOR JSON PATH) as hmis,

          (select fgTbl.fg_name as name
					FROM asu_system_api_fg as fgTbl
						left join asu_system_api_subsystemlist_fg as jtFG on jtFG.subsystemlist_id = subSystemsTbl.id
            where jtFG.fg_id = fgTbl.id
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
            inner join asu_system_api_baselocation as baseLocTbl on systemsTbl.location_id = baseLocTbl.id FOR JSON PATH
    `);

    const jsonStringData = result.recordset.map((row) => Object.values(row)[0]).join("");

    return JSON.parse(jsonStringData || "[]");
  }
};
