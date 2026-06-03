import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ActionRow = {
  area: string;
  itemCode: string;
  description: string;
  priority: string | null;
  status: string;
  responsible: string | null;
  requestDate: Date | null;
  receiptDate: Date | null;
  documentBase: string | null;
};

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR");
}

export function exportToExcel(data: ActionRow[]) {
  const rows = data.map((a) => ({
    Área: a.area,
    Item: a.itemCode,
    Descrição: a.description,
    Prioridade: a.priority ?? "",
    Status: a.status,
    Responsável: a.responsible ?? "",
    "Data da Solicitação": formatDate(a.requestDate),
    "Data do Recebimento": formatDate(a.receiptDate),
    "Base Documental": a.documentBase ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();

  // Style column widths
  ws["!cols"] = [
    { wch: 14 }, { wch: 8 }, { wch: 60 }, { wch: 12 }, { wch: 16 },
    { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Ações RIBEIRA");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), "ribeira-acoes.xlsx");
}

export function exportToPdf(data: ActionRow[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(15, 30, 45);
  doc.rect(0, 0, 297, 297, "F");

  doc.setFontSize(16);
  doc.setTextColor(100, 220, 200);
  doc.text("RIBEIRA SUSTENTÁVEL", 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(150, 160, 170);
  doc.text("Relatório de Ações e Entregas", 14, 23);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 29);

  const statusColors: Record<string, [number, number, number]> = {
    Pendente: [180, 140, 60],
    "Em Andamento": [60, 160, 200],
    Concluído: [60, 180, 120],
    Cancelado: [180, 80, 60],
  };

  autoTable(doc, {
    startY: 35,
    head: [["Área", "Item", "Descrição", "Prioridade", "Status", "Responsável", "Data Sol.", "Data Rec."]],
    body: data.map((a) => [
      a.area,
      a.itemCode,
      a.description.length > 80 ? a.description.substring(0, 80) + "..." : a.description,
      a.priority ?? "-",
      a.status,
      a.responsible ?? "-",
      formatDate(a.requestDate),
      formatDate(a.receiptDate),
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [220, 225, 230],
      fillColor: [18, 28, 40],
      lineColor: [40, 55, 70],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [20, 50, 70],
      textColor: [100, 220, 200],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [22, 34, 48],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 12 },
      2: { cellWidth: 90 },
      3: { cellWidth: 20 },
      4: { cellWidth: 26 },
      5: { cellWidth: 35 },
      6: { cellWidth: 22 },
      7: { cellWidth: 22 },
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const status = data.cell.raw as string;
        const color = statusColors[status] ?? [150, 150, 150];
        doc.setTextColor(...color);
        doc.text(status, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1);
        doc.setTextColor(220, 225, 230);
      }
    },
    margin: { left: 14, right: 14 },
  });

  doc.save("ribeira-acoes.pdf");
}
