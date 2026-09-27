import multer from 'multer';
import path from 'path';
import fs from 'fs';
// pdf-parse is required conditionally
const pdfParse = require('pdf-parse');

const uploadDir = path.join(process.cwd(), 'uploads', 'proof-of-work');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.docx', '.pptx', '.xlsx', '.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not supported. Allowed formats: PDF, DOCX, PPTX, XLSX, PNG, JPG, JPEG, WEBP.`));
  }
};

export const proofOfWorkUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  }
});

export async function extractTextFromArtifact(filePath: string, mimeType: string, originalName: string): Promise<string> {
  try {
    const ext = path.extname(originalName).toLowerCase();
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      const buffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(buffer);
      return (parsed.text || '').slice(0, 50000);
    }
    
    if (ext === '.txt' || ext === '.md' || mimeType.startsWith('text/')) {
      const text = fs.readFileSync(filePath, 'utf-8');
      return text.slice(0, 50000);
    }

    return '';
  } catch (err: any) {
    console.error(`Failed to extract text from artifact ${originalName}:`, err.message);
    return '';
  }
}
