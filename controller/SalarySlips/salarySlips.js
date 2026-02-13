import ExcelJS from "exceljs"
import { executeQuery } from '../../config/db.js';

// 

export const generateSalarySlip = async (req, res) => {
    try {
        const { 
            empCode, 
            daysInMonth, 
            absentDays, 
            presentDays, 
            absentDaysInMonth, 
            leaveBalanceOpening, 
            leaveTakenInMonth, 
            leaveBalanceClosing, 
            paySlipMonth, 
            loanOpeningBalance, 
            loanDeductionCurrentMonth, 
            loanBalance, 
            leaveDeductionAmount, 
            transactionId,
            salaryDate   // ✅ NEW FIELD ADDED
        } = req.body;

        const [employee] = await executeQuery(
            `SELECT * FROM employee_details WHERE empCode = ?`, 
            [empCode]
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found with the given empCode.'
            });
        }

        const formattedPaySlipMonth = new Date(paySlipMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
        });

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
            parseFloat(employee.esiAmount || 0) +
            parseFloat(employee.advanceSalary || 0) +
            parseFloat(leaveDeductionAmount || 0);

        const netPay = grossSalaryWithBenefits - totalDeduction;

        const result = await executeQuery(`
            INSERT INTO salary_slips (
                empCode, name, email, mobileNumber, department, pfNumber, esiNumber, bankName,
                accountNumber, panNumber, dateOfJoining, basicSalary, ctc, basicPayment, houseRentAllowance,
                conveyanceAllowance, medicalAllowance, specialAllowance, overtimeAllowance,
                additionalAllowance, professionalTax, tds, employeePfAmount, esiAmount, advanceSalary,
                leaveDeductionAmount, daysInMonth, absentDays, presentDays, absentDaysInMonth,
                leaveBalanceOpening, leaveTakenInMonth, leaveBalanceClosing, paySlipMonth, salaryDate,
                loanOpeningBalance, loanDeductionCurrentMonth, loanBalance, transactionId,
                grossSalary, otherBenefits, grossSalaryWithBenefits, totalDeduction, netPay
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            employee.empCode,
            employee.name,
            employee.email,
            employee.mobileNumber,
            employee.department,
            employee.pfNumber,
            employee.esiNumber,
            employee.bankName,
            employee.accountNumber,
            employee.panNumber,
            employee.dateOfJoining,
            employee.basicSalary,
            employee.ctc,
            employee.basicPayment,
            employee.houseRentAllowance,
            employee.conveyanceAllowance,
            employee.medicalAllowance,
            employee.specialAllowance,
            employee.overtimeAllowance,
            employee.additionalAllowance,
            employee.professionalTax,
            employee.tds,
            employee.employeePfAmount,
            employee.esiAmount,
            employee.advanceSalary,
            leaveDeductionAmount,
            daysInMonth,
            absentDays,
            presentDays,
            absentDaysInMonth,
            leaveBalanceOpening,
            leaveTakenInMonth,
            leaveBalanceClosing,
            formattedPaySlipMonth,
            salaryDate, // ✅ NEW VALUE ADDED
            loanOpeningBalance,
            loanDeductionCurrentMonth,
            loanBalance,
            transactionId,
            grossSalary,
            otherBenefits,
            grossSalaryWithBenefits,
            totalDeduction,
            netPay
        ]);

        const insertedId = result.insertId;

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
        const { month, empCode, company, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let baseQuery = `
      FROM salary_slips ss
      JOIN employee_details ed ON ss.empCode = ed.empCode
      WHERE 1=1
    `;

        const values = [];
        const filters = [];

        if (month) {
            const formattedMonth = new Date(month).toLocaleString("default", {
                month: "long",
                year: "numeric",
            });
            filters.push(`ss.paySlipMonth = ?`);
            values.push(formattedMonth);
        }

        if (empCode) {
            filters.push(`ss.empCode LIKE ?`);
            values.push(`${empCode}%`);
        }

        if (company) {
            filters.push(`ed.company = ?`);
            values.push(company);
        }

        // Add filters to base query
        if (filters.length) {
            baseQuery += ` AND ${filters.join(" AND ")}`;
        }

        // Count total
        const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;
        const countResult = await executeQuery(countQuery, values);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        // Data query
        const dataQuery = `
      SELECT ss.*, ed.company
      ${baseQuery}
      ORDER BY ss.generatedDate DESC
      LIMIT ? OFFSET ?
    `;

        const dataValues = [...values, parseInt(limit), offset];
        const salarySlips = await executeQuery(dataQuery, dataValues);

        res.status(200).json({
            success: true,
            message: "Salary slips fetched successfully",
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords,
                pageSize: parseInt(limit),
            },
            data: salarySlips,
        });
    } catch (error) {
        console.error("Error fetching salary slips:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch salary slips",
            error: error.message,
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

//download salary slip excel file
export const downloadSalarySlipsExcel = async (req, res) => {
    try {
        const salarySlips = await executeQuery("SELECT * FROM salary_slips");

        if (salarySlips.length === 0) {
            return res.status(404).json({
                message: "No Salary Slips found"
            });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Salary Slip List");

        worksheet.columns = [
            { header: "ID", key: "id", width: 8 },
            { header: "Emp Code", key: "empCode", width: 15 },
            { header: "Name", key: "name", width: 20 },
            { header: "Email", key: "email", width: 25 },
            { header: "Mobile", key: "mobileNumber", width: 15 },
            { header: "Department", key: "department", width: 20 },
            { header: "PF Number", key: "pfNumber", width: 20 },
            { header: "ESI Number", key: "esiNumber", width: 20 },
            { header: "Bank Name", key: "bankName", width: 20 },
            { header: "Account Number", key: "accountNumber", width: 20 },
            { header: "PAN", key: "panNumber", width: 15 },
            { header: "Date of Joining", key: "dateOfJoining", width: 15 },
            { header: "Basic Salary", key: "basicSalary", width: 15 },
            { header: "CTC", key: "ctc", width: 12 },
            { header: "Basic Payment", key: "basicPayment", width: 15 },
            { header: "HRA", key: "houseRentAllowance", width: 15 },
            { header: "Conveyance", key: "conveyanceAllowance", width: 15 },
            { header: "Medical Allowance", key: "medicalAllowance", width: 15 },
            { header: "Special Allowance", key: "specialAllowance", width: 15 },
            { header: "Overtime Allowance", key: "overtimeAllowance", width: 15 },
            { header: "Additional Allowance", key: "additionalAllowance", width: 15 },
            { header: "Professional Tax", key: "professionalTax", width: 15 },
            { header: "TDS", key: "tds", width: 10 },
            { header: "Employee PF", key: "employeePfAmount", width: 15 },
            { header: "ESi Contribution", key: "esiAmount", width: 15 },
            { header: "Advance Salary", key: "advanceSalary", width: 15 },
            { header: "Leave Dedcuction Amount", key: "leaveDeductionAmount", width: 15 },
            { header: "Days in Month", key: "daysInMonth", width: 15 },
            { header: "Absent Days", key: "absentDays", width: 15 },
            { header: "Present Days", key: "presentDays", width: 15 },
            { header: "Absent Days in Month", key: "absentDaysInMonth", width: 20 },
            { header: "Leave Balance Opening", key: "leaveBalanceOpening", width: 20 },
            { header: "Leave Taken", key: "leaveTakenInMonth", width: 15 },
            { header: "Leave Balance Closing", key: "leaveBalanceClosing", width: 20 },
            { header: "Transaction Id", key: "transactionId", width: 20 },
            { header: "Pay Slip Month", key: "paySlipMonth", width: 15 },
            { header: "Generated Date", key: "generatedDate", width: 20 },
            { header: "Loan Opening Balance", key: "loanOpeningBalance", width: 20 },
            { header: "Loan Deduction", key: "loanDeductionCurrentMonth", width: 20 },
            { header: "Loan Balance", key: "loanBalance", width: 15 },
            { header: "Gross Salary", key: "grossSalary", width: 15 },
            { header: "Other Benefits", key: "otherBenefits", width: 15 },
            { header: "Gross with Benefits", key: "grossSalaryWithBenefits", width: 20 },
            { header: "Total Deduction", key: "totalDeduction", width: 15 },
            { header: "Net Pay", key: "netPay", width: 15 },
            { header: "Net Pay In Words", key: "netPayInWords", width: 30 }
        ];

        salarySlips.forEach((slip) => {
            worksheet.addRow(slip);
        });

        const fileName = `salary_slips_list.xlsx`;
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Length", buffer.length);

        return res.send(buffer);
    } catch (error) {
        console.error("Failed to generate Salary slip list Excel file:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate Salary slip list Excel file" });
        }
    }
};