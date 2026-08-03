const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'icons', 'icon-192x192.png');
const outputPath = path.join(__dirname, '..', 'public', 'icons', 'icon-192x192-opt.png');
const icon512Path = path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png');
const icon512OptPath = path.join(__dirname, '..', 'public', 'icons', 'icon-512x512-opt.png');
const appleIconPath = path.join(__dirname, '..', 'public', 'icons', 'apple-touch-icon.png');
const appleIconOptPath = path.join(__dirname, '..', 'public', 'icons', 'apple-touch-icon-opt.png');


async function optimizeIcons() {
  try {
    // 192x192
    if (fs.existsSync(inputPath)) {
      await sharp(inputPath)
        .resize(192, 192)
        .png({ compressionLevel: 9, quality: 80, palette: true })
        .toFile(outputPath);
      fs.renameSync(outputPath, inputPath);
      console.log('Optimized icon-192x192.png');
    }

    // 512x512
    if (fs.existsSync(icon512Path)) {
      await sharp(icon512Path)
        .resize(512, 512)
        .png({ compressionLevel: 9, quality: 80, palette: true })
        .toFile(icon512OptPath);
      fs.renameSync(icon512OptPath, icon512Path);
      console.log('Optimized icon-512x512.png');
    }

    // Apple Touch Icon
    if (fs.existsSync(appleIconPath)) {
      await sharp(appleIconPath)
        .resize(180, 180) // Standard Apple touch icon size
        .png({ compressionLevel: 9, quality: 80, palette: true })
        .toFile(appleIconOptPath);
      fs.renameSync(appleIconOptPath, appleIconPath);
      console.log('Optimized apple-touch-icon.png');
    }

  } catch (err) {
    console.error('Error optimizing icons:', err);
  }
}

optimizeIcons();
