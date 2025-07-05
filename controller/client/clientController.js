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
      associatedCompany, // Required
      companyName,
      pointOfContactPersonName,
      pointOfContactDesignation,
      pointOfContactMobileNumber
    } = req.body;

    // ✅ Validate required fields
    if (!name || !email || !mobileNumber || !address || !pinCode || !associatedCompany) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Use lowercase company prefix for ID
    const prefix = associatedCompany.toLowerCase();

    const latestResult = await executeQuery(
      `SELECT client_unique_id FROM clients WHERE client_unique_id LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}-%`]
    );

    let newNumber = 1001;
    if (latestResult.length > 0) {
      const lastId = latestResult[0].client_unique_id;
      const lastNumber = parseInt(lastId.split('-')[1]);
      newNumber = lastNumber + 1;
    }

    const client_unique_id = `${prefix}-${newNumber}`;

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


export const getAllClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const results = await executeQuery(
      `SELECT * FROM clients ORDER BY id DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ GET CLIENT BY ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const results = await executeQuery(`SELECT * FROM clients WHERE id = ?`, [id]);

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
