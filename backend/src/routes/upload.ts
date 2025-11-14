import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController';

export const uploadRouter = Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/', // Temporary storage
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload file and extract health data
uploadRouter.post('/file', upload.single('file'), uploadController.uploadFile);

// Get user's uploaded files
uploadRouter.get('/files', uploadController.getUploadedFiles);

// Get specific uploaded file data
uploadRouter.get('/files/:id', uploadController.getUploadedFile);

// Delete uploaded file
uploadRouter.delete('/files/:id', uploadController.deleteUploadedFile);

