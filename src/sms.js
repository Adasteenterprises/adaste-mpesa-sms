import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const baseUrl = "https://api.africastalking.com/version1/messaging";
const username = process.env.AT_USERNAME;
const apiKey = process.env.AT_APIKEY;

async function sendSms(to, message) {
  try {
    console.log(`Sending SMS → ${to}: ${message}`);
    await axios.post(
      baseUrl,
      new URLSearchParams({
        username,
        to,
        message,
        from: "ADASTE"
      }),
      { headers: { apikey: apiKey } }
    );
  } catch (err) {
    console.error("SMS error:", err.message);
  }
}

// Make sure to export the sendSms function correctly
export { sendSms };
