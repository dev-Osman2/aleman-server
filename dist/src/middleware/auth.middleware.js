"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.optionalAuth = exports.requireAuth = void 0;
const node_1 = require("better-auth/node");
const auth_1 = require("../auth");
const requireAuth = async (req, res, next) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            res.status(401).json({
                success: false,
                message: "Unauthorized - Access denied. Please login first.",
            });
            return;
        }
        req.user = session.user;
        req.session = session.session;
        next();
    }
    catch (error) {
        console.error("Authentication middleware error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during authentication",
        });
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = async (req, res, next) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (session) {
            req.user = session.user;
            req.session = session.session;
        }
    }
    catch {
    }
    next();
};
exports.optionalAuth = optionalAuth;
const requireAdmin = async (req, res, next) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            res.status(401).json({
                success: false,
                message: "Unauthorized - Access denied. Please login first.",
            });
            return;
        }
        if (session.user.role !== "ADMIN") {
            res.status(403).json({
                success: false,
                message: "Forbidden - You do not have permission to access admin resources.",
            });
            return;
        }
        req.user = session.user;
        req.session = session.session;
        next();
    }
    catch (error) {
        console.error("Admin authorization middleware error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during admin authorization",
        });
    }
};
exports.requireAdmin = requireAdmin;
