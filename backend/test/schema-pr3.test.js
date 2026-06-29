// Executable schema + migration safety check for PR-3.
// Pure stdlib asserts (no test framework). Run: node test/schema-pr3.test.js
// Validates that schema.prisma and the generated migration SQL satisfy PR-3
// acceptance criteria: new models, Product fields, safe backfill for existing rows.

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const backendRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(backendRoot, 'prisma', 'schema.prisma');
const migrationsDir = path.join(backendRoot, 'prisma', 'migrations');

function readSchema() {
  return fs.readFileSync(schemaPath, 'utf8');
}

function listMigrationDirs() {
  return fs.readdirSync(migrationsDir)
    .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory())
    .sort();
}

function readMigrationSql(dir) {
  const sqlPath = path.join(migrationsDir, dir, 'migration.sql');
  assert.ok(fs.existsSync(sqlPath), `migration.sql missing in ${dir}`);
  return fs.readFileSync(sqlPath, 'utf8');
}

function extractModel(schema, name) {
  const re = new RegExp(`model\\s+${name}\\s+\\{([\\s\\S]*?)\\n\\}`, 'm');
  const m = schema.match(re);
  return m ? m[1] : null;
}

function run() {
  const schema = readSchema();

  // --- User model (admin auth) ---
  const userModel = extractModel(schema, 'User');
  assert.ok(userModel, 'schema.prisma MUST define a User model');
  assert.match(userModel, /email\s+String\s+@unique/, 'User.email MUST be String @unique');
  assert.match(userModel, /passwordHash\s+String/, 'User MUST have passwordHash String');
  assert.match(userModel, /role\s+String/, 'User MUST have role String');
  assert.match(userModel, /active\s+Boolean/, 'User MUST have active Boolean');
  assert.match(userModel, /createdAt\s+DateTime/, 'User MUST have createdAt');
  assert.match(userModel, /updatedAt\s+DateTime/, 'User MUST have updatedAt');

  // --- Product extensions ---
  const productModel = extractModel(schema, 'Product');
  assert.ok(productModel, 'Product model must still exist');
  assert.match(productModel, /stock\s+Int/, 'Product MUST have stock Int');
  assert.match(productModel, /active\s+Boolean/, 'Product MUST have active Boolean');
  assert.match(productModel, /hoverImage\s+String\?/, 'Product MUST have hoverImage String? (nullable)');

  // --- ContactMessage ---
  const contactModel = extractModel(schema, 'ContactMessage');
  assert.ok(contactModel, 'schema.prisma MUST define ContactMessage model');
  assert.match(contactModel, /name\s+String/, 'ContactMessage MUST have name String');
  assert.match(contactModel, /email\s+String/, 'ContactMessage MUST have email String');
  assert.match(contactModel, /message\s+String/, 'ContactMessage MUST have message String');

  // --- JobApplication ---
  const jobModel = extractModel(schema, 'JobApplication');
  assert.ok(jobModel, 'schema.prisma MUST define JobApplication model');
  assert.match(jobModel, /fullName\s+String/, 'JobApplication MUST have fullName String');
  assert.match(jobModel, /email\s+String/, 'JobApplication MUST have email String');
  assert.match(jobModel, /position\s+String/, 'JobApplication MUST have position String');

  // --- FranchiseLead ---
  const franchiseModel = extractModel(schema, 'FranchiseLead');
  assert.ok(franchiseModel, 'schema.prisma MUST define FranchiseLead model');
  assert.match(franchiseModel, /fullName\s+String/, 'FranchiseLead MUST have fullName String');
  assert.match(franchiseModel, /email\s+String/, 'FranchiseLead MUST have email String');
  assert.match(franchiseModel, /city\s+String/, 'FranchiseLead MUST have city String');

  // --- Migration safety: the new migration MUST backfill existing Product rows ---
  const dirs = listMigrationDirs();
  assert.ok(dirs.length > 0, 'at least one migration directory must exist');
  // The latest migration is the one we are adding for PR-3 schema extensions.
  const latestDir = dirs[dirs.length - 1];
  const sql = readMigrationSql(latestDir);

  // stock column: must be added with a default/backfill so existing rows are safe.
  assert.match(
    sql,
    /"stock"\s+INTEGER\s+NOT\s+NULL\s+DEFAULT\s+\d+/i,
    'migration MUST add Product.stock as NOT NULL with a DEFAULT (safe for existing rows)',
  );
  // active column: must be added with a default.
  assert.match(
    sql,
    /"active"\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+(true|false)/i,
    'migration MUST add Product.active as NOT NULL with a DEFAULT',
  );
  // hoverImage: nullable, no backfill needed.
  assert.match(sql, /"hoverImage"\s+TEXT/i, 'migration MUST add Product.hoverImage as TEXT (nullable)');
  // User table present in migration.
  assert.match(sql, /CREATE TABLE "User"/, 'migration MUST create User table');

  // --- Existing API field preserved: image still selectable (no rename) ---
  assert.match(productModel, /image\s+String\?/, 'Product.image MUST remain String? (existing API depends on it)');

  console.log('OK: schema-pr3 asserts passed.');
}

run();