import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_BASE_URL = "http://localhost:5000/api";

function Dashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [summary, setSummary] = useState({
    products: 0,
    categories: 0,
    customers: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    sales: 0,
  });

  const [revenueData, setRevenueData] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState("daily");

  const [orderStatus, setOrderStatus] = useState({
    PENDING: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    OUT_FOR_DELIVERY: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  });

  const [stockAlerts, setStockAlerts] = useState({
    lowStockCount: 0,
    outOfStockCount: 0,
    lowStockProducts: [],
    outOfStockProducts: [],
  });

  const [recentOrders, setRecentOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = useCallback(() => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("token") ||
      ""
    );
  }, []);

  // =========================================================
  // HEADERS
  // =========================================================

  const getHeaders = useCallback(() => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  }, [getToken]);

  // =========================================================
  // COMMON FETCH
  // =========================================================

  const fetchJSON = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getHeaders(),
          ...(options.headers || {}),
        },
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Server returned an invalid response. Please check the backend."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Request failed with status ${response.status}`
        );
      }

      return data;
    },
    [getHeaders]
  );

  // =========================================================
  // FETCH SUMMARY
  // =========================================================

  const fetchSummary = useCallback(async () => {
    const data = await fetchJSON(
      `${API_BASE_URL}/dashboard/summary`
    );

    const summaryData = data.data || {};

    setSummary({
      products: Number(summaryData.products || 0),
      categories: Number(summaryData.categories || 0),
      customers: Number(summaryData.customers || 0),
      orders: Number(summaryData.orders || 0),
      revenue: Number(summaryData.revenue || 0),
      pendingOrders: Number(summaryData.pendingOrders || 0),
      completedOrders: Number(
        summaryData.completedOrders || 0
      ),
      cancelledOrders: Number(
        summaryData.cancelledOrders || 0
      ),
      sales: Number(summaryData.sales || 0),
    });
  }, [fetchJSON]);

  // =========================================================
  // FETCH REVENUE
  // =========================================================

  const fetchRevenue = useCallback(
    async (period) => {
      try {
        setRevenueLoading(true);

        const data = await fetchJSON(
          `${API_BASE_URL}/dashboard/revenue?period=${period}`
        );

        setRevenueData(
          Array.isArray(data.data) ? data.data : []
        );
      } catch (error) {
        console.error("Revenue API error:", error);
        setRevenueData([]);
      } finally {
        setRevenueLoading(false);
      }
    },
    [fetchJSON]
  );

  // =========================================================
  // FETCH ORDER STATUS
  // =========================================================

  const fetchOrderStatus = useCallback(async () => {
    const data = await fetchJSON(
      `${API_BASE_URL}/dashboard/order-status`
    );

    const statusData = data.data || {};

    setOrderStatus({
      PENDING: Number(statusData.PENDING || 0),
      CONFIRMED: Number(statusData.CONFIRMED || 0),
      PROCESSING: Number(statusData.PROCESSING || 0),
      OUT_FOR_DELIVERY: Number(
        statusData.OUT_FOR_DELIVERY || 0
      ),
      SHIPPED: Number(statusData.SHIPPED || 0),
      DELIVERED: Number(statusData.DELIVERED || 0),
      CANCELLED: Number(statusData.CANCELLED || 0),
    });
  }, [fetchJSON]);

  // =========================================================
  // FETCH STOCK ALERTS
  // =========================================================

  const fetchStockAlerts = useCallback(async () => {
    const data = await fetchJSON(
      `${API_BASE_URL}/dashboard/stock-alerts?limit=10`
    );

    const stockData = data.data || {};

    setStockAlerts({
      lowStockCount: Number(
        stockData.lowStockCount || 0
      ),

      outOfStockCount: Number(
        stockData.outOfStockCount || 0
      ),

      lowStockProducts: Array.isArray(
        stockData.lowStockProducts
      )
        ? stockData.lowStockProducts
        : [],

      outOfStockProducts: Array.isArray(
        stockData.outOfStockProducts
      )
        ? stockData.outOfStockProducts
        : [],
    });
  }, [fetchJSON]);

  // =========================================================
  // FETCH RECENT ORDERS
  // =========================================================

  const fetchRecentOrders = useCallback(async () => {
    const data = await fetchJSON(
      `${API_BASE_URL}/dashboard/recent-orders?limit=5`
    );

    setRecentOrders(
      Array.isArray(data.data) ? data.data : []
    );
  }, [fetchJSON]);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchSummary(),
        fetchOrderStatus(),
        fetchStockAlerts(),
        fetchRecentOrders(),
      ]);
    } catch (error) {
      console.error("Dashboard API error:", error);

      setError(
        error.message ||
          "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, [
    fetchSummary,
    fetchOrderStatus,
    fetchStockAlerts,
    fetchRecentOrders,
  ]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =========================================================
  // REVENUE PERIOD CHANGE
  // =========================================================

  useEffect(() => {
    fetchRevenue(revenuePeriod);
  }, [revenuePeriod, fetchRevenue]);

  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }, []);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = useCallback((date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  // =========================================================
  // REVENUE LABEL
  // =========================================================

  const formatRevenuePeriod = useCallback(
    (period) => {
      if (!period) {
        return "-";
      }

      const value = String(period);
      const parsedDate = new Date(value);

      if (!Number.isNaN(parsedDate.getTime())) {
        if (revenuePeriod === "yearly") {
          return parsedDate.toLocaleDateString("en-IN", {
            year: "numeric",
          });
        }

        if (revenuePeriod === "monthly") {
          return parsedDate.toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          });
        }

        return parsedDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
      }

      return value;
    },
    [revenuePeriod]
  );

  // =========================================================
  // TOTAL ORDER STATUS
  // =========================================================

  const totalOrderStatus = useMemo(() => {
    return Object.values(orderStatus).reduce(
      (total, value) =>
        total + Number(value || 0),
      0
    );
  }, [orderStatus]);

  // =========================================================
  // REVENUE TOTAL
  // =========================================================

  const revenueTotal = useMemo(() => {
    return revenueData.reduce(
      (total, item) =>
        total + Number(item.revenue || 0),
      0
    );
  }, [revenueData]);

  // =========================================================
  // MAX REVENUE
  // =========================================================

  const maxRevenue = useMemo(() => {
    if (!revenueData.length) {
      return 0;
    }

    return Math.max(
      ...revenueData.map((item) =>
        Number(item.revenue || 0)
      )
    );
  }, [revenueData]);

  // =========================================================
  // TOTAL REVENUE BARS
  // =========================================================

  const revenueBarCount = revenueData.length;

  // =========================================================
  // HIGHEST REVENUE PERIOD
  // =========================================================

  const highestRevenuePeriod = useMemo(() => {
    if (!revenueData.length) {
      return null;
    }

    return revenueData.reduce(
      (highest, current) => {
        const currentRevenue = Number(
          current.revenue || 0
        );

        const highestRevenue = Number(
          highest?.revenue || 0
        );

        return currentRevenue > highestRevenue
          ? current
          : highest;
      },
      revenueData[0]
    );
  }, [revenueData]);

  // =========================================================
  // ORDER STATUS COLORS
  // =========================================================

  const statusColors = {
    PENDING: "#f2a900",
    CONFIRMED: "#4285e8",
    PROCESSING: "#7567df",
    OUT_FOR_DELIVERY: "#06b6d4",
    SHIPPED: "#21a68b",
    DELIVERED: "#5fc442",
    CANCELLED: "#e96b6b",
  };

  // =========================================================
  // DONUT GRADIENT
  // =========================================================

  const statusGradient = useMemo(() => {
    if (totalOrderStatus === 0) {
      return "#eeeeee 0deg 360deg";
    }

    let currentDegree = 0;

    const segments = Object.entries(orderStatus)
      .map(([status, count]) => {
        const numericCount = Number(count || 0);

        if (numericCount <= 0) {
          return null;
        }

        const degree =
          (numericCount / totalOrderStatus) * 360;

        const start = currentDegree;
        const end = currentDegree + degree;

        currentDegree = end;

        return `${statusColors[status]} ${start}deg ${end}deg`;
      })
      .filter(Boolean);

    return segments.length
      ? segments.join(", ")
      : "#eeeeee 0deg 360deg";
  }, [orderStatus, totalOrderStatus]);

  // =========================================================
  // STATUS LABEL
  // =========================================================

  const getStatusLabel = (status) => {
    if (!status) {
      return "-";
    }

    return String(status)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Welcome back, Admin. Here's what's happening
            with your store.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-btn"
          onClick={loadDashboard}
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh</span>
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="dashboard-error">
          <i className="bi bi-exclamation-circle"></i>

          <span>{error}</span>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="dashboard-stats">

        {/* PRODUCTS */}

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon-products">
              <i className="bi bi-box-seam"></i>
            </div>

            <span className="stat-label">
              Products
            </span>
          </div>

          <div className="stat-value">
            {summary.products.toLocaleString("en-IN")}
          </div>

          <div className="stat-bottom">
            <span>All products</span>
          </div>
        </div>

        {/* CATEGORIES */}

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon-categories">
              <i className="bi bi-grid"></i>
            </div>

            <span className="stat-label">
              Categories
            </span>
          </div>

          <div className="stat-value">
            {summary.categories.toLocaleString("en-IN")}
          </div>

          <div className="stat-bottom">
            <span>Active catalog</span>
          </div>
        </div>

        {/* CUSTOMERS */}

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon-customers">
              <i className="bi bi-people"></i>
            </div>

            <span className="stat-label">
              Customers
            </span>
          </div>

          <div className="stat-value">
            {summary.customers.toLocaleString("en-IN")}
          </div>

          <div className="stat-bottom">
            <span>Registered users</span>
          </div>
        </div>

        {/* ORDERS */}

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon-orders">
              <i className="bi bi-cart3"></i>
            </div>

            <span className="stat-label">
              Total Orders
            </span>
          </div>

          <div className="stat-value">
            {summary.orders.toLocaleString("en-IN")}
          </div>

          <div className="stat-bottom">
            <span>
              {summary.sales.toLocaleString("en-IN")} paid
            </span>
          </div>
        </div>

        {/* REVENUE */}

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon-revenue">
              <i className="bi bi-currency-rupee"></i>
            </div>

            <span className="stat-label">
              Total Revenue
            </span>
          </div>

          <div className="stat-value revenue-value">
            {formatCurrency(summary.revenue)}
          </div>

          <div className="stat-bottom">
            <span>Paid orders</span>
          </div>
        </div>

      </section>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <section className="dashboard-main-grid">

        {/* ===================================================
            REVENUE
        =================================================== */}

        <div className="dashboard-card revenue-card">

          <div className="dashboard-card-header">

            <div>
              <h2>Revenue Overview</h2>

              <p>
                Revenue generated from backend orders
              </p>
            </div>

            <select
              value={revenuePeriod}
              onChange={(e) =>
                setRevenuePeriod(e.target.value)
              }
              className="dashboard-period-select"
            >
              <option value="daily">
                Daily
              </option>

              <option value="weekly">
                Weekly
              </option>

              <option value="monthly">
                Monthly
              </option>

              <option value="yearly">
                Yearly
              </option>
            </select>

          </div>

          {/* REVENUE TOTAL */}

          <div className="revenue-total">

            <div>
              <span>Period Revenue</span>

              <strong>
                {formatCurrency(revenueTotal)}
              </strong>
            </div>

            {highestRevenuePeriod && (
              <div className="revenue-highest-info">

                <span>Highest Period</span>

                <strong>
                  {formatCurrency(
                    highestRevenuePeriod.revenue
                  )}
                </strong>

              </div>
            )}

          </div>

          {/* REVENUE CHART */}

          {revenueLoading ? (
            <div className="dashboard-section-loading">
              <div className="dashboard-spinner"></div>

              <span>
                Loading revenue...
              </span>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="dashboard-empty">
              <i className="bi bi-bar-chart"></i>

              <p>
                No revenue data available.
              </p>
            </div>
          ) : (
            <div className="revenue-chart-container">

              {/* Y AXIS */}

              <div className="revenue-y-axis">

                <span>
                  {formatCurrency(maxRevenue)}
                </span>

                <span>
                  {formatCurrency(maxRevenue * 0.75)}
                </span>

                <span>
                  {formatCurrency(maxRevenue * 0.5)}
                </span>

                <span>
                  {formatCurrency(maxRevenue * 0.25)}
                </span>

                <span>
                  ₹0
                </span>

              </div>

              {/* CHART */}

              <div
                className="revenue-chart"
                data-bars={revenueBarCount}
              >

                <div className="revenue-grid-lines">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                {revenueData.map((item, index) => {
                  const revenue = Number(
                    item.revenue || 0
                  );

                  const height =
                    maxRevenue > 0
                      ? Math.max(
                          7,
                          (revenue / maxRevenue) * 100
                        )
                      : 7;

                  const isHighest =
                    highestRevenuePeriod &&
                    highestRevenuePeriod.period ===
                      item.period;

                  return (
                    <div
                      className={`revenue-bar-item ${
                        isHighest ? "highest" : ""
                      }`}
                      key={`${item.period}-${index}`}
                    >

                      {/* REVENUE VALUE */}

                      <span className="revenue-bar-value">
                        {formatCurrency(revenue)}
                      </span>

                      {/* BAR */}

                      <div className="revenue-bar-wrapper">

                        <div
                          className="revenue-bar"
                          style={{
                            height: `${height}%`,
                          }}
                          title={`${formatRevenuePeriod(
                            item.period
                          )} - ${formatCurrency(
                            revenue
                          )}`}
                        ></div>

                      </div>

                      {/* PERIOD */}

                      <span className="revenue-bar-label">
                        {formatRevenuePeriod(
                          item.period
                        )}
                      </span>

                    </div>
                  );
                })}

              </div>
            </div>
          )}

        </div>

        {/* ===================================================
            ORDER STATUS
        =================================================== */}

        <div className="dashboard-card order-status-card">

          <div className="dashboard-card-header">

            <div>
              <h2>Order Status</h2>

              <p>
                Current order distribution
              </p>
            </div>

          </div>

          {/* DONUT */}

          <div className="order-status-content">

            <div
              className="order-status-donut"
              style={{
                background:
                  `conic-gradient(${statusGradient})`,
              }}
            >

              <div className="order-status-donut-center">

                <strong>
                  {totalOrderStatus.toLocaleString(
                    "en-IN"
                  )}
                </strong>

                <span>
                  Total Orders
                </span>

              </div>

            </div>

            {/* STATUS LIST */}

            <div className="order-status-list">

              {Object.entries(orderStatus).map(
                ([status, count]) => (
                  <div
                    className="order-status-row"
                    key={status}
                  >

                    <div className="order-status-name">

                      {/* COLOURED DOT */}

                      <span
                        className={`status-dot status-${status.toLowerCase()}`}
                        style={{
                          backgroundColor:
                            statusColors[status],
                        }}
                      ></span>

                      <span>
                        {getStatusLabel(status)}
                      </span>

                    </div>

                    <strong>
                      {Number(
                        count || 0
                      ).toLocaleString("en-IN")}
                    </strong>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          STOCK ALERTS
      ===================================================== */}

      <section className="dashboard-stock-grid">

        {/* LOW STOCK */}

        <div className="dashboard-card stock-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                <i className="bi bi-exclamation-triangle"></i>
                Low Stock
              </h2>

              <p>
                Products with stock from 1 to 10
              </p>
            </div>

            <span className="stock-count low">
              {stockAlerts.lowStockCount}
            </span>

          </div>

          <div className="stock-list">

            {stockAlerts.lowStockProducts.length ===
            0 ? (
              <div className="dashboard-empty small">

                <i className="bi bi-check-circle"></i>

                <p>
                  No low-stock products.
                </p>

              </div>
            ) : (
              stockAlerts.lowStockProducts.map(
                (product) => (
                  <div
                    className="stock-item"
                    key={product._id}
                  >

                    <div className="stock-product-info">

                      <strong>
                        {product.name ||
                          "Unnamed Product"}
                      </strong>

                      <span>
                        {product.sku ||
                          "No SKU"}
                      </span>

                    </div>

                    <div className="stock-value low">

                      {product.stock}

                      <small>
                        {" "}left
                      </small>

                    </div>

                  </div>
                )
              )
            )}

          </div>

          <button
            type="button"
            className="stock-view-btn"
            onClick={() =>
              navigate("/admin/inventory")
            }
          >
            View Inventory

            <i className="bi bi-arrow-right"></i>
          </button>

        </div>

        {/* OUT OF STOCK */}

        <div className="dashboard-card stock-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                <i className="bi bi-x-circle"></i>
                Out of Stock
              </h2>

              <p>
                Products with zero stock
              </p>
            </div>

            <span className="stock-count out">
              {stockAlerts.outOfStockCount}
            </span>

          </div>

          <div className="stock-list">

            {stockAlerts.outOfStockProducts.length ===
            0 ? (
              <div className="dashboard-empty small">

                <i className="bi bi-check-circle"></i>

                <p>
                  No out-of-stock products.
                </p>

              </div>
            ) : (
              stockAlerts.outOfStockProducts.map(
                (product) => (
                  <div
                    className="stock-item"
                    key={product._id}
                  >

                    <div className="stock-product-info">

                      <strong>
                        {product.name ||
                          "Unnamed Product"}
                      </strong>

                      <span>
                        {product.sku ||
                          "No SKU"}
                      </span>

                    </div>

                    <div className="stock-value out">

                      0

                      <small>
                        {" "}left
                      </small>

                    </div>

                  </div>
                )
              )
            )}

          </div>

          <button
            type="button"
            className="stock-view-btn"
            onClick={() =>
              navigate("/admin/inventory")
            }
          >
            View Inventory

            <i className="bi bi-arrow-right"></i>
          </button>

        </div>

      </section>

      {/* =====================================================
          RECENT ORDERS
      ===================================================== */}

      <section className="dashboard-card recent-orders-card">

        <div className="dashboard-card-header">

          <div>
            <h2>Recent Orders</h2>

            <p>
              Latest orders from the backend
            </p>
          </div>

          <button
            type="button"
            className="dashboard-view-all"
            onClick={() =>
              navigate("/admin/orders")
            }
          >
            View All

            <i className="bi bi-arrow-right"></i>
          </button>

        </div>

        {recentOrders.length === 0 ? (
          <div className="dashboard-empty">

            <i className="bi bi-cart-x"></i>

            <p>
              No recent orders found.
            </p>

          </div>
        ) : (
          <div className="orders-table-wrapper">

            <table className="dashboard-orders-table">

              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {recentOrders.map((order) => (
                  <tr key={order.orderId}>

                    <td>
                      <strong>
                        #
                        {String(
                          order.orderId || ""
                        ).slice(-8)}
                      </strong>
                    </td>

                    <td>

                      <div className="order-customer">

                        <strong>
                          {order.customer?.name ||
                            "Guest Customer"}
                        </strong>

                        <span>
                          {order.customer?.email ||
                            "No email"}
                        </span>

                      </div>

                    </td>

                    <td>
                      {formatDate(order.date)}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(
                          order.amount
                        )}
                      </strong>
                    </td>

                    <td>

                      <span
                        className={`payment-status ${
                          String(
                            order.paymentStatus || ""
                          ).toLowerCase()
                        }`}
                      >
                        {getStatusLabel(
                          order.paymentStatus
                        )}
                      </span>

                    </td>

                    <td>

                      <span
                        className={`order-status-badge ${
                          String(
                            order.orderStatus || ""
                          ).toLowerCase()
                        }`}
                      >
                        {getStatusLabel(
                          order.orderStatus
                        )}
                      </span>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* =====================================================
          MINI SUMMARY
      ===================================================== */}

      <section className="dashboard-mini-grid">

        {/* PENDING */}

        <div className="mini-summary-card pending">

          <div className="mini-summary-icon">
            <i className="bi bi-clock-history"></i>
          </div>

          <div>

            <span>
              Pending Orders
            </span>

            <strong>
              {summary.pendingOrders.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

        </div>

        {/* DELIVERED */}

        <div className="mini-summary-card delivered">

          <div className="mini-summary-icon">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>

            <span>
              Delivered Orders
            </span>

            <strong>
              {summary.completedOrders.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

        </div>

        {/* CANCELLED */}

        <div className="mini-summary-card cancelled">

          <div className="mini-summary-icon">
            <i className="bi bi-x-circle"></i>
          </div>

          <div>

            <span>
              Cancelled Orders
            </span>

            <strong>
              {summary.cancelledOrders.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

        </div>

        {/* PAID */}

        <div className="mini-summary-card paid">

          <div className="mini-summary-icon">
            <i className="bi bi-credit-card"></i>
          </div>

          <div>

            <span>
              Paid Orders
            </span>

            <strong>
              {summary.sales.toLocaleString(
                "en-IN"
              )}
            </strong>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;