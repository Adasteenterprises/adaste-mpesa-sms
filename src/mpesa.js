import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// M-PESA credentials
const baseUrl = "https://sandbox.safaricom.co.ke/mpesa";
const shortcode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const callbackUrl = process.env.CALLBACK_URL;

// Generate M-PESA password
function generatePassword() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
  return { password, timestamp };
}

// STK Push (Send Payment Request)
async function stkPush(phone, amount, accountRef = "ADASTE") {
  const { password, timestamp } = generatePassword();
  const token = process.env.MPESA_TOKEN;

  try {
    const res = await axios.post(
      `${baseUrl}/stkpush/v1/processrequest`,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: accountRef,
        TransactionDesc: "Loan repayment"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ STK Push sent:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ STK Push error:", err.message);
  }
}

// STK Callback (Handle M-PESA Response)
async function stkCallback(req, res) {
  console.log("📩 M-PESA Callback received:", req.body);

  try {
    const data = req.body?.Body?.stkCallback;
    if (data?.ResultCode === 0) {
      console.log("✅ Payment successful:", data);
      // TODO: update DB or Airtable here
    } else {
      console.log("❌ Payment failed:", data?.ResultDesc);
    }
    res.status(200).send("Callback received");
  } catch (error) {
    console.error("Callback Error:", error);
    res.status(500).send("Error processing callback");
  }
}

// Export both functions
export { stkPush, stkCallback };
