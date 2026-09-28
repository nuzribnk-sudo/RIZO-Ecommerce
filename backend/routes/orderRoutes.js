const express = require("express");

const orderController = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// TEST
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Order routes working",
  });
});

// CREATE ORDER
router.post(
  "/",
  protect,
  orderController.createOrder
);

// RAZORPAY CREATE ORDER
router.post(
  "/razorpay/create-order",
  protect,
  orderController.createRazorpayOrder
);

// RAZORPAY VERIFY PAYMENT
router.post(
  "/razorpay/verify",
  protect,
  orderController.verifyRazorpayPayment
);

// BEST SELLING PRODUCTS
router.get(
  "/best-sellers",
  protect,
  orderController.getBestSellingProducts
);

// LOGGED-IN USER ORDERS
router.get(
  "/",
  protect,
  orderController.getOrders
);

// UPDATE PAYMENT STATUS - ADMIN ONLY
router.put(
  "/:id/payment-status",
  protect,
  adminOnly,
  orderController.updatePaymentStatus
);

// ALL ORDERS - ADMIN ONLY
router.get(
  "/all",
  protect,
  adminOnly,
  orderController.getAllOrders
);

// DOWNLOAD ORDER INVOICE
router.get(
  "/:id/invoice",
  protect,
  orderController.downloadInvoice
);

// SINGLE ORDER
router.get(
  "/:id",
  protect,
  orderController.getOrderById
);

// UPDATE ORDER STATUS - ADMIN ONLY
router.put(
  "/:id/status",
  protect,
  adminOnly,
  orderController.updateOrderStatus
);

// UPDATE ORDER TRACKING - ADMIN ONLY
router.patch(
  "/:id/tracking",
  protect,
  adminOnly,
  orderController.updateOrderTracking
);

// CUSTOMER CANCEL ORDER
router.put(
  "/:id/cancel",
  protect,
  orderController.cancelOrder
);

// CUSTOMER REQUEST RETURN
router.post(
  "/:id/return",
  protect,
  orderController.requestReturn
);

// ADMIN APPROVE / REJECT RETURN
router.put(
  "/:id/return-status",
  protect,
  adminOnly,
  orderController.updateReturnStatus
);

// CHECK RAZORPAY REFUND STATUS - ADMIN ONLY
router.get(
  "/:id/refund-status",
  protect,
  adminOnly,
  orderController.checkRefundStatus
);

module.exports = router;