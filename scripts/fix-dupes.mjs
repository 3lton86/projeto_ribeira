import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client(process.env.DATABASE_URL);
await client.connect();

console.log("Removendo duplicatas — mantendo apenas o id mínimo por (area, itemCode)...");

const result = await client.query(`
  DELETE FROM actions
  WHERE id NOT IN (
    SELECT MIN(id) FROM actions GROUP BY area, "itemCode"
  )
  AND "isGroup" = 0
`);

console.log(`Removidos ${result.rowCount} registros duplicados.`);

await client.end();
