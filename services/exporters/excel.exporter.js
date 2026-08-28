import ExcelJS from "exceljs";
import {
  EXCEL_FG_WS_HEADERS,
  EXCEL_HMI_WS_HEADERS,
  EXCEL_MAIN_WS_HEADERS,
  EXCEL_PC_CONFIG_WS_HEADERS,
  EXCEL_PC_WS_HEADERS,
  EXCEL_PLC_WS_HEADERS
} from "./constants.js";
import * as utilNum from "#utils/num.js";
import * as utilStr from "#utils/str.js";

/**
 * @import { ExporterAdapterInterface } from '../types.js'
 * @import { FgModelDbRecord, HmiModelDbRecord, PCConfigDbRecord, PcEquipmentDbRecord, PlcModelDbRecord, SubSystemDbRecord, SystemDbRecord } from '#repositories/equipment.repository.js'
 */

/**
 * @typedef {Map<string, { row: number }>} HeadingRowMap
 * @typedef {Array<any[]>} WsData
 */

/** @implements {ExporterAdapterInterface} */
export class XlsExporterAdapter {
  /** @type {Partial<ExcelJS.AddWorksheetOptions>} */
  static worksheetsOptions = { views: [{ state: "frozen", ySplit: 1, zoomScale: 70 }] };

  constructor() {
    this.wb = new ExcelJS.Workbook();
    this.ws = this.wb.addWorksheet("Перечень систем", XlsExporterAdapter.worksheetsOptions);
    this.PcWs = this.wb.addWorksheet("Перечень ПК", XlsExporterAdapter.worksheetsOptions);
    this.pcConfigWs = this.wb.addWorksheet("Компоненты ПК", XlsExporterAdapter.worksheetsOptions);
    this.hmiWs = this.wb.addWorksheet("HMI", XlsExporterAdapter.worksheetsOptions);
    this.plcWs = this.wb.addWorksheet("PLC", XlsExporterAdapter.worksheetsOptions);
    this.fgWs = this.wb.addWorksheet("ПЧ", XlsExporterAdapter.worksheetsOptions);

    /** @type {WsData} */
    this.mainSheetData = [];

    /** @type {WsData} */
    this.pcSheetData = [];

    /** @type {WsData} */
    this.pcConfigSheetData = [];

    /** @type {WsData} */
    this.hmiSheetData = [];

    /** @type {WsData} */
    this.plcSheetData = [];

    /** @type {WsData} */
    this.fgSheetData = [];

    /** @type {{ sheet: ExcelJS.Worksheet, colStart: string, colEnd: string, from: number; to: number }[]} */
    this.mergeRanges = [];
  }

