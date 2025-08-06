import { executeQuery } from "../config/db.js";
import ExcelJS from "exceljs";

// ✅ Generate Receipt Number: MRR-YYYYMM00001
const generateReceiptNumber = async () => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const query = `SELECT COUNT(*) AS count FROM receipt2 WHERE receipt_number LIKE ?`;
  const result = await executeQuery(query, [`MRR-${yearMonth}%`]);
  const count = result[0].count + 1;

  return `MRR-${yearMonth}${String(count).padStart(5, '0')}`;
};

// ✅ Add a new receipt with auto genrated receipt_number Ex- MRR20250700001
export const oldaddReceipt = async (req, res) => {
  try {
    const {
      clientUniqueId,
      milestoneName,
      amountReceived,
      paymentMode,
      transactionRef,
      receiptDate
    } = req.body;

    // Fetch client by unique ID
    const clientResult = await executeQuery(
      "SELECT * FROM clients WHERE client_unique_id = ?",
      [clientUniqueId]
    );

    if (clientResult.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const client = clientResult[0];
    const receiptNumber = await generateReceiptNumber();

    const insertQuery = `
      INSERT INTO receipt2 (
        receipt_number, client_id, client_unique_id, client_name, mobile_number, email,
        gst_no, address, pin_code, milestone_name, amount_received,
        payment_mode, transaction_ref, receipt_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [
      receiptNumber,
      client.id,
      client.client_unique_id,
      client.client_name,
      client.client_contact_no,
      client.client_email,
      client.gst_number,
      client.client_address,
      client.pincode,
      milestoneName,
      amountReceived,
      paymentMode,
      transactionRef,
      receiptDate
    ]);

    res.status(201).json({ message: "Receipt created successfully", receiptNumber });
  } catch (error) {
    console.error("Error adding receipt:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//add receipt api without auto generated receipt number
export const oldaddReceiptNew = async (req, res) => {
  try {
    const {
      clientUniqueId,
      receipt_number,
      milestoneName,
      amountReceived,
      paymentMode,
      paymentType,
      transactionRef,
      receiptDate
    } = req.body;

    // Validate required fields
    if (
      !clientUniqueId || !receipt_number || !milestoneName ||
      !amountReceived || !paymentMode || !paymentType || !receiptDate
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for existing receipt_number
    const existing = await executeQuery(
      "SELECT id FROM receipt2 WHERE receipt_number = ?",
      [receipt_number]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Receipt number already exists." });
    }

    // Fetch client by unique ID
    const clientResult = await executeQuery(
      "SELECT * FROM clients WHERE client_unique_id = ?",
      [clientUniqueId]
    );

    if (clientResult.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const client = clientResult[0];

    // Insert into receipt2 table
    const insertQuery = `
      INSERT INTO receipt2 (
        receipt_number, client_id, client_unique_id, client_name, mobile_number, email,
        gst_no, address, pin_code, milestone_name, amount_received,
        payment_mode, payment_type, transaction_ref, receipt_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [
      receipt_number,
      client.id,
      client.client_unique_id,
      client.client_name,
      client.client_contact_no,
      client.client_email,
      client.gst_number,
      client.client_address,
      client.pincode,
      milestoneName,
      amountReceived,
      paymentMode,
      paymentType,
      transactionRef,
      receiptDate
    ]);

    res.status(201).json({
      message: "Receipt added successfully",
      receipt_number
    });

  } catch (error) {
    console.error("Error adding receipt:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};




export const oldgetAllReceipts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const clientUniqueId = req.query.clientUniqueId;
    const paymentType = req.query.paymentType;


    let baseQuery = "FROM receipt2";
    const conditions = [];
    const queryParams = [];
    const countParams = [];

    // Filter if clientUniqueId is present
    if (clientUniqueId) {
      conditions.push("client_unique_id = ?");
      queryParams.push(clientUniqueId.trim());
      countParams.push(clientUniqueId.trim());
    }

    if (paymentType) {
      conditions.push("payment_type = ?");
      queryParams.push(paymentType.trim());
      countParams.push(paymentType.trim());
    }

    const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

    // Fetch paginated receipts
    const receiptQuery = `SELECT * ${baseQuery}${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const finalReceiptParams = [...queryParams, limit, offset];
    const receipts = await executeQuery(receiptQuery, finalReceiptParams);

    // Get count and total amount
    const summaryQuery = `SELECT COUNT(*) AS totalCount, SUM(amount_received) AS totalAmount ${baseQuery}${whereClause}`;
    const summary = await executeQuery(summaryQuery, countParams);
    const totalCount = summary[0].totalCount || 0;
    const totalAmount = parseFloat(summary[0].totalAmount || 0);

    res.status(200).json({
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      totalAmountReceived: totalAmount,
      receipts
    });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const oldgetReceiptsByClient = async (req, res) => {
  const { clientUniqueId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const receipts = await executeQuery(
      "SELECT * FROM receipt2 WHERE client_unique_id = ? ORDER BY receipt_number DESC LIMIT ? OFFSET ?",
      [clientUniqueId, limit, offset]
    );

    if (receipts.length === 0) {
      return res.status(404).json({ message: "No receipts found for this client." });
    }

    const countResult = await executeQuery(
      "SELECT COUNT(*) AS count, SUM(amount_received) AS total FROM receipt2 WHERE client_unique_id = ?",
      [clientUniqueId]
    );

    const receiptCount = countResult[0].count;
    const totalAmountReceived = parseFloat(countResult[0].total || 0);

    res.status(200).json({
      page,
      limit,
      receiptCount,
      totalAmountReceived,
      receipts
    });
  } catch (error) {
    console.error("Error fetching client receipts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// get by ReceiptNumber add old recpit controller

export const getReceiptByNumber = async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    const results = await executeQuery(
      `SELECT * FROM receipt2 WHERE receipt_number = ?`,
      [receiptNumber]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteReceiptNew = async (req, res) => {
  try {
    const { receipt_number } = req.params;

    if (!receipt_number) {
      return res.status(400).json({ message: "Receipt number is required." });
    }

    const receipt = await executeQuery(
      "SELECT id FROM receipt2 WHERE receipt_number = ?",
      [receipt_number]
    );

    if (receipt.length === 0) {
      return res.status(404).json({ message: "Receipt not found." });
    }

    await executeQuery("DELETE FROM receipt2 WHERE receipt_number = ?", [receipt_number]);

    res.status(200).json({ message: "Receipt deleted successfully." })
  } catch (error) {
    console.error("Error deleting receipt:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const downloadReceiptsExcel = async (req, res) => {
  try {
    const { clientUniqueId } = req.query;

    let query = "SELECT * FROM receipt2";
    const params = [];

    if (clientUniqueId) {
      query += " WHERE client_unique_id = ?";
      params.push(clientUniqueId.trim());
    }

    query += " ORDER BY created_at DESC";

    const receipts = await executeQuery(query, params);

    if (clientUniqueId && receipts.length === 0) {
      return res.status(404).json({ message: "Enter a valid client unique ID" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Receipts");

    worksheet.columns = [
      { header: "Receipt No", key: "receipt_number", width: 20 },
      { header: "Client Unique ID", key: "client_unique_id", width: 20 },
      { header: "Client Name", key: "client_name", width: 25 },
      { header: "Mobile", key: "mobile_number", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "GST No", key: "gst_no", width: 20 },
      { header: "Address", key: "address", width: 30 },
      { header: "Pincode", key: "pin_code", width: 10 },
      { header: "Milestone", key: "milestone_name", width: 25 },
      { header: "Amount Received", key: "amount_received", width: 15 },
      { header: "Payment Mode", key: "payment_mode", width: 15 },
      { header: "Payment Type", key: "payment_type", width: 15 },
      { header: "Transaction Ref", key: "transaction_ref", width: 25 },
      { header: "Receipt Date", key: "receipt_date", width: 15 },
      { header: "Created At", key: "created_at", width: 20 }
    ];

    receipts.forEach((receipt) => {
      worksheet.addRow(receipt);
    });

    const fileName = `receipts_${clientUniqueId || "all"}.xlsx`;

    // ✅ Write to buffer first for safe binary output
    const buffer = await workbook.xlsx.writeBuffer();

    // ✅ Set proper headers
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer); // ✅ Ensure proper stream response
  } catch (error) {
    console.error("Error generating Excel:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate Excel file" });
    }
  }
};























// // ✅ Get all receipts
// export const oldgetAllReceipts = async (req, res) => {
//   try {
//     const receipts = await executeQuery("SELECT * FROM receipt2 ORDER BY created_at DESC");
//     res.status(200).json(receipts);
//   } catch (error) {
//     console.error("Error fetching receipts:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };





// // ✅ Get all receipts of a client by client_unique_id + summary
// export const oldgetReceiptsByClient = async (req, res) => {
//   const { clientUniqueId } = req.params;

//   try {
//     // Fetch all receipts of that client
//     const receipts = await executeQuery(
//       "SELECT * FROM receipt2 WHERE client_unique_id = ? ORDER BY created_at DESC",
//       [clientUniqueId]
//     );

//     if (receipts.length === 0) {
//       return res.status(404).json({ message: "No receipts found for this client." });
//     }

//     // Count and total amount
//     const receiptCount = receipts.length;
//     const totalAmountReceived = receipts.reduce(
//       (total, receipt) => total + parseFloat(receipt.amount_received),
//       0
//     );

//     res.status(200).json({
//       receiptCount,
//       totalAmountReceived,
//       receipts
//     });
//   } catch (error) {
//     console.error("Error fetching client receipts:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };




















