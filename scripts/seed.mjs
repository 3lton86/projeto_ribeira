import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client(process.env.DATABASE_URL);
await client.connect();
const db = drizzle(client);

console.log("Database connected. Add your seed logic here.");

// Exemplo: inserir dados iniciais
// await db.insert(actions).values([...]);

await client.end();
console.log("Seed concluído.");
