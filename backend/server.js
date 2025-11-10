// Servidor HTTP solo para entorno local. En Vercel usamos funciones serverless que importan app desde backend/app.js
const app = require('./app');
const PORT = process.env.PORT || 5050;

async function start() {
  try {
    console.log('Intentando conectar a la base de datos...');
    // La conexión real la maneja Prisma al ejecutar queries.
    const host = process.env.HOST || '127.0.0.1';
    const server = app.listen(PORT, host, () => {
      const addr = server.address();
      if (typeof addr === 'string') console.log(`Backend listening on pipe ${addr}`);
      else if (addr && typeof addr === 'object') console.log(`Backend listening on http://${addr.address}:${addr.port}`);
      else console.log(`Backend listening on port ${PORT}`);
    });

    // Mejor manejo de errores de arranque (p.ej., puerto en uso)
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`El puerto ${PORT} ya está en uso. Liberalo o ejecutá con PORT=<otro> npm run dev.`);
        console.error('Tip Windows: netstat -ano | findstr :%PORT%  -> taskkill /PID <pid> /F');
      } else {
        console.error('Error del servidor:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Error arrancando el servidor:', err?.message || err);
    process.exit(1);
  }
}

start();
