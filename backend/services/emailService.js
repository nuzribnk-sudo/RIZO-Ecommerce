
require("dotenv").config();

// ================= BREVO API CONFIGURATION =================

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const getEmailConfig = () => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const adminEmail = process.env.EMAIL_USER;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  if (!fromEmail) {
    throw new Error("BREVO_FROM_EMAIL is not configured");
  }

  return {
    apiKey,
    fromEmail,
    adminEmail,
  };
};

// ================= COMMON EMAIL SENDER =================

const sendEmail = async ({
  to,
  subject,
  text,
  replyTo,
  attachments = [],
}) => {
  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new Error("Recipient email is required");
  }

  if (!subject || !text) {
    throw new Error("Email subject and content are required");
  }

  const { apiKey, fromEmail } = getEmailConfig();

  const recipients = (Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((email) => ({ email }));

  if (recipients.length === 0) {
    throw new Error("A valid recipient email is required");
  }

  const payload = {
    sender: {
      name: "RIZO Fashion",
      email: fromEmail,
    },
    to: recipients,
    subject,
    textContent: text,
  };

  if (replyTo) {
    payload.replyTo = {
      email: replyTo,
    };
  }

  if (attachments.length > 0) {
    payload.attachment = attachments.map((attachment) => {
      if (!attachment.content) {
        throw new Error(
          `Missing content for attachment: ${attachment.filename}`
        );
      }

      const content = Buffer.isBuffer(attachment.content)
        ? attachment.content.toString("base64")
        : Buffer.from(attachment.content).toString("base64");

      return {
        name: attachment.filename,
        content,
      };
    });
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  let result = {};

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    result = { message: responseText };
  }

  if (!response.ok) {
    console.error("Brevo email API failed:", {
      status: response.status,
      message: result.message || "Email sending failed",
      code: result.code,
    });

    throw new Error(
      result.message || `Brevo email API error: ${response.status}`
    );
  }

  console.log("Brevo accepted email:", result.messageId || "Accepted");

  return result;
};

// ================= VERIFY EMAIL CONFIGURATION =================

const verifyEmailConnection = async () => {
  try {
    getEmailConfig();

    // This checks configuration only.
    // Actual API connectivity is checked when an email is sent.
    console.log("Brevo email configuration is present.");

    return true;
  } catch (error) {
    console.error("Email configuration check failed:", error.message);
    return false;
  }
};

// ================= CUSTOMER REGISTRATION OTP =================

const sendOtpEmail = async (email, otp) => {
  try {
    if (!email) {
      throw new Error("Customer email is required");
    }

    if (!otp) {
      throw new Error("OTP is required");
    }

    return await sendEmail({
      to: email,
      subject: "RIZO - Email Verification OTP",
      text: `Your RIZO verification OTP is ${otp}.

It will expire in 10 minutes.

If you did not request this, please ignore this email.`,
    });
  } catch (error) {
    console.error("Registration OTP email failed:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

// ================= PASSWORD RESET OTP =================

const sendResetOtpEmail = async (email, otp) => {
  try {
    if (!email) {
      throw new Error("Recipient email is required");
    }

    if (!otp) {
      throw new Error("OTP is required");
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
    console.error("Password reset email failed:", error.message);
    throw new Error("Failed to send password reset OTP email");
  }
};

// ================= CONTACT MESSAGE TO ADMIN =================

const sendContactEmail = async ({ name, email, phone, comment }) => {
  try {
    const { adminEmail } = getEmailConfig();

    if (!adminEmail) {
      throw new Error("EMAIL_USER is not configured");
    }

    return await sendEmail({
      to: adminEmail,
      replyTo: email,
      subject: "New Contact Form Message - RIZO Fashion",
      text: `New Contact Form Message

Name: ${name || "N/A"}
Email: ${email || "N/A"}
Phone: ${phone || "N/A"}

Message:
${comment || "No message provided"}

Submitted from the RIZO Fashion Contact page.`,
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
      user.name || order?.shippingAddress?.fullName || "Customer";

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
      text: `Hello ${customerName},

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

Thank you for choosing RIZO Fashion!`,
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
    const { adminEmail } = getEmailConfig();

    if (!adminEmail) {
      throw new Error("EMAIL_USER is not configured");
    }

    const orderId = order?._id?.toString() || "N/A";

    const customerName =
      customer?.name || order?.shippingAddress?.fullName || "Customer";

    const finalAmount = Number(order?.finalAmount || 0);

    return await sendEmail({
      to: adminEmail,
      subject: `RIZO - New Order Received #${orderId}`,
      text: `New Order Received

Order ID: ${orderId}
Customer Name: ${customerName}
Customer Email: ${customer?.email || "N/A"}
Payment Method: ${order?.paymentMethod || "N/A"}
Payment Status: ${order?.paymentStatus || "N/A"}
Order Status: ${order?.orderStatus || "N/A"}
Total Amount: Rs. ${finalAmount.toFixed(2)}

Please log in to the RIZO admin panel to view the order.`,
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
