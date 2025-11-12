// server.js
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Local JSON files for quick data storage
const clientsFile = "./data/clients.json";
const loansFile = "./data/loans.json";

// Ensure folders exist
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(clientsFile)) fs.writeFileSync(clientsFile, "[]");
if (!fs.existsSync(loansFile)) fs.writeFileSync(loansFile, "[]");

// Helper functions
const readData = (file) => JSON.parse(fs.readFileSync(file));
const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// 🟢 1. Register client
app.post("/api/register", (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email)
    return res.status(400).json({ error: "All fields required" });

  const clients = readData(clientsFile);
  const id = `C${clients.length + 1}`;
  const newClient = { id, name, phone, email };
  clients.push(newClient);
  writeData(clientsFile, clients);
  res.json({ message: "Client registered successfully", client: newClient });
});

// 🟢 2. Apply for a loan
app.post("/api/loans/apply", (req, res) => {
  const { clientId, amount, term, purpose } = req.body;
  if (!clientId || !amount)
    return res.status(400).json({ error: "Missing fields" });

  const loans = readData(loansFile);
  const id = `L${loans.length + 1}`;
  const newLoan = { id, clientId, amount, term, purpose, status: "Pending" };
  loans.push(newLoan);
  writeData(loansFile, loans);
  res.json({ message: "Loan application submitted.", loan: newLoan });
});

// 🟢 3. Approve Loan
app.post("/api/loans/approve/:id", (req, res) => {
  const { id } = req.params;
  const loans = readData(loansFile);
  const loan = loans.find((l) => l.id === id);
  if (!loan) return res.status(404).json({ error: "Loan not found" });

  loan.status = "Approved";
  writeData(loansFile, loans);
  res.json({ message: "Loan approved successfully.", loan });
});

// 🟢 4. Reject Loan
app.post("/api/loans/reject/:id", (req, res) => {
  const { id } = req.params;
  const loans = readData(loansFile);
  const loan = loans.find((l) => l.id === id);
  if (!loan) return res.status(404).json({ error: "Loan not found" });

  loan.status = "Rejected";
  writeData(loansFile, loans);
  res.json({ message: "Loan rejected successfully.", loan });
});

// 🟢 5. Get all clients
app.get("/api/clients", (_, res) => {
  const clients = readData(clientsFile);
  res.json(clients);
});

// 🟢 6. Get all loans
app.get("/api/loans", (_, res) => {
  const loans = readData(loansFile);
  res.json(loans);
});

// 🟢 7. Root endpoint
app.get("/", (_, res) => res.send("✅ ADASTE Loan System API is live!"));

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on ${PORT}`));
