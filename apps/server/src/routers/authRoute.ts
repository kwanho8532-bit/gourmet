import { Router } from 'express'
import { AuthController } from '../controllers/authController';

const router: Router = Router()

router.post('/refresh', AuthController.refresh)

export default router;