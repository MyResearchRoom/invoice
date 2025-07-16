import express from 'express';
import { getCounts } from '../../controller/Counts/counts.js';

const router = express.Router();

router.get("/getCounts", getCounts)

export default router;