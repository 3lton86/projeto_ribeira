import bcrypt from 'bcryptjs';
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const NEW_PASSWORD = 'Ribeira@2026!';
const USERNAME = 'ribeira.admin';

const connection = await createConnection(process.env.DATABASE_URL);

// Generate fresh hash
const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);
console.log('New hash generated:', passwordHash.substring(0, 20) + '...');

// Verify hash works before saving
const valid = await bcrypt.compare(NEW_PASSWORD, passwordHash);
console.log('Hash verification:', valid ? '✓ OK' : '✗ FAILED');

if (!valid) {
  console.error('Hash verification failed! Aborting.');
  await connection.end();
  process.exit(1);
}

// Update in DB
const [result] = await connection.execute(
  `UPDATE local_users SET passwordHash = ?, active = 1 WHERE username = ?`,
  [passwordHash, USERNAME]
);

if (result.affectedRows === 0) {
  // User doesn't exist — create it
  console.log('User not found, creating...');
  await connection.execute(
    `INSERT INTO local_users (name, username, passwordHash, role, active, createdAt, updatedAt)
     VALUES (?, ?, ?, 'super_admin', 1, NOW(), NOW())`,
    ['Super Administrador', USERNAME, passwordHash]
  );
  console.log('✓ Super-admin criado com sucesso!');
} else {
  console.log(`✓ Senha atualizada para o usuário "${USERNAME}"`);
}

// Final verification from DB
const [rows] = await connection.execute(
  'SELECT id, name, username, role, active FROM local_users WHERE username = ?',
  [USERNAME]
);
console.log('Registro no banco:', JSON.stringify(rows[0]));

await connection.end();
console.log('\n=== CREDENCIAIS DE ACESSO ===');
console.log(`Usuário: ${USERNAME}`);
console.log(`Senha:   ${NEW_PASSWORD}`);
console.log('=============================');
