
require("dotenv").config();

// ================= COMMON RESEND EMAIL SENDER =================

const sendEmail = async ({
  to,
  subject,
  text,
  replyTo,
  attachments = [],
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!fromEmail) {
    throw new Error("CONTACT_FROM_EMAIL is not configured");
  }

  if (!to) {
    throw new Error("Recipient email is required");
  }

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
      content: Buffer.from(attachment.content).toString("base64"),
      content_type: attachment.contentType || "application/octet-stream",
    }));
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Resend email failed:", result);
    throw new Error(
      result.message || result.error || `Email sending failed (${response.status})`
    );
  }

  console.log("Email sent successfully. Resend ID:", result.id);
  return result;
};

// ================= TEST EMAIL CONFIGURATION =================

const verifyEmailConnection = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!process.env.CONTACT_FROM_EMAIL) {
      throw new Error("CONTACT_FROM_EMAIL is not configured");
    }

    console.log("Resend email configuration is present");
    console.log("Sender email:", process.env.CONTACT_FROM_EMAIL);
  } catch (error) {
    console.error("Email configuration check failed:", error.message);
  }
};

// ================= SEND REGISTRATION OTP =================

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

// ================= SEND PASSWORD RESET OTP =================

const sendResetOtpEmail = async (email, otp) => {
  try {
    return await sendEmail({
      to: email,
      subject: "RIZO - Password Reset OTP",
      text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`,
    });
  } catch (error) {
    console.error("Password reset OTP email failed:", error.message);
    throw new Error("Failed to send password reset OTP email");
  }
};

// ================= SEND CONTACT MESSAGE TO ADMIN =================

const sendContactEmail = async ({ name, email, phone, comment }) => {
  try {
    const adminEmail = process.env.EMAIL_USER;

    if (!adminEmail) {
      throw new Error("Admin email (EMAIL_USER) is not configured");
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

--------------------------------
Submitted from the RIZO Fashion Contact page.
      `.trim(),
    });
  } catch (error) {
    console.error("Contact email failed:", error.message);
    throw new Error("Failed to send contact email");
  }
};

// ================= SEND CUSTOMER ORDER CONFIRMATION =================

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

${invoiceBuffer ? "Your PDF invoice is attached to this email." : "Your invoice is currently unavailable."}

Thank you for choosing RIZO Fashion!
      `.trim(),
      attachments,
    });
  } catch (error) {
    console.error("Order confirmation email failed:", error.message);
    throw error;
  }
};

// ================= SEND NEW ORDER NOTIFICATION TO ADMIN =================

const sendNewOrderAdminEmail = async ({ order, customer }) => {
  try {
    const adminEmail = process.env.EMAIL_USER;

    if (!adminEmail) {
      throw new Error("Admin email (EMAIL_USER) is not configured");
    }

    const orderId = order?._id?.toString() || "N/A";

    const customerName =
      customer?.name ||
      order?.shippingAddress?.fullName ||
      "Customer";

    const customerEmail = customer?.email || "N/A";
    const finalAmount = Number(order?.finalAmount || 0);

    return await sendEmail({
      to: adminEmail,
      subject: `RIZO - New Order Received #${orderId}`,
      text: `
New Order Received

A new order has been placed on RIZO Fashion.

Order ID: ${orderId}
Customer Name: ${customerName}
Customer Email: ${customerEmail}
Payment Method: ${order?.paymentMethod || "N/A"}
Payment Status: ${order?.paymentStatus || "N/A"}
Order Status: ${order?.orderStatus || "N/A"}
Total Amount: Rs. ${finalAmount.toFixed(2)}

Please log in to the admin panel to view the complete order details.
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
