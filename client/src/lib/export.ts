import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SEMPLA_LOGO_B64 } from "./sempla-logo-b64";

// ---- Types ----

type CommentRow = {
  content: string;
  createdAt: Date | null;
  userName: string | null;
};

type DocumentRow = {
  label: string;
  url: string;
  uploaderName: string | null;
  createdAt: Date | null;
};

export type ActionRow = {
  area: string;
  itemCode: string;
  parentCode?: string | null;
  isGroup?: number;
  description: string;
  priority: string | null;
  status: string;
  dueDate?: Date | null;
  requestDate: Date | null;
  receiptDate: Date | null;
  documentBase: string | null;
  observacoes?: string | null;
  orgao?: string | null;
  responsavelNome?: string | null;
  responsavelCargo?: string | null;
  responsavelTel?: string | null;
  responsavelEmail?: string | null;
  comments?: CommentRow[];
  documents?: DocumentRow[];
};

export type ExportFilters = {
  areas?: string[];
  statuses?: string[];
  priorities?: string[];
  orgaos?: string[];
  responsaveis?: string[];
  searchText?: string;
  deadlineFilter?: string;
  docFilter?: string;
  contactFilter?: string;
};

// ---- Helpers ----

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function deadlineSituation(dueDate: Date | null | undefined, status: string): string {
  if (status === "Cancelado") return "Cancelado";
  if (status === "Concluído") return "Concluído";
  if (!dueDate) return "Sem prazo";
  const now = new Date();
  return new Date(dueDate) < now ? "Atrasado" : "No prazo";
}

// ---- Excel Export ----

