import { api } from "./api.js";

async function testApi() {
  try {
    const response = await fetch(
      "http://localhost:5000/"
    );

    const data = await response.json();

    console.log("MemoFlo API:", data);

    if (data?.product === "MemoFlo API") {
      console.log("✅ API connection successful");
    } else {
      console.warn("⚠️ API responded, but product was unexpected");
    }
  } catch (error) {
    console.error("❌ API connection failed:", error.message);
  }
}

testApi();
