import { executeQuery } from '../../config/db.js';

export const addEmployeeDetails = async (req, res) => {
    try {
        const {
            empCode,
            name,
            email,
            mobileNumber,
            department,
            pfNumber,
            esiNumber,
            bankName,
            accountNumber,
            panNumber,
            dateOfJoining,
            basicSalary,
            ctc,
            basicPayment,
            houseRentAllowance,
            conveyanceAllowance,
            medicalAllowance,
            specialAllowance,
            overtimeAllowance,
            additionalAllowance,
            professionalTax,
            tds,
            employeePfAmount,
            advanceSalary
        } = req.body;

        const grossSalary = parseFloat(basicPayment) + parseFloat(houseRentAllowance) + parseFloat(conveyanceAllowance) + parseFloat(medicalAllowance) + parseFloat(specialAllowance);
        const otherBenefits = parseFloat(overtimeAllowance) + parseFloat(additionalAllowance);
        const grossSalaryWithBenefits = parseFloat(grossSalary) + parseFloat(otherBenefits);
        const totalDeduction = parseFloat(professionalTax) + parseFloat(tds) + parseFloat(employeePfAmount) + parseFloat(advanceSalary);
        const netPay = parseFloat(grossSalaryWithBenefits) - parseFloat(totalDeduction);


        await executeQuery(
            `INSERT INTO employee_details (
        empCode, name, email, mobileNumber, department, pfNumber, esiNumber, 
        bankName, accountNumber, panNumber, dateOfJoining, basicSalary, ctc,
        basicPayment, houseRentAllowance, conveyanceAllowance, medicalAllowance, 
        specialAllowance, overtimeAllowance, additionalAllowance,
        professionalTax, tds, employeePfAmount, advanceSalary, grossSalary, otherBenefits, grossSalaryWithBenefits, totalDeduction, netPay
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empCode, name, email, mobileNumber, department,
                pfNumber, esiNumber, bankName, accountNumber, panNumber,
                dateOfJoining, basicSalary, ctc,
                basicPayment, houseRentAllowance, conveyanceAllowance, medicalAllowance,
                specialAllowance, overtimeAllowance, additionalAllowance,
                professionalTax, tds, employeePfAmount, advanceSalary, grossSalary, otherBenefits, grossSalaryWithBenefits, totalDeduction, netPay
            ]
        );

        const newEmployee = await executeQuery(
            `SELECT * FROM employee_details WHERE empCode = ?`,
            [empCode]
        );

        return res.status(200).json({
            success: true,
            message: "Employee details added successfully",
            data: {
                ...newEmployee,
                grossSalary,
                otherBenefits,
                grossSalaryWithBenefits,
                totalDeduction,
                netPay,
                // netPayInWords
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add employee.',
            error: error.message
        });
    }
};

export const getEmployeeDetailsList = async (req, res) => {
    try {
        const { empCode } = req.query;

        let result;

        if (empCode) {
            result = await executeQuery(
                `SELECT * FROM employee_details WHERE empCode = ?`,
                [empCode]
            );
        } else {
            result = await executeQuery(
                `SELECT * FROM employee_details`
            );
        }

        return res.status(200).json({
            success: true,
            message: empCode ? "Employee Details fetched successfully" : "Employee list fetched successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch employee list.',
            error: error.message
        });
    }
};

export const editEmployeeDetails = async (req, res) => {
    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID is required.',
            });
        }

        const {
            empCode,
            name,
            email,
            mobileNumber,
            department,
            pfNumber,
            esiNumber,
            bankName,
            accountNumber,
            panNumber,
            dateOfJoining,
            basicSalary,
            ctc,
            basicPayment,
            houseRentAllowance,
            conveyanceAllowance,
            medicalAllowance,
            specialAllowance,
            overtimeAllowance,
            additionalAllowance,
            professionalTax,
            tds,
            employeePfAmount,
            advanceSalary
        } = req.body;

        const result = await executeQuery(
            `UPDATE employee_details SET 
        empCode = ?, name = ?, email = ?, mobileNumber = ?, department = ?, 
        pfNumber = ?, esiNumber = ?, bankName = ?, accountNumber = ?, panNumber = ?, dateOfJoining = ?, 
        basicSalary = ?, ctc = ?, basicPayment = ?, houseRentAllowance = ?, 
        conveyanceAllowance = ?, medicalAllowance = ?, specialAllowance = ?, overtimeAllowance = ?, 
        additionalAllowance = ?, professionalTax = ?, tds = ?, employeePfAmount = ?, advanceSalary = ?
      WHERE id = ?`,
            [
                empCode, name, email, mobileNumber, department,
                pfNumber, esiNumber, bankName, accountNumber, panNumber, dateOfJoining,
                basicSalary, ctc, basicPayment, houseRentAllowance, conveyanceAllowance,
                medicalAllowance, specialAllowance, overtimeAllowance, additionalAllowance,
                professionalTax, tds, employeePfAmount, advanceSalary,
                id
            ]
        );

        const updatedData = await executeQuery(
            `SELECT * FROM employee_details WHERE id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Employee details updated successfully",
            data: updatedData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to update employee",
            error: error.message
        });
    }
};

export const deleteEmployeeDetails = async (req, res) => {
    try {

        const { id } = req.params;

        if (!id)
            return res.status(400).json({
                success: false,
                message: "Employee ID is required",
            });

        const result = await executeQuery(
            `DELETE FROM employee_details where id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Employee details deleted successfully",
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete employee",
            error: error.message
        });

    }
};