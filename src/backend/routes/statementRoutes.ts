import { Router } from 'express';
import multer from 'multer';
import { analyzeStatement } from '../controllers/statementController';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/analyze-statement
router.post('/analyze-statement', upload.single('file'), analyzeStatement);

export default router;
