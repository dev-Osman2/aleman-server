import { Router } from "express";
import { registerUser, loginUser, getMe } from "../controllers/auth.controller";

const router = Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

// GET /api/auth/me
router.get("/me", getMe);

export default router;