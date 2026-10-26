import {
  sendTelegramMessage,
  clearAllTelegramMessages,
} from "./telegram/telegramClient";
import {
  formatConfirmedOrderForPrep,
  formatOrderStatusMessage,
  formatFeedbackMessage,
} from "./telegram/telegramFormatters";

export { clearAllTelegramMessages };

export const notifyConfirmedOrder = async (order: any): Promise<boolean> => {
  try {
    const text = formatConfirmedOrderForPrep(order);
    return await sendTelegramMessage(text);
  } catch {
    return false;
  }
};

export const notifyNewOrder = notifyConfirmedOrder;

export const notifyOrderStatus = async (
  order: any,
  oldStatus: string,
  newStatus: string
): Promise<boolean> => {
  try {
    const text = formatOrderStatusMessage(order, oldStatus, newStatus);
    return await sendTelegramMessage(text);
  } catch {
    return false;
  }
};

export const notifyFeedback = async (
  suggestion: any,
  user?: any
): Promise<boolean> => {
  try {
    const text = formatFeedbackMessage(suggestion, user);
    return await sendTelegramMessage(text);
  } catch {
    return false;
  }
};

export default {
  notifyConfirmedOrder,
  notifyNewOrder,
  notifyOrderStatus,
  notifyFeedback,
};
