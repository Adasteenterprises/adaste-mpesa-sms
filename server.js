import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { stkPush, stkCallback } from "./src/mpesa.js";
import { sendSms } from "./src/sms.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// --- M-PESA endpoints ---
app.post("/mpesa/stkpush", stkPush);
app.post("/mpesa/stk/callback", stkCallback);

// --- Test SMS ---
app.post("/sms/test", async (req, res) => {
  await sendSms(req.body.phone, req.body.message);
  res.json({ status: "SMS sent (sandbox)" });
});

// --- Home / Health check ---
app.get("/", (_, res) => {
  res.send("✅ ADASTE M-PESA + SMS API is running on Render.");
});

// --- Start the server ---
const PORT = process.env.PORT || 10000; // Render-friendly port
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ ADASTE Server is live on Render at port ${PORT}`);
  console.log(`🌐 Health Check URL: http://localhost:${PORT}/`);
});