  /** @param {SystemDbRecord[]} db */
  async export(db) {
    db.sort((a, b) => a.baseLocationName.localeCompare(b.baseLocationName, "ru", { sensitivity: "base" }));

    const mainWsHeadings = this.fillMainWorksheet(db);
    const pcWsHeadings = this.fillPcWorksheet(db);
    const pcConfigWsHeadings = this.fillPcConfigWorksheet(db);
    const hmiWsHeadings = this.fillHmisWorksheet(db);
    const plcWsHeadings = this.fillPlcsWorksheet(db);
    const fgWsHeadings = this.fillFgsWorksheet(db);

    this.ws.getRow(1).values = EXCEL_MAIN_WS_HEADERS;
    this.PcWs.getRow(1).values = EXCEL_PC_WS_HEADERS;
    this.pcConfigWs.getRow(1).values = EXCEL_PC_CONFIG_WS_HEADERS;
    this.hmiWs.getRow(1).values = EXCEL_HMI_WS_HEADERS;
    this.plcWs.getRow(1).values = EXCEL_PLC_WS_HEADERS;
    this.fgWs.getRow(1).values = EXCEL_FG_WS_HEADERS;

    this.ws.autoFilter = `A1:I${this.mainSheetData.length + 1}`;
    this.PcWs.autoFilter = `A1:T${this.pcSheetData.length + 1}`;
    this.pcConfigWs.autoFilter = `A1:O${this.pcSheetData.length + 1}`;
    this.hmiWs.autoFilter = `A1:O${this.pcSheetData.length + 1}`;

    this.ws.addRows(this.mainSheetData);
    this.PcWs.addRows(this.pcSheetData);
    this.pcConfigWs.addRows(this.pcConfigSheetData);
    this.hmiWs.addRows(this.hmiSheetData);
    this.plcWs.addRows(this.plcSheetData);
    this.fgWs.addRows(this.fgSheetData);

    this.mergeRanges.forEach((r) => r.sheet.mergeCells(`${r.colStart}${r.from}:${r.colEnd}${r.to}`));

    this.ws.getColumn(1).width = 50;
    this.ws.getColumn(2).width = 50;
    this.ws.getColumn(3).width = 35;
    this.ws.getColumn(4).width = 17;
    this.ws.getColumn(5).width = 17;
    this.ws.getColumn(6).width = 45;
    this.ws.getColumn(7).width = 45;
    this.ws.getColumn(8).width = 45;
    this.ws.getColumn(9).width = 30;
    this.ws.getRow(1).height = 45;

    this.PcWs.getColumn(1).width = 30;
    this.PcWs.getColumn(2).width = 40;
    this.PcWs.getColumn(3).width = 20;
    utilNum.range(4, 20).forEach((el) => (this.PcWs.getColumn(el).width = 18));
    this.pcConfigWs.getColumn(1).width = 30;
    this.pcConfigWs.getColumn(2).width = 35;
    utilNum.range(3, 8).forEach((el) => (this.pcConfigWs.getColumn(el).width = 25));
    this.pcConfigWs.getColumn(9).width = 40;
    this.pcConfigWs.getColumn(10).width = 20;
    utilNum.range(11, 15).forEach((el) => (this.pcConfigWs.getColumn(el).width = 30));

    this.hmiWs.getColumn(1).width = 30;
    this.hmiWs.getColumn(2).width = 45;
    this.hmiWs.getColumn(3).width = 35;
    utilNum.range(4, 15).forEach((el) => (this.hmiWs.getColumn(el).width = 16));
    this.hmiWs.getColumn(9).width = 35;

    this.plcWs.getColumn(1).width = 30;
    this.plcWs.getColumn(2).width = 40;
    this.plcWs.getColumn(3).width = 20;
    utilNum.range(4, 13).forEach((el) => (this.plcWs.getColumn(el).width = 16));
    this.fgWs.getColumn(6).width = 30;
    this.fgWs.getColumn(7).width = 35;

    this.fgWs.getColumn(1).width = 30;
    this.fgWs.getColumn(2).width = 40;
    this.fgWs.getColumn(3).width = 20;
    utilNum.range(4, 11).forEach((el) => (this.fgWs.getColumn(el).width = 16));
    this.fgWs.getColumn(6).width = 25;
    this.fgWs.getColumn(7).width = 35;

    this.setSheetCellStyles(this.ws);
    this.setSheetCellStyles(this.PcWs);
    this.setSheetCellStyles(this.pcConfigWs);
    this.setSheetCellStyles(this.hmiWs);
    this.setSheetCellStyles(this.plcWs);
    this.setSheetCellStyles(this.fgWs);
    this.setHeadingCellsStyles(this.ws, mainWsHeadings);
    this.setHeadingCellsStyles(this.PcWs, pcWsHeadings);
    this.setHeadingCellsStyles(this.pcConfigWs, pcConfigWsHeadings);
    this.setHeadingCellsStyles(this.hmiWs, hmiWsHeadings);
    this.setHeadingCellsStyles(this.plcWs, plcWsHeadings);
    this.setHeadingCellsStyles(this.fgWs, fgWsHeadings);

    const excelBuffer = await this.wb.xlsx.writeBuffer();

    /** @type {Buffer} */
    return excelBuffer;
  }

  /**
   * @param {SystemDbRecord[]} db
   */
  fillPcWorksheet(db) {
    /** @type {HeadingRowMap} */
    const headings = new Map();

    let currRow = 2;

    for (const system of db) {
      const subsystems = system.subsystems || [];
      const pcCount = subsystems.reduce((count, curr) => (curr?.pcs?.length || 0) + count, 0);

      if (subsystems.length === 0) continue;

      if (pcCount > 0) {
        const isHeadingInserted = this.addBaseLocHeading({
          ws: this.PcWs,
          data: this.pcSheetData,
          currRow,
          headings,
          name: system.baseLocationName,
          colStart: "A",
          colEnd: "T"
        });

        if (isHeadingInserted) currRow++;
      }

      for (const subsystem of subsystems) {
        const pcItems = subsystem?.pcs || [];

        if (pcItems.length === 0) continue;

        pcItems.forEach((pc) => {
          this.addPcRow(pc, system, subsystem);
          currRow++;
        });
      }
    }

    return headings;
  }

