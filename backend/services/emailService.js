
require("dotenv").config();
const nodemailer = require("nodemailer");

// ================= GMAIL SMTP CONFIGURATION =================

const createTransporter = () => {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpAppPassword = process.env.SMTP_APP_PASSWORD;

  if (!smtpEmail || !smtpAppPassword) {
    throw new Error(
      "SMTP_EMAIL or SMTP_APP_PASSWORD is not configured"
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: {
      user: smtpEmail,
      pass: smtpAppPassword,
    },
  });
};

// ================= COMMON EMAIL SENDER =================

const sendEmail = async ({
  to,
  subject,
  text,
  replyTo,
  attachments = [],
}) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  const transporter = createTransporter();

  try {
    const result = await transporter.sendMail({
      from: {
        name: "RIZO Fashion",
        address: process.env.SMTP_EMAIL,
      },
      to,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType:
          attachment.contentType || "application/octet-stream",
      })),
    });

    console.log("Email accepted by SMTP server:", result.messageId);
    return result;
  } finally {
    transporter.close();
  }
};

// ================= VERIFY EMAIL CONFIGURATION =================

const verifyEmailConnection = async () => {
  let transporter;

  try {
    transporter = createTransporter();
    await transporter.verify();
    console.log("Gmail SMTP connection verified");
    return true;
  } catch (error) {
    console.error("Email connection check failed:", error.message);
    return false;
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
};

// ================= REGISTRATION OTP =================

const sendOtpEmail = async (email, otp) => {
  try {
    return await sendEmail({
      to: email,
      subject: "RIZO - Email Verification OTP",
      text: `Your verification OTP is ${otp}. It will expire in 10 minutes.`,
    });
  } catch (error) {
    console.error("Registration OTP email failed:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

// ================= PASSWORD RESET OTP TO ADMIN =================

const sendResetOtpEmail = async (email, otp) => {
  try {
    return await sendEmail({
      to: email,
      subject: "RIZO - Password Reset OTP",
      text: `A password reset was requested for a RIZO account.

OTP: ${otp}

This OTP expires in 10 minutes.`,
    });
  } catch (error) {
    console.error("Password reset email failed:", error.message);
    throw new Error("Failed to send password reset OTP email");
  }
};

// ================= CONTACT MESSAGE TO ADMIN =================

const sendContactEmail = async ({
  name,
  email,
  phone,
  comment,
}) => {
  try {
    const adminEmail = process.env.EMAIL_USER;

    if (!adminEmail) {
      throw new Error("EMAIL_USER is not configured");
    }

    return await sendEmail({
      to: adminEmail,
      replyTo: email,
      subject: "New Contact Form Message - RIZO Fashion",
      text: `
New Contact Form Message

Name: ${name || "N/A"}
Email: ${email || "N/A"}
Phone: ${phone || "N/A"}

Message:
${comment || "No message provided"}

Submitted from the RIZO Fashion Contact page.
      `.trim(),
    });
  } catch (error) {
    console.error("Contact email failed:", error.message);
    throw new Error("Failed to send contact email");
  }
};

// ================= CUSTOMER ORDER CONFIRMATION =================

const sendOrderConfirmationEmail = async ({
  order,
  user,
  invoiceBuffer,
}) => {
  try {
    if (!user?.email) {
      throw new Error("Customer email not found");
    }

    const customerName =
      user.name ||
      order?.shippingAddress?.fullName ||
      "Customer";

    const orderId = order?._id?.toString() || "N/A";
    const finalAmount = Number(order?.finalAmount || 0);

    const attachments = invoiceBuffer
      ? [
          {
            filename: `invoice-${orderId}.pdf`,
            content: invoiceBuffer,
            contentType: "application/pdf",
          },
        ]
      : [];

    return await sendEmail({
      to: user.email,
      subject: `RIZO - Order Confirmation #${orderId}`,
      text: `
Hello ${customerName},

Thank you for shopping with RIZO Fashion!

Your order has been confirmed.

Order ID: ${orderId}
Payment Method: ${order?.paymentMethod || "N/A"}
Payment Status: ${order?.paymentStatus || "N/A"}
Order Status: ${order?.orderStatus || "N/A"}
Total Amount: Rs. ${finalAmount.toFixed(2)}

${
  invoiceBuffer
    ? "Your PDF invoice is attached."
    : "Your invoice is currently unavailable."
}

Thank you for choosing RIZO Fashion!
      `.trim(),
      attachments,
    });
  } catch (error) {
    console.error("Order confirmation email failed:", error.message);
    throw error;
  }
};

// ================= NEW ORDER NOTIFICATION TO ADMIN =================

const sendNewOrderAdminEmail = async ({ order, customer }) => {
  try {
    const adminEmail = process.env.EMAIL_USER;

    if (!adminEmail) {
      throw new Error("EMAIL_USER is not configured");
    }

    const orderId = order?._id?.toString() || "N/A";

    const customerName =
      customer?.name ||
      order?.shippingAddress?.fullName ||
      "Customer";

    const finalAmount = Number(order?.finalAmount || 0);

    return await sendEmail({
      to: adminEmail,
      subject: `RIZO - New Order Received #${orderId}`,
      text: `
New Order Received

Order ID: ${orderId}
Customer Name: ${customerName}
Customer Email: ${customer?.email || "N/A"}
Payment Method: ${order?.paymentMethod || "N/A"}
Payment Status: ${order?.paymentStatus || "N/A"}
Order Status: ${order?.orderStatus || "N/A"}
Total Amount: Rs. ${finalAmount.toFixed(2)}

Please log in to the RIZO admin panel to view the order.
      `.trim(),
    });
  } catch (error) {
    console.error("New order admin email failed:", error.message);
    throw error;
  }
};

// ================= EXPORT FUNCTIONS =================

module.exports = {
  verifyEmailConnection,
  sendOtpEmail,
  sendResetOtpEmail,
  sendContactEmail,
  sendOrderConfirmationEmail,
  sendNewOrderAdminEmail,
};
