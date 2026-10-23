import { Router } from "express";
import { getBooks, getBookById } from "../controllers/book.controller";

const router = Router();

// GET /api/products
router.get("/", getBooks);

// GET /api/products/:id
router.get("/:id", getBookById);

export default router;