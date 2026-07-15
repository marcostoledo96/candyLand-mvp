// Executable schema + migration + seed triangulation checks for PR-3.
// Pure stdlib asserts. Run: node test/schema-pr3-triangulate.test.js
// Edge cases beyond the happy path: delta-only migration, no destructive ops,
// seed sets the new fields, existing API field preserved, field naming.

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const backendRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(backendRoot, 'prisma', 'schema.prisma');
const seedPath = path.join(backendRoot, 'prisma', 'seed.js');
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
  const dirs = listMigrationDirs();
  assert.ok(dirs.length >= 2, 'there MUST be at least 2 migrations (init + pr3 delta)');
  const initSql = readMigrationSql(dirs[0]);
  const productMigration = dirs.find((dir) => dir.includes('admin_stock_hover_forms'));
  assert.ok(productMigration, 'Product extension migration must exist');
  const deltaSql = readMigrationSql(productMigration);

  // The init migration is distinct from the delta (init creates Product from scratch).
  assert.ok(/CREATE TABLE "Product"/.test(initSql), 'init migration MUST create Product table (sanity: init is unchanged)');

  // Edge case 1: the delta migration MUST NOT recreate existing tables.
  // It should only ALTER Product and CREATE the new tables.
  assert.ok(!/CREATE TABLE "Product"/.test(deltaSql), 'delta MUST NOT recreate Product table');
  assert.ok(!/CREATE TABLE "Category"/.test(deltaSql), 'delta MUST NOT recreate Category table');
  assert.ok(!/CREATE TABLE "Order"/.test(deltaSql), 'delta MUST NOT recreate Order table');
  assert.ok(/ALTER TABLE "Product"/.test(deltaSql), 'delta MUST ALTER TABLE Product');

  // Edge case 2: no destructive DROP in the delta.
  assert.ok(!/DROP TABLE/i.test(deltaSql), 'delta MUST NOT contain DROP TABLE');
  assert.ok(!/DROP COLUMN/i.test(deltaSql), 'delta MUST NOT contain DROP COLUMN');

  // Edge case 3: existing API field image preserved in schema (not renamed).
  const productModel = extractModel(schema, 'Product');
  assert.match(productModel, /\bimage\s+String\?/, 'Product.image MUST remain (existing /api/productos depends on it)');

  // Edge case 4: hoverImage is nullable (existing products have no hover image).
  assert.match(productModel, /hoverImage\s+String\?/, 'Product.hoverImage MUST be nullable');

  // Edge case 5: stock default in schema matches migration default (0).
  assert.match(productModel, /stock\s+Int\s+@default\(0\)/, 'Product.stock MUST default to 0 in schema');
  assert.match(deltaSql, /"stock"\s+INTEGER\s+NOT\s+NULL\s+DEFAULT\s+0/i, 'Product.stock MUST default to 0 in migration');

  // Edge case 6: active default in schema matches migration default (true).
  assert.match(productModel, /active\s+Boolean\s+@default\(true\)/, 'Product.active MUST default to true in schema');
  assert.match(deltaSql, /"active"\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+true/i, 'Product.active MUST default to true in migration');

  // Edge case 7: User.passwordHash must NOT be named password (avoid leaking plaintext field name expectations).
  const userModel = extractModel(schema, 'User');
  assert.match(userModel, /passwordHash\s+String/, 'User MUST use passwordHash (not password)');

  // Edge case 8: seed initializes stock/active only on create, not on update.
  const seed = fs.readFileSync(seedPath, 'utf8');
  assert.match(seed, /create\(\{\s*data:\s*\{\s*\.\.\.data,\s*stock:\s*p\.stock,\s*active:\s*true\s*\}\s*\}\)/s, 'seed MUST initialize stock/active when creating products');
  assert.match(seed, /update\(\{\s*where:\s*\{\s*id:\s*existing\.id\s*\},\s*data\s*\}\)/s, 'seed update path MUST reuse base data only');

  // Edge case 9: new models have createdAt timestamps.
  assert.match(extractModel(schema, 'ContactMessage'), /createdAt\s+DateTime/, 'ContactMessage MUST have createdAt');
  assert.match(extractModel(schema, 'JobApplication'), /createdAt\s+DateTime/, 'JobApplication MUST have createdAt');
  assert.match(extractModel(schema, 'FranchiseLead'), /createdAt\s+DateTime/, 'FranchiseLead MUST have createdAt');

  console.log('OK: schema-pr3 triangulation asserts passed.');
}

run();
