import ExcelJS from "exceljs";

/**
 * @import { ExporterAdapterInterface } from '../types.js'
 * @import { SystemDbRecord } from '#repositories/equipment.repository.js'
 */

/** @implements {ExporterAdapterInterface} */
export class XlsExporterAdapter {
  /** @type {Partial<ExcelJS.AddWorksheetOptions>} */
  static mainWsOptions = { views: [{ state: "frozen", ySplit: 1, zoomScale: 70 }] };

  constructor() {
    this.wb = new ExcelJS.Workbook();
    this.ws = this.wb.addWorksheet("Перечень систем", XlsExporterAdapter.mainWsOptions);

    /** @type {Array<any[]>} */
    this.data = [];
  }

  /** @param {SystemDbRecord[]} db */
  async export(db) {
    /** @type {Map<string, { row: number }>} */
    const addedBaseLocationNames = new Map();

    /** @type {{ colStart: string, colEnd: string, from: number; to: number }[]} */
    const mergeRanges = [];

    let currentRow = 2;

    for (const system of db) {
      const subsystems = system.subsystems || [];

      // Подсистема не найдены, добавляет название системы с пустыми ячейками
      if (subsystems.length === 0) {
        this.data.push([system.name, ...new Array(8).fill("", 0, 8)]);
        currentRow++;
        continue;
      }

      // Заголовок для расположения систем
      if (!addedBaseLocationNames.has(system.baseLocationName)) {
        addedBaseLocationNames.set(system.baseLocationName, { row: currentRow });
        this.data.push([system.baseLocationName]);
        mergeRanges.push({ colStart: "A", colEnd: "I", from: currentRow, to: currentRow });
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

        this.data.push([
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

      mergeRanges.push({ colStart: "A", colEnd: "A", from: startRow, to: currentRow - 1 });
    }

    this.ws.getRow(1).values = [
      "Наименование системы",
      "Наименование внутренних подсистем.",
      "Расположение",
      "Документация",
      "Электроплан",
      "PLC",
      "HMI",
      "ПЧ",
      "Промышленные ПК"
    ];

    this.ws.autoFilter = `A1:I${this.data.length + 1}`;

    this.ws.addRows(this.data);

    mergeRanges.forEach((r) => this.ws.mergeCells(`${r.colStart}${r.from}:${r.colEnd}${r.to}`));

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

    this.ws.eachRow((row, rowNumber) => {
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

    addedBaseLocationNames.forEach((baseLocationHeaderRow) => {
      const row = this.ws.getRow(baseLocationHeaderRow.row);
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

    const excelBuffer = await this.wb.xlsx.writeBuffer();

    /** @type {Buffer} */
    return excelBuffer;
  }

  setupStyles() {}
}
