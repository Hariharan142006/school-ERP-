import { Router } from 'express';
import { 
  getGatePasses, 
  createGatePass, 
  updateGatePass, 
  deleteGatePass,
  getGatePassByCode,
  verifyGatePass,
  getParentGatePasses,
  getGatePassLogs
} from '../controllers/gatePassController';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/logs', getGatePassLogs);
router.get('/parent', getParentGatePasses);
router.get('/lookup/:code', getGatePassByCode);
router.post('/verify/:code', verifyGatePass);

router.get('/', getGatePasses);
router.post('/', createGatePass);
router.put('/:id', updateGatePass);
router.delete('/:id', deleteGatePass);

export default router;
