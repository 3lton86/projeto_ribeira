/**
 * Script: Reseta a senha do super-admin padrão.
 * Uso: node scripts/reset-super-admin.mjs
 */
import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client(process.env.DATABASE_URL);
await client.connect();

const username = "ribeira.admin";
const newPassword = "Ribeira@2024";
const passwordHash = await bcrypt.hash(newPassword, 10);

const result = await client.query(
  'UPDATE local_users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE username = $2',
  [passwordHash, username]
);

if (result.rowCount > 0) {
  console.log(`Senha do "${username}" resetada com sucesso.`);
  console.log(`  Nova senha: ${newPassword}`);
  console.log(`  ⚠️  Altere após o login.`);
} else {
  console.log(`Usuário "${username}" não encontrado. Rode create-super-admin.mjs primeiro.`);
}

await client.end();
