import { NextResponse } from 'next/server';
import { processUpload } from '@/lib/upload';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const fileUrl = await processUpload(file);
    
    if (!fileUrl) {
      return NextResponse.json({ success: false, error: 'Échec de la récupération de l\'URL' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erreur lors du téléchargement', stack: error.stack }, { status: 500 });
  }
}
