import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bookRoutes from "./routes/book.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import orderRoutes from "./routes/order.routes"; // <-- استيراد المسار

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://127.0.0.1:3000",
  credentials: true,

}));
app.use(express.json());

// المسارات
app.use("/api/products", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes); // <-- تفعيل مسار الطلبات

app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});