  /**
   * @param {SystemDbRecord[]} db
   */
  fillPcConfigWorksheet(db) {
    /** @type {HeadingRowMap} */
    const headings = new Map();

    let currRow = 2;

    for (const system of db) {
      const subsystems = system.subsystems || [];
      const pcCount = subsystems.reduce((count, curr) => (curr?.pcs?.length || 0) + count, 0);

      if (subsystems.length === 0) continue;

      if (pcCount > 0) {
        const isHeadingInserted = this.addBaseLocHeading({
          ws: this.pcConfigWs,
          data: this.pcConfigSheetData,
          currRow,
          headings,
          name: system.baseLocationName,
          colStart: "A",
          colEnd: "O"
        });

        if (isHeadingInserted) currRow++;
      }

      for (const subsystem of subsystems) {
        const pcItems = subsystem?.pcs || [];

        if (pcItems.length === 0) continue;

        pcItems.forEach((pc) => {
          const configs = pc?.config || [];
          if (configs.length > 0) {
            configs.forEach((c) => {
              this.addPcConfigRow(c, subsystem);
              currRow++;
            });
          }
        });
      }
    }

    return headings;
  }

  /**
   * @param {SystemDbRecord[]} db
   */
  fillHmisWorksheet(db) {
    /** @type {HeadingRowMap} */
    const headings = new Map();

    let currRow = 2;

    for (const system of db) {
      const subsystems = system.subsystems || [];
      const pcCount = subsystems.reduce((count, curr) => (curr?.hmis?.length || 0) + count, 0);

      if (subsystems.length === 0) continue;

      if (pcCount > 0) {
        const isHeadingInserted = this.addBaseLocHeading({
          ws: this.hmiWs,
          data: this.hmiSheetData,
          currRow,
          headings,
          name: system.baseLocationName,
          colStart: "A",
          colEnd: "O"
        });

        if (isHeadingInserted) currRow++;
      }

      for (const subsystem of subsystems) {
        const hmiItems = subsystem?.hmis || [];

        if (hmiItems.length === 0) continue;

        hmiItems.forEach((hmi) => {
          // console.log(hmi);
          this.addHmiRow(hmi, subsystem);
          currRow++;
        });
      }
    }

    return headings;
  }

  /**
   * @param {SystemDbRecord[]} db
   */
  fillPlcsWorksheet(db) {
    /** @type {HeadingRowMap} */
    const headings = new Map();

    let currRow = 2;

    for (const system of db) {
      const subsystems = system.subsystems || [];
      const plcCount = subsystems.reduce((count, curr) => (curr?.plcs?.length || 0) + count, 0);

      if (subsystems.length === 0) continue;

      if (plcCount > 0) {
        const isHeadingInserted = this.addBaseLocHeading({
          ws: this.plcWs,
          data: this.plcSheetData,
          currRow,
          headings,
          name: system.baseLocationName,
          colStart: "A",
          colEnd: "M"
        });

        if (isHeadingInserted) currRow++;
      }

      for (const subsystem of subsystems) {
        const plcItems = subsystem?.plcs || [];

        if (plcItems.length === 0) continue;

        plcItems.forEach((plc) => {
          // console.log(hmi);
          this.addPlcRow(plc, subsystem);
          currRow++;
        });
      }
    }

    return headings;
  }

  /**
   * @param {SystemDbRecord[]} db
   */
  fillFgsWorksheet(db) {
    /** @type {HeadingRowMap} */
    const headings = new Map();

    let currRow = 2;

    for (const system of db) {
      const subsystems = system.subsystems || [];
      const fgCount = subsystems.reduce((count, curr) => (curr?.fgs?.length || 0) + count, 0);

      if (subsystems.length === 0) continue;

      if (fgCount > 0) {
        const isHeadingInserted = this.addBaseLocHeading({
          ws: this.fgWs,
          data: this.fgSheetData,
          currRow,
          headings,
          name: system.baseLocationName,
          colStart: "A",
          colEnd: "K"
        });

        if (isHeadingInserted) currRow++;
      }

      for (const subsystem of subsystems) {
        const fgsItems = subsystem?.fgs || [];

        if (fgsItems.length === 0) continue;

        fgsItems.forEach((fg) => {
          this.addFgRow(fg, subsystem);
          currRow++;
        });
      }
    }

    return headings;
  }

