const Order = require("../models/Order");

const Cart = require("../models/Cart");

const Product = require("../models/Product");

const User = require("../models/User");

const notificationService = require("./notificationService");

const productService = require("./productService");

const razorpayService = require("./razorpayService");

const {
  sendOrderConfirmationEmail,
  sendNewOrderAdminEmail,
} = require("./emailService");

const { generateInvoicePdf } = require("./invoiceService");

// ================= STOCK HELPERS ==========

const getProductId = (item) => {
  if (!item) return null;

  return item.product?._id || item.product;
};

const validateStockAvailability = async (items = []) => {
  for (const item of items) {
    const productId = getProductId(item);
    const quantity = Number(item.quantity);

    if (!productId) {
      throw new Error(
        "Product is required for each order item"
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "Quantity must be a positive integer"
      );
    }

    const product = await Product.findById(productId).select(
      "name stock"
    );

    if (!product) {
      throw new Error(
        `Product not found: ${productId}`
      );
    }

    if (product.stock < quantity) {
      throw new Error(
        `Not enough stock for ${product.name}. Available stock: ${product.stock}, requested: ${quantity}`
      );
    }
  }
};

const restoreStock = async (items = []) => {
  for (const item of items) {
    const productId = getProductId(item);
    const quantity = Number(item.quantity);

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      continue;
    }

    try {
      const updatedProduct =
        await Product.findByIdAndUpdate(
          productId,
          {
            $inc: {
              stock: quantity,
            },
          },
          {
            new: true,
          }
        );

      console.log(
        "STOCK RESTORED:",
        productId,
        "Quantity:",
        quantity,
        "New Stock:",
        updatedProduct
          ? updatedProduct.stock
          : "PRODUCT NOT FOUND"
      );
    } catch (error) {
      console.error(
        "Failed to restore stock:",
        productId,
        error.message
      );
    }
  }
};

const reduceStockForItems = async (items = []) => {
  const reducedItems = [];

  try {
    for (const item of items) {
      const productId = getProductId(item);
      const quantity = Number(item.quantity);

      const product =
        await productService.reduceProductStock(
          productId,
          quantity
        );

      if (!product) {
        throw new Error(
          `Not enough stock for product ${productId}`
        );
      }

      reducedItems.push({
        product: productId,
        quantity,
      });
    }

    return reducedItems;
  } catch (error) {
    if (reducedItems.length > 0) {
      await restoreStock(reducedItems);
    }

    throw error;
  }
};

// ================= BILLING ADDRESS HELPER ==========

const getBillingAddress = (
  shippingAddress,
  billingAddress
) => {
  /*
    Billing address logic:
    1. billingAddress is not sent
       -> use shipping address
    2. billingAddress === "same"
       -> use shipping address
    3. billingAddress === null
       -> use shipping address
    4. billingAddress is an object
       -> use the separate billing address

    This keeps existing checkout behavior working
    while supporting a different billing address.
  */

  if (
    billingAddress === undefined ||
    billingAddress === null ||
    billingAddress === "same"
  ) {
    return {
      fullName: shippingAddress?.fullName || "",
      phone: shippingAddress?.phone || "",
      address: shippingAddress?.address || "",
      apartment: shippingAddress?.apartment || "",
      city: shippingAddress?.city || "",
      state: shippingAddress?.state || "",
      pincode: shippingAddress?.pincode || "",
      country: shippingAddress?.country || "India",
    };
  }

  if (
    typeof billingAddress === "object" &&
    !Array.isArray(billingAddress)
  ) {
    return {
      fullName: billingAddress.fullName || "",
      phone: billingAddress.phone || "",
      address: billingAddress.address || "",
      apartment: billingAddress.apartment || "",
      city: billingAddress.city || "",
      state: billingAddress.state || "",
      pincode: billingAddress.pincode || "",
      country: billingAddress.country || "India",
    };
  }

  return {
    fullName: shippingAddress?.fullName || "",
    phone: shippingAddress?.phone || "",
    address: shippingAddress?.address || "",
    apartment: shippingAddress?.apartment || "",
    city: shippingAddress?.city || "",
    state: shippingAddress?.state || "",
    pincode: shippingAddress?.pincode || "",
    country: shippingAddress?.country || "India",
  };
};

// ================= CREATE ORDER =================

