import fs from "fs";
import path from "path";

const MESSAGES_FILE = path.join(__dirname, "../../../data/telegram_messages.json");

function getStoredMessageIds(): number[] {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeMessageId(id: number): void {
  try {
    const dir = path.dirname(MESSAGES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const ids = getStoredMessageIds();
    if (!ids.includes(id)) {
      ids.push(id);
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(ids, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to store Telegram message ID:", err);
  }
}

export const sendTelegramMessage = async (text: string): Promise<boolean> => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return false;
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
      if (data?.result?.message_id) {
        storeMessageId(data.result.message_id);
      }
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const deleteTelegramMessage = async (
  messageId: number,
): Promise<boolean> => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return false;

    const url = `https://api.telegram.org/bot${token}/deleteMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
};

export const clearAllTelegramMessages = async (): Promise<number> => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return 0;

    const storedIds = getStoredMessageIds();
    let deletedCount = 0;

    
    for (const msgId of storedIds) {
      const ok = await deleteTelegramMessage(msgId);
      if (ok) deletedCount++;
    }

    
    const maxId = storedIds.length > 0 ? Math.max(...storedIds) : 100;
    const minSweep = Math.max(1, maxId - 150);
    for (let id = maxId; id >= minSweep; id--) {
      if (!storedIds.includes(id)) {
        const ok = await deleteTelegramMessage(id);
        if (ok) deletedCount++;
      }
    }

    
    try {
      if (fs.existsSync(MESSAGES_FILE)) {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), "utf-8");
      }
    } catch {
      
    }

    return deletedCount;
  } catch (error) {
    console.error("Error clearing Telegram messages:", error);
    return 0;
  }
};