  /**
   * @param {SystemDbRecord[]} db
   */
  fillMainWorksheet(db) {
    /** @type {HeadingRowMap} */
    const headings = new Map();

    let currentRow = 2;

    for (const system of db) {
      const subsystems = system.subsystems || [];

      // Подсистемы не найдены, добавляет название системы с пустыми ячейками
      if (subsystems.length === 0) {
        this.mainSheetData.push([system.name, ...new Array(8).fill("", 0, 8)]);
        currentRow++;
        continue;
      }

      // Заголовок для расположения систем
      if (!headings.has(system.baseLocationName)) {
        headings.set(system.baseLocationName, { row: currentRow });
        this.mainSheetData.push([system.baseLocationName]);
        this.mergeRanges.push({ sheet: this.ws, colStart: "A", colEnd: "I", from: currentRow, to: currentRow });
        currentRow++;
      }

      const startRow = currentRow;

      // Добавление систем и подсистем в таблицу Excel
      subsystems.forEach((subsystem) => {
        const hasDocLink = Boolean(subsystem?.docLink);
        const hasElectroPlan = Boolean(subsystem?.electrDiagLink);
        const plcs = subsystem?.plcs || [];
        const hmis = subsystem?.hmis || [];
        const fgs = subsystem?.fgs || [];
        const pcs = subsystem?.pcs || [];

        this.mainSheetData.push([
          system.name,
          subsystem.name,
          `${system.baseLocationName} ${subsystem.locationName}`,
          hasDocLink ? { text: "Документация", hyperlink: subsystem?.docLink } : "",
          hasElectroPlan ? { text: "Электроплан", hyperlink: subsystem?.electrDiagLink } : "",
          plcs.map((plc) => `${plc.nameModel || ""}`).join("\n"),
          hmis.map((hmi) => `${hmi.nameModel || ""}`).join("\n"),
          fgs.map((fg) => `${fg.nameModel || ""}`).join("\n"),
          pcs.map((pc) => `${pc.name || ""}`).join("\n")
        ]);

        currentRow++;
      });

      this.mergeRanges.push({ sheet: this.ws, colStart: "A", colEnd: "A", from: startRow, to: currentRow - 1 });
    }

    return headings;
  }

  /**
   * @param {PCConfigDbRecord} config
   * @param {SubSystemDbRecord} subsystem
   */
  addPcConfigRow(config, subsystem) {
    this.pcConfigSheetData.push([
      subsystem.name || "",
      config.modelName || "",
      config.partNum || "",
      config.cpu || "",
      config.motherboard || "",
      config.socket || "",
      config.mem || "",
      config.memVolume || "",
      config.hdd || "",
      config.hddVolume || "",
      config.powerUnit || "",
      config.expansionCards || "",
      config.externalDevices || "",
      config.cpuFan || "",
      config.caseFan || ""
    ]);
  }

  /**
   *
   * @param {PcEquipmentDbRecord} pc
   * @param {SystemDbRecord} system
   * @param {SubSystemDbRecord} subsystem
   */
  addPcRow(pc, system, subsystem) {
    const hasProjectSourceLink = Boolean(pc?.projectSourceLink) && utilStr.isStrLink(pc?.projectSourceLink || "");
    const hasProjectArchieveLink = Boolean(pc?.projectArchieveLink) && utilStr.isStrLink(pc?.projectArchieveLink || "");
    const modelNames = pc?.config?.map((c) => c.modelName).join("\n");

    this.pcSheetData.push([
      subsystem.name,
      modelNames || "",
      pc.invNumber || "",
      `${system.baseLocationName} ${subsystem.locationName}`,
      pc.purpose || "",
      pc.name || "",
      pc.adminLoginPass || "",
      pc.workerLoginPass || "",
      pc.promConn || "",
      pc.compConn || "",
      pc.locAndRemark || "",
      pc.upsReq || "",
      pc.upsAvail || "",
      pc.lastServiceDate || "",
      pc.osVersion || "",
      pc.indSoftInst || "",
      pc.softAdminLoginPass || "",
      pc.projectSource || "",
      hasProjectSourceLink ? { text: "Ссылка", hyperlink: pc.projectSourceLink } : pc.projectSourceLink || "",
      hasProjectArchieveLink ? { text: "Ссылка", hyperlink: pc.projectArchieveLink } : pc.projectArchieveLink || ""
    ]);
  }

