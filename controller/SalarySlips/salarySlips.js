import { executeQuery } from '../../config/db.js';

export const generateSalarySlip = async (req, res) => {
    try {
        const { empCode, daysInMonth, absentDays, presentDays, absentDaysInMonth, leaveBalanceOpening, leaveTakenInMonth, leaveBalanceClosing, paySlipMonth, loanOpeningBalance, loanDeductionCurrentMonth, loanBalance } = req.body;

        const [employee] = await executeQuery(`SELECT * FROM employee_details WHERE empCode = ?`, [empCode]);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found with the given empCode.'
            });
        }

        const grossSalary =
            parseFloat(employee.basicPayment || 0) +
            parseFloat(employee.houseRentAllowance || 0) +
            parseFloat(employee.conveyanceAllowance || 0) +
            parseFloat(employee.medicalAllowance || 0) +
            parseFloat(employee.specialAllowance || 0);

        const otherBenefits =
            parseFloat(employee.overtimeAllowance || 0) +
            parseFloat(employee.additionalAllowance || 0);

        const grossSalaryWithBenefits = grossSalary + otherBenefits;

        const totalDeduction =
            parseFloat(employee.professionalTax || 0) +
            parseFloat(employee.tds || 0) +
            parseFloat(employee.employeePfAmount || 0) +
            parseFloat(employee.advanceSalary || 0);
        // parseFloat(loanDeductionCurrentMonth || 0);

        const netPay = grossSalaryWithBenefits - totalDeduction;

        const result = await executeQuery(`
      INSERT INTO salary_slips (
        empCode, name, email, mobileNumber, department, pfNumber, esiNumber, bankName,
        accountNumber, panNumber, dateOfJoining, basicSalary, ctc, basicPayment, houseRentAllowance,
        conveyanceAllowance, medicalAllowance, specialAllowance, overtimeAllowance,
        additionalAllowance, professionalTax, tds, employeePfAmount, advanceSalary,
        daysInMonth, absentDays, presentDays, absentDaysInMonth, leaveBalanceOpening, leaveTakenInMonth, leaveBalanceClosing, paySlipMonth, loanOpeningBalance, loanDeductionCurrentMonth, loanBalance, grossSalary, otherBenefits, grossSalaryWithBenefits, totalDeduction, netPay
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            employee.empCode, employee.name, employee.email, employee.mobileNumber, employee.department,
            employee.pfNumber, employee.esiNumber, employee.bankName, employee.accountNumber,
            employee.panNumber, employee.dateOfJoining, employee.basicSalary, employee.ctc,
            employee.basicPayment, employee.houseRentAllowance, employee.conveyanceAllowance,
            employee.medicalAllowance, employee.specialAllowance, employee.overtimeAllowance,
            employee.additionalAllowance, employee.professionalTax, employee.tds,
            employee.employeePfAmount, employee.advanceSalary,

            daysInMonth, absentDays, presentDays, absentDaysInMonth, leaveBalanceOpening, leaveTakenInMonth, leaveBalanceClosing, paySlipMonth, loanOpeningBalance, loanDeductionCurrentMonth, loanBalance, grossSalary, otherBenefits, grossSalaryWithBenefits, totalDeduction, netPay
        ]);

        const insertedId = result.insertId;

        // Fetch the inserted record
        const [salarySlip] = await executeQuery(
            `SELECT * FROM salary_slips WHERE id = ?`,
            [insertedId]
        );

        return res.status(201).json({
            success: true,
            message: 'Salary slip data submitted successfully',
            data: salarySlip
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit salary slip data',
            error: error.message
        });
    }
};

export const getSalarySlips = async (req, res) => {
    try {

        const salarySlips = await executeQuery(
            `SELECT * FROM salary_slips ORDER BY generatedDate DESC`
        );

        res.status(200).json({
            success: true,
            message: 'Salary slips fetched successfully',
            data: salarySlips
        });

    } catch (error) {
        console.error('Error fetching salary slips:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch salary slips',
            error: error.message
        });
    }
};

export const getSalarySlipsOfEmployee = async (req, res) => {
    try {
        const { empCode } = req.params;

        if (!empCode) {
            return res.status(400).json({
                success: false,
                message: "Employee Code is required"
            });
        }

        const salarySlips = await executeQuery(
            `SELECT * FROM salary_slips WHERE empCode = ? ORDER BY generatedDate DESC`,
            [empCode]
        );

        if (salarySlips.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No salary slips found for employee code: ${empCode}`
            });
        }

        res.status(200).json({
            success: true,
            message: `Salary Slip of ${empCode} fetched successfully`,
            data: salarySlips
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: `Failed to fetch salary slips of ${empCode}`,
            error: error.message
        });
    }
};

export const deleteSalarySlip = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Salary Slip ID is required"
            });
        }

        const [existingSalarySlip] = await executeQuery(
            `SELECT * FROM salary_slips WHERE id = ?`,
            [id]
        );

        if (!existingSalarySlip) {
            return res.status(404).json({
                success: false,
                message: "No salary slip found"
            });
        }

        await executeQuery(
            `DELETE FROM salary_slips WHERE id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: `Salary Slip deleted successfully`
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: `Failed to delete salary slip.`,
            error: error.message
        });
    }
};
