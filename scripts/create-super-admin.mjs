/**
 * Script para criar o super-admin inicial do sistema RIBEIRA SUSTENTÁVEL.
 * Execute: node scripts/create-super-admin.mjs
 *
 * Credenciais padrão:
 *   username: ribeira.admin
 *   password: Ribeira@2026
 *
 * ALTERE A SENHA após o primeiro login pelo painel de usuários.
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const username = "ribeira.admin";
const password = "Ribeira@2026";
const name = "Super Administrador";
const position = "Gestão do Projeto";
const organization = "Consórcio Ribeira Sustentável";

// Check if already exists
const [existing] = await conn.query("SELECT id FROM local_users WHERE username = ?", [username]);
if (existing.length > 0) {
  console.log(`✓ Super-admin "${username}" já existe. Nenhuma alteração feita.`);
  await conn.end();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);

await conn.query(
  `INSERT INTO local_users (name, username, passwordHash, role, position, organization, active)
   VALUES (?, ?, ?, 'super_admin', ?, ?, 1)`,
  [name, username, passwordHash, position, organization]
);

console.log("✓ Super-admin criado com sucesso!");
console.log(`  Usuário: ${username}`);
console.log(`  Senha:   ${password}`);
console.log("  ⚠️  Altere a senha após o primeiro login.");

await conn.end();
process.exit(0);
