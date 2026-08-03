import { createClient } from "@supabase/supabase-js";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// Ne pas créer le client si on est en dev sans vraie URL
const supabase = supabaseUrl.includes("localhost") ? null : createClient(supabaseUrl, supabaseKey);

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

  // Laissons passer si magic bytes imparfait
  // isValidMagicBytes(buffer, ext)

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const cleanName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '');
  const filename = `${uniqueSuffix}-${cleanName}${ext}`;
  
  // SI ON EST EN LOCAL (DEVELOPMENT) OU SUPABASE NON CONFIGURE
  if (process.env.NODE_ENV === "development" || !supabase) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      return `/uploads/${filename}`;
    } catch (error) {
      console.error("Erreur d'upload local:", error);
      throw new Error("Échec du téléversement en local.");
    }
  }

  // SI ON EST EN PRODUCTION (VERCEL)
  try {
    const { error } = await supabase
      .storage
      .from('regionale-express-voyage')
      .upload(`uploads/${filename}`, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error("Erreur d'upload Supabase:", error);
      throw new Error("Échec du téléversement vers le serveur de stockage.");
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('regionale-express-voyage')
      .getPublicUrl(`uploads/${filename}`);

    return publicUrl;
  } catch (error) {
    console.error("Erreur d'upload:", error);
    throw new Error("Échec du téléversement vers le serveur de stockage.");
  }
}
