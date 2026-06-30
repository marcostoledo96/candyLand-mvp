// One-shot admin user creation/refresh script.
// Run: node scripts/create-admin.js
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from env (or .env via dotenv).
// Safe to re-run: updates the password hash if the user already exists.
// Does NOT hardcode credentials. Fails safely if env vars are missing.

require('dotenv').config();
const prisma = require('../prismaClient');
const { hashPassword } = require('../utils/password');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required.');
    console.error('Example: ADMIN_EMAIL=admin@candy.com ADMIN_PASSWORD=secret npm run create-admin');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD MUST be at least 8 characters.');
    process.exit(1);
  }
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = hashPassword(password);

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Force role ADMIN + active true: bootstrap must guarantee an admin even if
    // the row was previously a non-admin or inactive user.
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, active: true, role: 'ADMIN' } });
    console.log(`Admin user updated: ${normalizedEmail} (id=${existing.id}, role=ADMIN, active=true)`);
  } else {
    const created = await prisma.user.create({ data: { email: normalizedEmail, passwordHash, role: 'ADMIN', active: true } });
    console.log(`Admin user created: ${normalizedEmail} (id=${created.id})`);
  }
}

main()
  .catch((err) => {
    console.error('create-admin failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });