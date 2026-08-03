const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processImages() {
  const sourcePath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\e0434c68-064f-4f49-80bf-b4e9c8959c85\\media__1785305059974.jpg';
  const publicIconsDir = path.join(__dirname, '..', 'public', 'icons');
  const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

  // S'assurer que les dossiers existent
  if (!fs.existsSync(publicIconsDir)) fs.mkdirSync(publicIconsDir, { recursive: true });
  if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });

  console.log('Processing new logo...');

  // 1. Générer le logo principal (pour le site)
  await sharp(sourcePath)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(publicImagesDir, 'logo.png'));
  console.log('logo.png generated');

  // 2. Générer l'icône PWA 192x192
  await sharp(sourcePath)
    .resize(192, 192)
    .png({ quality: 80, palette: true })
    .toFile(path.join(publicIconsDir, 'icon-192x192.png'));
  console.log('icon-192x192.png generated');

  // 3. Générer l'icône PWA 512x512
  await sharp(sourcePath)
    .resize(512, 512)
    .png({ quality: 80, palette: true })
    .toFile(path.join(publicIconsDir, 'icon-512x512.png'));
  console.log('icon-512x512.png generated');

  // 4. Générer le favicon
  await sharp(sourcePath)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
  console.log('favicon.ico generated');
}

processImages().catch(console.error);
