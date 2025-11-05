// PrismaClient con singleton para evitar múltiples conexiones en serverless y dev
// Nota: en Vercel (funciones serverless) las invocaciones pueden reutilizar el mismo runtime,
// por eso guardamos la instancia en globalThis para evitar reconexiones innecesarias.
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  // En producción creamos una única instancia por proceso
  prisma = new PrismaClient();
} else {
  // En desarrollo/serverless, cacheamos en global para reusar
  if (!globalThis.__PRISMA__) {
    globalThis.__PRISMA__ = new PrismaClient();
  }
  prisma = globalThis.__PRISMA__;
}

module.exports = prisma;
