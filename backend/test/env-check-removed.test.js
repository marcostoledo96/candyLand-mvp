const assert = require('node:assert/strict');
const http = require('node:http');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const sentinelUrl = 'postgresql://sensitive-user:sensitive-pass@provider.example/candyland';
let databaseCalls = 0;
const fakePrisma = {
  $queryRaw: async () => {
    databaseCalls += 1;
    return [{ '?column?': 1 }];
  },
  product: { count: async () => 0 },
};

const originalResolve = Module._resolveFilename;
const prismaClientPath = path.resolve(__dirname, '../prismaClient.js');
Module._resolveFilename = function resolveFilename(request, parent, ...rest) {
  if (request === './prismaClient' || request === '../prismaClient' || request === prismaClientPath) {
    return '__production_deploy_qa_prisma__';
  }
  if (request === 'dotenv') return '__production_deploy_qa_dotenv__';
  return originalResolve.call(this, request, parent, ...rest);
};
require.cache.__production_deploy_qa_prisma__ = {
  id: '__production_deploy_qa_prisma__', filename: '__production_deploy_qa_prisma__', loaded: true, exports: fakePrisma,
};
require.cache.__production_deploy_qa_dotenv__ = {
  id: '__production_deploy_qa_dotenv__', filename: '__production_deploy_qa_dotenv__', loaded: true, exports: { config: () => ({}) },
};

process.env.DATABASE_URL = sentinelUrl;
const app = require('../app');

function request(pathname) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const req = http.request({ host: '127.0.0.1', port: server.address().port, path: pathname, method: 'GET' }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => server.close(() => resolve({ status: res.statusCode, body })));
      });
      req.on('error', (error) => server.close(() => reject(error)));
      req.end();
    });
  });
}

test('GET /api/env-check is absent, does not query the database, and leaks no diagnostics', async () => {
  const response = await request('/api/env-check');

  assert.equal(response.status, 404);
  assert.equal(databaseCalls, 0);
  assert.equal(response.body.includes(sentinelUrl), false);
  assert.equal(response.body.includes('provider.example'), false);
  assert.equal(response.body.includes('databaseUrlPreview'), false);
  assert.equal(response.body.includes('Error:'), false);
  assert.equal(response.body.includes(' at '), false);
});
