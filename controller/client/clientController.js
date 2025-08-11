import ExcelJS from 'exceljs';
import { executeQuery } from '../../config/db.js';


export const addClient = async (req, res) => {
  try {
    const {
      name,
      email,
      mobileNumber,
      address,
      gstNo,
      pinCode,
      associatedCompany,
      companyName,
      pointOfContactPersonName,
      pointOfContactDesignation,
      pointOfContactMobileNumber
    } = req.body;

    if (!name || !email || !mobileNumber || !address || !pinCode || !associatedCompany) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let prefix = "";
    if (associatedCompany.toLowerCase() === "myresearchroom") {
      prefix = "MRR";
    } else if (associatedCompany.toLowerCase() === "wesolutize") {
      prefix = "WES";
    } else {
      throw new Error("Unknown company name");
    }

    const latestResult = await executeQuery(
      `SELECT client_unique_id FROM clients WHERE client_unique_id LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}-%`]
    );

    let newNumber = 1;
    if (latestResult.length > 0) {
      const lastId = latestResult[0].client_unique_id;
      // const lastNumber = parseInt(lastId.replace(prefix, ""));
      const lastNumber = parseInt(lastId.replace(`${prefix}-`, ""));

      newNumber = lastNumber + 1;
    }

    const finalNumber = String(newNumber).padStart(4, "0");

    const client_unique_id = `${prefix}-${finalNumber}`;

    const sql = `
      INSERT INTO clients (
        client_unique_id, client_name, client_email, client_contact_no,
        client_address, gst_number, pincode, company_name,
        client_company_name, contact_person_name,
        contact_person_designation, contact_person_contact_no
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      client_unique_id,
      name,
      email,
      mobileNumber,
      address,
      gstNo || null,
      pinCode,
      associatedCompany,
      companyName || null,
      pointOfContactPersonName || null,
      pointOfContactDesignation || null,
      pointOfContactMobileNumber || null
    ];

    await executeQuery(sql, params);

    res.status(201).json({
      message: 'Client added successfully',
      client_unique_id
    });

  } catch (error) {
    console.error('Error inserting client:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// export const getAllClients = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const countResult = await executeQuery(`SELECT COUNT(*) AS total FROM clients`);
//     const totalRecords = countResult[0].total;
//     const totalPages = Math.ceil(totalRecords / limit);

//     const results = await executeQuery(
//       `SELECT * FROM clients ORDER BY id DESC LIMIT ? OFFSET ?`,
//       [limit, offset]
//     );

//     res.status(200).json({
//       results,
//       currentPage: page,
//       totalPages,
//       totalRecords,
//       pageLimit: limit,
//     });
//   } catch (error) {
//     console.error('Error fetching clients:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

export const getAllClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const company = req.query.company || "";
    const clientId = req.query.client_unique_id || "";

    const offset = (page - 1) * limit;

    const values = [];
    let whereClause = "";

    if (company) {
      whereClause = `WHERE company_name = ?`;
      values.push(company);
    }

    if (clientId) {
      if (whereClause) {
        whereClause += " AND client_unique_id = ?";
      } else {
        whereClause += " WHERE client_unique_id = ?";
      }
      values.push(clientId);
    }


    const countQuery = `SELECT COUNT(*) AS total FROM clients ${whereClause}`;
    const countResult = await executeQuery(countQuery, values);
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    const dataQuery = `SELECT * FROM clients ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`;
    values.push(limit, offset);
    const results = await executeQuery(dataQuery, values);

    res.status(200).json({
      results,
      currentPage: page,
      totalPages,
      totalRecords,
      pageLimit: limit,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// ✅ GET CLIENT BY ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const results = await executeQuery(`SELECT * FROM clients WHERE client_unique_id = ?`, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ FILTER CLIENTS BY COMPANY
export const getClientsByCompany = async (req, res) => {
  try {
    const { company } = req.params;

    const results = await executeQuery(
      `SELECT * FROM clients WHERE company_name = ? ORDER BY id DESC`,
      [company]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Error filtering clients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ UPDATE CLIENT
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      mobileNumber,
      address,
      gstNo,
      pinCode,
      companyName,
      pointOfContactPersonName,
      pointOfContactDesignation,
      pointOfContactMobileNumber
    } = req.body;

    const sql = `
      UPDATE clients SET
        client_name = ?, client_email = ?, client_contact_no = ?,
        client_address = ?, gst_number = ?, pincode = ?,
        client_company_name = ?, contact_person_name = ?,
        contact_person_designation = ?, contact_person_contact_no = ?
      WHERE id = ?
    `;

    const params = [
      name,
      email,
      mobileNumber,
      address,
      gstNo || null,
      pinCode,
      companyName || null,
      pointOfContactPersonName || null,
      pointOfContactDesignation || null,
      pointOfContactMobileNumber || null,
      id
    ];

    await executeQuery(sql, params);

    res.status(200).json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ DELETE CLIENT
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    await executeQuery(`DELETE FROM clients WHERE id = ?`, [id]);

    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//download client list excel
export const downloadClientsExcel = async (req, res) => {
  try {
    const clients = await executeQuery("SELECT * FROM clients");

    if (clients.length === 0) {
      return res.status(404).json({ message: "No client found" });
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clients");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Client Unique Id", key: "client_unique_id", width: 20 },
      { header: "Name", key: "client_name", width: 25 },
      { header: "Email", key: "client_email", width: 25 },
      { header: "Contact No.", key: "client_contact_no", width: 20 },
      { header: "Address", key: "client_address", width: 20 },
      { header: "GST No.", key: "gst_number", width: 20 },
      { header: "Pin Code", key: "pin_code", width: 10 },
      { header: "Company Name", key: "company_name", width: 20 },
      { header: "Client Company Name", key: "client_company_name", width: 20 },
      { header: "Contact Person Name", key: "contact_person_name", width: 25 },
      { header: "Contact Person Designation", key: "contact_person_designation", width: 20 },
      { header: "Contact Person Contact", key: "contact_person_contact_no", width: 20 },
      { header: "Created at", key: "created_at", width: 20 },
    ];

    clients.forEach((client) => {
      worksheet.addRow(client);
    });

    const fileName = `client_list.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);
  } catch (error) {
    console.error("Error generating client Excel:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate client list Excel file" });
    }
  }
};




export const getClientByUniqueId = async (req, res) => {
  try {
    const { clientUniqueId } = req.params;

    const results = await executeQuery(
      `SELECT * FROM clients WHERE client_unique_id = ?`,
      [clientUniqueId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getAllClientUniqueIds = async (req, res) => {
  try {
    const results = await executeQuery(
      "SELECT client_unique_id FROM clients ORDER BY client_unique_id ASC"
    );

    // Convert to plain array: ["C-2025-001", "C-2025-002", ...]
    const uniqueIds = results.map(row => row.client_unique_id.trim());

    res.status(200).json(uniqueIds);
  } catch (error) {
    console.error("Error fetching client_unique_ids:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getClientsUniqueIdAndName = async (req, res) => {
  try {
    const results = await executeQuery(
      `SELECT client_unique_id, client_name FROM clients ORDER BY client_unique_id ASC`
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};