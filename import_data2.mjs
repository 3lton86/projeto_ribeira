/**
 * Script de importação da planilha Excel para o banco PostgreSQL.
 * Trata todos os casos de sub-itens:
 *   - Col A = número inteiro, Col B = vazio → GRUPO
 *   - Col A = "X.Y", Col B = vazio → ITEM
 *   - Col A = vazio, Col B = "X.Y.Z" → SUBITEM
 *   - Col A = "X.Y", Col B = "X.Y.Z" → SUBITEM (usa Col B como código)
 * Execute: node -r dotenv/config import_data2.mjs
 */
import pg from 'pg';
import ExcelJS from 'exceljs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not set.');
  process.exit(1);
}

console.log('Connecting to PostgreSQL...');

const AREA_MAP = {
  '1. Gestão PMO': 'Governança',
  '2. Técnico': 'Técnico',
  '3. Jurídico': 'Jurídico',
  '4. Eco-Fin': 'Eco-Fin',
};

const STATUS_MAP = {
  'Pendente': 'Pendente',
  'Em Andamento': 'Em Andamento',
  'Concluído': 'Concluído',
  'Cancelado': 'Cancelado',
};

const PRIORITY_MAP = {
  'Alta': 'Alta',
  'Média': 'Média',
  'Baixa': 'Baixa',
};

function cleanStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s || null;
}

function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  if (!s) return null;
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(parseInt(m1[3]), parseInt(m1[2])-1, parseInt(m1[1]));
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(parseInt(m2[1]), parseInt(m2[2])-1, parseInt(m2[3]));
  return null;
}

function isPureInteger(s) {
  if (!s) return false;
  const n = parseInt(s);
  return !isNaN(n) && String(n) === s;
}

function getParentCode(code) {
  const parts = code.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : null;
}

async function main() {
  const client = new pg.Client(dbUrl);
  await client.connect();
  console.log('Connected!');

  // Clear all actions first
  console.log('Clearing existing data...');
  await client.query('DELETE FROM action_orgaos');
  await client.query('DELETE FROM audit_log');
  await client.query('DELETE FROM history');
  await client.query('DELETE FROM comments');
  await client.query('DELETE FROM action_documents');
  await client.query('DELETE FROM notifications');
  await client.query('DELETE FROM actions');
  console.log('Data cleared.');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('./ribeira_planilha.xlsx');

  let totalInserted = 0;

  for (const [sheetName, area] of Object.entries(AREA_MAP)) {
    const ws = workbook.getWorksheet(sheetName);
    if (!ws) {
      console.log(`  AVISO: Aba "${sheetName}" não encontrada.`);
      continue;
    }
    console.log(`\n=== Processando aba: ${sheetName} → area=${area} ===`);

    let headerRow = null;
    ws.eachRow((row, rowNum) => {
      if (!headerRow && cleanStr(row.getCell(1).value) === 'Item') {
        headerRow = rowNum;
      }
    });

    if (!headerRow) {
      console.log(`  AVISO: Cabeçalho não encontrado.`);
      continue;
    }
    console.log(`  Cabeçalho na linha ${headerRow}`);

    const headerRowObj = ws.getRow(headerRow);
    let orgaoColIdx = null;
    headerRowObj.eachCell((cell, colNum) => {
      const v = cleanStr(cell.value);
      if (v && (v.includes('Org') || v.includes('Responsável') || v.includes('Responsavel'))) {
        orgaoColIdx = colNum;
      }
    });
    console.log(`  Coluna de órgão: ${orgaoColIdx}`);

    let sortOrder = 0;
    let inserted = 0;
    let skipped = 0;

    for (let rowNum = headerRow + 1; rowNum <= ws.rowCount; rowNum++) {
      const row = ws.getRow(rowNum);
      
      const colA = cleanStr(row.getCell(1).value);
      const colB = cleanStr(row.getCell(2).value);
      const colC = cleanStr(row.getCell(3).value);
      const colD = cleanStr(row.getCell(4).value);
      const colE = row.getCell(5).value;
      const colF = orgaoColIdx ? cleanStr(row.getCell(orgaoColIdx).value) : null;
      const colG = cleanStr(row.getCell(7).value);
      const colH = row.getCell(8).value;
      const colI = cleanStr(row.getCell(9).value);

      if (!colC) {
        skipped++;
        continue;
      }

      let isGroup = 0;
      let itemCode = null;
      let parentCode = null;

      if (colA && !colB) {
        if (isPureInteger(colA)) {
          isGroup = 1;
          itemCode = colA;
          parentCode = null;
        } else {
          itemCode = colA;
          parentCode = getParentCode(colA);
        }
      } else if (!colA && colB) {
        itemCode = colB;
        parentCode = getParentCode(colB);
      } else if (colA && colB) {
        itemCode = colB;
        parentCode = getParentCode(colB);
      } else {
        skipped++;
        continue;
      }

      if (!itemCode) {
        skipped++;
        continue;
      }

      const priority = PRIORITY_MAP[colD] || null;
      const status = STATUS_MAP[colI] || 'Pendente';
      const requestDate = parseDate(colE);
      const receiptDate = parseDate(colH);
      const documentBase = colG;
      const observacoes = colF;

      sortOrder++;

      await client.query(
        `INSERT INTO actions 
          (area, "itemCode", "parentCode", "isGroup", description, priority, status,
           "dueDate", "requestDate", "receiptDate", "documentBase", observacoes,
           orgao, "sortOrder", project, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10, $11, NULL, $12, 'ribeira', NOW(), NOW())`,
        [area, itemCode, parentCode, isGroup, colC, priority, status,
         requestDate, receiptDate, documentBase, observacoes, sortOrder]
      );
      inserted++;
    }

    console.log(`  Inseridos: ${inserted} | Pulados (sem descrição): ${skipped}`);
    totalInserted += inserted;
  }

  await client.end();
  console.log(`\n=== IMPORTAÇÃO CONCLUÍDA: ${totalInserted} registros inseridos no total ===`);
}

main().catch(err => {
  console.error('ERRO:', err.message);
  process.exit(1);
});