export function exportToExcel(data: ActionRow[]) {
  // Determine hierarchy depth for indentation
  const getDepth = (itemCode: string) => (itemCode.match(/\./g) || []).length;

  const DOC_STATUS_LABEL: Record<string, string> = {
    accepted: "DOC ACEITO",
    pending: "DOC COM PENDÊNCIA",
  };

  // Expand: one row per item; if item has documents, add extra rows for each document
  const rows: Record<string, string | number>[] = [];

  for (const a of data) {
    const isGroup = a.isGroup === 1;
    const depth = getDepth(a.itemCode);
    const indent = "  ".repeat(depth);
    const docs = (!isGroup && a.documents && a.documents.length > 0) ? a.documents : [];

    const baseRow = {
      "Área": a.area,
      "Código": a.itemCode,
      "Descrição": isGroup ? `${indent}▌ ${a.description}` : `${indent}${a.description}`,
      "Tipo": isGroup ? "Grupo" : (depth === 0 ? "Item" : `Sub-item nível ${depth}`),
      "Prioridade": isGroup ? "" : (a.priority ?? ""),
      "Status": isGroup ? "" : a.status,
      "Situação Prazo": isGroup ? "" : deadlineSituation(a.dueDate, a.status),
      "Observações": a.observacoes ?? "",
      "Órgão Responsável": a.orgao ?? "",
      "Nome do Responsável": a.responsavelNome ?? "",
      "Cargo": a.responsavelCargo ?? "",
      "Telefone": a.responsavelTel ?? "",
      "E-mail": a.responsavelEmail ?? "",
      "Prazo Previsto": isGroup ? "" : formatDate(a.dueDate),
      "Data da Solicitação": isGroup ? "" : formatDate(a.requestDate),
      "Data do Recebimento": isGroup ? "" : formatDate(a.receiptDate),
      "Base Documental": a.documentBase ?? "",
      "Qtd. Comentários": isGroup ? "" : (a.comments?.length ?? 0),
      "Qtd. Documentos": isGroup ? "" : docs.length,
      // Document columns — filled per-document row below
      "Nome do Documento": "",
      "URL do Arquivo": "",
      "Status do Documento": "",
    };

    if (docs.length === 0) {
      rows.push(baseRow);
    } else {
      // First document on the same row as the item
      rows.push({
        ...baseRow,
        "Nome do Documento": docs[0].label ?? "",
        "URL do Arquivo": docs[0].url ?? "",
        "Status do Documento": DOC_STATUS_LABEL[(docs[0] as any).docStatus ?? ""] ?? "",
      });
      // Additional documents on continuation rows (repeat code + description for readability)
      for (let i = 1; i < docs.length; i++) {
        rows.push({
          "Área": "",
          "Código": a.itemCode,
          "Descrição": `${indent}  └ (continuação)`,
          "Tipo": "",
          "Prioridade": "",
          "Status": "",
          "Situação Prazo": "",
          "Observações": "",
          "Órgão Responsável": "",
          "Nome do Responsável": "",
          "Cargo": "",
          "Telefone": "",
          "E-mail": "",
          "Prazo Previsto": "",
          "Data da Solicitação": "",
          "Data do Recebimento": "",
          "Base Documental": "",
          "Qtd. Comentários": "",
          "Qtd. Documentos": "",
          "Nome do Documento": docs[i].label ?? "",
          "URL do Arquivo": docs[i].url ?? "",
          "Status do Documento": DOC_STATUS_LABEL[(docs[i] as any).docStatus ?? ""] ?? "",
        });
      }
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();

  // Apply hyperlinks to URL column (col U = "URL do Arquivo")
  const urlColLetter = "U";
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let r = 1; r <= range.e.r; r++) {
    const cellAddr = `${urlColLetter}${r + 1}`;
    const cell = ws[cellAddr];
    if (cell && cell.v && typeof cell.v === "string" && cell.v.startsWith("http")) {
      cell.l = { Target: cell.v, Tooltip: cell.v };
    }
  }

  ws["!cols"] = [
    { wch: 14 }, // Área
    { wch: 10 }, // Código
    { wch: 60 }, // Descrição
    { wch: 14 }, // Tipo
    { wch: 12 }, // Prioridade
    { wch: 16 }, // Status
    { wch: 14 }, // Situação Prazo
    { wch: 40 }, // Observações
    { wch: 18 }, // Órgão Responsável
    { wch: 30 }, // Nome do Responsável
    { wch: 25 }, // Cargo
    { wch: 18 }, // Telefone
    { wch: 32 }, // E-mail
    { wch: 16 }, // Prazo Previsto
    { wch: 20 }, // Data da Solicitação
    { wch: 20 }, // Data do Recebimento
    { wch: 40 }, // Base Documental
    { wch: 10 }, // Qtd. Comentários
    { wch: 10 }, // Qtd. Documentos
    { wch: 45 }, // Nome do Documento
    { wch: 70 }, // URL do Arquivo
    { wch: 20 }, // Status do Documento
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Ações RIBEIRA");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), "ribeira-acoes.xlsx");
}

// ---- PDF Export ----

// Color palette (RGB)
const C = {
  white: [255, 255, 255] as [number, number, number],
  black: [30, 35, 40] as [number, number, number],
  gray: [100, 110, 120] as [number, number, number],
  lightGray: [220, 225, 230] as [number, number, number],
  veryLightGray: [245, 247, 249] as [number, number, number],
  teal: [0, 150, 136] as [number, number, number],
  tealLight: [178, 223, 219] as [number, number, number],
  orange: [200, 100, 30] as [number, number, number],
  green: [46, 160, 100] as [number, number, number],
  greenLight: [198, 239, 206] as [number, number, number],
  yellow: [180, 140, 20] as [number, number, number],
  yellowLight: [255, 235, 156] as [number, number, number],
  blue: [30, 120, 200] as [number, number, number],
  blueLight: [189, 215, 238] as [number, number, number],
  red: [200, 60, 50] as [number, number, number],
  redLight: [255, 199, 206] as [number, number, number],
  purple: [120, 80, 180] as [number, number, number],
  headerBg: [0, 77, 64] as [number, number, number],   // deep teal header
  sectionBg: [232, 245, 243] as [number, number, number],
  rowAlt: [248, 252, 251] as [number, number, number],
};

function statusColor(status: string): [number, number, number] {
  switch (status) {
    case "Concluído": return C.green;
    case "Em Andamento": return C.blue;
    case "Pendente": return C.yellow;
    case "Cancelado": return C.red;
    default: return C.gray;
  }
}

function statusBg(status: string): [number, number, number] {
  switch (status) {
    case "Concluído": return C.greenLight;
    case "Em Andamento": return C.blueLight;
    case "Pendente": return C.yellowLight;
    case "Cancelado": return C.redLight;
    default: return C.lightGray;
  }
}

function deadlineColor(sit: string): [number, number, number] {
  switch (sit) {
    case "Atrasado": return C.red;
    case "No prazo": return C.green;
    case "Concluído": return C.teal;
    default: return C.gray;
  }
}

function priorityColor(p: string | null): [number, number, number] {
  switch (p) {
    case "Alta": return C.red;
    case "Média": return C.orange;
    case "Baixa": return C.green;
    default: return C.gray;
  }
}

function areaColor(area: string): [number, number, number] {
  switch (area) {
    case "Governança": return [0, 100, 160];
    case "Técnico": return [0, 140, 120];
    case "Jurídico": return [140, 60, 160];
    case "Eco-Fin": return [180, 100, 0];
    default: return C.gray;
  }
}

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

// ---- Audit Log PDF Export ----

export function exportAuditLogToPdf(
  logs: Array<{
    id: number;
    createdAt: Date | null;
    userName: string | null;
    userRole: string | null;
    userOrgao: string | null;
    eventType: string;
    actionId: number | null;
    detail: string | null;
  }>,
  filters?: { search?: string; eventFilter?: string; roleFilter?: string }
) {
  const ROLE_LABELS: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Administrador",
    setorial: "Setorial",
    viewer: "Visualizador",
  };
  const EVENT_LABELS: Record<string, string> = {
    comment: "Comentário",
    document: "Documento",
    item_change: "Alteração de Item",
    create: "Criação",
  };

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 14;
  const now = new Date();

  // ---- Header ----
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, pageW, 34, "F");
  doc.setFillColor(...C.teal);
  doc.rect(0, 34, pageW, 2, "F");

  // Logo SEMPLA
  try {
    doc.addImage(SEMPLA_LOGO_B64, "PNG", pageW - margin - 60, 8, 54, 14.4);
  } catch (_) {
    doc.setFontSize(7);
    doc.setTextColor(...C.tealLight);
    doc.text("SEMPLA", pageW - margin - 20, 16);
  }

  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.text("PLATAFORMA DE GESTÃO DOCUMENTAL DE PPPs", margin, 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.tealLight);
  doc.text("Log de Auditoria — Registro completo de todas as alterações realizadas na plataforma", margin, 21);

  doc.setFontSize(7.5);
  doc.setTextColor(...C.lightGray);
  doc.text(`Gerado em ${formatDateTime(now)}  ·  ${logs.length} registro(s)`, margin, 28);

  // ---- Filter summary ----
  const hasF = filters && (filters.search || (filters.eventFilter && filters.eventFilter !== "all") || (filters.roleFilter && filters.roleFilter !== "all"));
  let startY = 42;
  if (hasF) {
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    const parts: string[] = [];
    if (filters?.search) parts.push(`Busca: "${filters.search}"`);
    if (filters?.eventFilter && filters.eventFilter !== "all") parts.push(`Evento: ${EVENT_LABELS[filters.eventFilter] ?? filters.eventFilter}`);
    if (filters?.roleFilter && filters.roleFilter !== "all") parts.push(`Perfil: ${ROLE_LABELS[filters.roleFilter] ?? filters.roleFilter}`);
    doc.text(`Filtros aplicados: ${parts.join(" | ")}`, margin, startY);
    startY += 6;
  }

  // ---- Table ----
  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    head: [["Data/Hora", "Usuário", "Perfil", "Órgão", "Evento", "Item", "Detalhe"]],
    body: logs.map(log => [
      log.createdAt ? new Date(log.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—",
      log.userName ?? "—",
      ROLE_LABELS[log.userRole ?? ""] ?? log.userRole ?? "—",
      log.userOrgao ?? "—",
      EVENT_LABELS[log.eventType] ?? log.eventType ?? "—",
      log.actionId ? `#${log.actionId}` : "—",
      log.detail ?? "—",
    ]),
    headStyles: {
      fillColor: C.headerBg,
      textColor: C.white,
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: 2,
      textColor: C.black,
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 40 },
      4: { cellWidth: 22 },
      5: { cellWidth: 12 },
      6: { cellWidth: "auto" },
    },
    didDrawPage: (data: any) => {
      const pg = data.pageNumber;
      doc.setFontSize(7);
      doc.setTextColor(...C.gray);
      doc.text(
        `PLATAFORMA DE GESTÃO DOCUMENTAL DE PPPs — Log de Auditoria — Gerado em ${formatDateTime(now)} — Página ${pg}`,
        margin,
        pageH - 8
      );
      doc.setDrawColor(...C.lightGray);
      doc.line(margin, pageH - 11, pageW - margin, pageH - 11);
    },
  });

  doc.save(`auditoria_${now.toISOString().slice(0, 10)}.pdf`);
}