const createOrder = async (orderData) => {
  console.log(
    "CREATE ORDER SERVICE HIT:",
    {
      user: orderData.user,
      paymentMethod: orderData.paymentMethod,
    }
  );

  const items = orderData.items || [];

  const totalAmount =
    Number(orderData.totalAmount) || 0;

  const shippingCharge =
    totalAmount === 0
      ? 0
      : totalAmount < 699
      ? 50
      : 0;

  const finalAmount = Math.max(
    0,
    totalAmount +
      shippingCharge -
      (Number(orderData.discountAmount) || 0)
  );

  const paymentMethod = String(
    orderData.paymentMethod || ""
  ).toUpperCase();

  const shippingAddress =
    orderData.shippingAddress;

  if (!shippingAddress) {
    throw new Error(
      "Shipping address is required"
    );
  }

  const billingAddress =
    getBillingAddress(
      shippingAddress,
      orderData.billingAddress
    );

  console.log(
    "SHIPPING ADDRESS:",
    shippingAddress
  );

  console.log(
    "BILLING ADDRESS:",
    billingAddress
  );

  await validateStockAvailability(items);

  let reducedItems = [];

  if (paymentMethod === "COD") {
    reducedItems =
      await reduceStockForItems(items);
  }

  let order;

  try {
    order = await Order.create({
      ...orderData,
      shippingAddress,
      billingAddress,
      shippingCharge,
      finalAmount,
    });
  } catch (error) {
    if (reducedItems.length > 0) {
      await restoreStock(reducedItems);
    }

    throw error;
  }

  if (paymentMethod === "COD") {
    console.log("COD CART CLEAR: START");

    const cart = await Cart.findOne({
      user: order.user,
    });

    console.log(
      "COD CART BEFORE CLEAR:",
      cart ? cart.items.length : "NO CART"
    );

    if (cart) {
      cart.items = [];

      await cart.save();

      console.log(
        "COD CART CLEAR: SUCCESS"
      );
    }
  }

  await notificationService.createNotification({
    user: order.user,
    title: "Order Created",
    message:
      "Your order has been created successfully.",
    type: "ORDER",
  });

  const admin =
    await notificationService.getAdminUser();

  if (admin) {
    await notificationService.createNotification({
      user: admin._id,
      title: "New Order",
      message:
        "A new order has been placed.",
      type: "ORDER",
    });
  }

  if (admin) {
    try {
      const customer =
        await User.findById(order.user);

      await sendNewOrderAdminEmail({
        order,
        customer,
      });

      console.log(
        "NEW ORDER ADMIN EMAIL SENT SUCCESSFULLY"
      );
    } catch (adminEmailError) {
      console.error(
        "NEW ORDER ADMIN EMAIL FAILED:"
      );

      console.error(
        adminEmailError.message
      );
    }
  }

  if (paymentMethod === "COD") {
    try {
      const user =
        await User.findById(order.user);

      if (!user?.email) {
        console.log(
          "COD EMAIL SKIPPED: Customer email not found"
        );
      } else {
        const invoiceBuffer =
          await generateInvoicePdf(order);

        await sendOrderConfirmationEmail({
          order,
          user,
          invoiceBuffer,
        });

        console.log(
          "COD ORDER EMAIL SENT SUCCESSFULLY"
        );
      }
    } catch (emailError) {
      console.error(
        "COD ORDER EMAIL FAILED:"
      );

      console.error(
        emailError.message
      );
    }
  }

  return order;
};

// ================= GET USER ORDERS ==========

const getOrdersByUser = async (userId) => {
  const orders =
    await Order.find({
      user: userId,
    })
      .populate("items.product")
      .sort({
        createdAt: -1,
      });

  return orders;
};

// ================= GET ALL ORDERS ==========

