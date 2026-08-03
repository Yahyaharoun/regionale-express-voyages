import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

// Vérification basique des "Magic Bytes" pour contrer l'usurpation d'extension
function isValidMagicBytes(buffer: Buffer, ext: string): boolean {
  if (ext === '.pdf') {
    return buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
  }
  if (ext === '.png') {
    return buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer.length > 2 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  return false;
}

export async function processUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  
  // Limite de taille à 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Fichier trop volumineux (Max 5MB).");
  }

  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.name).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Extension non autorisée. Seuls ${allowedExtensions.join(', ')} sont acceptés.`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (!isValidMagicBytes(buffer, ext)) {
    throw new Error("Contenu de fichier invalide (Vérification de sécurité échouée).");
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const cleanName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '');
  const filename = `${uniqueSuffix}-${cleanName}${ext}`;
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  
  writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}
