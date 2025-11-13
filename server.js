import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // ✅ Load environment variables

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Use MongoDB URI from Render Environment Variable or fallback for local testing
const mongoURI =
  process.env.MONGODB_URI ||
  "mongodb+srv://adasteenterprises_db_user:RW3WGl4ovSrjqZ7y@adastecluster.zt7jspz.mongodb.net/adaste_db?retryWrites=true&w=majority";

// ✅ Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------- Schemas -------------------
const clientSchema = new mongoose.Schema({
  id: String,
  name: String,
  phone: String,
  email: String,
});

const loanSchema = new mongoose.Schema({
  id: String,
  clientId: String,
  amount: Number,
  term: String,
  purpose: String,
  status: String,
});

const Client = mongoose.model("Client", clientSchema);
const Loan = mongoose.model("Loan", loanSchema);

// ------------------- Routes -------------------

// ✅ Register client
app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const count = await Client.countDocuments();
    const client = new Client({
      id: `C${count + 1}`,
      name,
      phone,
      email,
    });
    await client.save();
    res.json({ message: "Client registered successfully", client });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Apply for loan
app.post("/api/loans/apply", async (req, res) => {
  try {
    const { clientId, amount, term, purpose } = req.body;
    const count = await Loan.countDocuments();
    const loan = new Loan({
      id: `L${count + 1}`,
      clientId,
      amount,
      term,
      purpose,
      status: "Pending",
    });
    await loan.save();
    res.json({ message: "Loan application submitted.", loan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Approve loan
app.post("/api/loans/approve/:id", async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { id: req.params.id },
      { status: "Approved" },
      { new: true }
    );
    res.json({ message: "Loan approved successfully.", loan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Reject loan
app.post("/api/loans/reject/:id", async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { id: req.params.id },
      { status: "Rejected" },
      { new: true }
    );
    res.json({ message: "Loan rejected successfully.", loan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all clients
app.get("/api/clients", async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all loans
app.get("/api/loans", async (req, res) => {
  try {
    const loans = await Loan.find();
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 Adaste MPESA SMS API running successfully!");
});

// ------------------- Server -------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

