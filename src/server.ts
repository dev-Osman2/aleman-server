import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bookRoutes from "./routes/book.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes"; // <-- استيراد مسار الأدمن

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ربط المسارات
app.use("/api/products", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); // <-- تفعيل مسار الأدمن المحمي

app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});