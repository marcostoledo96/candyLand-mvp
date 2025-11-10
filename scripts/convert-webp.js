import { readdir, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const IMG_DIR = path.resolve(process.cwd(), 'public', 'img');
const exts = new Set(['.jpg', '.jpeg', '.png']);

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const d of entries) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

async function convertFile(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  if (!exts.has(ext)) return false;
  const outPath = srcPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  try {
    // Si ya existe, no reprocesar
    const st = await stat(outPath).catch(() => null);
    if (st && st.isFile()) return false;
  } catch {
    // ignorar ausencia del archivo destino
  }
  await sharp(srcPath)
    .webp({ quality: 76 })
    .toFile(outPath);
  return true;
}

async function main() {
  // Asegurar carpeta
  await mkdir(IMG_DIR, { recursive: true });
  let converted = 0;
  for await (const file of walk(IMG_DIR)) {
    const done = await convertFile(file).catch((e) => {
      console.error('Error convirtiendo', file, e.message);
      return false;
    });
    if (done) converted++;
  }
  console.log(`Listo: ${converted} imágenes convertidas a WebP en public/img`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
