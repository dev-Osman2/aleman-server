"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.updateProfile = exports.getMe = exports.loginUser = exports.registerUser = void 0;
const node_1 = require("better-auth/node");
const auth_1 = require("../auth");
const prisma_1 = require("../prisma");
const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;
const registerUser = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;
        if (!name || !phone || !email || !password) {
            res.status(400).json({
                success: false,
                message: "جميع الحقول مطلوبة (الاسم، رقم الهاتف، البريد الإلكتروني، كلمة المرور)",
            });
            return;
        }
        const trimmedPhone = String(phone).trim();
        if (!EGYPTIAN_PHONE_REGEX.test(trimmedPhone)) {
            res.status(400).json({
                success: false,
                message: "رقم الهاتف غير صالح، يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً",
            });
            return;
        }
        const response = await auth_1.auth.api.signUpEmail({
            body: {
                name: String(name).trim(),
                email: String(email).trim(),
                password,
                phone: trimmedPhone,
            },
            asResponse: false,
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: response,
        });
    }
    catch (error) {
        console.error("Error registering user with Better Auth:", error);
        res.status(400).json({
            success: false,
            message: error?.message || "Failed to register user",
        });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { identifier, email, phone, password } = req.body;
        const loginInput = (identifier || email || phone || "").trim();
        if (!loginInput || !password) {
            res.status(400).json({
                success: false,
                message: "يرجى إدخال البريد الإلكتروني (أو رقم الهاتف) وكلمة المرور",
            });
            return;
        }
        let targetEmail = loginInput;
        if (!loginInput.includes("@")) {
            const userByPhone = await prisma_1.prisma.user.findUnique({
                where: { phone: loginInput },
                select: { email: true },
            });
            if (!userByPhone) {
                res.status(401).json({
                    success: false,
                    message: "رقم الهاتف أو كلمة المرور غير صحيحة",
                });
                return;
            }
            targetEmail = userByPhone.email;
        }
        const response = await auth_1.auth.api.signInEmail({
            body: {
                email: targetEmail,
                password,
            },
            asResponse: false,
        });
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: response,
        });
    }
    catch (error) {
        console.error("Error logging in:", error);
        res.status(401).json({
            success: false,
            message: "بيانات الدخول غير صحيحة، تأكد من الإيميل/الهاتف وكلمة المرور",
        });
    }
};
exports.loginUser = loginUser;
const getMe = async (req, res) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            res.status(401).json({
                success: false,
                message: "Unauthorized - No active session",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: session,
        });
    }
    catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching session",
        });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            res.status(401).json({
                success: false,
                message: "Unauthorized - Please login first",
            });
            return;
        }
        const { name, phone } = req.body;
        if (!name && !phone) {
            res.status(400).json({
                success: false,
                message: "Please provide at least a name or phone to update",
            });
            return;
        }
        const trimmedPhone = phone ? String(phone).trim() : undefined;
        if (trimmedPhone && !EGYPTIAN_PHONE_REGEX.test(trimmedPhone)) {
            res.status(400).json({
                success: false,
                message: "رقم الهاتف غير صالح، يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً",
            });
            return;
        }
        if (trimmedPhone && trimmedPhone !== session.user.phone) {
            const phoneTaken = await prisma_1.prisma.user.findUnique({
                where: { phone: trimmedPhone },
            });
            if (phoneTaken) {
                res.status(409).json({
                    success: false,
                    message: "هذا الرقم مسجل بالفعل بحساب آخر",
                });
                return;
            }
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                ...(name ? { name } : {}),
                ...(phone ? { phone } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                updatedAt: true,
            },
        });
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while updating profile",
        });
    }
};
exports.updateProfile = updateProfile;
const deleteAccount = async (req, res) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            res.status(401).json({
                success: false,
                message: "Unauthorized - Please login first",
            });
            return;
        }
        const userId = session.user.id;
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.orderItem.deleteMany({
                where: { order: { userId } },
            });
            await tx.order.deleteMany({
                where: { userId },
            });
            await tx.session.deleteMany({
                where: { userId },
            });
            await tx.account.deleteMany({
                where: { userId },
            });
            await tx.user.delete({
                where: { id: userId },
            });
        });
        res.status(200).json({
            success: true,
            message: "تم حذف الحساب وكافة البيانات المرتبطة به بنجاح",
        });
    }
    catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({
            success: false,
            message: "حدث خطأ أثناء محاولة حذف الحساب",
        });
    }
};
exports.deleteAccount = deleteAccount;
