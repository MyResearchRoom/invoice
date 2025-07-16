import { executeQuery } from "../../config/db.js";

export const getCounts = async (req, res) => {
  try {
    const query = `
      SELECT
        (SELECT COUNT(DISTINCT client_unique_id) FROM clients) AS total_clients,
        (SELECT COUNT(DISTINCT name) FROM employee_details) AS total_employees,
        (SELECT COUNT(*) FROM user where role= "user") AS total_users,
        (SELECT COUNT(*) FROM invoice) AS total_invoices,
        (SELECT COUNT(*) FROM invoice WHERE department= 'myresearchroom') AS total_mrr_invoices,
        (SELECT COUNT(*) FROM invoice WHERE department= 'wesolutize') AS total_wesolutize_invoices,
        (SELECT COUNT(*) FROM receipts) AS total_receipts,
        (SELECT COUNT(*) FROM receipts WHERE receipt_number LIKE 'MRR%') as total_mrr_receipts,
        (SELECT COUNT(*) FROM receipts WHERE receipt_number LIKE 'WES%') as total_wesolutize_receipts,
        (SELECT COUNT(*) FROM salary_slips) AS total_salary_slips,
        (SELECT COUNT(*) 
          FROM salary_slips ss
          JOIN employee_details ed ON ss.name = ed.name
          WHERE ed.company = 'wesolutize'
        ) AS wesolutize_salary_slips,
        (
          SELECT COUNT(*) 
          FROM salary_slips ss
          JOIN employee_details ed ON ss.name = ed.name
          WHERE ed.company = 'mrr'
        ) AS myresearchroom_salary_slips
    `;

    const result = await executeQuery(query);

    res.status(200).json(result[0] || {
      total_clients: 0,
      total_employees: 0,
      total_invoices: 0,
      total_receipts: 0,
      total_salary_slips: 0,
      wesolutize_count: 0,
      myresearchroom_count: 0
    });
  } catch (error) {
    console.error("Failed to get counts", error);
    res.status(500).json({ message: "Failed to get counts", error });
  }
};
