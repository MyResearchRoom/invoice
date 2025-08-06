import express from 'express';
import { addEmployeeDetails, deleteEmployeeDetails, downloadEmployeeListExcel, editEmployeeDetails, getEmployeeDetailsList } from '../../controller/EmployeeDetails/employeeDetails.js';

const router = express.Router();

router.post('/addEmployee', addEmployeeDetails);
router.get('/getEmployeeList', getEmployeeDetailsList);
router.put('/editEmployeeDetails/:id', editEmployeeDetails);
router.delete('/deleteEmployeeDetails/:id', deleteEmployeeDetails);
router.get('/download-employeeList', downloadEmployeeListExcel);

export default router;
