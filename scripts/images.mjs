// Gera as fotos do site em AVIF e WebP, em 3 larguras. Rode: npm run images
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ANEXOS = 'C:/Users/snasc/AppData/Local/Temp/claude/C--Users-snasc/eee7660f-f063-415f-bee6-618a3e4acf17/images';
const OUT = path.resolve('public/img');

// nome no site -> arquivo original
const fotos = {
  'viviane-hero': `${ANEXOS}/17.jpg`,
  'viviane-consultorio': `${ANEXOS}/16.webp`,
  'viviane-quem': `${ANEXOS}/18.jpg`,
};
const larguras = [480, 800, 1200];

fs.mkdirSync(OUT, { recursive: true });
for (const [nome, src] of Object.entries(fotos)) {
  const meta = await sharp(src).metadata();
  console.log(nome, meta.width + 'x' + meta.height);
  for (const w of larguras) {
    const base = sharp(src).rotate().resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${nome}-${w}.avif`));
    await base.clone().webp({ quality: 74 }).toFile(path.join(OUT, `${nome}-${w}.webp`));
  }
}
// imagem de compartilhamento (WhatsApp, Instagram, Facebook)
await sharp(fotos['viviane-hero']).rotate()
  .resize(1200, 630, { fit: 'cover', position: 'top' }).jpeg({ quality: 80 })
  .toFile(path.join(OUT, 'og-image.jpg'));
console.log('ok');
