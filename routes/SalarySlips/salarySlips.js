import express from 'express'
import { deleteSalarySlip, generateSalarySlip, getSalarySlips, getSalarySlipsOfEmployee } from '../../controller/SalarySlips/salarySlips.js';

const router = express.Router();

router.post("/generateSalarySlip", generateSalarySlip);
router.get("/getSalarySlips", getSalarySlips);
router.get('/getSalarySlipsOfEmployee/:empCode', getSalarySlipsOfEmployee)
router.delete('/deleteSalarySlip/:id', deleteSalarySlip)

export default router;