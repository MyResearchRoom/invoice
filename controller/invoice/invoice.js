import { executeQuery } from '../../config/db.js';





// export const createInvoice = async (req, res) => {
//     const {
//         invoice_number,
//         client_name,
//         client_phone,
//         client_email,
//         gst_no,
//         client_address,
//         pin_code,
//         total_amount,
//         cgst,
//         sgst,
//         discount,
//         total_payable_amount,
//         total_payable_amount_in_words,
//         department,
//         invoice_date,
//         due_days,
//         items // Expecting an array of invoice items from frontend
//     } = req.body;

//     console.log(items);

//     console.log('📦 Full Request Body:', req.body);

//     // Handling signature file
//     const signature = req.file ? req.file.buffer : null;
//     const signatureContentType = req.file ? req.file.mimetype : null;

//     if (!invoice_number || !client_name || !client_phone || !client_email || !items || items.length === 0) {
//         return res.status(400).json({ message: 'Missing required fields or empty items list' });
//     }

//     try {
//         // Insert into Invoice table
//         const invoiceQuery = `
//             INSERT INTO Invoice 
//             (invoice_number, client_name, client_phone, client_email, gst_no, client_address, pin_code, 
//             total_amount, cgst,sgst, discount, total_payable_amount,total_payable_amount_in_words, department, invoice_date,due_days, signature, signature_content_type)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)`;

//         const invoiceValues = [
//             invoice_number, client_name, client_phone, client_email, gst_no, client_address, pin_code,
//             total_amount, cgst,sgst, discount, total_payable_amount,total_payable_amount_in_words, department, invoice_date,due_days, signature, signatureContentType
//         ];

//         const result = await executeQuery(invoiceQuery, invoiceValues);
//         const invoiceId = result.insertId; // Get the newly created invoice ID

//         // Insert multiple items into InvoiceItems table
//         const itemQuery = `
//             INSERT INTO InvoiceItems (invoice_id, productCode, description, price, quantity, productTotalAmt) 
//             VALUES ?`;

//         const itemValues = JSON.parse(items).map(item => [
//             invoiceId,
//             item.productCode,
//             item.description,
//             item.price,
//             item.quantity,
//             item.productTotalAmt
//         ]);

//         await executeQuery(itemQuery, [itemValues]);

//         res.status(201).json({ message: 'Invoice created successfully!', invoiceId });
//     } catch (error) {
//         console.error('Error creating invoice:', error);
//         res.status(500).json({ message: 'Server error', error });
//     }
// };