export function exportToPdf(data: ActionRow[], filters?: ExportFilters) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 12;
  const now = new Date();

  // ---- Header ----
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setFillColor(...C.teal);
  doc.rect(0, 32, pageW, 2, "F");

  try {
    doc.addImage(SEMPLA_LOGO_B64, "PNG", pageW - margin - 56, 7, 50, 13.3);
  } catch (_) {
    doc.setFontSize(7); doc.setTextColor(...C.tealLight); doc.text("SEMPLA", pageW - margin - 20, 14);
  }

  doc.setFontSize(13); doc.setTextColor(...C.white); doc.setFont("helvetica", "bold");
  doc.text("PLATAFORMA DE GESTÃO DOCUMENTAL DE PPPs", margin, 11);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.tealLight);
  doc.text("PMI Ribeira Sustentável", margin, 19);
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.lightGray);
  doc.text(`Gerado em ${formatDateTime(now)}  ·  ${data.filter(a => a.isGroup === 0).length} item(ns)`, margin, 27);

  // ---- Filter summary ----
  const DEADLINE_LABELS: Record<string, string> = { overdue: "Atrasados", this_week: "Vence esta semana" };
  const DOC_FILTER_LABELS: Record<string, string> = { any: "Com documento", pending: "Doc com pendência", accepted: "Doc aceito" };
  const CONTACT_LABELS: Record<string, string> = { with_contact: "Com contato", no_contact: "Sem contato" };

  const hasFilters =
    (filters?.areas?.length ?? 0) > 0 ||
    (filters?.statuses?.length ?? 0) > 0 ||
    (filters?.priorities?.length ?? 0) > 0 ||
    (filters?.orgaos?.length ?? 0) > 0 ||
    (filters?.responsaveis?.length ?? 0) > 0 ||
    (filters?.searchText ?? "").length > 0 ||
    (filters?.deadlineFilter && filters.deadlineFilter !== "all") ||
    (filters?.docFilter && filters.docFilter !== "all") ||
    (filters?.contactFilter && filters.contactFilter !== "all");

  const filterParts: string[] = [];
  if (filters?.areas?.length) filterParts.push(`Área: ${filters.areas.join(", ")}`);
  if (filters?.statuses?.length) filterParts.push(`Status: ${filters.statuses.join(", ")}`);
  if (filters?.priorities?.length) filterParts.push(`Prioridade: ${filters.priorities.join(", ")}`);
  if (filters?.orgaos?.length) filterParts.push(`Órgão: ${filters.orgaos.join(", ")}`);
  if (filters?.responsaveis?.length) filterParts.push(`Responsável: ${filters.responsaveis.join(", ")}`);
  if (filters?.deadlineFilter && filters.deadlineFilter !== "all") filterParts.push(`Prazo: ${DEADLINE_LABELS[filters.deadlineFilter] ?? filters.deadlineFilter}`);
  if (filters?.docFilter && filters.docFilter !== "all") filterParts.push(`Documento: ${DOC_FILTER_LABELS[filters.docFilter] ?? filters.docFilter}`);
  if (filters?.contactFilter && filters.contactFilter !== "all") filterParts.push(`Contato: ${CONTACT_LABELS[filters.contactFilter] ?? filters.contactFilter}`);
  if (filters?.searchText) filterParts.push(`Busca: "${filters.searchText}"`);

  let startY = 38;
  if (hasFilters) {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.teal);
    doc.text("FILTROS: ", margin, startY + 3.5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...C.black);
    const fText = filterParts.join("  |  ");
    const fLines = doc.splitTextToSize(fText, pageW - margin * 2 - 22);
    fLines.forEach((l: string, i: number) => doc.text(l, margin + 18, startY + 3.5 + i * 4));
    startY += 4 + fLines.length * 4 + 2;
  }

  // ---- Summary table ----
  const byArea: Record<string, { total: number; concluido: number; pendente: number; andamento: number; cancelado: number }> = {};
  for (const a of data) {
    if (a.isGroup === 1) continue;
    if (!byArea[a.area]) byArea[a.area] = { total: 0, concluido: 0, pendente: 0, andamento: 0, cancelado: 0 };
    byArea[a.area].total++;
    if (a.status === "Concluído") byArea[a.area].concluido++;
    else if (a.status === "Pendente") byArea[a.area].pendente++;
    else if (a.status === "Em Andamento") byArea[a.area].andamento++;
    else if (a.status === "Cancelado") byArea[a.area].cancelado++;
  }

  autoTable(doc, {
    startY,
    head: [["Área", "Total", "Pendente", "Em Andamento", "Concluído", "Cancelado", "% Concluído"]],
    body: Object.entries(byArea).map(([area, s]) => [
      area, String(s.total), String(s.pendente), String(s.andamento),
      String(s.concluido), String(s.cancelado),
      s.total > 0 ? `${Math.round((s.concluido / s.total) * 100)}%` : "0%",
    ]),
    styles: { fontSize: 7.5, cellPadding: 2, textColor: C.black, lineColor: C.lightGray, lineWidth: 0.2 },
    headStyles: { fillColor: C.headerBg, textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold" },
      1: { cellWidth: 14, halign: "center" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 26, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 22, halign: "center", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  const afterSummaryY = (doc as any).lastAutoTable.finalY + 6;

  // ---- Main items table ----
  // Build flat rows: groups as section headers, items as data rows
  type PdfRow = [string, string, string, string, string, string, string, string, string, string, string];
  const tableHead: string[][] = [[
    "Cód.", "Descrição / Grupo", "Área", "Status", "Prioridade",
    "Situação Prazo", "Órgão Responsável", "Responsável", "Cargo", "Telefone", "Prazo Previsto"
  ]];

  const tableBody: (string | { content: string; styles?: Record<string, unknown> })[][] = [];

  for (const a of data) {
    const isGroup = a.isGroup === 1;
    const depth = (a.itemCode.match(/\./g) || []).length;
    const indent = "  ".repeat(depth);
    const sit = isGroup ? "" : deadlineSituation(a.dueDate, a.status);

    tableBody.push([
      a.itemCode,
      isGroup ? `${indent}▌ ${a.description}` : `${indent}${a.description}`,
      isGroup ? a.area : "",
      isGroup ? "" : a.status,
      isGroup ? "" : (a.priority ?? "—"),
      sit,
      isGroup ? "" : (a.orgao ?? "—"),
      isGroup ? "" : (a.responsavelNome ?? "—"),
      isGroup ? "" : (a.responsavelCargo ?? "—"),
      isGroup ? "" : (a.responsavelTel ?? "—"),
      isGroup ? "" : formatDate(a.dueDate),
    ]);
  }

  autoTable(doc, {
    startY: afterSummaryY,
    head: tableHead,
    body: tableBody,
    styles: {
      fontSize: 6.5,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      textColor: C.black,
      lineColor: C.lightGray,
      lineWidth: 0.15,
      overflow: "linebreak",
      minCellHeight: 6,
    },
    headStyles: {
      fillColor: C.headerBg,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 7,
      cellPadding: 2.5,
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: {
      0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 68 },  // Descrição — maior
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 24 },  // Órgão
      7: { cellWidth: 30 },  // Responsável
      8: { cellWidth: 26 },  // Cargo
      9: { cellWidth: 20 },  // Telefone
      10: { cellWidth: 17, halign: "center" }, // Prazo
    },
    margin: { left: margin, right: margin },
    willDrawCell: (data: any) => {
      // Color group rows differently
      if (data.row.index >= 0 && tableBody[data.row.index]) {
        const rowData = tableBody[data.row.index];
        const isGroupRow = typeof rowData[2] === "string" && rowData[2] !== "" && rowData[3] === "";
        if (isGroupRow && data.section === "body") {
          data.cell.styles.fillColor = C.sectionBg;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = C.headerBg;
        }
      }
      // Color status cells
      if (data.column.index === 3 && data.section === "body") {
        const status = String(data.cell.raw ?? "");
        if (status) {
          data.cell.styles.textColor = statusColor(status);
          data.cell.styles.fontStyle = "bold";
        }
      }
      // Color priority cells
      if (data.column.index === 4 && data.section === "body") {
        const prio = String(data.cell.raw ?? "");
        if (prio && prio !== "—") {
          data.cell.styles.textColor = priorityColor(prio);
          data.cell.styles.fontStyle = "bold";
        }
      }
      // Color deadline situation
      if (data.column.index === 5 && data.section === "body") {
        const sit2 = String(data.cell.raw ?? "");
        if (sit2) data.cell.styles.textColor = deadlineColor(sit2);
      }
    },
    didDrawPage: (data: any) => {
      const pg = data.pageNumber;
      doc.setFontSize(6.5); doc.setTextColor(...C.gray);
      doc.text(
        `PMI Ribeira Sustentável — Relatório de Ações e Entregas — ${formatDateTime(now)} — Pág. ${pg}`,
        margin, pageH - 6
      );
      doc.setDrawColor(...C.lightGray);
      doc.line(margin, pageH - 9, pageW - margin, pageH - 9);
    },
  });

  doc.save(`ribeira-acoes-${now.toISOString().slice(0, 10)}.pdf`);
}
