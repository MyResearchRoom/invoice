import express from 'express';
import multer from 'multer';
import { createInvoice, getFilteredInvoices, getInvoiceByNumber, getInvoiceCountByDepartment, getInvoiceDetailsByInvoiceNumber, getInvoices } from '../../controller/invoice/invoice.js';

const router = express.Router();

// Configure multer to handle file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Maximum file size is 1MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
            cb(null, true);
        } else {
            cb(new Error('File type not supported. Please upload a PNG or JPEG image.'));
        }
    }
});

// Route to create a new invoice
router.post('/createInvoice', upload.single('signature'), createInvoice);
// http://localhost:8000/api/invoice/createInvoice


// ----------------------------all fields get--------------------------
// Get all invoices
router.get('/getInvoices', getInvoices);
// http://localhost:8000/api/invoice/getInvoices

// --------------------------------------------------------------------

router.get('/getFilteredInvoices', getFilteredInvoices);
// http://localhost:8000/api/invoice/getFilteredInvoices
// http://localhost:8000/api/invoice/getFilteredInvoices?invoice_date=2024-02-07&department=wesolutize



router.get('/getInvoiceByNumber/:invoice_number', getInvoiceByNumber);
// http://localhost:8000/api/invoice/getInvoiceByNumber



// Route to get department-wise invoice count
router.get('/getInvoiceCountByDepartment', getInvoiceCountByDepartment);
// http://localhost:8000/api/invoice/getInvoiceCountByDepartment



//used in receipts
router.get('/getInvoiceDetailsByInvoiceNumber/:invoice_number', getInvoiceDetailsByInvoiceNumber);
// http://localhost:8000/api/invoice/getInvoiceDetailsByInvoiceNumber


export default router;
