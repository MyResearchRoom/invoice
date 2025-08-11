import express from 'express';
import {
    addReceipt,
    getReceiptsByInvoiceNumber,
    getReceiptsByClient,
    updateReceipt,
    deleteReceipt,
    getAllReceipts,
    downloadReceiptListExcel,
} from '../../controller/Receipts/receipts.js';
const router = express.Router();

router.post('/add-receipt', addReceipt); // Add receipt with auto generated receipt number Ex- MRR20250700001
// router.get('/invoice/:invoiceId', getReceiptsByInvoice); // Get by invoice ID
router.get('/getAllReceipts', getAllReceipts);
router.get('/invoice-number/:invoiceNumber', getReceiptsByInvoiceNumber);
router.get('/by-client', getReceiptsByClient); // Get by client name
router.put('/:receiptId', updateReceipt); // Update
router.delete('/:receiptId', deleteReceipt); // Delete
router.get('/download-receipt-list', downloadReceiptListExcel);

export default router;
