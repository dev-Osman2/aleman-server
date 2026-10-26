import { Router } from "express";
import { getBooks, getBookById } from "../controllers/book.controller";

const router = Router();


router.get("/", getBooks);


router.get("/:code", getBookById);

export default router;