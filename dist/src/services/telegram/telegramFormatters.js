"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFeedbackMessage = exports.formatOrderStatusMessage = exports.formatConfirmedOrderForPrep = void 0;
const formatConfirmedOrderForPrep = (order) => {
    const itemsText = order.items
        ?.map((item, index) => `  ${index + 1}. <b>${item.book?.title || "كتاب"}</b> (الكمية: ${item.quantity}) - ${item.priceAtBuy} ج.م`)
        .join("\n") || "  لا توجد عناصر";
    const customerName = order.user?.name || "عميل غير محدد";
    const customerPhone = order.user?.phone || "غير متوفر";
    return (`📦 <b>طلب مؤكد وجاهز للتجهيز #${order.id}</b>\n\n` +
        `👤 <b>العميل:</b> ${customerName}\n` +
        `📞 <b>الهاتف:</b> ${customerPhone}\n` +
        `📍 <b>العنوان:</b> ${order.address}\n` +
        `💳 <b>طريقة الدفع:</b> ${order.paymentMethod}\n` +
        `🔢 <b>رقم التحويل:</b> <code>${order.transferNumber || "نقدي"}</code>\n` +
        `📝 <b>ملاحظات:</b> ${order.notes || "لا توجد"}\n\n` +
        `📚 <b>العناصر للتجهيز:</b>\n${itemsText}\n\n` +
        `💰 <b>المجموع الجزئي:</b> ${order.subtotal} ج.م\n` +
        `🚚 <b>رسوم التوصيل:</b> ${order.deliveryFee} ج.م\n` +
        `💵 <b>الإجمالي الكلي:</b> ${order.total} ج.م\n` +
        `📅 <b>التاريخ:</b> ${new Date(order.createdAt).toLocaleString("ar-EG")}`);
};
exports.formatConfirmedOrderForPrep = formatConfirmedOrderForPrep;
const formatOrderStatusMessage = (order, oldStatus, newStatus) => {
    return `🔄 <b>تحديث حالة الطلب #${order.id}</b>\n\n` +
        `👤 <b>العميل:</b> ${order.user?.name || "غير محدد"}\n` +
        `⚡ <b>الحالة السابقة:</b> ${oldStatus}\n` +
        `✅ <b>الحالة الجديدة:</b> <b>${newStatus}</b>\n` +
        `💵 <b>إجمالي الطلب:</b> ${order.total} ج.م`;
};
exports.formatOrderStatusMessage = formatOrderStatusMessage;
const formatFeedbackMessage = (suggestion, user) => {
    const userName = user?.name || suggestion?.customerName || "عميل زائر (بدون تسجيل)";
    const userPhone = user?.phone || suggestion?.phone || "غير متوفر";
    return `💡 <b>ملاحظة / اقتراح جديد</b>\n\n` +
        `👤 <b>المرسل:</b> ${userName}\n` +
        `📞 <b>الهاتف:</b> ${userPhone}\n` +
        `💬 <b>نص الاقتراح:</b>\n${suggestion.content}\n\n` +
        `📅 <b>التاريخ:</b> ${new Date(suggestion.createdAt || Date.now()).toLocaleString("ar-EG")}`;
};
exports.formatFeedbackMessage = formatFeedbackMessage;
