import { sendTelegramMessage } from "./telegram/telegramClient";
import {
  formatNewOrderMessage,
  formatOrderStatusMessage,
  formatFeedbackMessage,
} from "./telegram/telegramFormatters";

export const notifyNewOrder = async (order: any): Promise<boolean> => {
  try {
    const text = formatNewOrderMessage(order);
    return await sendTelegramMessage(text);
  } catch {
    return false;
  }
};

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
  notifyNewOrder,
  notifyOrderStatus,
  notifyFeedback,
};
