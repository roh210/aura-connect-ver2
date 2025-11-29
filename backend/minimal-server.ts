// Minimal server test
import express from "express";

const app = express();
const PORT = 3001;

app.get("/", (req, res) => {
  res.json({ message: "Server is working!" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
  console.log(`Server address:`, server.address());
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
});
