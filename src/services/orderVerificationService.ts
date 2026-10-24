import { PrismaClient } from "@prisma/client";
import {prisma} from "../prisma";

export interface OrderItemInput {
  bookId: string;
  quantity: number;
}

export interface VerifiedOrderItem {
  bookId: string;
  quantity: number;
  priceAtBuy: number;
  title: string;
}

export interface VerificationResult {
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderItemsData: VerifiedOrderItem[];
  isStoreOpen: boolean;
  closedMessage: string;
}

/**
 * Retrieves delivery fee and store availability from Setting.
 */
export const getStoreSettings = async (tx?: any) => {
  const db = tx || prisma;
  const setting = await db.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      isStoreOpen: true,
      closedMessage: "المكتبة مغلقة حالياً، نعود قريباً",
      deliveryFee: 25,
      instapayNumber: "",
      vodafoneNumber: "",
    },
  });

  return setting;
};

/**
 * Validates order items, checks inventory, loads actual book prices from DB,
 * and calculates subtotal, delivery fee, and total.
 */
export const verifyOrderItems = async (
  items: OrderItemInput[],
  tx?: any
): Promise<VerificationResult> => {
  const db = tx || prisma;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("EMPTY_OR_INVALID_ITEMS");
  }

  const setting = await getStoreSettings(db);

  let subtotal = 0;
  const orderItemsData: VerifiedOrderItem[] = [];

  for (const item of items) {
    if (!item.bookId || typeof item.quantity !== "number" || item.quantity < 1 || !Number.isInteger(item.quantity)) {
      throw new Error("INVALID_ITEM_FORMAT");
    }

    const book = await db.book.findUnique({
      where: { id: item.bookId },
    });

    if (!book) {
      throw new Error(`BOOK_NOT_FOUND:${item.bookId}`);
    }

    if (book.quantity < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK:${book.title} (متاح: ${book.quantity})`);
    }

    const itemTotal = book.price * item.quantity;
    subtotal += itemTotal;

    orderItemsData.push({
      bookId: book.id,
      quantity: item.quantity,
      priceAtBuy: book.price,
      title: book.title,
    });
  }

  const deliveryFee = setting.deliveryFee;
  const total = subtotal + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    total,
    orderItemsData,
    isStoreOpen: setting.isStoreOpen,
    closedMessage: setting.closedMessage,
  };
};

export default {
  getStoreSettings,
  verifyOrderItems,
};
