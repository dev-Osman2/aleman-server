import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bookRoutes from "./routes/book.routes";
import authRoutes from "./routes/auth.routes"; // <-- استيراد المسار الجديد

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/products", bookRoutes);
app.use("/api/auth", authRoutes); // <-- تفعيل مسار المصادقة

app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});