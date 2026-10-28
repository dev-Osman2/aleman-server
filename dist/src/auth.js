"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const plugins_1 = require("better-auth/plugins");
const prisma_1 = require("better-auth/adapters/prisma");
const prisma_2 = require("./prisma");
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(prisma_2.prisma, {
        provider: "postgresql",
    }),
    plugins: [
        (0, plugins_1.bearer)(),
    ],
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: true,
                input: true,
            },
            role: {
                type: "string",
                defaultValue: "CUSTOMER",
                input: false,
            },
        },
    },
});
