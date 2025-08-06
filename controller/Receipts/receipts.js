import ExcelJS from 'exceljs';
import { executeQuery } from '../../config/db.js';

import numberToWords from 'number-to-words';
const { toWords } = numberToWords;


// Add Receipt
// export const addReceipt = async (req, res) => {
//     const {
//         invoice_number,
//         milestone_name,
//         amount_received,
//         payment_mode,
//         transaction_ref,
//         authorized_by
//     } = req.body;

//     try {
//         // Get invoice details by invoice_number
//         const invoiceData = await executeQuery(
//             'SELECT id, total_payable_amount FROM invoice WHERE invoice_number = ?',
//             [invoice_number]
//         );
//         if (invoiceData.length === 0) {
//             return res.status(404).json({ message: 'Invoice not found' });
//         }

//         const invoice = invoiceData[0];
//         const invoice_id = invoice.id;

//         // Get total amount received so far
//         const totalRow = await executeQuery(
//             'SELECT COALESCE(SUM(amount_received), 0) as total FROM receipts WHERE invoice_id = ?',
//             [invoice_id]
//         );
//         const totalSoFarBefore = parseFloat(totalRow[0].total);

//         // Prevent further receipts if total received >= total payable
//         if (totalSoFarBefore >= parseFloat(invoice.total_payable_amount)) {
//             return res.status(400).json({ message: 'All payments completed for this invoice.' });
//         }

//         const totalSoFar = totalSoFarBefore + parseFloat(amount_received);
//         const balance = parseFloat(invoice.total_payable_amount) - totalSoFar;

//         // Generate next receipt number
//         const lastRow = await executeQuery(
//             'SELECT receipt_number FROM receipts ORDER BY id DESC LIMIT 1'
//         );
//         let newNumber = 1;
//         if (lastRow.length > 0) {
//             const match = lastRow[0].receipt_number.match(/RCPT-(\d+)/);
//             if (match) newNumber = parseInt(match[1]) + 1;
//         }

//         const receipt_number = `RCPT-${String(newNumber).padStart(5, '0')}`;
//         const amount_in_words = toWords(parseInt(amount_received)) + ' Rupees Only';

//         await executeQuery(
//             `INSERT INTO receipts (
//         invoice_id, receipt_number, receipt_date, milestone_name,
//         amount_received, total_received_so_far, balance_remaining,
//         amount_in_words, payment_mode, transaction_ref, authorized_by
//       ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 invoice_id, receipt_number, milestone_name,
//                 amount_received, totalSoFar, balance,
//                 amount_in_words, payment_mode, transaction_ref, authorized_by
//             ]
//         );

//         res.status(201).json({
//             message: 'Receipt added successfully',
//             receipt_number,
//             balance_remaining: balance <= 0 ? 0 : balance
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

