/**
 * Script: Cria o super-admin padrão para o primeiro acesso ao sistema.
 * Uso: node scripts/create-super-admin.mjs
 * ALTERE A SENHA após o primeiro login pelo painel de usuários.
 */
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client(process.env.DATABASE_URL);
await client.connect();

const username = "ribeira.admin";
const password = "Ribeira@2024";
const name = "Super Administrador";
const role = "super_admin";

const passwordHash = await bcrypt.hash(password, 10);

// Verificar se já existe
const existing = await client.query('SELECT id FROM local_users WHERE username = $1', [username]);
if (existing.rows.length > 0) {
  console.log(`Usuário "${username}" já existe (id=${existing.rows[0].id}). Nenhuma ação necessária.`);
} else {
  await client.query(
    `INSERT INTO local_users (name, username, "passwordHash", role, active, "pendingApproval", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 1, 0, NOW(), NOW())`,
    [name, username, passwordHash, role]
  );
  console.log(`Super-admin criado com sucesso!`);
  console.log(`  Username: ${username}`);
  console.log(`  Senha: ${password}`);
  console.log(`  ⚠️  Altere a senha após o primeiro login.`);
}

await client.end();
