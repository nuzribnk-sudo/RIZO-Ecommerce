
require("dotenv").config();

const nodemailer = require("nodemailer");

// ================= EMAIL TRANSPORT =================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});

// ================= TEST EMAIL CONNECTION =================

const verifyEmailConnection = async () => {
  try {
    await transporter.verify();

    console.log("Email server is ready");
    console.log("Sender email:", process.env.EMAIL_USER);
  } catch (error) {
    console.error("Email server connection failed:");
    console.error(error.message);
  }
};

// ================= SEND REGISTRATION OTP =================

const sendOtpEmail = async (email, otp) => {
  try {
    console.log("=================================");
    console.log("Sending registration OTP");
    console.log("From:", process.env.EMAIL_USER);
    console.log("To:", email);
    console.log("=================================");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "E-Commerce Email Verification OTP",
      text: `Your verification OTP is ${otp}. It will expire in 10 minutes.`,
    });

    console.log("Registration OTP email sent successfully");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Registration OTP email failed:");
    console.error(error.message);

    throw new Error("Failed to send OTP email");
  }
};

// ================= SEND RESET PASSWORD OTP =================

const sendResetOtpEmail = async (email, otp) => {
  try {
    console.log("=================================");
    console.log("Sending password reset OTP");
    console.log("From:", process.env.EMAIL_USER);
    console.log("To:", email);
    console.log("=================================");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "E-Commerce Password Reset OTP",
      text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`,
    });

    console.log("Password reset OTP email sent successfully");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Password reset OTP email failed:");
    console.error(error.message);

    throw new Error("Failed to send password reset OTP email");
  }
};

// ================= SEND CONTACT MESSAGE =================

const sendContactEmail = async ({
  name,
  email,
  phone,
  comment,
}) => {
  try {
    console.log("=================================");
    console.log("Sending contact message email");
    console.log("From:", process.env.EMAIL_USER);
    console.log("Customer:", email);
    console.log("=================================");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "New Contact Form Message - E-Commerce",
      text: `
New Contact Form Message

Name: ${name}
Email: ${email}
Phone: ${phone}

Comment:
${comment}

--------------------------------
This message was submitted from the E-Commerce website Contact page.
      `,
    });

    console.log("Contact email sent successfully");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Contact email failed:");
    console.error(error.message);

    throw new Error("Failed to send contact email");
  }
};

// ================= SEND ORDER CONFIRMATION EMAIL =================

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
      order.shippingAddress?.fullName ||
      "Customer";

    const orderId = order._id?.toString() || "N/A";
    const finalAmount = Number(order.finalAmount || 0);

    console.log("=================================");
    console.log("Sending order confirmation email");
    console.log("From:", process.env.EMAIL_USER);
    console.log("To:", user.email);
    console.log("Order ID:", orderId);
    console.log("=================================");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Order Confirmation - #${orderId}`,
      text: `
Hello ${customerName},

Thank you for your order!

Your order has been confirmed successfully.

Order ID: ${orderId}
Payment Method: ${order.paymentMethod || "N/A"}
Payment Status: ${order.paymentStatus || "N/A"}
Order Status: ${order.orderStatus || "N/A"}
Total Amount: Rs. ${finalAmount.toFixed(2)}

Your invoice is attached to this email as a PDF.

Thank you for choosing Rizo Fashion!
      `,
      attachments: invoiceBuffer
        ? [
            {
              filename: `invoice-${orderId}.pdf`,
              content: invoiceBuffer,
              contentType: "application/pdf",
            },
          ]
        : [],
    });

    console.log("Order confirmation email sent successfully");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Order confirmation email failed:");
    console.error(error.message);

    throw error;
  }
};

// ================= SEND NEW ORDER ADMIN EMAIL =================

const sendNewOrderAdminEmail = async ({
  order,
  customer,
}) => {
  try {
    const adminEmail = process.env.EMAIL_USER;

    if (!adminEmail) {
      throw new Error("Admin email not configured");
    }

    const orderId = order._id?.toString() || "N/A";

    const customerName =
      customer?.name ||
      order.shippingAddress?.fullName ||
      "Customer";

    const customerEmail = customer?.email || "N/A";
    const finalAmount = Number(order.finalAmount || 0);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New Order Received - #${orderId}`,
      text: `
New Order Received

A new order has been placed on Rizo Fashion.

Order ID: ${orderId}
Customer Name: ${customerName}
Customer Email: ${customerEmail}
Payment Method: ${order.paymentMethod || "N/A"}
Payment Status: ${order.paymentStatus || "N/A"}
Order Status: ${order.orderStatus || "N/A"}
Total Amount: Rs. ${finalAmount.toFixed(2)}

Please log in to the admin panel to view the complete order details.
      `,
    });

    console.log("New order admin email sent successfully");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("New order admin email failed:");
    console.error(error.message);

    throw error;
  }
};

module.exports = {
  verifyEmailConnection,
  sendOtpEmail,
  sendResetOtpEmail,
  sendContactEmail,
  sendOrderConfirmationEmail,
  sendNewOrderAdminEmail,
};
