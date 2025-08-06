import express from "express";
import { deleteReceiptNew, downloadReceiptsExcel, getReceiptByNumber, oldaddReceipt, oldaddReceiptNew, oldgetAllReceipts, oldgetReceiptsByClient } from "../controller/oldreceipt.js";

const router = express.Router();

router.post("/add", oldaddReceipt);
router.post('/add-receipt-new', oldaddReceiptNew); // Add receipt new without auto generated receipt number
router.get("/all", oldgetAllReceipts);
router.get("/client/:clientUniqueId", oldgetReceiptsByClient);
router.delete("/delete/:receipt_number", deleteReceiptNew);
router.get("/number/:receiptNumber", getReceiptByNumber);
router.get("/download", downloadReceiptsExcel);
export default router;
