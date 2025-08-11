import ExcelJS from 'exceljs';
import { executeQuery } from '../../config/db.js';


export const addEmployeeDetails = async (req, res) => {
    try {
        const {
            empCode,
            name,
            email,
            mobileNumber,
            company,
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
            esiAmount,
            advanceSalary,
        } = req.body;

        const grossSalary = parseFloat(basicPayment) + parseFloat(houseRentAllowance) + parseFloat(conveyanceAllowance) + parseFloat(medicalAllowance) + parseFloat(specialAllowance);
        const otherBenefits = parseFloat(overtimeAllowance) + parseFloat(additionalAllowance);
        const grossSalaryWithBenefits = parseFloat(grossSalary) + parseFloat(otherBenefits);
        const totalDeduction = parseFloat(professionalTax) + parseFloat(tds) + parseFloat(employeePfAmount) + parseFloat(esiAmount) + parseFloat(advanceSalary);
        const netPay = parseFloat(grossSalaryWithBenefits) - parseFloat(totalDeduction);


        await executeQuery(
            `INSERT INTO employee_details (
        empCode, name, email, mobileNumber, company, department, pfNumber, esiNumber, 
        bankName, accountNumber, panNumber, dateOfJoining, basicSalary, ctc,
        basicPayment, houseRentAllowance, conveyanceAllowance, medicalAllowance, 
        specialAllowance, overtimeAllowance, additionalAllowance,
        professionalTax, tds, employeePfAmount, esiAmount, advanceSalary, grossSalary, otherBenefits, grossSalaryWithBenefits, totalDeduction, netPay
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empCode, name, email, mobileNumber, company, department,
                pfNumber, esiNumber, bankName, accountNumber, panNumber,
                dateOfJoining, basicSalary, ctc,
                basicPayment, houseRentAllowance, conveyanceAllowance, medicalAllowance,
                specialAllowance, overtimeAllowance, additionalAllowance,
                professionalTax, tds, employeePfAmount, esiAmount, advanceSalary, grossSalary, otherBenefits, grossSalaryWithBenefits, totalDeduction, netPay
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let result, countResult;

        if (empCode) {
            countResult = await executeQuery(
                `SELECT * FROM employee_details WHERE empCode = ?`,
                [empCode]
            );

            result = await executeQuery(
                `SELECT * FROM employee_details WHERE empCode = ? LIMIT ? OFFSET ?`,
                [empCode, limit, offset]
            );

        } else {
            countResult = await executeQuery(`SELECT COUNT(*) AS total FROM employee_details`);
            result = await executeQuery(
                `SELECT * FROM employee_details LIMIT ? OFFSET ?`,
                [limit, offset]
            );
        }

        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);


        return res.status(200).json({
            success: true,
            message: empCode ? "Employee Details fetched successfully" : "Employee list fetched successfully",
            data: result,
            pagination: {
                page,
                limit,
                totalRecords,
                totalPages,
            },
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

// export const editEmployeeDetails = async (req, res) => {
//     try {

//         const { id } = req.params;

//         if (!id) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'ID is required.',
//             });
//         }

//         const {
//             empCode,
//             name,
//             email,
//             mobileNumber,
//             company,
//             department,
//             pfNumber,
//             esiNumber,
//             bankName,
//             accountNumber,
//             panNumber,
//             dateOfJoining,
//             basicSalary,
//             ctc,
//             basicPayment,
//             houseRentAllowance,
//             conveyanceAllowance,
//             medicalAllowance,
//             specialAllowance,
//             overtimeAllowance,
//             additionalAllowance,
//             professionalTax,
//             tds,
//             employeePfAmount,
//             advanceSalary
//         } = req.body;

//         const result = await executeQuery(
//             `UPDATE employee_details SET 
//         empCode = ?, name = ?, email = ?, mobileNumber = ?, company = ?, department = ?, 
//         pfNumber = ?, esiNumber = ?, bankName = ?, accountNumber = ?, panNumber = ?, dateOfJoining = ?, 
//         basicSalary = ?, ctc = ?, basicPayment = ?, houseRentAllowance = ?, 
//         conveyanceAllowance = ?, medicalAllowance = ?, specialAllowance = ?, overtimeAllowance = ?, 
//         additionalAllowance = ?, professionalTax = ?, tds = ?, employeePfAmount = ?, advanceSalary = ?
//       WHERE id = ?`,
//             [
//                 empCode, name, email, mobileNumber, company, department,
//                 pfNumber, esiNumber, bankName, accountNumber, panNumber, dateOfJoining,
//                 basicSalary, ctc, basicPayment, houseRentAllowance, conveyanceAllowance,
//                 medicalAllowance, specialAllowance, overtimeAllowance, additionalAllowance,
//                 professionalTax, tds, employeePfAmount, advanceSalary,
//                 id
//             ]
//         );

//         const updatedData = await executeQuery(
//             `SELECT * FROM employee_details WHERE id = ?`,
//             [id]
//         );

//         res.status(200).json({
//             success: true,
//             message: "Employee details updated successfully",
//             data: updatedData
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to update employee",
//             error: error.message
//         });
//     }
// };

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
            company,
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
            esiAmount,
            advanceSalary,
        } = req.body;

        // Recalculate salaries
        const grossSalary = parseFloat(basicPayment) + parseFloat(houseRentAllowance) + parseFloat(conveyanceAllowance) + parseFloat(medicalAllowance) + parseFloat(specialAllowance);
        const otherBenefits = parseFloat(overtimeAllowance) + parseFloat(additionalAllowance);
        const grossSalaryWithBenefits = parseFloat(grossSalary) + parseFloat(otherBenefits);
        const totalDeduction = parseFloat(professionalTax) + parseFloat(tds) + parseFloat(employeePfAmount) + parseFloat(esiAmount) + parseFloat(advanceSalary);
        const netPay = parseFloat(grossSalaryWithBenefits) - parseFloat(totalDeduction);

        const result = await executeQuery(
            `UPDATE employee_details SET
            empCode = ?, name = ?, email = ?, mobileNumber = ?, company = ?, department = ?,
            pfNumber = ?, esiNumber = ?, bankName = ?, accountNumber = ?, panNumber = ?, dateOfJoining = ?,
            basicSalary = ?, ctc = ?, basicPayment = ?, houseRentAllowance = ?,
            conveyanceAllowance = ?, medicalAllowance = ?, specialAllowance = ?, overtimeAllowance = ?,
            additionalAllowance = ?, professionalTax = ?, tds = ?, employeePfAmount = ?, esiAmount = ?, advanceSalary = ?,
            grossSalary = ?, otherBenefits = ?, grossSalaryWithBenefits = ?, totalDeduction = ?, netPay = ?
            WHERE id = ?`,
            [
                empCode, name, email, mobileNumber, company, department,
                pfNumber, esiNumber, bankName, accountNumber, panNumber, dateOfJoining,
                basicSalary, ctc, basicPayment, houseRentAllowance, conveyanceAllowance,
                medicalAllowance, specialAllowance, overtimeAllowance, additionalAllowance,
                professionalTax, tds, employeePfAmount, esiAmount, advanceSalary,
                grossSalary, otherBenefits, grossSalaryWithBenefits, totalDeduction, netPay,
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
            data: {
                ...updatedData[0],
                grossSalary,
                otherBenefits,
                grossSalaryWithBenefits,
                totalDeduction,
                netPay
            }
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

//download employee list excel
export const downloadEmployeeListExcel = async (req, res) => {
    try {
        const employees = await executeQuery("SELECT * FROM employee_details");

        if (employees.length === 0) {
            return res.status(404).json({
                message: "No employees found"
            });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Employee List");

        worksheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Employee Code", key: "empCode", width: 15 },
            { header: "Name", key: "name", width: 20 },
            { header: "Email", key: "email", width: 20 },
            { header: "Mobile Number", key: "mobileNumber", width: 20 },
            { header: "Company", key: "company", width: 20 },
            { header: "Department", key: "department", width: 20 },
            { header: "PF Number", key: "pfNumber", width: 20 },
            { header: "ESI Number", key: "esiNumber", width: 20 },
            { header: "Bank Name", key: "bankName", width: 20 },
            { header: "Account Number", key: "accountNumber", width: 20 },
            { header: "Date of Joining", key: "dateOfJoining", width: 20 },
            { header: "Basic Salary", key: "basicSalary", width: 20 },
            { header: "CTC", key: "ctc", width: 20 },
            { header: "Basic Payment", key: "basicPayment", width: 20 },
            { header: "House Rent Allowance", key: "houseRentAllowance", width: 20 },
            { header: "Conveyance Allowance", key: "conveyanceAllowance", width: 20 },
            { header: "Medical Allowance", key: "medicalAllowance", width: 20 },
            { header: "Special Allowance", key: "specialAllowance", width: 20 },
            { header: "Overtime Allowance", key: "overtimeAllowance", width: 20 },
            { header: "Additional Allowance", key: "additionalAllowance", width: 20 },
            { header: "Professional Tax", key: "professionaltax", width: 20 },
            { header: "TDS", key: "tds", width: 20 },
            { header: "Employee PF contribution Amount", key: "employeePfAmount", width: 20 },
            { header: "ESI contribution ", key: "esiAmount", width: 20 },
            { header: "Advance Salary", key: "advanceSalary", width: 20 },
            { header: "Gross Salary", key: "grossSalary", width: 20 },
            { header: "Other Benefits", key: "otherBenefits", width: 20 },
            { header: "Gross salary with Benefits", key: "grossSalaryWithBenefits", width: 20 },
            { header: "Total Deduction", key: "totalDeduction", width: 20 },
            { header: "Net Pay", key: "netPay", width: 20 },
        ];

        employees.forEach((employee) => {
            worksheet.addRow(employee);
        });

        const fileName = `employee_list.xlsx`;
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Length", buffer.length);

        return res.send(buffer);
    } catch (error) {
        console.error("Failed to generate employee list Excel file:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate employee list Excel file" });
        }
    }
};