"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyFeedback = exports.notifyOrderStatus = exports.notifyNewOrder = exports.notifyConfirmedOrder = exports.isCashierOrder = exports.deleteTelegramMessage = exports.clearAllTelegramMessages = void 0;
const telegramClient_1 = require("./telegram/telegramClient");
Object.defineProperty(exports, "deleteTelegramMessage", { enumerable: true, get: function () { return telegramClient_1.deleteTelegramMessage; } });
Object.defineProperty(exports, "clearAllTelegramMessages", { enumerable: true, get: function () { return telegramClient_1.clearAllTelegramMessages; } });
const telegramFormatters_1 = require("./telegram/telegramFormatters");
const isCashierOrder = (order) => {
    if (!order)
        return false;
    if (order.user?.role === "ADMIN")
        return true;
    const address = typeof order.address === "string" ? order.address : "";
    if (address.includes("كاشير") ||
        address.includes("مقر المكتبة") ||
        address.includes("بيع مباشر")) {
        return true;
    }
    const notes = typeof order.notes === "string" ? order.notes : "";
    if (notes.includes("كاشير")) {
        return true;
    }
    const transferNumber = typeof order.transferNumber === "string" ? order.transferNumber : "";
    if (transferNumber.includes("كاشير")) {
        return true;
    }
    return false;
};
exports.isCashierOrder = isCashierOrder;
const notifyConfirmedOrder = async (order) => {
    if ((0, exports.isCashierOrder)(order)) {
        return null;
    }
    try {
        const text = (0, telegramFormatters_1.formatConfirmedOrderForPrep)(order);
        return await (0, telegramClient_1.sendTelegramMessage)(text);
    }
    catch {
        return null;
    }
};
exports.notifyConfirmedOrder = notifyConfirmedOrder;
exports.notifyNewOrder = exports.notifyConfirmedOrder;
const notifyOrderStatus = async (order, oldStatus, newStatus) => {
    if ((0, exports.isCashierOrder)(order)) {
        return null;
    }
    try {
        const text = (0, telegramFormatters_1.formatOrderStatusMessage)(order, oldStatus, newStatus);
        return await (0, telegramClient_1.sendTelegramMessage)(text);
    }
    catch {
        return null;
    }
};
exports.notifyOrderStatus = notifyOrderStatus;
const notifyFeedback = async (suggestion, user) => {
    try {
        const text = (0, telegramFormatters_1.formatFeedbackMessage)(suggestion, user);
        return await (0, telegramClient_1.sendTelegramMessage)(text);
    }
    catch {
        return null;
    }
};
exports.notifyFeedback = notifyFeedback;
exports.default = {
    isCashierOrder: exports.isCashierOrder,
    notifyConfirmedOrder: exports.notifyConfirmedOrder,
    notifyNewOrder: exports.notifyNewOrder,
    notifyOrderStatus: exports.notifyOrderStatus,
    notifyFeedback: exports.notifyFeedback,
    deleteTelegramMessage: telegramClient_1.deleteTelegramMessage,
    clearAllTelegramMessages: telegramClient_1.clearAllTelegramMessages,
};
