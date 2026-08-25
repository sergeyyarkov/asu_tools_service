import { equipmentRepository } from "#root/repositories/equipment.repository.js";
import ExcelJS from "exceljs";

/** @import { HttpRouteHandler } from "#root/http-server/types/http-server.js" */

/**
 * URL: /api/asu_table_xls
 * Method: GET
 * Description: Генерирует файл Excel на основе БД АСУ промплощадки
 *
 * @type {HttpRouteHandler}
 */
export default async (ctx) => {
  const { res } = ctx;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Перечень систем", {
    views: [{ state: "frozen", ySplit: 1, zoomScale: 70 }]
  });

  const filename = encodeURIComponent("АСУ промплощадка.xlsx");
  const equipmentData = await equipmentRepository.getAll();

  const excelData = [];

  /** @type {Map<string, { row: number }} */
  const addedBaseLocationNames = new Map();

  /** @type {{ colStart: string, colEnd: string, from: number; to: number }[]} */
  const mergeRanges = [];

  let currentRow = 2;

  for (const system of equipmentData) {
    const subsystems = system.subsystems || [];

    if (subsystems.length === 0) {
      excelData.push([system.name, ...new Array(8).fill("", 0, 8)]);
      currentRow++;
      continue;
    }

    // Заголовок для расположения систем
    if (!addedBaseLocationNames.has(system.baseLocationName)) {
      addedBaseLocationNames.set(system.baseLocationName, { row: currentRow });
      excelData.push([system.baseLocationName]);
      mergeRanges.push({ colStart: "A", colEnd: "I", from: currentRow, to: currentRow });
      currentRow++;
    }

    const startRow = currentRow;

    // Добавление систем подсистем в таблицу excel
    subsystems.forEach((subsystem) => {
      const hasDocLink = Boolean(subsystem?.docLink);
      const hasElectroPlan = Boolean(subsystem?.electrDiagLink);
      const plcs = subsystem?.plcs || [];
      const hmis = subsystem?.hmis || [];
      const fgs = subsystem?.fgs || [];
      const pcs = subsystem?.pcs || [];

      excelData.push([
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

  ws.getRow(1).values = [
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

  ws.autoFilter = `A1:I${excelData.length + 1}`;

  ws.addRows(excelData);

  mergeRanges.forEach((r) => ws.mergeCells(`${r.colStart}${r.from}:${r.colEnd}${r.to}`));

  ws.getColumn(1).width = 50;
  ws.getColumn(2).width = 50;
  ws.getColumn(3).width = 35;
  ws.getColumn(4).width = 17;
  ws.getColumn(5).width = 17;
  ws.getColumn(6).width = 45;
  ws.getColumn(7).width = 45;
  ws.getColumn(8).width = 45;
  ws.getColumn(9).width = 30;
  ws.getRow(1).height = 45;

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

  addedBaseLocationNames.forEach((baseLocationHeaderRow) => {
    const row = ws.getRow(baseLocationHeaderRow.row);
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

  const excelBuffer = await wb.xlsx.writeBuffer();

  res.res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.res.setHeader("Content-Disposition", `attachment; filename=${filename}; filename*=UTF-8''${filename}`);
  res.res.setHeader("Content-Length", excelBuffer.byteLength);
  res.res.end(excelBuffer);

  return;
};
