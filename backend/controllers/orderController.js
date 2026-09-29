const orderService = require("../services/orderService");

const razorpayService = require("../services/razorpayService");

const { generateInvoicePdf } = require("../services/invoiceService");

// CREATE ORDER
const createOrder = async (req, res) => {
  console.log("CREATE ORDER CONTROLLER HIT");

  console.log("PAYMENT METHOD:", req.body?.paymentMethod);

  try {
    const orderData = {
      ...req.body,
      user: req.user._id,
    };

    const order = await orderService.createOrder(orderData);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// GET LOGGED-IN USER'S ORDERS
const getOrders = async (req, res) => {
  try {
    console.log("=================================");
    console.log("GET ORDERS CONTROLLER HIT");
    console.log("LOGGED IN USER:", req.user);
    console.log("LOGGED IN USER ID:", req.user?._id);
    console.log("=================================");

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User authentication data not found",
      });
    }

    const userId = req.user._id;

    const orders = await orderService.getOrdersByUser(userId);

    console.log("ORDERS FOUND:", orders.length);

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get user orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    });
  }
};

// GET ALL CUSTOMERS' ORDERS
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      orderStatus = "",
      paymentStatus = "",
    } = req.query;

    const result = await orderService.getAllOrders({
      page,
      limit,
      search,
      orderStatus,
      paymentStatus,
    });

    res.status(200).json({
      success: true,
      orders: result.orders,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalOrders: result.totalOrders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get all orders",
      error: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get order",
      error: error.message,
    });
  }
};

// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    const orderStatus = req.body.orderStatus || req.body.status;

    const { courier, trackingNumber, trackingUrl } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "Order status is required",
      });
    }

    const order = await orderService.updateOrderStatus(
      req.params.id,
      orderStatus,
      courier,
      trackingNumber,
      trackingUrl
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// UPDATE ORDER TRACKING
const updateOrderTracking = async (req, res) => {
  try {
    const { courier, trackingNumber, trackingUrl } = req.body;

    if (trackingNumber === undefined && trackingUrl === undefined) {
      return res.status(400).json({
        success: false,
        message: "Tracking number or tracking URL is required",
      });
    }

    const order = await orderService.updateOrderTracking(
      req.params.id,
      courier,
      trackingNumber,
      trackingUrl
    );

    res.status(200).json({
      success: true,
      message: "Order tracking information updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order tracking error:", error);

    const statusCode =
      error.message === "Order not found" ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE RAZORPAY ORDER
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "MongoDB order ID is required",
      });
    }

    const receipt = `receipt_${Date.now()}`;

    // Create order in Razorpay
    const razorpayOrder =
      await razorpayService.createRazorpayOrder(
        amount,
        receipt
      );

    // Save Razorpay order ID in MongoDB order
    const updatedOrder =
      await orderService.updateRazorpayOrder(
        orderId,
        razorpayOrder.id,
        req.user._id
      );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "MongoDB order not found",
      });
    }

    res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      order: razorpayOrder,
      mongoOrder: updatedOrder,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};

// VERIFY RAZORPAY PAYMENT
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }

    // Step 1: Verify Razorpay signature
    const isValid =
      razorpayService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Step 2: Update MongoDB order
    const order =
      await orderService.verifyRazorpayPayment(
        orderId,
        req.user._id,
        razorpay_payment_id,
        razorpay_signature
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Step 3: Send success response
    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

const requestReturn = async (req, res) => {
  try {
    const order = await orderService.requestReturn(
      req.params.id,
      req.user._id,
      req.body.reason
    );

    res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      order,
    });
  } catch (error) {
    console.error("Request return error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// CUSTOMER CANCEL ORDER
const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrderByUser(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Customer cancel order error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN APPROVE / REJECT RETURN
const updateReturnStatus = async (req, res) => {
  try {
    const order = await orderService.updateReturnStatus(
      req.params.id,
      req.body.returnStatus
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Return ${req.body.returnStatus.toLowerCase()} successfully`,
      order,
    });
  } catch (error) {
    console.error("Update return status error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getBestSellingProducts = async (req, res) => {
  try {
    const products = await orderService.getBestSellingProducts();

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get best selling products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get best selling products",
      error: error.message,
    });
  }
};

// ================= DOWNLOAD ORDER INVOICE ==========
const downloadInvoice = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Customer can download only their own invoice
    if (
      req.user.role !== "admin" &&
      String(order.user?._id || order.user) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download this invoice",
      });
    }

    const invoiceBuffer = await generateInvoicePdf(order);

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${order._id}.pdf"`
    );

    return res.status(200).send(invoiceBuffer);
  } catch (error) {
    console.error("Invoice download failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
    });
  }
};

// CHECK REFUND STATUS
const checkRefundStatus = async (req, res, next) => {
  try {
    const order = await orderService.checkRefundStatus(req.params.id);

    res.status(200).json({
      success: true,
      message: "Refund status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PAYMENT STATUS
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;

    const order = await orderService.updateOrderPaymentStatus(
      req.params.id,
      paymentStatus
    );

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getAllOrders,
  getBestSellingProducts,
  createRazorpayOrder,
  updateOrderStatus,
  updateOrderTracking,
  cancelOrder,
  getOrderById,
  verifyRazorpayPayment,
  requestReturn,
  updateReturnStatus,
  downloadInvoice,
  checkRefundStatus,
  updatePaymentStatus,
};