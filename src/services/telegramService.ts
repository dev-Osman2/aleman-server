import {
  sendTelegramMessage,
  deleteTelegramMessage,
  clearAllTelegramMessages,
} from "./telegram/telegramClient";
import {
  formatConfirmedOrderForPrep,
  formatOrderStatusMessage,
  formatFeedbackMessage,
} from "./telegram/telegramFormatters";

export { clearAllTelegramMessages, deleteTelegramMessage };

export const notifyConfirmedOrder = async (
  order: any,
): Promise<number | null> => {
  try {
    const text = formatConfirmedOrderForPrep(order);
    return await sendTelegramMessage(text);
  } catch {
    return null;
  }
};

export const notifyNewOrder = notifyConfirmedOrder;

export const notifyOrderStatus = async (
  order: any,
  oldStatus: string,
  newStatus: string,
): Promise<number | null> => {
  try {
    const text = formatOrderStatusMessage(order, oldStatus, newStatus);
    return await sendTelegramMessage(text);
  } catch {
    return null;
  }
};

export const notifyFeedback = async (
  suggestion: any,
  user?: any,
): Promise<number | null> => {
  try {
    const text = formatFeedbackMessage(suggestion, user);
    return await sendTelegramMessage(text);
  } catch {
    return null;
  }
};

export default {
  notifyConfirmedOrder,
  notifyNewOrder,
  notifyOrderStatus,
  notifyFeedback,
  deleteTelegramMessage,
  clearAllTelegramMessages,
};

