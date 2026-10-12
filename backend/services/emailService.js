
require("dotenv").config();

// ================= RESEND API CONFIGURATION =================

const RESEND_API_URL = "https://api.resend.com/emails";

const getEmailConfig = () => {
  const apiKey = process.env.RESEND_API_KEY;

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "RIZO Fashion <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return { apiKey, fromEmail };
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

  const { apiKey, fromEmail } = getEmailConfig();

  const payload = {
    from: fromEmail,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  if (attachments.length > 0) {
    payload.attachments = attachments.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.isBuffer(attachment.content)
        ? attachment.content.toString("base64")
        : attachment.content,
      content_type:
        attachment.contentType || "application/octet-stream",
    }));
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Resend API error:",
      response.status,
      responseData.message ||
        responseData.name ||
        "Email request failed"
    );

    throw new Error(
      `Email delivery request failed (${response.status}): ${
        responseData.message ||
        responseData.name ||
        "Resend API error"
      }`
    );
  }

  console.log("Resend accepted email:", responseData.id);

  return responseData;
};

// ================= VERIFY EMAIL CONFIGURATION =================

const verifyEmailConnection = async () => {
  try {
    getEmailConfig();
    console.log("Resend API configuration is present");
    return true;
  } catch (error) {
    console.error(
      "Email configuration check failed:",
      error.message
    );
    return false;
  }
};

// ================= CUSTOMER REGISTRATION OTP =================

const sendOtpEmail = async (email, otp) => {
  try {
    if (!email) {
      throw new Error("Customer email is required");
    }

    return await sendEmail({
      to: email,
      subject: "RIZO - Email Verification OTP",
      text: `Your RIZO verification OTP is ${otp}.

It will expire in 10 minutes.

If you did not request this, please ignore this email.`,
    });
  } catch (error) {
    console.error(
      "Registration OTP email failed:",
      error.message
    );
    throw new Error("Failed to send OTP email");
  }
};

// ================= PASSWORD RESET OTP =================

const sendResetOtpEmail = async (email, otp) => {
  try {
    if (!email) {
      throw new Error("Recipient email is required");
    }

    return await sendEmail({
      to: email,
      subject: "RIZO - Password Reset OTP",
      text: `A password reset was requested for a RIZO account.

Your OTP is: ${otp}

This OTP expires in 10 minutes.

If you did not request this, please ignore this email.`,
    });
  } catch (error) {
    console.error(
      "Password reset email failed:",
      error.message
    );
    throw new Error(
      "Failed to send password reset OTP email"
    );
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
    console.error(
      "Order confirmation email failed:",
      error.message
    );
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
    console.error(
      "New order admin email failed:",
      error.message
    );
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
