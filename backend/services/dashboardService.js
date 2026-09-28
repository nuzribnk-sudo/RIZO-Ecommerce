const Product = require("../models/Product");
const Category = require("../models/Category");
const Coupon = require("../models/coupon");
const User = require("../models/User");
const Order = require("../models/Order");

// ================= SUMMARY =================

const getDashboardSummary = async () => {
  const [
    totalProducts,
    totalCategories,
    totalCoupons,
    totalCustomers,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    paidOrders,
    revenueResult,
  ] = await Promise.all([
    Product.countDocuments(),

    Category.countDocuments(),

    Coupon.countDocuments(),

    User.countDocuments({
      role: "user",
    }),

    Order.countDocuments(),

    Order.countDocuments({
      orderStatus: "PENDING",
    }),

    Order.countDocuments({
      orderStatus: "DELIVERED",
    }),

    Order.countDocuments({
      orderStatus: "CANCELLED",
    }),

    Order.countDocuments({
      paymentStatus: "PAID",
      orderStatus: { $ne: "CANCELLED" },
    }),

    Order.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          orderStatus: { $ne: "CANCELLED" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$finalAmount",
          },
        },
      },
    ]),
  ]);

  const totalRevenue =
    revenueResult.length > 0
      ? revenueResult[0].totalRevenue
      : 0;

  return {
    products: totalProducts,
    categories: totalCategories,
    coupons: totalCoupons,
    customers: totalCustomers,

    orders: totalOrders,

    pendingOrders,
    completedOrders,
    cancelledOrders,

    sales: paidOrders,
    revenue: totalRevenue,
  };
};

// ================= REVENUE / SALES =================

const getRevenueData = async (period = "daily") => {
  const allowedPeriods = [
    "daily",
    "weekly",
    "monthly",
    "yearly",
  ];

  if (!allowedPeriods.includes(period)) {
    throw new Error(
      "Invalid period. Use daily, weekly, monthly or yearly"
    );
  }

  const now = new Date();

  let startDate = new Date(now);
  let format;

  // Last 30 days
  if (period === "daily") {
    startDate.setDate(now.getDate() - 29);

    format = "%Y-%m-%d";
  }

  // Last 12 weeks
  if (period === "weekly") {
    startDate.setDate(now.getDate() - 83);

    format = "%Y-W%V";
  }

  // Last 12 months
  if (period === "monthly") {
    startDate.setMonth(now.getMonth() - 11);

    format = "%Y-%m";
  }

  // Last 5 years
  if (period === "yearly") {
    startDate.setFullYear(now.getFullYear() - 4);

    format = "%Y";
  }

  const revenue = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: now,
        },

        paymentStatus: "PAID",

        orderStatus: {
          $ne: "CANCELLED",
        },
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: "$createdAt",
            timezone: "Asia/Kolkata",
          },
        },

        sales: {
          $sum: 1,
        },

        revenue: {
          $sum: "$finalAmount",
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  return {
    period,
    data: revenue.map((item) => ({
      period: item._id,
      sales: item.sales,
      revenue: item.revenue,
    })),
  };
};

// ================= ORDER STATUS =================

const getOrderStatusData = async () => {
  const result = await Order.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const statusData = {
    PENDING: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    OUT_FOR_DELIVERY: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  result.forEach((item) => {
    if (statusData[item._id] !== undefined) {
      statusData[item._id] = item.count;
    }
  });

  return statusData;
};

// ================= STOCK ALERTS =================

const getStockAlerts = async (lowStockLimit = 5) => {
  const limit = Number(lowStockLimit);

  if (Number.isNaN(limit) || limit < 0) {
    throw new Error(
      "lowStockLimit must be a valid positive number"
    );
  }

  const lowStockProducts = await Product.find({
    stock: {
      $gt: 0,
      $lte: limit,
    },
  })
    .select(
      "_id sku name stock regularPrice salePrice status"
    )
    .populate("category", "name")
    .sort({
      stock: 1,
    });

  const outOfStockProducts = await Product.find({
    stock: 0,
  })
    .select(
      "_id sku name stock regularPrice salePrice status"
    )
    .populate("category", "name")
    .sort({
      name: 1,
    });

  return {
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,

    lowStockProducts,
    outOfStockProducts,
  };
};

// ================= RECENT ORDERS =================

const getRecentOrders = async (limit = 10) => {
  const orderLimit = Number(limit);

  if (Number.isNaN(orderLimit) || orderLimit <= 0) {
    throw new Error(
      "limit must be a valid positive number"
    );
  }

  const orders = await Order.find()
    .populate(
      "user",
      "name email phone"
    )
    .sort({
      createdAt: -1,
    })
    .limit(orderLimit)
    .lean();

  return orders.map((order) => ({
    orderId: order._id,

    customer: order.user
      ? {
          id: order.user._id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        }
      : null,

    date: order.createdAt,

    amount: order.finalAmount,

    paymentMethod: order.paymentMethod,

    paymentStatus: order.paymentStatus,

    orderStatus: order.orderStatus,
  }));
};

module.exports = {
  getDashboardSummary,
  getRevenueData,
  getOrderStatusData,
  getStockAlerts,
  getRecentOrders,
};