export const createInvoice = async (req, res) => {
    const {
        client_name,
        client_phone,
        client_email,
        gst_no,
        client_address,
        pin_code,
        total_amount,
        cgst,
        sgst,
        discount,
        total_payable_amount,
        total_payable_amount_in_words,
        department,
        invoice_date,
        due_days,
        items // Expecting an array of invoice items from frontend
    } = req.body;

    console.log('📦 Full Request Body:', req.body);

    const signature = req.file ? req.file.buffer : null;
    const signatureContentType = req.file ? req.file.mimetype : null;

    if (!client_name || !client_phone || !client_email || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields or empty items list' });
    }

    try {
        // Utility: Format date to YYYYMM
        const formatDateToYYYYMM = (dateStr) => {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}${month}`;
        };

        // Utility: Map department to prefix
        const getPrefix = (department) => {
            const map = {
                wesolutize: 'WES',
                myresearchroom: 'MRR'
            };
            return map[department.toLowerCase()] || 'INV';
        };

        // Step 1: Prepare prefix and date segment
        const prefix = getPrefix(department);
        const yyyymm = formatDateToYYYYMM(invoice_date);
        const invoicePrefix = `${prefix}-${yyyymm}`;

        // Step 2: Find last invoice for this prefix
        const lastInvoiceQuery = `
            SELECT invoice_number FROM invoice
            WHERE invoice_number LIKE '${invoicePrefix}-%'
            ORDER BY id DESC
            LIMIT 1
        `;
        const lastInvoice = await executeQuery(lastInvoiceQuery);

        let nextNumber = 1;
        if (lastInvoice.length > 0) {
            const lastNumPart = lastInvoice[0].invoice_number.split('-')[2];
            const lastNum = parseInt(lastNumPart);
            nextNumber = lastNum + 1;
        }

        // Step 3: Generate new invoice number
        const invoice_number = `${invoicePrefix}-${String(nextNumber).padStart(4, '0')}`;

        // Step 4: Insert Invoice
        const invoiceQuery = `
            INSERT INTO invoice 
            (invoice_number, client_name, client_phone, client_email, gst_no, client_address, pin_code, 
            total_amount, cgst, sgst, discount, total_payable_amount, total_payable_amount_in_words, 
            department, invoice_date, due_days, signature, signature_content_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const invoiceValues = [
            invoice_number, client_name, client_phone, client_email, gst_no, client_address, pin_code,
            total_amount, cgst, sgst, discount, total_payable_amount, total_payable_amount_in_words,
            department, invoice_date, due_days, signature, signatureContentType
        ];

        const result = await executeQuery(invoiceQuery, invoiceValues);
        const invoiceId = result.insertId;

        // Step 5: Insert Invoice Items
        const itemQuery = `
            INSERT INTO invoiceitems (invoice_id, productCode, description, price, quantity, productTotalAmt) 
            VALUES ?
        `;

        const itemValues = JSON.parse(items).map(item => [
            invoiceId,
            item.productCode,
            item.description,
            item.price,
            item.quantity,
            item.productTotalAmt
        ]);

        await executeQuery(itemQuery, [itemValues]);

        res.status(201).json({ message: 'Invoice created successfully!', invoiceId, invoice_number });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};




export const getInvoices = async (req, res) => {
    try {
        const { invoice_number, invoice_date } = req.query;

        let query = "SELECT id, invoice_number, DATE_FORMAT(CONVERT_TZ(invoice_date, '+00:00', '+05:30'), '%Y-%m-%d') AS invoice_date FROM invoice";
        let params = [];

        if (invoice_number || invoice_date) {
            query += " WHERE 1=1";

            if (invoice_number) {
                query += " AND invoice_number = ?";
                params.push(invoice_number);
            }

            if (invoice_date) {
                query += " AND DATE(CONVERT_TZ(invoice_date, '+00:00', '+05:30')) = ?";
                params.push(invoice_date);
            }
        }

        const invoices = await executeQuery(query, params);

        if (invoices.length === 0) {
            return res.status(404).json({ message: "No invoices found" });
        }

        res.status(200).json({ success: true, data: invoices });
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};








export const getFilteredInvoices = async (req, res) => {
    const { invoice_date, department, start_date, end_date, page = 1, limit = 10 } = req.query;

    try {
        let sql = `
            SELECT id, invoice_number, client_name, 
            DATE_FORMAT(CONVERT_TZ(invoice_date, '+00:00', '+05:30'), '%Y-%m-%d') AS invoice_date, 
            department 
            FROM invoice
        `;
        const params = [];
        const conditions = [];

        if (invoice_date) {
            conditions.push('DATE(CONVERT_TZ(invoice_date, "+00:00", "+05:30")) = ?');
            params.push(invoice_date);
        }

        if (start_date && end_date) {
            conditions.push('DATE(CONVERT_TZ(invoice_date, "+00:00", "+05:30")) BETWEEN ? AND ?');
            params.push(start_date, end_date);
        }

        if (department) {
            conditions.push('department = ?');
            params.push(department);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        sql += ' ORDER BY invoice_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        // Fetch invoices
        const invoices = await executeQuery(sql, params);

        // Fetch total count
        let countSql = `SELECT COUNT(*) AS total FROM invoice`;
        if (conditions.length > 0) {
            countSql += ' WHERE ' + conditions.join(' AND ');
        }
        const totalResult = await executeQuery(countSql, params.slice(0, -2)); // Exclude LIMIT & OFFSET params
        const total = totalResult[0].total;
        const totalPages = Math.ceil(total / parseInt(limit));

        // Determine next & previous page
        const nextPage = parseInt(page) < totalPages ? parseInt(page) + 1 : null;
        const prevPage = parseInt(page) > 1 ? parseInt(page) - 1 : null;

        // Send response
        res.status(200).json({
            totalRecords: total,
            currentPage: parseInt(page),
            totalPages,
            nextPage,
            prevPage,
            invoices,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices', error });
    }
};







export const getInvoiceByNumber = async (req, res) => {
    const { invoice_number } = req.params;

    try {
        let sql = `
            SELECT invoice_number, department, client_name, client_phone, client_address, gst_no, 
                   DATE_FORMAT(CONVERT_TZ(invoice_date, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') AS invoice_date, 
                   total_amount, discount, total_payable_amount, total_payable_amount_in_words, 
                   cgst, sgst, due_days, signature, signature_content_type
            FROM invoice
            WHERE invoice_number = ?`;

        const invoiceResult = await executeQuery(sql, [invoice_number]);

        if (invoiceResult.length === 0) {
            return res.status(404).json({ message: 'No invoices found matching the criteria' });
        }

        // Fetch Invoice Items for each invoice
        const itemsSql = `
            SELECT productCode, description, price, quantity, productTotalAmt
            FROM invoiceitems 
            WHERE invoice_id = (SELECT id FROM invoice WHERE invoice_number = ?)`;

        const itemsResult = await executeQuery(itemsSql, [invoice_number]);

        // Attach items to the invoice
        invoiceResult[0].items = itemsResult;

        res.status(200).json(invoiceResult[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice', error });
    }
};







export const getInvoiceCountByDepartment = async (req, res) => {
    try {
        const query = `
            SELECT 
                SUM(CASE WHEN LOWER(department) = 'wesolutize' THEN 1 ELSE 0 END) AS wesolutize_count,
                SUM(CASE WHEN LOWER(department) = 'myresearchroom' THEN 1 ELSE 0 END) AS myresearchroom_count
            FROM invoice
        `;

        const result = await executeQuery(query);

        res.status(200).json(result[0] || { wesolutize_count: 0, myresearchroom_count: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice counts', error });
    }
};






//used in receipts
export const getInvoiceDetailsByInvoiceNumber = async (req, res) => {
    const { invoice_number } = req.params;

    try {
        const invoiceSql = `
      SELECT id, invoice_number, department, client_name, client_phone, client_email, client_address, pin_code, gst_no, 
             DATE_FORMAT(CONVERT_TZ(invoice_date, '+00:00', '+05:30'), '%Y-%m-%d') AS invoice_date, 
             total_amount, discount, total_payable_amount, total_payable_amount_in_words, 
             cgst, sgst, due_days, signature, signature_content_type
      FROM invoice
      WHERE invoice_number = ?`;

        const invoiceResult = await executeQuery(invoiceSql, [invoice_number]);

        if (invoiceResult.length === 0) {
            return res.status(404).json({ message: 'No invoices found matching the criteria' });
        }

        const invoice = invoiceResult[0];

        const itemsSql = `
      SELECT productCode, description, price, quantity, productTotalAmt
      FROM invoiceitems 
      WHERE invoice_id = ?`;

        const items = await executeQuery(itemsSql, [invoice.id]);

        const receiptSql = `
      SELECT SUM(amount_received) AS total_received
      FROM receipts
      WHERE invoice_id = ?`;

        const receiptResult = await executeQuery(receiptSql, [invoice.id]);

        const totalReceived = receiptResult[0].total_received || 0;
        const remainingBalance = Number(invoice.total_payable_amount) - totalReceived;

        invoice.items = items;
        invoice.total_received = totalReceived;
        invoice.remaining_balance = remainingBalance;

        res.status(200).json(invoice);
    } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({ message: 'Error fetching invoice', error });
    }
};
