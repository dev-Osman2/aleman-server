"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllTelegramMessages = exports.deleteTelegramMessage = exports.sendTelegramMessage = void 0;
const sendTelegramMessage = async (text) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) {
            return null;
        }
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
            }),
        });
        if (response.ok) {
            const data = await response.json();
            return data?.result?.message_id ?? null;
        }
        return null;
    }
    catch (error) {
        console.error("Error sending Telegram message:", error);
        return null;
    }
};
exports.sendTelegramMessage = sendTelegramMessage;
const deleteTelegramMessage = async (messageId) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId)
            return false;
        const url = `https://api.telegram.org/bot${token}/deleteMessage`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
        });
        const data = await res.json();
        return Boolean(data?.ok);
    }
    catch (error) {
        console.error(`Error deleting Telegram message ${messageId}:`, error);
        return false;
    }
};
exports.deleteTelegramMessage = deleteTelegramMessage;
const clearAllTelegramMessages = async (messageIds) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId || !Array.isArray(messageIds) || messageIds.length === 0) {
            return 0;
        }
        let deletedCount = 0;
        for (const msgId of messageIds) {
            if (typeof msgId === "number" && !isNaN(msgId)) {
                const ok = await (0, exports.deleteTelegramMessage)(msgId);
                if (ok)
                    deletedCount++;
            }
        }
        return deletedCount;
    }
    catch (error) {
        console.error("Error clearing Telegram messages:", error);
        return 0;
    }
};
exports.clearAllTelegramMessages = clearAllTelegramMessages;
