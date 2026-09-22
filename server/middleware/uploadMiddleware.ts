import multer from 'multer';
import { Request } from 'express';

// Store uploaded files strictly in memory (RAM buffer) to ensure zero disk persistence
const storage = multer.memoryStorage();

// File filter to accept image formats typically used for Government ID Cards
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload an image (PNG, JPG, JPEG, WEBP) of the official ID card.'));
  }
};

export const uploadIdProof = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum
  },
});
