/**
 * Script para importar o dump MySQL para PostgreSQL.
 * Lê o arquivo .sql de backup, extrai os INSERTs e converte para PostgreSQL.
 *
 * Uso: DATABASE_URL=postgresql://... node scripts/import-mysql-dump.mjs ../backup/ribeira-sustentavel_backup_2026-08-11T23-52-39-874Z.sql
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error("Uso: node scripts/import-mysql-dump.mjs <caminho-do-dump.sql>");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL não configurada.");
  process.exit(1);
}

const fullPath = resolve(dumpPath);
console.log(`Lendo dump: ${fullPath}`);
const sql = readFileSync(fullPath, "utf-8");

// Tabelas que queremos importar (na ordem correta por dependências)
const TARGET_TABLES = [
  "local_users",
  "users",
  "actions",
  "action_documents",
  "action_orgaos",
  "audit_log",
  "comments",
  "contact_history",
  "governance_nodes",
  "history",
  "notifications",
  "orgao_responsaveis",
  "user_orgaos",
];

// Extrair INSERT statements do dump MySQL
function extractInserts(sqlContent) {
  const inserts = {};
  const lines = sqlContent.split("\n");

  for (const line of lines) {
    const match = line.match(/^INSERT INTO `([^`]+)` VALUES\s*(.+);$/);
    if (!match) continue;
    const [, tableName, valuesStr] = match;
    if (!TARGET_TABLES.includes(tableName)) continue;
    if (!inserts[tableName]) inserts[tableName] = [];
    inserts[tableName].push(valuesStr);
  }

  return inserts;
}

// Parse MySQL VALUES string into rows
// Handles: (val1,val2,...),(val1,val2,...) 
function parseValues(valuesStr) {
  const rows = [];
  let i = 0;
  
  while (i < valuesStr.length) {
    // Find opening paren
    while (i < valuesStr.length && valuesStr[i] !== "(") i++;
    if (i >= valuesStr.length) break;
    i++; // skip (
    
    const values = [];
    let current = "";
    let inString = false;
    let escaped = false;
    
    while (i < valuesStr.length) {
      const ch = valuesStr[i];
      
      if (escaped) {
        if (ch === "'") current += "'";
        else if (ch === "\\") current += "\\";
        else if (ch === "n") current += "\n";
        else if (ch === "r") current += "\r";
        else if (ch === "t") current += "\t";
        else if (ch === "0") current += "\0";
        else current += ch;
        escaped = false;
        i++;
        continue;
      }
      
      if (ch === "\\" && inString) {
        escaped = true;
        i++;
        continue;
      }
      
      if (ch === "'" && !inString) {
        inString = true;
        i++;
        continue;
      }
      
      if (ch === "'" && inString) {
        // Check for ''
        if (i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
          current += "'";
          i += 2;
          continue;
        }
        inString = false;
        i++;
        continue;
      }
      
      if (!inString && (ch === "," || ch === ")")) {
        values.push(current.trim() === "NULL" ? null : current);
        current = "";
        if (ch === ")") {
          i++;
          break;
        }
        i++;
        continue;
      }
      
      current += ch;
      i++;
    }
    
    if (values.length > 0) {
      rows.push(values);
    }
  }
  
  return rows;
}

// Mapeia colunas do dump MySQL → colunas do PostgreSQL
// A ordem deve corresponder à ordem dos VALUES no dump (baseada no CREATE TABLE do MySQL dump)
const TABLE_COLUMNS_DUMP = {
  users: ["id", "openId", "name", "email", "loginMethod", "role", "createdAt", "updatedAt", "lastSignedIn"],
  actions: ["id", "area", "itemCode", "parentCode", "isGroup", "description", "priority", "status", "requestDate", "receiptDate", "documentBase", "sortOrder", "createdAt", "updatedAt", "orgao", "responsavelNome", "responsavelCargo", "responsavelTel", "responsavelEmail", "dueDate", "observacoes", "project"],
  comments: ["id", "actionId", "userId", "content", "createdAt"],
  history: ["id", "actionId", "userId", "fieldChanged", "oldValue", "newValue", "createdAt"],
  governance_nodes: ["id", "parentId", "title", "subtitle", "type", "theme", "sortOrder"],
  local_users: ["id", "name", "username", "passwordHash", "role", "position", "organization", "active", "createdAt", "updatedAt", "pendingApproval", "telefone", "email", "lastAccessAt", "allowedProjects"],
  action_documents: ["id", "actionId", "label", "url", "uploadedBy", "uploaderName", "createdAt", "docStatus", "statusUpdatedAt", "statusUpdatedBy"],
  action_orgaos: ["id", "actionId", "orgao", "responsavelNome", "responsavelCargo", "responsavelTel", "responsavelEmail", "sortOrder", "createdAt"],
  user_orgaos: ["id", "userId", "orgao", "createdAt"],
  audit_log: ["id", "actionId", "userId", "userName", "userRole", "userOrgao", "eventType", "detail", "createdAt", "project"],
  notifications: ["id", "userId", "type", "title", "body", "actionId", "actionCode", "orgao", "isRead", "createdAt"],
  orgao_responsaveis: ["id", "orgao", "nome", "cargo", "telefone", "email", "localUserId", "sortOrder", "createdAt"],
  contact_history: ["id", "actionId", "channel", "recipientName", "recipientContact", "message", "sentBy", "sentAt"],
};
const TABLE_COLUMNS = TABLE_COLUMNS_DUMP;

async function main() {
  const client = new pg.Client(dbUrl);
  await client.connect();
  console.log("Conectado ao PostgreSQL.");

  const inserts = extractInserts(sql);
  console.log(`Tabelas encontradas no dump: ${Object.keys(inserts).join(", ")}`);

  for (const table of TARGET_TABLES) {
    if (!inserts[table]) {
      console.log(`  ${table}: nenhum dado no dump.`);
      continue;
    }

    const columns = TABLE_COLUMNS[table];
    if (!columns) {
      console.log(`  ${table}: colunas não mapeadas, pulando.`);
      continue;
    }

    // Limpar tabela antes de inserir
    await client.query(`DELETE FROM "${table}"`);

    let totalRows = 0;
    for (const valuesStr of inserts[table]) {
      const rows = parseValues(valuesStr);
      
      for (const row of rows) {
        // Ajustar quantidade de colunas (dump pode ter mais/menos que o schema novo)
        const values = row.slice(0, columns.length);
        while (values.length < columns.length) values.push(null);
        
        const quotedCols = columns.map(c => `"${c}"`).join(", ");
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        
        // Converter valores
        const pgValues = values.map((v, i) => {
          if (v === null) return null;
          // JSON columns
          if (columns[i] === "allowedProjects") {
            // Pode vir como string JSON ou como NULL
            if (v === "NULL" || v === "") return null;
            return v;
          }
          return v;
        });

        try {
          await client.query(
            `INSERT INTO "${table}" (${quotedCols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            pgValues
          );
          totalRows++;
        } catch (err) {
          // Log the error but continue with other rows
          if (!err.message.includes("duplicate key")) {
            console.error(`  ERRO em ${table}: ${err.message}`);
            console.error(`  Valores: ${JSON.stringify(values.slice(0, 3))}...`);
          }
        }
      }
    }

    // Reset sequence to max id
    try {
      await client.query(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`);
    } catch (_) {}

    console.log(`  ${table}: ${totalRows} registros importados.`);
  }

  await client.end();
  console.log("\n✅ Importação concluída!");
}

main().catch(err => {
  console.error("ERRO FATAL:", err.message);
  process.exit(1);
});
