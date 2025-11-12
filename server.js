// server.js
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// 🟢 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🟢 Define Schemas
const clientSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
});

const loanSchema = new mongoose.Schema({
  clientId: String,
  amount: Number,
  term: String,
  purpose: String,
  status: { type: String, default: "Pending" },
});

const Client = mongoose.model("Client", clientSchema);
const Loan = mongoose.model("Loan", loanSchema);

// 🟢 Register client
app.post("/api/register", async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email)
    return res.status(400).json({ error: "All fields required" });

  const newClient = new Client({ name, phone, email });
  await newClient.save();
  res.json({ message: "Client registered successfully", client: newClient });
});

// 🟢 Apply for a loan
app.post("/api/loans/apply", async (req, res) => {
  const { clientId, amount, term, purpose } = req.body;
  if (!clientId || !amount)
    return res.status(400).json({ error: "Missing fields" });

  const newLoan = new Loan({ clientId, amount, term, purpose });
  await newLoan.save();
  res.json({ message: "Loan application submitted.", loan: newLoan });
});

// 🟢 Approve loan
app.post("/api/loans/approve/:id", async (req, res) => {
  const { id } = req.params;
  const loan = await Loan.findById(id);
  if (!loan) return res.status(404).json({ error: "Loan not found" });

  loan.status = "Approved";
  await loan.save();
  res.json({ message: "Loan approved successfully.", loan });
});

// 🟢 Reject loan
app.post("/api/loans/reject/:id", async (req, res) => {
  const { id } = req.params;
  const loan = await Loan.findById(id);
  if (!loan) return res.status(404).json({ error: "Loan not found" });

  loan.status = "Rejected";
  await loan.save();
  res.json({ message: "Loan rejected successfully.", loan });
});

// 🟢 Get all clients
app.get("/api/clients", async (_, res) => {
  const clients = await Client.find();
  res.json(clients);
});

// 🟢 Get all loans
app.get("/api/loans", async (_, res) => {
  const loans = await Loan.find();
  res.json(loans);
});

// 🟢 Root endpoint
app.get("/", (_, res) => res.send("✅ ADASTE Loan System API (MongoDB version) is live!"));

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on ${PORT}`));
