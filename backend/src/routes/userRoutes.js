// src/routes/userRoutes.js
import { Router } from 'express';
import * as users from '../controllers/userController.js';

const router = Router();

router.get('/', users.list);
router.get('/:id', users.get);
router.post('/', users.create);
router.put('/:id', users.update);
router.delete('/:id', users.remove);

export default router;
