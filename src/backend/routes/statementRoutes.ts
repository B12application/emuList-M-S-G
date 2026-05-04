import { Router } from 'express';
import multer from 'multer';
import { analyzeStatement, getUsage } from '../controllers/statementController';

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

// GET /api/usage
router.get('/usage', getUsage);

export default router;
