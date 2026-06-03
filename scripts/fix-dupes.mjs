import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log("Removendo duplicatas — mantendo apenas o id mínimo por (area, itemCode)...");

// Delete rows that are NOT the minimum id for each (area, itemCode) pair
await conn.query(`
  DELETE a FROM actions a
  INNER JOIN (
    SELECT area, itemCode, MIN(id) as keep_id
    FROM actions
    GROUP BY area, itemCode
  ) keep ON a.area = keep.area AND a.itemCode = keep.itemCode
  WHERE a.id != keep.keep_id
`);

const [total] = await conn.query("SELECT COUNT(*) as cnt FROM actions");
const [byArea] = await conn.query("SELECT area, COUNT(*) as cnt FROM actions GROUP BY area ORDER BY area");
const [dupes] = await conn.query(`
  SELECT area, itemCode, COUNT(*) as cnt 
  FROM actions 
  GROUP BY area, itemCode 
  HAVING cnt > 1
`);

console.log("Total após limpeza:", total[0].cnt);
console.log("Por área:", JSON.stringify(byArea));
console.log("Duplicatas restantes:", dupes.length === 0 ? "Nenhuma ✓" : JSON.stringify(dupes));

await conn.end();
console.log("Concluído!");
process.exit(0);