const getAllOrders = async ({
  page = 1,
  limit = 10,
  search = "",
  orderStatus = "",
  paymentStatus = "",
} = {}) => {
  const currentPage = Math.max(
    parseInt(page, 10) || 1,
    1
  );

  const perPage = Math.max(
    parseInt(limit, 10) || 10,
    1
  );

  const skip =
    (currentPage - 1) * perPage;

  const query = {};

  if (orderStatus) {
    query.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  const searchText = search.trim();

  if (searchText) {
    const regex = new RegExp(
      searchText,
      "i"
    );

    const users =
      await User.find({
        $or: [
          {
            name: regex,
          },
          {
            email: regex,
          },
        ],
      }).select("_id");

    const searchConditions = [
      {
        user: {
          $in: users.map(
            (user) => user._id
          ),
        },
      },
    ];

    if (
      /^[0-9a-fA-F]{24}$/.test(
        searchText
      )
    ) {
      searchConditions.push({
        _id: searchText,
      });
    }

    query.$or = searchConditions;
  }

  const totalOrders =
    await Order.countDocuments(query);

  const totalPages =
    Math.ceil(
      totalOrders / perPage
    );

  const orders =
    await Order.find(query)
      .populate("items.product")
      .populate("user")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(perPage);

  const safeOrders =
    orders.map((order) => {
      const orderObject =
        order.toObject();

      if (orderObject.user) {
        orderObject.user = {
          _id: orderObject.user._id,
          name: orderObject.user.name,
          email: orderObject.user.email,
          phone: orderObject.user.phone,
          role: orderObject.user.role,
          status: orderObject.user.status,
          isEmailVerified:
            orderObject.user
              .isEmailVerified,
          profileCompleted:
            orderObject.user
              .profileCompleted,
        };
      }

      return orderObject;
    });

  return {
    orders: safeOrders,
    currentPage,
    totalPages,
    totalOrders,
  };
};

// ================= GET ORDER BY ID ==========

const getOrderById = async (orderId) => {
  const order =
    await Order.findById(orderId)
      .populate("items.product")
      .populate({
        path: "user",
        select:
          "_id name email phone role status isEmailVerified profileCompleted",
      });

  return order;
};

// ================= UPDATE ORDER STATUS ==========

const updateOrderStatus = async (
  orderId,
  orderStatus,
  courier,
  trackingNumber,
  trackingUrl
) => {
  const existingOrder =
    await Order.findById(orderId);

  if (!existingOrder) {
    return null;
  }

  const paymentMethod =
    String(
      existingOrder.paymentMethod || ""
    ).toUpperCase();

  const stockWasDeducted =
    paymentMethod === "COD" ||
    (paymentMethod === "RAZORPAY" &&
      existingOrder.paymentStatus === "PAID") ||
    (!paymentMethod &&
      existingOrder.orderStatus !== "PENDING");

  if (
    orderStatus === "CANCELLED" &&
    existingOrder.orderStatus !== "CANCELLED" &&
    stockWasDeducted
  ) {
    await restoreStock(
      existingOrder.items
    );
  }

  const updateData = {
    orderStatus,
  };

  // ================= TRACKING UPDATE =================

  if (orderStatus === "SHIPPED") {
    if (trackingNumber !== undefined) {
      updateData.trackingNumber =
        String(trackingNumber).trim();
    }

    if (trackingUrl !== undefined) {
      updateData.trackingUrl =
        String(trackingUrl).trim();
    }

    if (courier !== undefined) {
      updateData.courier =
        String(courier).trim();
    }
  }

  const order =
    await Order.findByIdAndUpdate(
      orderId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

  if (order) {
    await notificationService.createNotification({
      user: order.user,
      title: "Order Status Updated",
      message:
        `Your order status is now ${orderStatus}.`,
      type: "ORDER",
    });
  }

  return order;
};

// ================= UPDATE ORDER TRACKING =================

const updateOrderTracking = async (
  orderId,
  courier,
  trackingNumber,
  trackingUrl
) => {
  const existingOrder =
    await Order.findById(orderId);

  if (!existingOrder) {
    throw new Error(
      "Order not found"
    );
  }

  if (
    existingOrder.orderStatus !==
    "SHIPPED"
  ) {
    throw new Error(
      "Tracking information can be updated only for shipped orders"
    );
  }

  if (
    trackingNumber === undefined &&
    trackingUrl === undefined &&
    courier === undefined
  ) {
    throw new Error(
      "Tracking number, tracking URL, or courier is required"
    );
  }

  const updateData = {};

  if (trackingNumber !== undefined) {
    updateData.trackingNumber =
      String(trackingNumber).trim();
  }

  if (trackingUrl !== undefined) {
    updateData.trackingUrl =
      String(trackingUrl).trim();
  }

  if (courier !== undefined) {
    updateData.courier =
      String(courier).trim();
  }

  const order =
    await Order.findByIdAndUpdate(
      orderId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  return order;
};

// ================= CUSTOMER CANCEL ORDER ==========

const cancelOrderByUser = async (
  orderId,
  userId,
  userRole
) => {
  const isAdmin =
    String(userRole || "").toLowerCase() ===
    "admin";

  const order = isAdmin
    ? await Order.findById(orderId)
    : await Order.findOne({
        _id: orderId,
        user: userId,
      });

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  if (
    [
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ].includes(order.orderStatus)
  ) {
    throw new Error(
      "Order cannot be cancelled at this stage"
    );
  }

  if (
    order.orderStatus ===
    "CANCELLED"
  ) {
    throw new Error(
      "Order is already cancelled"
    );
  }

  const paymentMethod =
    String(
      order.paymentMethod || ""
    ).toUpperCase();

  const stockWasDeducted =
    paymentMethod === "COD" ||
    (paymentMethod === "RAZORPAY" &&
      order.paymentStatus === "PAID");

  if (stockWasDeducted) {
    await restoreStock(order.items);
  }

  order.orderStatus = "CANCELLED";

  if (
    paymentMethod === "RAZORPAY" &&
    order.paymentStatus === "PAID"
  ) {
    order.refundStatus = "PENDING";

    order.refundAmount =
      Number(order.finalAmount) || 0;
  }

  await order.save();

  await notificationService.createNotification({
    user: order.user,
    title: "Order Cancelled",
    message:
      "Your order has been cancelled successfully.",
    type: "ORDER",
  });

  return order;
};

// ================= REQUEST RETURN ==========

const requestReturn = async (
  orderId,
  userId,
  reason
) => {
  const order =
    await Order.findById(orderId);

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  if (
    order.user.toString() !==
    userId.toString()
  ) {
    throw new Error(
      "You are not authorized to request return for this order"
    );
  }

  if (
    order.orderStatus !==
    "DELIVERED"
  ) {
    throw new Error(
      "Return can be requested only for delivered orders"
    );
  }

  if (
    order.returnStatus !==
    "NONE"
  ) {
    throw new Error(
      "Return request already exists for this order"
    );
  }

  if (
    !reason ||
    !reason.trim()
  ) {
    throw new Error(
      "Return reason is required"
    );
  }

  order.returnStatus = "REQUESTED";
  order.returnReason = reason.trim();
  order.returnRequestedAt = new Date();

  await order.save();

  return order;
};

// ================= ADMIN APPROVE / REJECT RETURN ==========

const updateReturnStatus = async (
  orderId,
  returnStatus
) => {
  const order =
    await Order.findById(orderId);

  if (!order) {
    return null;
  }

  if (
    order.returnStatus !==
    "REQUESTED"
  ) {
    throw new Error(
      "There is no pending return request for this order"
    );
  }

  if (
    ![
      "APPROVED",
      "REJECTED",
    ].includes(returnStatus)
  ) {
    throw new Error(
      "Invalid return status"
    );
  }

  if (
    returnStatus ===
    "REJECTED"
  ) {
    order.returnStatus = "REJECTED";
    order.refundStatus = "NOT_APPLICABLE";
    order.refundAmount = 0;
    order.refundId = "";
    order.refundedAt = null;

    await order.save();

    return order;
  }

  if (
    order.paymentMethod !==
    "RAZORPAY"
  ) {
    order.returnStatus = "APPROVED";
    order.refundStatus = "NOT_APPLICABLE";
    order.refundAmount = 0;

    await order.save();

    return order;
  }

  if (
    order.paymentStatus !==
    "PAID"
  ) {
    throw new Error(
      "Razorpay refund is possible only for a paid order"
    );
  }

  if (!order.razorpayPaymentId) {
    throw new Error(
      "Razorpay payment ID not found for this order"
    );
  }

  if (order.refundId) {
    throw new Error(
      "Refund has already been created for this order"
    );
  }

  const refundAmount =
    Number(order.finalAmount);

  if (
    !Number.isFinite(refundAmount) ||
    refundAmount <= 0
  ) {
    throw new Error(
      "Invalid refund amount"
    );
  }

  try {
    const refund =
      await razorpayService.createRefund(
        order.razorpayPaymentId,
        refundAmount
      );

    order.returnStatus = "APPROVED";
    order.refundAmount = refundAmount;
    order.refundId = refund.id || "";

    order.refundStatus =
      refund.status === "processed"
        ? "COMPLETED"
        : "PROCESSING";

    if (refund.created_at) {
      order.refundedAt =
        new Date(
          refund.created_at * 1000
        );
    } else {
      order.refundedAt = new Date();
    }

    await order.save();

    return order;
  } catch (error) {
    console.error(
      "Razorpay refund failed:",
      error.message
    );

    order.returnStatus = "REQUESTED";
    order.refundStatus = "PENDING";

    await order.save();

    throw new Error(
      `Razorpay refund failed: ${error.message}`
    );
  }
};

// ================= BEST SELLING PRODUCTS ==========

const getBestSellingProducts = async () => {
  const bestSellers =
    await Order.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          orderStatus: {
            $nin: ["CANCELLED"],
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.product",
          totalSold: {
            $sum: "$items.quantity",
          },
        },
      },
      {
        $sort: {
          totalSold: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $project: {
          _id: 0,
          product: 1,
          totalSold: 1,
        },
      },
    ]);

  return bestSellers;
};

// ================= UPDATE RAZORPAY ORDER ==========

const updateRazorpayOrder = async (
  orderId,
  razorpayOrderId,
  userId
) => {
  const order =
    await Order.findOneAndUpdate(
      {
        _id: orderId,
        user: userId,
      },
      {
        razorpayOrderId,
      },
      {
        new: true,
      }
    );

  return order;
};

// ================= VERIFY RAZORPAY PAYMENT ==========

const verifyRazorpayPayment = async (
  orderId,
  userId,
  razorpayPaymentId,
  razorpaySignature
) => {
  const existingOrder =
    await Order.findOne({
      _id: orderId,
      user: userId,
    });

  if (!existingOrder) {
    return null;
  }

  if (
    existingOrder.paymentStatus ===
    "PAID"
  ) {
    return existingOrder;
  }

  const paymentMethod =
    String(
      existingOrder.paymentMethod || ""
    ).toUpperCase();

  if (
    paymentMethod === "COD"
  ) {
    throw new Error(
      "Razorpay payment verification is allowed only for Razorpay orders"
    );
  }

  const reducedItems =
    await reduceStockForItems(
      existingOrder.items || []
    );

  try {
    const order =
      await Order.findOneAndUpdate(
        {
          _id: orderId,
          user: userId,
          paymentStatus: {
            $ne: "PAID",
          },
        },
        {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          razorpayPaymentId,
          razorpaySignature,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!order) {
      await restoreStock(reducedItems);

      return await Order.findOne({
        _id: orderId,
        user: userId,
      });
    }

    const cart =
      await Cart.findOne({
        user: userId,
      });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    try {
      const user =
        await User.findById(order.user);

      if (!user?.email) {
        console.log(
          "RAZORPAY EMAIL SKIPPED: Customer email not found"
        );
      } else {
        const invoiceBuffer =
          await generateInvoicePdf(order);

        await sendOrderConfirmationEmail({
          order,
          user,
          invoiceBuffer,
        });

        console.log(
          "RAZORPAY ORDER EMAIL SENT SUCCESSFULLY"
        );
      }
    } catch (emailError) {
      console.error(
        "RAZORPAY ORDER EMAIL FAILED:"
      );

      console.error(
        emailError.message
      );
    }

    return order;
  } catch (error) {
    await restoreStock(reducedItems);

    throw error;
  }
};

// ================= CHECK RAZORPAY REFUND STATUS =================

const checkRefundStatus = async (orderId) => {
  const order =
    await Order.findById(orderId);

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  if (!order.refundId) {
    throw new Error(
      "Refund ID not found for this order"
    );
  }

  const refund =
    await razorpayService.getRefund(
      order.refundId
    );

  console.log(
    "Razorpay refund status:",
    refund.status
  );

  if (
    refund.status === "processed"
  ) {
    order.refundStatus = "COMPLETED";
  } else if (
    refund.status === "failed"
  ) {
    order.refundStatus = "FAILED";
  } else {
    order.refundStatus = "PROCESSING";
  }

  if (refund.created_at) {
    order.refundedAt =
      new Date(
        refund.created_at * 1000
      );
  }

  await order.save();

  return order;
};

// ================= UPDATE PAYMENT STATUS ==========

const updateOrderPaymentStatus = async (
  orderId,
  paymentStatus
) => {
  const allowedStatuses = [
    "PENDING",
    "PAID",
    "FAILED",
  ];

  if (
    !allowedStatuses.includes(
      paymentStatus
    )
  ) {
    throw new Error(
      "Invalid payment status. Allowed values: PENDING, PAID, FAILED"
    );
  }

  const order =
    await Order.findById(orderId);

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  // Manual payment status update is only for COD
  if (
    order.paymentMethod !==
    "COD"
  ) {
    throw new Error(
      "Payment status can be manually updated only for COD orders"
    );
  }

  order.paymentStatus =
    paymentStatus;

  if (
    paymentStatus === "PAID"
  ) {
    order.paidAt = new Date();
  }

  await order.save();

  return order;
};

// ================= EXPORTS ==========

module.exports = {
  createOrder,
  getOrdersByUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
  cancelOrderByUser,
  requestReturn,
  updateReturnStatus,
  getBestSellingProducts,
  updateRazorpayOrder,
  verifyRazorpayPayment,
  checkRefundStatus,
  updateOrderPaymentStatus,
};