//main add receipt api includes auto generated reciept number ex- MRR20250700001
export const addReceipt = async (req, res) => {
    const {
        invoice_number,
        milestone_name,
        amount_received,
        payment_mode,
        transaction_ref,
        authorized_by
    } = req.body;

    try {
        // Get invoice details by invoice_number
        const invoiceData = await executeQuery(
            'SELECT id, total_payable_amount FROM invoice WHERE invoice_number = ?',
            [invoice_number]
        );
        if (invoiceData.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoice = invoiceData[0];
        const invoice_id = invoice.id;

        // Get total amount received so far
        const totalRow = await executeQuery(
            'SELECT COALESCE(SUM(amount_received), 0) as total FROM receipts WHERE invoice_id = ?',
            [invoice_id]
        );
        const totalSoFarBefore = parseFloat(totalRow[0].total);

        // Prevent further receipts if total received >= total payable
        if (totalSoFarBefore >= parseFloat(invoice.total_payable_amount)) {
            return res.status(400).json({ message: 'All payments completed for this invoice.' });
        }

        const totalSoFar = totalSoFarBefore + parseFloat(amount_received);
        const balance = parseFloat(invoice.total_payable_amount) - totalSoFar;

        // ========= ✅ Generate Custom Receipt Number =========
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");

        // Extract company prefix from invoice_number (e.g., MRR or WES)
        const companyPrefix = invoice_number.split("-")[0];
        const basePrefix = `${companyPrefix}-${year}${month}`; // MRR-202507

        // Get the last receipt for this invoice_id using that base prefix
        const lastReceiptRow = await executeQuery(
            `SELECT receipt_number FROM receipts 
       WHERE invoice_id = ? AND receipt_number LIKE ? 
       ORDER BY id DESC LIMIT 1`,
            [invoice_id, `${basePrefix}%`]
        );

        let newCounter = 1;
        if (lastReceiptRow.length > 0) {
            const lastReceiptNumber = lastReceiptRow[0].receipt_number;
            const match = lastReceiptNumber.match(/(\d{4})$/);
            if (match) {
                newCounter = parseInt(match[1], 10) + 1;
            }
        }

        const formattedCounter = String(newCounter).padStart(4, "0");
        const receipt_number = `${basePrefix}${formattedCounter}`;
        // ================================================

        const amount_in_words = toWords(parseInt(amount_received)) + ' Rupees Only';

        await executeQuery(
            `INSERT INTO receipts (
        invoice_id, receipt_number, receipt_date, milestone_name,
        amount_received, total_received_so_far, balance_remaining,
        amount_in_words, payment_mode, transaction_ref, authorized_by
      ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice_id, receipt_number, milestone_name,
                amount_received, totalSoFar, balance,
                amount_in_words, payment_mode, transaction_ref, authorized_by
            ]
        );

        res.status(201).json({
            message: 'Receipt added successfully',
            receipt_number,
            balance_remaining: balance <= 0 ? 0 : balance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};


//get all receipts
export const getAllReceipts = async (req, res) => {
    const { invoice_number = '', client_name = '' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const countQuery = `
      SELECT COUNT(*) AS total
      FROM receipts r
      JOIN invoice i ON r.invoice_id = i.id
      WHERE i.invoice_number LIKE ? AND i.client_name LIKE ?
    `;
        const countParams = [`%${invoice_number}%`, `%${client_name}%`];
        const countResult = await executeQuery(countQuery, countParams);

        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        const dataQuery = `
      SELECT 
        r.id AS receipt_id,
        r.receipt_number,
        r.receipt_date,
        r.milestone_name,
        r.amount_received,
        r.total_received_so_far,
        r.balance_remaining, 
        r.payment_mode,
        r.transaction_ref,
        i.invoice_number,
        i.client_name,
        i.client_phone,
        i.client_email,
        i.gst_no,
        i.total_payable_amount
      FROM receipts r
      JOIN invoice i ON r.invoice_id = i.id
      WHERE i.invoice_number LIKE ? AND i.client_name LIKE ?
      ORDER BY r.receipt_date DESC
      LIMIT ? OFFSET ?
    `;
        const dataParams = [...countParams, limit, offset];
        const receipts = await executeQuery(dataQuery, dataParams);

        res.status(200).json({
            receipts,
            currentPage: page,
            totalPages,
            totalRecords,
            pageLimit: limit
        });

    } catch (error) {
        console.error("Error fetching filtered receipts:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};




// Get Receipts by Invoice ID
export const getReceiptsByInvoiceNumber = async (req, res) => {
    const invoiceNumber = req.params.invoiceNumber;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // Step 1: Get invoice with client info
        const invoiceData = await executeQuery(
            `SELECT 
        id, invoice_number, client_name, client_phone, client_email, 
        total_payable_amount 
       FROM invoice 
       WHERE invoice_number = ?`,
            [invoiceNumber]
        );

        if (invoiceData.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoice = invoiceData[0];
        const invoiceId = invoice.id;

        // Step 2: Count total receipts for pagination
        const countRows = await executeQuery(
            'SELECT COUNT(*) as total FROM receipts WHERE invoice_id = ?',
            [invoiceId]
        );
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Step 3: Fetch paginated receipts
        const receipts = await executeQuery(
            'SELECT * FROM receipts WHERE invoice_id = ? ORDER BY receipt_date DESC LIMIT ? OFFSET ?',
            [invoiceId, limit, offset]
        );

        res.json({
            invoice: {
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                client_name: invoice.client_name,
                client_phone: invoice.client_phone,
                client_email: invoice.client_email,
                total_payable_amount: invoice.total_payable_amount
            },
            pagination: {
                page,
                limit,
                total,
                totalPages
            },
            receipts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};


// Get Receipts by Client Name
export const getReceiptsByClient = async (req, res) => {
    const clientName = req.query.client_name;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!clientName) return res.status(400).json({ message: 'client_name is required' });

    try {
        const countRows = await executeQuery(
            `SELECT COUNT(*) AS total
       FROM receipts r
       JOIN invoice i ON r.invoice_id = i.id
       WHERE i.client_name = ?`,
            [clientName]
        );
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        const receipts = await executeQuery(
            `SELECT r.*, i.invoice_number, i.client_name, i.total_payable_amount
       FROM receipts r
       JOIN invoice i ON r.invoice_id = i.id
       WHERE i.client_name = ?
       ORDER BY r.receipt_date DESC
       LIMIT ? OFFSET ?`,
            [clientName, limit, offset]
        );

        res.json({
            client_name: clientName,
            pagination: { page, limit, total, totalPages },
            receipts
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


// Update Receipt
export const updateReceipt = async (req, res) => {
    const receiptId = req.params.receiptId;
    const {
        milestone_name,
        amount_received,
        payment_mode,
        transaction_ref,
        authorized_by
    } = req.body;

    try {
        const existing = await executeQuery('SELECT * FROM receipts WHERE id = ?', [receiptId]);
        if (existing.length === 0) return res.status(404).json({ message: 'Receipt not found' });

        await executeQuery(
            `UPDATE receipts SET 
        milestone_name = ?, 
        amount_received = ?, 
        payment_mode = ?, 
        transaction_ref = ?, 
        authorized_by = ?, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
            [milestone_name, amount_received, payment_mode, transaction_ref, authorized_by, receiptId]
        );

        res.json({ message: 'Receipt updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete Receipt
export const deleteReceipt = async (req, res) => {
    const receiptId = req.params.receiptId;
    try {
        await executeQuery('DELETE FROM receipts WHERE id = ?', [receiptId]);
        res.json({ message: 'Receipt deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

//download receipts list excel
export const downloadReceiptListExcel = async (req, res) => {
    const { invoice_number = '', client_name = '' } = req.query;

    try {
        const dataQuery = `
      SELECT 
        i.invoice_number,
        i.client_name,
        i.client_phone,
        i.client_email,
        i.gst_no,
        i.total_payable_amount,
        r.id AS receipt_id,
        r.receipt_number,
        r.receipt_date,
        r.milestone_name,
        r.amount_received,
        r.total_received_so_far,
        r.balance_remaining, 
        r.payment_mode,
        r.transaction_ref
      FROM receipts r
      JOIN invoice i ON r.invoice_id = i.id
      WHERE i.invoice_number LIKE ? AND i.client_name LIKE ?
      ORDER BY r.receipt_date DESC
    `;

        const dataParams = [`%${invoice_number}%`, `%${client_name}%`];
        const receipts = await executeQuery(dataQuery, dataParams);

        if (receipts.length === 0) {
            return res.status(404).json({ message: "No receipts found." });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Receipt List");

        worksheet.columns = [
            { header: "Receipt No", key: "receipt_number", width: 15 },
            { header: "Receipt Date", key: "receipt_date", width: 15 },
            { header: "Milestone", key: "milestone_name", width: 20 },
            { header: "Amount Received", key: "amount_received", width: 18 },
            { header: "Total Received So Far", key: "total_received_so_far", width: 22 },
            { header: "Balance Remaining", key: "balance_remaining", width: 20 },
            { header: "Payment Mode", key: "payment_mode", width: 15 },
            { header: "Transaction Ref", key: "transaction_ref", width: 20 },
            { header: "Invoice No", key: "invoice_number", width: 15 },
            { header: "Client Name", key: "client_name", width: 20 },
            { header: "Client Phone", key: "client_phone", width: 15 },
            { header: "Client Email", key: "client_email", width: 25 },
            { header: "GST No", key: "gst_no", width: 20 },
            { header: "Total Payable Amount", key: "total_payable_amount", width: 20 }
        ];

        receipts.forEach((receipt) => {
            worksheet.addRow(receipt);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `receipt_list.xlsx`;

        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Length", buffer.length);

        return res.send(buffer);
    } catch (error) {
        console.error("Error generating receipt Excel:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate receipt list Excel file" });
        }
    }
};
