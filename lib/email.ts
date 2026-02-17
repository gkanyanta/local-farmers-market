import { Resend } from "resend";

let resend: Resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface OrderEmailItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
}

function formatKwacha(amount: number) {
  return `K${amount.toFixed(2)}`;
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    CONFIRMED: "Confirmed",
    SOURCING: "Being Sourced",
    READY_FOR_PICKUP: "Ready for Pickup",
    PICKED_UP: "Picked Up",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

function getStatusMessage(status: string, orderNumber: string) {
  switch (status) {
    case "CONFIRMED":
      return `Great news! Your order <strong>${orderNumber}</strong> has been confirmed. We'll start sourcing your items soon.`;
    case "SOURCING":
      return `Your order <strong>${orderNumber}</strong> is now being sourced from our local farmers.`;
    case "READY_FOR_PICKUP":
      return `Your order <strong>${orderNumber}</strong> is ready for pickup! Please arrange collection at your earliest convenience.`;
    case "PICKED_UP":
      return `Your order <strong>${orderNumber}</strong> has been picked up. Thank you for supporting local farmers!`;
    case "CANCELLED":
      return `Your order <strong>${orderNumber}</strong> has been cancelled. If you have any questions, please contact us.`;
    default:
      return `Your order <strong>${orderNumber}</strong> status has been updated to ${getStatusText(status)}.`;
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  items: OrderEmailItem[],
  subtotal: number,
  pickupOption: string
) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const orderUrl = `${process.env.APP_BASE_URL}/orders`;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.qty} ${item.unit}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatKwacha(item.price * item.qty)}</td>
        </tr>`
    )
    .join("");

  const pickupText =
    pickupOption === "OWN_RIDER"
      ? "You'll be sending your own rider."
      : "A rider will be booked for you.";

  try {
    await getResend().emails.send({
      from: fromEmail,
      to: email,
      subject: `Order ${orderNumber} — Payment received`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#16a34a">Order Confirmed!</h2>
          <p>Thank you for your order. Your payment has been received and your order is being processed.</p>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:8px;text-align:left">Item</th>
                <th style="padding:8px;text-align:left">Qty</th>
                <th style="padding:8px;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:8px;font-weight:bold">Total</td>
                <td style="padding:8px;text-align:right;font-weight:bold">${formatKwacha(subtotal)}</td>
              </tr>
            </tfoot>
          </table>
          <p>${pickupText}</p>
          <p><a href="${orderUrl}" style="color:#16a34a">View your orders</a></p>
          <p style="color:#888;font-size:12px;margin-top:24px">Local Farmers Market — Fresh from Zambian farmers to you.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}

export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  status: string
) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const orderUrl = `${process.env.APP_BASE_URL}/orders`;

  try {
    await getResend().emails.send({
      from: fromEmail,
      to: email,
      subject: `Order ${orderNumber} — ${getStatusText(status)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>Order Update</h2>
          <p>${getStatusMessage(status, orderNumber)}</p>
          <p><a href="${orderUrl}" style="color:#16a34a">View your orders</a></p>
          <p style="color:#888;font-size:12px;margin-top:24px">Local Farmers Market — Fresh from Zambian farmers to you.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order status email:", error);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: fromEmail,
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
