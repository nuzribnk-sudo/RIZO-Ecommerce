import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Orders.css";

const API_URL = "http://localhost:5000/api";
const ORDERS_PER_PAGE = 10;

// =========================================================
// STATUS LABELS
// =========================================================

const statusLabels = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusClassMap = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out-for-delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// =========================================================
// PAYMENT STATUS
// =========================================================

const paymentStatusLabels = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
};

const paymentStatusClassMap = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
};

// =========================================================
// COMPONENT
// =========================================================

const Orders = () => {
  const navigate = useNavigate();

  // =======================================================
  // ORDERS STATE
  // =======================================================

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =======================================================
  // TRACKING STATE
  // =======================================================

  const [trackingOrder, setTrackingOrder] = useState(null);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // =======================================================
  // GET TOKEN
  // =======================================================

  const getToken = useCallback(() => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  }, []);

  // =======================================================
  // FETCH ORDERS
  // =======================================================

  const fetchOrders = useCallback(
    async (page = currentPage) => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          setError(
            "Authentication required. Please login again."
          );

          setOrders([]);
          setTotalOrders(0);
          setTotalPages(1);

          return;
        }

        const response = await axios.get(
          `${API_URL}/orders/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },

            params: {
              page,
              limit: ORDERS_PER_PAGE,

              search: search.trim(),

              orderStatus:
                statusFilter === "ALL"
                  ? ""
                  : statusFilter,

              paymentStatus:
                paymentFilter === "ALL"
                  ? ""
                  : paymentFilter,
            },
          }
        );

        const responseData = response.data || {};

        const responseOrders = Array.isArray(
          responseData.orders
        )
          ? responseData.orders
          : [];

        setOrders(responseOrders);

        setCurrentPage(
          Number(responseData.currentPage || page)
        );

        setTotalPages(
          Math.max(
            Number(responseData.totalPages || 1),
            1
          )
        );

        setTotalOrders(
          Number(responseData.totalOrders || 0)
        );
      } catch (err) {
        console.error(
          "Failed to fetch admin orders:",
          err
        );

        if (err.response?.status === 401) {
          setError(
            "Your session has expired. Please login again."
          );
        } else if (err.response?.status === 403) {
          setError(
            "You are not authorized to view orders."
          );
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load orders."
          );
        }

        setOrders([]);
        setTotalOrders(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      getToken,
      search,
      statusFilter,
      paymentFilter,
    ]
  );

  // =======================================================
  // FETCH ON CHANGE
  // =======================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(currentPage);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    currentPage,
    search,
    statusFilter,
    paymentFilter,
    fetchOrders,
  ]);

  // =======================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =======================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    paymentFilter,
  ]);

  // =======================================================
  // CUSTOMER HELPERS
  // =======================================================

  const getCustomerName = (order) => {
    return (
      order?.user?.name ||
      order?.user?.fullName ||
      order?.shippingAddress?.fullName ||
      order?.shippingAddress?.name ||
      "Unknown Customer"
    );
  };

  const getCustomerEmail = (order) => {
    return (
      order?.user?.email ||
      order?.shippingAddress?.email ||
      "—"
    );
  };

  const getCustomerPhone = (order) => {
    return (
      order?.user?.phone ||
      order?.shippingAddress?.phone ||
      "—"
    );
  };

  // =======================================================
  // STATUS HELPERS
  // =======================================================

  const getStatusLabel = (status) => {
    return (
      statusLabels[status] ||
      status ||
      "Unknown"
    );
  };

  const getStatusClass = (status) => {
    return (
      statusClassMap[status] ||
      "pending"
    );
  };

  const getPaymentStatusLabel = (status) => {
    return (
      paymentStatusLabels[status] ||
      status ||
      "Pending"
    );
  };

  const getPaymentStatusClass = (status) => {
    return (
      paymentStatusClassMap[status] ||
      "pending"
    );
  };

  // =======================================================
  // CURRENCY
  // =======================================================

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  // =======================================================
  // DATE
  // =======================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =======================================================
  // ITEM COUNT
  // =======================================================

  const getItemCount = (order) => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce(
      (total, item) => {
        return (
          total +
          Number(item?.quantity || 0)
        );
      },
      0
    );
  };

  // =======================================================
  // ORDER ID
  // =======================================================

  const getOrderId = (order) => {
    if (!order?._id) {
      return "—";
    }

    return `ORD-${String(order._id)
      .slice(-6)
      .toUpperCase()}`;
  };

  // =======================================================
  // SUMMARY
  // =======================================================

  const summary = useMemo(() => {
    const pending = orders.filter(
      (order) =>
        String(
          order?.orderStatus || ""
        ).toUpperCase() === "PENDING"
    ).length;

    const processing = orders.filter(
      (order) =>
        [
          "CONFIRMED",
          "PROCESSING",
        ].includes(
          String(
            order?.orderStatus || ""
          ).toUpperCase()
        )
    ).length;

    const delivered = orders.filter(
      (order) =>
        String(
          order?.orderStatus || ""
        ).toUpperCase() === "DELIVERED"
    ).length;

    const cancelled = orders.filter(
      (order) =>
        String(
          order?.orderStatus || ""
        ).toUpperCase() === "CANCELLED"
    ).length;

    return {
      pending,
      processing,
      delivered,
      cancelled,
    };
  }, [orders]);

  // =======================================================
  // FILTER OPTIONS
  // =======================================================

  const statusOptions = [
    {
      value: "ALL",
      label: "All Status",
    },
    {
      value: "PENDING",
      label: "Pending",
    },
    {
      value: "CONFIRMED",
      label: "Confirmed",
    },
    {
      value: "PROCESSING",
      label: "Processing",
    },
    {
      value: "SHIPPED",
      label: "Shipped",
    },
    {
      value: "OUT_FOR_DELIVERY",
      label: "Out for Delivery",
    },
    {
      value: "DELIVERED",
      label: "Delivered",
    },
    {
      value: "CANCELLED",
      label: "Cancelled",
    },
  ];

  const paymentOptions = [
    {
      value: "ALL",
      label: "All Payments",
    },
    {
      value: "PENDING",
      label: "Pending",
    },
    {
      value: "PAID",
      label: "Paid",
    },
    {
      value: "FAILED",
      label: "Failed",
    },
  ];

  // =======================================================
  // OPEN TRACKING MODAL
  // =======================================================

  const handleOpenTracking = (order) => {
    setTrackingOrder(order);

    setCourier(
      order?.courier || ""
    );

    setTrackingNumber(
      order?.trackingNumber || ""
    );

    setTrackingUrl(
      order?.trackingUrl || ""
    );

    setTrackingError("");
  };

  // =======================================================
  // CLOSE TRACKING MODAL
  // =======================================================

  const handleCloseTracking = () => {
    if (trackingLoading) {
      return;
    }

    setTrackingOrder(null);
    setCourier("");
    setTrackingNumber("");
    setTrackingUrl("");
    setTrackingError("");
  };

  // =======================================================
  // SAVE TRACKING
  // =======================================================

  const handleSaveTracking = async () => {
    if (!trackingOrder?._id) {
      return;
    }

    const trimmedCourier =
      courier.trim();

    const trimmedTrackingNumber =
      trackingNumber.trim();

    const trimmedTrackingUrl =
      trackingUrl.trim();

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!trimmedCourier) {
      setTrackingError(
        "Please enter the courier name."
      );
      return;
    }

    if (!trimmedTrackingNumber) {
      setTrackingError(
        "Please enter the tracking / AWB number."
      );
      return;
    }

    // -----------------------------------------------------
    // BASIC URL VALIDATION
    // -----------------------------------------------------

    if (trimmedTrackingUrl) {
      try {
        const parsedUrl = new URL(
          trimmedTrackingUrl
        );

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          setTrackingError(
            "Tracking URL must start with http:// or https://."
          );
          return;
        }
      } catch {
        setTrackingError(
          "Please enter a valid tracking URL."
        );
        return;
      }
    }

    try {
      setTrackingLoading(true);
      setTrackingError("");

      const token = getToken();

      if (!token) {
        setTrackingError(
          "Authentication required. Please login again."
        );
        return;
      }

      // ---------------------------------------------------
      // BACKEND
      // PATCH /api/orders/:id/tracking
      // ---------------------------------------------------

      const response = await axios.patch(
        `${API_URL}/orders/${trackingOrder._id}/tracking`,
        {
          courier: trimmedCourier,

          trackingNumber:
            trimmedTrackingNumber,

          trackingUrl:
            trimmedTrackingUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const updatedOrder =
        response.data?.order;

      if (!updatedOrder) {
        throw new Error(
          "Tracking information was not returned by the server."
        );
      }

      // ---------------------------------------------------
      // UPDATE CURRENT TABLE
      // ---------------------------------------------------

      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (order) =>
              order._id ===
              trackingOrder._id
                ? {
                    ...order,
                    ...updatedOrder,
                  }
                : order
          )
      );

      // ---------------------------------------------------
      // UPDATE MODAL
      // ---------------------------------------------------

      setTrackingOrder(
        (previousOrder) => ({
          ...previousOrder,
          ...updatedOrder,
        })
      );

      setCourier(
        updatedOrder.courier || ""
      );

      setTrackingNumber(
        updatedOrder.trackingNumber ||
          ""
      );

      setTrackingUrl(
        updatedOrder.trackingUrl ||
          ""
      );

      // ---------------------------------------------------
      // SUCCESS TOAST
      // ---------------------------------------------------

      toast.success(
        "Tracking information saved successfully!"
      );
    } catch (err) {
      console.error(
        "Save tracking error:",
        err
      );

      if (err.response?.status === 401) {
        setTrackingError(
          "Your session has expired. Please login again."
        );
      } else if (
        err.response?.status === 403
      ) {
        setTrackingError(
          "You are not authorized to update tracking."
        );
      } else if (
        err.response?.status === 404
      ) {
        setTrackingError(
          "Order or tracking route was not found."
        );
      } else {
        setTrackingError(
          err.response?.data?.message ||
            err.message ||
            "Failed to save tracking information."
        );
      }
    } finally {
      setTrackingLoading(false);
    }
  };

  // =======================================================
  // PAGINATION
  // =======================================================

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      currentPage - 2
    );

    let endPage = Math.min(
      totalPages,
      startPage + maxVisiblePages - 1
    );

    if (
      endPage - startPage + 1 <
      maxVisiblePages
    ) {
      startPage = Math.max(
        1,
        endPage -
          maxVisiblePages +
          1
      );
    }

    for (
      let page = startPage;
      page <= endPage;
      page++
    ) {
      pages.push(page);
    }

    return pages;
  }, [
    currentPage,
    totalPages,
  ]);

  const startItem =
    totalOrders === 0
      ? 0
      : (currentPage - 1) *
          ORDERS_PER_PAGE +
        1;

  const endItem = Math.min(
    currentPage * ORDERS_PER_PAGE,
    totalOrders
  );

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const handleRetry = () => {
    fetchOrders(currentPage);
  };

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="admin-orders-page">
        <div className="orders-loading">
          <div className="loading-spinner"></div>

          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="admin-orders-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="orders-header">
        <div>
          <h1>Orders</h1>

          <p>
            Manage and track customer orders
          </p>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="orders-summary">

        <div className="order-summary-card">
          <div className="summary-icon pending-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>

          <div>
            <span>Pending</span>

            <strong>
              {summary.pending}
            </strong>
          </div>
        </div>

        <div className="order-summary-card">
          <div className="summary-icon processing-icon">
            <i className="bi bi-box-seam"></i>
          </div>

          <div>
            <span>Processing</span>

            <strong>
              {summary.processing}
            </strong>
          </div>
        </div>

        <div className="order-summary-card">
          <div className="summary-icon delivered-icon">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <span>Delivered</span>

            <strong>
              {summary.delivered}
            </strong>
          </div>
        </div>

        <div className="order-summary-card">
          <div className="summary-icon cancelled-icon">
            <i className="bi bi-x-circle"></i>
          </div>

          <div>
            <span>Cancelled</span>

            <strong>
              {summary.cancelled}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="orders-toolbar">

        <div className="orders-search">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search orders, customers..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        <div className="orders-filter">
          <i className="bi bi-funnel"></i>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            {statusOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="orders-filter">
          <i className="bi bi-credit-card"></i>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(
                event.target.value
              )
            }
          >
            {paymentOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="orders-error">
          <i className="bi bi-exclamation-circle"></i>

          <span>{error}</span>

          <button
            type="button"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="orders-table-card">

        <div className="orders-table-wrapper">

          <table className="orders-table">

            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {orders.length > 0 ? (

                orders.map((order) => {

                  const paymentStatus =
                    String(
                      order?.paymentStatus ||
                        "PENDING"
                    ).toUpperCase();

                  const currentStatus =
                    String(
                      order?.orderStatus ||
                        order?.status ||
                        "PENDING"
                    ).toUpperCase();

                  const customerName =
                    getCustomerName(order);

                  const customerEmail =
                    getCustomerEmail(order);

                  const customerPhone =
                    getCustomerPhone(order);

                  const hasTracking =
                    Boolean(
                      order?.courier ||
                        order?.trackingNumber ||
                        order?.trackingUrl
                    );

                  const canAddTracking =
                    currentStatus ===
                    "SHIPPED";

                  return (
                    <tr
                      key={order?._id}
                    >

                      {/* ORDER ID */}

                      <td>
                        <span className="order-id">
                          {getOrderId(order)}
                        </span>
                      </td>

                      {/* CUSTOMER */}

                      <td>
                        <div className="customer-cell">

                          <div className="customer-avatar">
                            {customerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="customer-info">

                            <strong>
                              {customerName}
                            </strong>

                            <span>
                              {customerEmail !==
                              "—"
                                ? customerEmail
                                : customerPhone}
                            </span>

                          </div>

                        </div>
                      </td>

                      {/* DATE */}

                      <td>
                        <span className="order-date">
                          {formatDate(
                            order?.createdAt ||
                              order?.updatedAt
                          )}
                        </span>
                      </td>

                      {/* ITEMS */}

                      <td>
                        <span className="item-count">
                          {getItemCount(order)}
                        </span>
                      </td>

                      {/* TOTAL */}

                      <td>
                        <strong className="order-total">
                          {formatCurrency(
                            order?.finalAmount ??
                              order?.totalAmount ??
                              order?.total ??
                              0
                          )}
                        </strong>
                      </td>

                      {/* PAYMENT */}

                      <td>
                        <span
                          className={`payment-status ${getPaymentStatusClass(
                            paymentStatus
                          )}`}
                        >
                          <span className="status-dot"></span>

                          {getPaymentStatusLabel(
                            paymentStatus
                          )}
                        </span>
                      </td>

                      {/* ORDER STATUS */}

                      <td>
                        <span
                          className={`order-status-badge ${getStatusClass(
                            currentStatus
                          )}`}
                        >
                          <span className="status-dot"></span>

                          {getStatusLabel(
                            currentStatus
                          )}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td>
                        <div className="order-actions">

                          {/* VIEW */}

                          <button
                            type="button"
                            className="view-order-btn"
                            onClick={() =>
                              navigate(
                                `/admin/orders/${order?._id}`
                              )
                            }
                            title="View Order"
                            aria-label="View Order"
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {/* TRACKING */}

                          {canAddTracking && (
                            <button
                              type="button"
                              className={`tracking-order-btn ${
                                hasTracking
                                  ? "has-tracking"
                                  : ""
                              }`}
                              onClick={() =>
                                handleOpenTracking(
                                  order
                                )
                              }
                              title={
                                hasTracking
                                  ? "Edit Tracking"
                                  : "Add Tracking"
                              }
                              aria-label={
                                hasTracking
                                  ? "Edit Tracking"
                                  : "Add Tracking"
                              }
                            >
                              <i className="bi bi-truck"></i>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="orders-empty"
                  >

                    <div className="empty-orders">

                      <i className="bi bi-inbox"></i>

                      <h3>
                        No orders found
                      </h3>

                      <p>
                        {search ||
                        statusFilter !== "ALL" ||
                        paymentFilter !== "ALL"
                          ? "Try changing your search or filters."
                          : "There are no orders available yet."}
                      </p>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        {totalOrders > 0 && (
          <div className="orders-table-footer">

            <span>
              Showing{" "}

              <strong>
                {startItem}
              </strong>

              {" - "}

              <strong>
                {endItem}
              </strong>

              {" "}of{" "}

              <strong>
                {totalOrders}
              </strong>

              {" "}orders
            </span>

          </div>
        )}

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {totalPages > 1 && (
          <div className="orders-pagination">

            <button
              type="button"
              className="pagination-btn"
              onClick={() =>
                goToPage(
                  currentPage - 1
                )
              }
              disabled={
                currentPage === 1
              }
            >
              <i className="bi bi-chevron-left"></i>

              <span>
                Previous
              </span>
            </button>

            <div className="pagination-info">

              {pageNumbers.map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={`pagination-number ${
                      currentPage === page
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      goToPage(page)
                    }
                  >
                    {page}
                  </button>
                )
              )}

            </div>

            <button
              type="button"
              className="pagination-btn"
              onClick={() =>
                goToPage(
                  currentPage + 1
                )
              }
              disabled={
                currentPage ===
                totalPages
              }
            >
              <span>
                Next
              </span>

              <i className="bi bi-chevron-right"></i>
            </button>

          </div>
        )}

      </div>

      {/* =====================================================
          TRACKING MODAL
      ===================================================== */}

      {trackingOrder && (

        <div
          className="tracking-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseTracking();
            }
          }}
        >

          <div className="tracking-modal">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="tracking-modal-header">

              <div>

                <span className="tracking-modal-eyebrow">
                  ORDER TRACKING
                </span>

                <h2>
                  {getOrderId(
                    trackingOrder
                  )}
                </h2>

              </div>

              <button
                type="button"
                className="tracking-modal-close"
                onClick={
                  handleCloseTracking
                }
                disabled={
                  trackingLoading
                }
                aria-label="Close"
              >
                <i className="bi bi-x"></i>
              </button>

            </div>

            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="tracking-modal-body">

              {/* ORDER SUMMARY */}

              <div className="tracking-order-summary">

                <div className="tracking-icon">
                  <i className="bi bi-truck"></i>
                </div>

                <div>

                  <strong>
                    {getCustomerName(
                      trackingOrder
                    )}
                  </strong>

                  <span>
                    Status:{" "}
                    {getStatusLabel(
                      String(
                        trackingOrder?.orderStatus ||
                          ""
                      ).toUpperCase()
                    )}
                  </span>

                </div>

              </div>

              {/* =================================================
                  COURIER
              ================================================= */}

              <div className="tracking-form-group">

                <label htmlFor="tracking-courier">
                  Courier
                </label>

                <div className="tracking-input-wrapper">

                  <i className="bi bi-truck"></i>

                  <input
                    id="tracking-courier"
                    type="text"
                    placeholder="Enter courier name"
                    value={courier}
                    onChange={(event) =>
                      setCourier(
                        event.target.value
                      )
                    }
                    disabled={
                      trackingLoading
                    }
                  />

                </div>

                <small>
                  Enter the courier service
                  handling this shipment.
                </small>

              </div>

              {/* =================================================
                  TRACKING NUMBER
              ================================================= */}

              <div className="tracking-form-group">

                <label htmlFor="tracking-number">
                  Tracking Number
                </label>

                <div className="tracking-input-wrapper">

                  <i className="bi bi-upc-scan"></i>

                  <input
                    id="tracking-number"
                    type="text"
                    placeholder="Enter tracking / AWB number"
                    value={trackingNumber}
                    onChange={(event) =>
                      setTrackingNumber(
                        event.target.value
                      )
                    }
                    disabled={
                      trackingLoading
                    }
                  />

                </div>

                <small>
                  Enter the tracking number
                  provided for this shipment.
                </small>

              </div>

              {/* =================================================
                  TRACKING URL
              ================================================= */}

              <div className="tracking-form-group">

                <label htmlFor="tracking-url">
                  Tracking URL
                </label>

                <div className="tracking-input-wrapper">

                  <i className="bi bi-link-45deg"></i>

                  <input
                    id="tracking-url"
                    type="url"
                    placeholder="https://courier.com/track/..."
                    value={trackingUrl}
                    onChange={(event) =>
                      setTrackingUrl(
                        event.target.value
                      )
                    }
                    disabled={
                      trackingLoading
                    }
                  />

                </div>

                <small>
                  Optional tracking page URL
                  provided by the courier.
                </small>

              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {trackingError && (
                <div className="tracking-error-message">

                  <i className="bi bi-exclamation-circle-fill"></i>

                  <span>
                    {trackingError}
                  </span>

                </div>
              )}

            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="tracking-modal-footer">

              <button
                type="button"
                className="tracking-cancel-btn"
                onClick={
                  handleCloseTracking
                }
                disabled={
                  trackingLoading
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="tracking-save-btn"
                onClick={
                  handleSaveTracking
                }
                disabled={
                  trackingLoading
                }
              >

                {trackingLoading ? (
                  <>
                    <span className="tracking-btn-spinner"></span>

                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2"></i>

                    Save Tracking
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Orders;