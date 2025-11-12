import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { approveLoan, rejectLoan, applyLoan } from "./src/loans.js";
import { registerClient, getClients } from "./src/clients.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors());

// --- Client Routes ---
app.post("/api/register", registerClient);
app.get("/api/clients", getClients);

// --- Loan Routes ---
app.post("/api/loans/apply", applyLoan);
app.post("/api/loans/approve/:id", approveLoan);
app.post("/api/loans/reject/:id", rejectLoan);

// --- Root ---
app.get("/", (_, res) => res.send("✅ ADASTE Loan System API is live!"));

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is live on port ${PORT}`);
});
