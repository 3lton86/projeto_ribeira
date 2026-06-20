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
  searchText?: string;
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
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const now = new Date();
  let y = 0;

  // ---- Page management ----
  function checkNewPage(needed: number) {
    if (y + needed > pageH - 18) {
      doc.addPage();
      y = 14;
      drawPageFooter();
    }
  }

  function drawPageFooter() {
    const pg = (doc as any).internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text(
      `PLATAFORMA DE GESTÃO DOCUMENTAL DE PPPs — Relatório de Ações e Entregas — Gerado em ${formatDateTime(now)} — Página ${pg}`,
      margin,
      pageH - 8
    );
    doc.setDrawColor(...C.lightGray);
    doc.line(margin, pageH - 11, pageW - margin, pageH - 11);
  }

  // ---- Cover / Header ----
  // Top bar (altura aumentada para acomodar logo)
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, pageW, 34, "F");

  // Accent stripe
  doc.setFillColor(...C.teal);
  doc.rect(0, 34, pageW, 2, "F");

  // Logo SEMPLA (canto direito do cabeçalho)
  // Proporção original: 1181x315 → escalar para altura 18mm → largura ≈ 67mm
  try {
    doc.addImage(SEMPLA_LOGO_B64, "PNG", pageW - margin - 60, 8, 54, 14.4);
  } catch (_) {
    // fallback: se a imagem falhar, exibe texto
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
  doc.text("Controle de entrega de documentos e informações pelos órgãos municipais para estruturação do projeto PPP", margin, 21);

  doc.setFontSize(7.5);
  doc.setTextColor(...C.lightGray);
  doc.text(`Relatório de Ações e Entregas  ·  ${formatDateTime(now)}  ·  ${data.length} item(ns)`, margin, 28);

  y = 42;

  // ---- Filter summary ----
  const hasFilters =
    (filters?.areas?.length ?? 0) > 0 ||
    (filters?.statuses?.length ?? 0) > 0 ||
    (filters?.priorities?.length ?? 0) > 0 ||
    (filters?.orgaos?.length ?? 0) > 0 ||
    (filters?.searchText ?? "").length > 0;

  if (hasFilters) {
    doc.setFillColor(...C.sectionBg);
    doc.roundedRect(margin, y, contentW, 6, 1.5, 1.5, "F");
    doc.setDrawColor(...C.teal);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentW, 6, 1.5, 1.5, "S");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.teal);
    doc.text("FILTROS APLICADOS:", margin + 3, y + 4);

    const filterParts: string[] = [];
    if (filters?.areas?.length) filterParts.push(`Área: ${filters.areas.join(", ")}`);
    if (filters?.statuses?.length) filterParts.push(`Status: ${filters.statuses.join(", ")}`);
    if (filters?.priorities?.length) filterParts.push(`Prioridade: ${filters.priorities.join(", ")}`);
    if (filters?.orgaos?.length) filterParts.push(`Órgão: ${filters.orgaos.join(", ")}`);
    if (filters?.searchText) filterParts.push(`Busca: "${filters.searchText}"`);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.black);
    const filterText = filterParts.join("   |   ");
    const lines = doc.splitTextToSize(filterText, contentW - 48);
    if (lines.length > 1) {
      // expand box
      doc.setFillColor(...C.sectionBg);
      doc.roundedRect(margin, y, contentW, 5 + lines.length * 4, 1.5, 1.5, "F");
      doc.setDrawColor(...C.teal);
      doc.roundedRect(margin, y, contentW, 5 + lines.length * 4, 1.5, 1.5, "S");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.teal);
      doc.text("FILTROS APLICADOS:", margin + 3, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.black);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 3, y + 8 + i * 4);
      });
      y += 6 + lines.length * 4 + 4;
    } else {
      doc.text(filterText, margin + 46, y + 4);
      y += 12;
    }
  } else {
    // No filters label
    doc.setFillColor(...C.veryLightGray);
    doc.roundedRect(margin, y, contentW, 6, 1.5, 1.5, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...C.gray);
    doc.text("Sem filtros aplicados — exibindo todos os itens", margin + 3, y + 4);
    y += 12;
  }

  // ---- Summary table ----
  const byArea: Record<string, { total: number; concluido: number; pendente: number; andamento: number; cancelado: number }> = {};
  for (const a of data) {
    if (!byArea[a.area]) byArea[a.area] = { total: 0, concluido: 0, pendente: 0, andamento: 0, cancelado: 0 };
    byArea[a.area].total++;
    if (a.status === "Concluído") byArea[a.area].concluido++;
    else if (a.status === "Pendente") byArea[a.area].pendente++;
    else if (a.status === "Em Andamento") byArea[a.area].andamento++;
    else if (a.status === "Cancelado") byArea[a.area].cancelado++;
  }

  const summaryHead = [["Área", "Total", "Pendente", "Em Andamento", "Concluído", "Cancelado", "% Concluído"]];
  const summaryBody = Object.entries(byArea).map(([area, s]) => [
    area,
    String(s.total),
    String(s.pendente),
    String(s.andamento),
    String(s.concluido),
    String(s.cancelado),
    s.total > 0 ? `${Math.round((s.concluido / s.total) * 100)}%` : "0%",
  ]);

  autoTable(doc, {
    startY: y,
    head: summaryHead,
    body: summaryBody,
    styles: { fontSize: 8, cellPadding: 2.5, textColor: C.black, fillColor: C.white, lineColor: C.lightGray, lineWidth: 0.2 },
    headStyles: { fillColor: C.headerBg, textColor: C.white, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold" },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 28, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 24, halign: "center", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ---- Action items ----
  // Group by area
  const grouped: Record<string, ActionRow[]> = {};
  for (const a of data) {
    if (!grouped[a.area]) grouped[a.area] = [];
    grouped[a.area].push(a);
  }

  for (const [area, items] of Object.entries(grouped)) {
    checkNewPage(20);

    // Count only non-group items for display
    const nonGroupCount = items.filter(a => a.isGroup !== 1).length;

    // Area header bar
    doc.setFillColor(...areaColor(area));
    doc.rect(margin, y, contentW, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(`${area.toUpperCase()}  —  ${nonGroupCount} item(ns)`, margin + 4, y + 5.5);
    y += 12;

    for (const action of items) {
      const isGroupRow = action.isGroup === 1;
      const depth = (action.itemCode.match(/\./g) || []).length;
      const indentMm = depth * 6; // 6mm per level of nesting
      const cardMargin = margin + indentMm;
      const cardWidth = contentW - indentMm;

      if (isGroupRow) {
        // Render group as a section header bar
        checkNewPage(10);
        doc.setFillColor(...areaColor(area).map(c => Math.min(255, c + 60)) as [number, number, number]);
        doc.roundedRect(cardMargin, y, cardWidth, 7, 1, 1, "F");
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.white);
        const groupLabel = `${action.itemCode}  ${action.description}`;
        const groupLines = doc.splitTextToSize(groupLabel, cardWidth - 8);
        doc.text(groupLines[0], cardMargin + 4, y + 4.8);
        y += 10;
        continue;
      }

      const sit = deadlineSituation(action.dueDate, action.status);
      const hasComments = (action.comments?.length ?? 0) > 0;
      const hasDocs = (action.documents?.length ?? 0) > 0;

      // Estimate height needed
      const descLines = wrapText(doc, action.description, cardWidth - 8, 8.5);
      const docBaseLines = action.documentBase ? wrapText(doc, action.documentBase, cardWidth - 8, 7.5) : [];
      const commentCount = action.comments?.length ?? 0;
      const docCount = action.documents?.length ?? 0;

      const estimatedH =
        10 + // item header
        descLines.length * 4.5 + 3 + // description
        (action.orgao || action.responsavelNome ? 20 : 0) + // contact block
        8 + // metadata row
        (action.documentBase ? docBaseLines.length * 4 + 6 : 0) +
        (action.observacoes ? 10 : 0) +
        (hasComments ? 6 + commentCount * 10 : 0) +
        (hasDocs ? 6 + docCount * 7 : 0) +
        4; // bottom padding

      checkNewPage(estimatedH);

      const itemStartY = y;

      // Item card background
      doc.setFillColor(...C.white);
      doc.setDrawColor(...C.lightGray);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardMargin, y, cardWidth, estimatedH, 2, 2, "FD");

      // Left accent bar (depth-aware color)
      const accentColor = depth > 0 ? [0, 150, 136] as [number, number, number] : areaColor(area);
      doc.setFillColor(...accentColor);
      doc.rect(cardMargin, y, 2, estimatedH, "F");

      // ---- Item header row ----
      y += 2.5;
      const headerRowH = 7;

      // Item code badge
      doc.setFillColor(...accentColor);
      doc.roundedRect(cardMargin + 4, y, 14, headerRowH, 1, 1, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.white);
      doc.text(action.itemCode, cardMargin + 11, y + 4.8, { align: "center" });

      // Status badge
      doc.setFillColor(...statusBg(action.status));
      doc.roundedRect(cardMargin + 20, y, 28, headerRowH, 1, 1, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...statusColor(action.status));
      doc.text(action.status, cardMargin + 34, y + 4.8, { align: "center" });

      // Priority badge
      if (action.priority) {
        doc.setFillColor(...C.veryLightGray);
        doc.roundedRect(cardMargin + 50, y, 20, headerRowH, 1, 1, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...priorityColor(action.priority));
        doc.text(`▲ ${action.priority}`, cardMargin + 60, y + 4.8, { align: "center" });
      }

      // Deadline situation badge
      doc.setFillColor(...C.veryLightGray);
      const sitX = cardMargin + 73;
      doc.roundedRect(sitX, y, 26, headerRowH, 1, 1, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...deadlineColor(sit));
      doc.text(sit, sitX + 13, y + 4.8, { align: "center" });

      // Prazo date
      if (action.dueDate) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.gray);
        doc.text(`Prazo: ${formatDate(action.dueDate)}`, cardMargin + 102, y + 4.8);
      }

      // Órgão (top right)
      if (action.orgao) {
        doc.setFillColor(...C.teal);
        const orgaoText = action.orgao;
        const orgaoW = Math.min(doc.getTextWidth(orgaoText) + 6, 35);
        doc.roundedRect(pageW - margin - orgaoW - 2, y, orgaoW, headerRowH, 1, 1, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.white);
        doc.text(orgaoText, pageW - margin - orgaoW / 2 - 2, y + 4.8, { align: "center" });
      }

      y += headerRowH + 2;

      // ---- Description ----
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.black);
      descLines.forEach((line: string) => {
        doc.text(line, cardMargin + 4, y);
        y += 4.5;
      });
      y += 2;

      // ---- Contact / Responsible block ----
      if (action.responsavelNome || action.responsavelCargo || action.responsavelTel || action.responsavelEmail) {
        doc.setFillColor(...C.veryLightGray);
        doc.roundedRect(cardMargin + 4, y, cardWidth - 8, 16, 1, 1, "F");

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.teal);
        doc.text("RESPONSÁVEL PELA ENTREGA", cardMargin + 7, y + 4.5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.black);
        const col1X = cardMargin + 7;
        const col2X = cardMargin + 7 + (cardWidth - 8) / 2;

        if (action.responsavelNome) {
          doc.setFont("helvetica", "bold");
          doc.text(action.responsavelNome, col1X, y + 9);
          doc.setFont("helvetica", "normal");
        }
        if (action.responsavelCargo) {
          doc.setTextColor(...C.gray);
          doc.text(action.responsavelCargo, col1X, y + 13);
        }
        if (action.responsavelTel) {
          doc.setTextColor(...C.black);
          doc.text(`Tel: ${action.responsavelTel}`, col2X, y + 9);
        }
        if (action.responsavelEmail) {
          doc.setTextColor(...C.blue);
          doc.text(action.responsavelEmail, col2X, y + 13);
        }
        y += 19;
      }

      // ---- Metadata row ----
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.gray);
      const metaParts: string[] = [];
      if (action.requestDate) metaParts.push(`Solicitação: ${formatDate(action.requestDate)}`);
      if (action.receiptDate) metaParts.push(`Recebimento: ${formatDate(action.receiptDate)}`);
      if (metaParts.length > 0) {
        doc.text(metaParts.join("   ·   "), cardMargin + 4, y);
        y += 5;
      }

      // ---- Base Documental ----
      if (action.documentBase) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.teal);
        doc.text("Base Documental:", cardMargin + 4, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.black);
        const bdLines = wrapText(doc, action.documentBase, cardWidth - 8, 7);
        bdLines.forEach((line: string) => {
          y += 4;
          doc.text(line, cardMargin + 4, y);
        });
        y += 4;
      }

      // ---- Observações ----
      if (action.observacoes) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.teal);
        doc.text("Observações:", cardMargin + 4, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.black);
        const obsLines = wrapText(doc, action.observacoes, cardWidth - 8, 7);
        obsLines.forEach((line: string) => {
          y += 4;
          doc.text(line, cardMargin + 4, y);
        });
        y += 4;
      }

      // ---- Comments ----
      if (hasComments) {
        y += 2;
        doc.setFillColor(...C.sectionBg);
        doc.roundedRect(cardMargin + 4, y, cardWidth - 8, 5, 1, 1, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.teal);
        doc.text(`COMENTÁRIOS (${action.comments!.length})`, cardMargin + 7, y + 3.5);
        y += 7;

        for (const c of action.comments!) {
          doc.setFillColor(...C.veryLightGray);
          doc.roundedRect(cardMargin + 4, y, cardWidth - 8, 9, 1, 1, "F");

          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...C.black);
          doc.text(c.userName ?? "Usuário", cardMargin + 7, y + 3.5);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...C.gray);
          doc.text(formatDateTime(c.createdAt), cardMargin + 7 + doc.getTextWidth((c.userName ?? "Usuário") + "  "), y + 3.5);

          doc.setTextColor(...C.black);
          const cLines = doc.splitTextToSize(c.content, cardWidth - 16);
          const firstLine = cLines[0] ?? "";
          doc.text(firstLine, cardMargin + 7, y + 7);
          if (cLines.length > 1) {
            doc.text("…", cardMargin + 7 + doc.getTextWidth(firstLine), y + 7);
          }
          y += 11;
        }
      }

      // ---- Documents ----
      if (hasDocs) {
        y += 2;
        doc.setFillColor(...C.sectionBg);
        doc.roundedRect(cardMargin + 4, y, cardWidth - 8, 5, 1, 1, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.teal);
        doc.text(`DOCUMENTOS ENTREGUES (${action.documents!.length})`, cardMargin + 7, y + 3.5);
        y += 7;

        for (const d of action.documents!) {
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...C.black);
          doc.text(`• ${d.label}`, cardMargin + 7, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...C.blue);
          const urlShort = d.url.length > 70 ? d.url.substring(0, 70) + "…" : d.url;
          doc.text(urlShort, cardMargin + 7, y + 4);
          doc.setTextColor(...C.gray);
          doc.text(`${d.uploaderName ?? ""} · ${formatDate(d.createdAt)}`, cardMargin + 7, y + 7.5);
          y += 10;
        }
      }

      y += 5; // bottom padding between items
    }

    y += 6; // space between areas
  }

  // Footer on last page
  drawPageFooter();

  doc.save(`ribeira-acoes-${now.toISOString().slice(0, 10)}.pdf`);
}
