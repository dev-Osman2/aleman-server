"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const book_routes_1 = __importDefault(require("./routes/book.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/api/products", book_routes_1.default);
app.use("/api/books", book_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
