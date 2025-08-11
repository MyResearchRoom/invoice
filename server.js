import express from "express";
import cors from "cors";

import authRouter from "./routes/auth/auth.js";
import invoiceRoutes from "./routes/invoice/invoice.js";
import employeeRoutes from "./routes/EmployeeDetails/employeeDetails.js"
import salarySlipRoutes from "./routes/SalarySlips/salarySlips.js"
import clientRoutes from "./routes/clientRoutes/clientRoutes.js"
import receiptsRoutes from "./routes/Receipts/receipts.js"
import countsRoutes from "./routes/Counts/counts.js"
import oldreceiptsRoutes from "./routes/oldreceipt.js"





import dotenv from "dotenv";
import morgan from "morgan";


dotenv.config();

const app = express();

app.use(morgan("dev")); // this line is to log all incoming requests to the console for debugging purposes. You can remove it if you don't want to see the logs.

app.use(cors()); // this line is to enable CORS for cross-origin requests. It's needed for frontend development with React.js. You can remove it if you're using a different frontend framework.

app.use(express.json()); // this line is to parse incoming JSON data into req.body

app.get("/", (req, res) => res.send("welcome new11082025"));

app.use("/api/auth", authRouter); // this line is to use the user router for handling requests at /api/users
app.use('/api/invoice', invoiceRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/salarySlips', salarySlipRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/counts', countsRoutes);
app.use('/api/old', oldreceiptsRoutes);








app.listen(8009, () => console.log("server is running on port 8009"));