  /**
   * @param {HmiModelDbRecord} hmi
   * @param {SubSystemDbRecord} subsystem
   */
  addHmiRow(hmi, subsystem) {
    const hasProjectLink = Boolean(hmi?.projectLink) && utilStr.isStrLink(hmi?.projectLink || "");
    const hasImageLink = Boolean(hmi?.imageLink) && utilStr.isStrLink(hmi?.imageLink || "");

    this.hmiSheetData.push([
      subsystem.name,
      hmi.nameModel || "",
      hmi.partNum || "",
      hmi.cabinet || "",
      hmi.cabinetLocation || "",
      hmi.purpose || "",
      hmi.adminLoginPass || "",
      hmi.workerLoginPass || "",
      hmi.interface || "",
      hmi.connectionSettings || "",
      hmi.cableLocation || "",
      hmi.projectName || "",
      hasProjectLink ? { text: "Ссылка", hyperlink: hmi.projectLink } : hmi.projectLink || "",
      hmi.diskImage || "",
      hasImageLink ? { text: "Ссылка", hyperlink: hmi.imageLink } : hmi.imageLink || ""
    ]);
  }

  /**
   * @param {PlcModelDbRecord} plc
   * @param {SubSystemDbRecord} subsystem
   */
  addPlcRow(plc, subsystem) {
    const hasProjectLink = Boolean(plc?.projectLink) && utilStr.isStrLink(plc?.projectLink || "");

    this.plcSheetData.push([
      subsystem.name,
      plc.nameModel || "",
      plc.partNum || "",
      plc.cabinet || "",
      plc.cabinetLocation || "",
      plc.purpose || "",
      plc.interface || "",
      plc.connectionSettings || "",
      plc.cableLocation || "",
      plc.projectName || "",
      plc.plcPass || "",
      plc.safetyPass || "",
      hasProjectLink ? { text: "Ссылка", hyperlink: plc.projectLink } : plc.projectLink || ""
    ]);
  }

  /**
   * @param {FgModelDbRecord} fg
   * @param {SubSystemDbRecord} subsystem
   */
  addFgRow(fg, subsystem) {
    const hasProjectLink = Boolean(fg?.projectLink) && utilStr.isStrLink(fg?.projectLink || "");

    this.fgSheetData.push([
      subsystem.name,
      fg.nameModel || "",
      fg.partNum || "",
      fg.cabinet || "",
      fg.cabinetLocation || "",
      fg.purpose || "",
      fg.interface || "",
      fg.connectionSettings || "",
      fg.cableLocation || "",
      fg.configName || "",
      hasProjectLink ? { text: "Ссылка", hyperlink: fg.projectLink } : fg.projectLink || ""
    ]);
  }

  /**
   * @param {{ ws: ExcelJS.Worksheet, data: WsData, headings: HeadingRowMap, name: string, currRow: number, colStart: string, colEnd: string }} info
   */
  addBaseLocHeading({ ws, data, headings, name, currRow, colStart, colEnd }) {
    if (!headings.has(name)) {
      headings.set(name, { row: currRow });
      data.push([name]);
      this.mergeRanges.push({ sheet: ws, colStart, colEnd, from: currRow, to: currRow });

      return true;
    }

    return false;
  }

  /**
   * @param {ExcelJS.Worksheet} ws
   * @param {Map<string, { row: number }>} headings
   */
  setHeadingCellsStyles(ws, headings) {
    headings.forEach((h) => {
      const row = ws.getRow(h.row);
      row.height = 30;
      row.eachCell((cell) => {
        cell.font = {
          name: "Tahoma",
          bold: true,
          size: 11
        };
        cell.border = {
          top: { style: "medium", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } }
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF92D050" }
        };
      });
    });
  }

  /**
   * @param {ExcelJS.Worksheet} ws
   */
  setSheetCellStyles(ws) {
    ws.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "center"
        };

        if (rowNumber > 1) {
          cell.font = {
            name: "Calibri",
            size: 12
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } }
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF4F4F4" }
          };

          if (cell.value === null || cell.value === undefined || cell.value === "") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFCE4D6" }
            };
          }

          // Ссылки
          if (cell.value && typeof cell.value === "object" && "hyperlink" in cell.value) {
            cell.font = {
              name: "Calibri",
              size: 11,
              color: { argb: "FF0563C1" },
              underline: "single"
            };
          }
        } else {
          cell.font = {
            name: "Calibri",
            size: 11,
            color: { argb: "FFFFFFFF" }
          };

          cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } }
          };

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF27A2B" }
          };
        }
      });
    });
  }
}
