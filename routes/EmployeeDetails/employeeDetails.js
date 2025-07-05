import express from 'express';
import { addEmployeeDetails, deleteEmployeeDetails, editEmployeeDetails, getEmployeeDetailsList } from '../../controller/EmployeeDetails/employeeDetails.js';

const router = express.Router();

router.post('/addEmployee', addEmployeeDetails);
router.get('/getEmployeeList', getEmployeeDetailsList);
router.put('/editEmployeeDetails/:id', editEmployeeDetails);
router.delete('/deleteEmployeeDetails/:id', deleteEmployeeDetails);

export default router;
