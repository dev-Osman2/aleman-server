import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bookRoutes from "./routes/book.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import orderRoutes from "./routes/order.routes"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://aleman.aswany.me",
  "https://aleman-library.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".aswany.me") ||
        origin.endsWith(".vercel.app");

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error(`CORS Error: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());


app.use("/api/products", bookRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes); 

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});