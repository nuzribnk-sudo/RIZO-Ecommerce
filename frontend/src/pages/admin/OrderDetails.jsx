import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./OrderDetails.css";

const API_URL = "http://localhost:5000/api";

/* =========================================================
   ORDER STATUS
========================================================= */

const ORDER_STATUS_OPTIONS = [
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

/* =========================================================
   PAYMENT STATUS
========================================================= */

const PAYMENT_STATUS_OPTIONS = [
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

/* =========================================================
   RETURN STATUS
========================================================= */

const RETURN_STATUS_LABELS = {
  NONE: "No Return Request",
  REQUESTED: "Return Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

/* =========================================================
   REFUND STATUS
========================================================= */

const REFUND_STATUS_LABELS = {
  NOT_APPLICABLE: "Not Applicable",
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

/* =========================================================
   COMPONENT
========================================================= */

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingReturn, setUpdatingReturn] = useState(false);

  /* =======================================================
     PAYMENT STATE
  ======================================================= */

  const [updatingPayment, setUpdatingPayment] = useState(false);

  /* =======================================================
     TRACKING STATE
  ======================================================= */

  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const [statusDropdownOpen, setStatusDropdownOpen] =
    useState(false);

  const statusDropdownRef = useRef(null);

  /* =======================================================
     CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  ======================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =======================================================
     TOKEN
  ======================================================= */

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  };

  /* =======================================================
     HEADERS
  ======================================================= */

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  /* =======================================================
     SAFE RESPONSE PARSER
  ======================================================= */

  const parseResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    throw new Error(
      `Server returned ${response.status}: ${text.slice(
        0,
        200
      )}`
    );
  };

  /* =======================================================
     FETCH ORDER DIRECTLY BY ID
     GET /api/orders/:id
  ======================================================= */

  const fetchOrder = useCallback(
    async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const token = getToken();

        if (!token) {
          throw new Error(
            "Authentication required. Please login again."
          );
        }

        if (!id) {
          throw new Error("Order ID is missing.");
        }

        const response = await fetch(
          `${API_URL}/orders/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await parseResponse(response);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to fetch order details."
          );
        }

        const fetchedOrder =
          data?.order || data;

        if (!fetchedOrder?._id) {
          throw new Error("Order not found.");
        }

        setOrder(fetchedOrder);

        /* Load tracking data */
        setTrackingNumber(
          fetchedOrder?.trackingNumber || ""
        );

        setTrackingUrl(
          fetchedOrder?.trackingUrl || ""
        );
      } catch (err) {
        console.error(
          "Fetch order error:",
          err
        );

        setError(
          err.message ||
            "Failed to load order details."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /* =======================================================
     STATUS HELPERS
  ======================================================= */

  const getOrderStatus = (value) => {
    if (!value) {
      return "PENDING";
    }

    return String(value).toUpperCase();
  };

  const getOrderStatusLabel = (value) => {
    const status = getOrderStatus(value);

    const found = ORDER_STATUS_OPTIONS.find(
      (item) => item.value === status
    );

    if (found) {
      return found.label;
    }

    return String(status)
      .replace(/\_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getReturnStatusLabel = (value) => {
    const status = String(
      value || "NONE"
    ).toUpperCase();

    return (
      RETURN_STATUS_LABELS[status] ||
      status
        .replace(/\_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )
    );
  };

  const getRefundStatusLabel = (value) => {
    const status = String(
      value || "NOT_APPLICABLE"
    ).toUpperCase();

    return (
      REFUND_STATUS_LABELS[status] ||
      status
        .replace(/\_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )
    );
  };

  /* =======================================================
     CURRENT STATUS OPTION
  ======================================================= */

  const currentStatusOption =
    ORDER_STATUS_OPTIONS.find(
      (item) =>
        item.value ===
        getOrderStatus(order?.orderStatus)
    ) || ORDER_STATUS_OPTIONS[0];

  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  };

  /* =======================================================
     FORMAT DATE
  ======================================================= */

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

  /* =======================================================
     FORMAT DATE + TIME
  ======================================================= */

  const formatDateTime = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* =======================================================
     ORDER ID
  ======================================================= */

  const getOrderId = (currentOrder) => {
    if (!currentOrder?._id) {
      return "—";
    }

    return `ORD-${String(
      currentOrder._id
    )
      .slice(-6)
      .toUpperCase()}`;
  };

  /* =======================================================
     CUSTOMER NAME
  ======================================================= */

  const getCustomerName = (currentOrder) => {
    return (
      currentOrder?.user?.name ||
      currentOrder?.user?.fullName ||
      currentOrder?.shippingAddress?.fullName ||
      currentOrder?.user?.email ||
      "Unknown Customer"
    );
  };

  /* =======================================================
     CUSTOMER EMAIL
  ======================================================= */

  const getCustomerEmail = (currentOrder) => {
    return (
      currentOrder?.user?.email || "—"
    );
  };

  /* =======================================================
     CUSTOMER PHONE
  ======================================================= */

  const getCustomerPhone = (currentOrder) => {
    return (
      currentOrder?.user?.phone ||
      currentOrder?.shippingAddress?.phone ||
      "—"
    );
  };

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  const getPaymentStatus = (currentOrder) => {
    return String(
      currentOrder?.paymentStatus ||
        "PENDING"
    ).toUpperCase();
  };

  const getPaymentStatusClass = (
    currentOrder
  ) => {
    const status =
      getPaymentStatus(currentOrder);

    if (status === "PAID") {
      return "paid";
    }

    if (status === "FAILED") {
      return "failed";
    }

    return "pending";
  };

  const getPaymentStatusLabel = (
    currentOrder
  ) => {
    const status =
      getPaymentStatus(currentOrder);

    if (status === "PAID") {
      return "Paid";
    }

    if (status === "FAILED") {
      return "Failed";
    }

    return "Pending";
  };

  /* =======================================================
     PRODUCT IMAGE
  ======================================================= */

  const getProductImage = (item) => {
    const product = item?.product;

    if (!product) {
      return "";
    }

    if (
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      const firstImage =
        product.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (
        typeof firstImage === "object" &&
        firstImage?.url
      ) {
        return firstImage.url;
      }
    }

    if (product.image) {
      return product.image;
    }

    return "";
  };

  /* =======================================================
     PRODUCT NAME
  ======================================================= */

  const getProductName = (item) => {
    return (
      item?.product?.name ||
      item?.name ||
      "Product"
    );
  };

  /* =======================================================
     PRODUCT PRICE
  ======================================================= */

  const getProductPrice = (item) => {
    return Number(
      item?.price ||
        item?.product?.salePrice ||
        item?.product?.regularPrice ||
        0
    );
  };

  /* =======================================================
     TOTAL ITEMS
  ======================================================= */

  const totalItems = useMemo(() => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce(
      (total, item) =>
        total +
        Number(item?.quantity || 0),
      0
    );
  }, [order]);

  /* =======================================================
     UPDATE ORDER STATUS
     PUT /api/orders/:id/status
  ======================================================= */

  const handleStatusChange = async (
    newStatus
  ) => {
    if (!order) {
      return;
    }

    const currentStatus =
      getOrderStatus(
        order.orderStatus
      );

    if (currentStatus === newStatus) {
      setStatusDropdownOpen(false);
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setStatusDropdownOpen(false);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/orders/${order._id}/status`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            orderStatus: newStatus,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update order status."
        );
      }

      await fetchOrder({
        showLoader: false,
      });

      toast.success(
        `Order status updated to ${getOrderStatusLabel(
          newStatus
        )} successfully.`,
        {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        }
      );
    } catch (err) {
      console.error(
        "Update order status error:",
        err
      );

      setError(
        err.message ||
          "Failed to update order status."
      );

      toast.error(
        err.message ||
          "Failed to update order status.",
        {
          position: "top-right",
          autoClose: 3000,
          theme: "light",
        }
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* =======================================================
     UPDATE PAYMENT STATUS
     PUT /api/orders/:id/payment-status

     Manual payment status update is ONLY for COD.
  ======================================================= */

  const handlePaymentStatusChange = async (
    newPaymentStatus
  ) => {
    if (!order) {
      return;
    }

    const currentPaymentStatus =
      getPaymentStatus(order);

    const currentPaymentMethod =
      String(
        order.paymentMethod || ""
      ).toUpperCase();

    /* Backend also allows this only for COD */
    if (currentPaymentMethod !== "COD") {
      toast.error(
        "Payment status can be manually updated only for COD orders.",
        {
          position: "top-right",
          autoClose: 3000,
          theme: "light",
        }
      );

      return;
    }

    if (
      currentPaymentStatus ===
      newPaymentStatus
    ) {
      return;
    }

    try {
      setUpdatingPayment(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/orders/${order._id}/payment-status`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            paymentStatus:
              newPaymentStatus,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update payment status."
        );
      }

      /*
       * Fetch latest order from backend
       * so paymentStatus + paidAt are refreshed.
       */
      await fetchOrder({
        showLoader: false,
      });

      const selectedPayment =
        PAYMENT_STATUS_OPTIONS.find(
          (item) =>
            item.value ===
            newPaymentStatus
        );

      toast.success(
        `Payment status updated to ${
          selectedPayment?.label ||
          newPaymentStatus
        } successfully.`,
        {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        }
      );
    } catch (err) {
      console.error(
        "Update payment status error:",
        err
      );

      setError(
        err.message ||
          "Failed to update payment status."
      );

      toast.error(
        err.message ||
          "Failed to update payment status.",
        {
          position: "top-right",
          autoClose: 3000,
          theme: "light",
        }
      );
    } finally {
      setUpdatingPayment(false);
    }
  };

  /* =======================================================
     UPDATE TRACKING
     PATCH /api/orders/:id/tracking
  ======================================================= */

  const handleTrackingUpdate = async () => {
    if (!order) {
      return;
    }

    const currentStatus =
      getOrderStatus(
        order.orderStatus
      );

    if (currentStatus !== "SHIPPED") {
      setError(
        "Tracking information can be updated only when the order status is Shipped."
      );

      return;
    }

    const trimmedTrackingNumber =
      trackingNumber.trim();

    const trimmedTrackingUrl =
      trackingUrl.trim();

    if (
      !trimmedTrackingNumber &&
      !trimmedTrackingUrl
    ) {
      setError(
        "Please enter a tracking number or tracking URL."
      );

      return;
    }

    if (
      trimmedTrackingUrl &&
      !/^https?:\/\/.+/i.test(
        trimmedTrackingUrl
      )
    ) {
      setError(
        "Please enter a valid tracking URL starting with http:// or https://."
      );

      return;
    }

    try {
      setUpdatingTracking(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/orders/${order._id}/tracking`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            trackingNumber:
              trimmedTrackingNumber,
            trackingUrl:
              trimmedTrackingUrl,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update tracking information."
        );
      }

      await fetchOrder({
        showLoader: false,
      });
    } catch (err) {
      console.error(
        "Update tracking error:",
        err
      );

      setError(
        err.message ||
          "Failed to update tracking information."
      );
    } finally {
      setUpdatingTracking(false);
    }
  };

  /* =======================================================
     UPDATE RETURN STATUS
     PUT /api/orders/:id/return-status
  ======================================================= */

  const handleReturnStatusChange = async (
    newReturnStatus
  ) => {
    if (!order) {
      return;
    }

    const currentReturnStatus =
      String(
        order.returnStatus || "NONE"
      ).toUpperCase();

    if (
      currentReturnStatus !== "REQUESTED"
    ) {
      setError(
        "There is no pending return request for this order."
      );

      return;
    }

    if (
      !["APPROVED", "REJECTED"].includes(
        newReturnStatus
      )
    ) {
      return;
    }

    try {
      setUpdatingReturn(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/orders/${order._id}/return-status`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            returnStatus:
              newReturnStatus,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update return status."
        );
      }

      await fetchOrder({
        showLoader: false,
      });
    } catch (err) {
      console.error(
        "Update return status error:",
        err
      );

      setError(
        err.message ||
          "Failed to update return status."
      );
    } finally {
      setUpdatingReturn(false);
    }
  };

  /* =======================================================
     SHIPPING ADDRESS
  ======================================================= */

  const shippingAddress =
    order?.shippingAddress || {};

  /* =======================================================
     RETURN VALUES
  ======================================================= */

  const returnStatus = String(
    order?.returnStatus || "NONE"
  ).toUpperCase();

  const refundStatus = String(
    order?.refundStatus ||
      "NOT_APPLICABLE"
  ).toUpperCase();

  const hasPendingReturn =
    returnStatus === "REQUESTED";

  const paymentMethod = String(
    order?.paymentMethod || ""
  ).toUpperCase();

  const isCODOrder =
    paymentMethod === "COD";

  const isRazorpayOrder =
    paymentMethod === "RAZORPAY";

  /* =======================================================
     TRACKING STATUS
  ======================================================= */

  const isShipped =
    getOrderStatus(
      order?.orderStatus
    ) === "SHIPPED";

  /* =======================================================
     TIMELINE
  ======================================================= */

  const timelineItems = [
    {
      key: "PENDING",
      label: "Order Placed",
      icon: "bi-bag-check",
    },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      icon: "bi-check-circle",
    },
    {
      key: "PROCESSING",
      label: "Processing",
      icon: "bi-box-seam",
    },
    {
      key: "SHIPPED",
      label: "Shipped",
      icon: "bi-truck",
    },
    {
      key: "OUT_FOR_DELIVERY",
      label: "Out for Delivery",
      icon: "bi-box-arrow-right",
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      icon: "bi-house-check",
    },
  ];

  const getTimelineActive = (
    timelineStatus
  ) => {
    const currentStatus =
      getOrderStatus(
        order?.orderStatus
      );

    const orderFlow = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    const currentIndex =
      orderFlow.indexOf(
        currentStatus
      );

    const timelineIndex =
      orderFlow.indexOf(
        timelineStatus
      );

    if (
      currentStatus === "CANCELLED"
    ) {
      return false;
    }

    return (
      currentIndex >= timelineIndex
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-loading">
          <i className="bi bi-arrow-repeat"></i>

          <span>
            Loading order details...
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-error">
          <div className="error-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>

          <h2>
            Unable to Load Order
          </h2>

          <p className="breakable">
            {error}
          </p>

          <button
            type="button"
            className="back-btn"
            onClick={() =>
              navigate("/admin/orders")
            }
          >
            <i className="bi bi-arrow-left"></i>

            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     NO ORDER
  ======================================================= */

  if (!order) {
    return (
      <div className="order-details-page">
        <div className="order-details-error">
          <div className="error-icon">
            <i className="bi bi-receipt"></i>
          </div>

          <h2>
            Order Not Found
          </h2>

          <p>
            The requested order could not
            be found.
          </p>

          <button
            type="button"
            className="back-btn"
            onClick={() =>
              navigate("/admin/orders")
            }
          >
            <i className="bi bi-arrow-left"></i>

            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="order-details-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="order-details-header">
        <div className="order-header-left">
          <div>
            <div className="page-eyebrow">
              ORDER DETAILS
            </div>

            <h1>
              {getOrderId(order)}
            </h1>

            <p>
              Complete information about this order
            </p>
          </div>
        </div>

        {/* =================================================
            TOP RIGHT ACTIONS
        ================================================= */}

        <div className="order-header-actions">

          {/* STATUS DROPDOWN */}

          <div
            className="order-status-control"
            ref={statusDropdownRef}
          >
            <label>
              Order Status
            </label>

            <button
              type="button"
              className={`custom-status-trigger ${
                statusDropdownOpen
                  ? "open"
                  : ""
              }`}
              onClick={() =>
                !updatingStatus &&
                setStatusDropdownOpen(
                  (prev) => !prev
                )
              }
              disabled={updatingStatus}
            >
              <span>
                {updatingStatus
                  ? "Updating..."
                  : currentStatusOption.label}
              </span>

              <i
                className={`bi ${
                  statusDropdownOpen
                    ? "bi-chevron-up"
                    : "bi-chevron-down"
                }`}
              ></i>
            </button>

            {statusDropdownOpen && (
              <div className="custom-status-menu">
                {ORDER_STATUS_OPTIONS.map(
                  (option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={`custom-status-option ${
                        option.value ===
                        currentStatusOption.value
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleStatusChange(
                          option.value
                        )
                      }
                    >
                      <span>
                        {option.label}
                      </span>

                      {option.value ===
                        currentStatusOption.value && (
                        <i className="bi bi-check2"></i>
                      )}
                    </button>
                  )
                )}
              </div>
            )}

            {updatingStatus && (
              <span className="status-saving">
                Updating status...
              </span>
            )}
          </div>

          {/* BLACK BACK TO ORDERS BUTTON */}

          <button
            type="button"
            className="top-back-btn"
            onClick={() =>
              navigate("/admin/orders")
            }
          >
            <i className="bi bi-arrow-left"></i>

            <span>
              Back to Orders
            </span>
          </button>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="order-inline-error">
          <i className="bi bi-exclamation-circle"></i>

          <span className="breakable">
            {error}
          </span>
        </div>
      )}

      {/* =================================================
          META CARDS
      ================================================= */}

      <div className="order-meta-grid">

        <div className="meta-card">
          <div className="meta-icon">
            <i className="bi bi-person"></i>
          </div>

          <div>
            <span>
              Customer
            </span>

            <strong className="breakable">
              {getCustomerName(order)}
            </strong>
          </div>
        </div>

        <div className="meta-card">
          <div className="meta-icon">
            <i className="bi bi-calendar3"></i>
          </div>

          <div>
            <span>
              Order Date
            </span>

            <strong>
              {formatDate(
                order.createdAt
              )}
            </strong>
          </div>
        </div>

        <div className="meta-card">
          <div className="meta-icon">
            <i className="bi bi-box-seam"></i>
          </div>

          <div>
            <span>
              Items
            </span>

            <strong>
              {totalItems}
            </strong>
          </div>
        </div>

        <div className="meta-card">
          <div className="meta-icon">
            <i className="bi bi-currency-rupee"></i>
          </div>

          <div>
            <span>
              Final Amount
            </span>

            <strong>
              {formatCurrency(
                order.finalAmount
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* =================================================
          CUSTOMER + SHIPPING
      ================================================= */}

      <div className="details-two-column">

        {/* CUSTOMER */}

        <div className="details-card">
          <div className="card-heading">
            <div className="heading-icon">
              <i className="bi bi-person-vcard"></i>
            </div>

            <div>
              <h2>
                Customer Information
              </h2>

              <p>
                Customer contact details
              </p>
            </div>
          </div>

          <div className="info-list">

            <div className="info-row">
              <span>
                Name
              </span>

              <strong className="breakable">
                {getCustomerName(order)}
              </strong>
            </div>

            <div className="info-row">
              <span>
                Email
              </span>

              <strong className="breakable">
                {getCustomerEmail(order)}
              </strong>
            </div>

            <div className="info-row">
              <span>
                Phone
              </span>

              <strong className="breakable">
                {getCustomerPhone(order)}
              </strong>
            </div>

          </div>
        </div>

        {/* SHIPPING */}

        <div className="details-card">
          <div className="card-heading">
            <div className="heading-icon">
              <i className="bi bi-geo-alt"></i>
            </div>

            <div>
              <h2>
                Shipping Address
              </h2>

              <p>
                Delivery information
              </p>
            </div>
          </div>

          <div className="shipping-address">
            <strong className="breakable">
              {shippingAddress.fullName ||
                getCustomerName(order)}
            </strong>

            <span className="breakable">
              {shippingAddress.address ||
                "—"}
            </span>

            <span className="breakable">
              {[
                shippingAddress.city,
                shippingAddress.state,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </span>

            <span>
              Pincode:{" "}
              {shippingAddress.pincode ||
                "—"}
            </span>

            <span>
              Phone:{" "}
              {shippingAddress.phone ||
                getCustomerPhone(order)}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          PAYMENT + ORDER INFORMATION
      ================================================= */}

      <div className="details-two-column">

        {/* PAYMENT */}

        <div className="details-card">

          <div className="card-heading">
            <div className="heading-icon">
              <i className="bi bi-credit-card"></i>
            </div>

            <div>
              <h2>
                Payment Information
              </h2>

              <p>
                Payment and transaction details
              </p>
            </div>
          </div>

          <div className="info-list">

            <div className="info-row">
              <span>
                Payment Method
              </span>

              <strong>
                {order.paymentMethod ||
                  "—"}
              </strong>
            </div>

            {/* =================================================
                PAYMENT STATUS
                COD = editable
                RAZORPAY = read only
            ================================================= */}

            <div className="info-row">
              <span>
                Payment Status
              </span>

              <strong>

                {isCODOrder ? (
                  <select
                    className={`payment-status-select ${getPaymentStatusClass(
                      order
                    )}`}
                    value={getPaymentStatus(
                      order
                    )}
                    onChange={(event) =>
                      handlePaymentStatusChange(
                        event.target.value
                      )
                    }
                    disabled={updatingPayment}
                  >
                    {PAYMENT_STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {updatingPayment &&
                          getPaymentStatus(
                            order
                          ) ===
                            option.value
                            ? "Updating..."
                            : option.label}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <span
                    className={`payment-status ${getPaymentStatusClass(
                      order
                    )}`}
                  >
                    {getPaymentStatusLabel(
                      order
                    )}
                  </span>
                )}

              </strong>
            </div>

            {isCODOrder && (
              <div className="payment-status-note">
                <i className="bi bi-info-circle"></i>

                <span>
                  COD payment status can be
                  updated manually after
                  receiving the payment.
                </span>
              </div>
            )}

            <div className="info-row">
              <span>
                Order Created
              </span>

              <strong>
                {formatDateTime(
                  order.createdAt
                )}
              </strong>
            </div>

            {order.paidAt && (
              <div className="info-row">
                <span>
                  Paid At
                </span>

                <strong>
                  {formatDateTime(
                    order.paidAt
                  )}
                </strong>
              </div>
            )}

            {order.razorpayOrderId && (
              <div className="info-row">
                <span>
                  Razorpay Order
                </span>

                <strong className="breakable">
                  {order.razorpayOrderId}
                </strong>
              </div>
            )}

            {order.razorpayPaymentId && (
              <div className="info-row">
                <span>
                  Razorpay Payment
                </span>

                <strong className="breakable">
                  {order.razorpayPaymentId}
                </strong>
              </div>
            )}

          </div>
        </div>

        {/* ORDER INFORMATION */}

        <div className="details-card">

          <div className="card-heading">
            <div className="heading-icon">
              <i className="bi bi-receipt"></i>
            </div>

            <div>
              <h2>
                Order Information
              </h2>

              <p>
                Basic order details
              </p>
            </div>
          </div>

          <div className="info-list">

            <div className="info-row">
              <span>
                Order ID
              </span>

              <strong className="breakable">
                {order._id}
              </strong>
            </div>

            <div className="info-row">
              <span>
                Status
              </span>

              <strong>
                {getOrderStatusLabel(
                  order.orderStatus
                )}
              </strong>
            </div>

            <div className="info-row">
              <span>
                Items
              </span>

              <strong>
                {totalItems}
              </strong>
            </div>

            <div className="info-row">
              <span>
                Payment Method
              </span>

              <strong>
                {order.paymentMethod ||
                  "—"}
              </strong>
            </div>

          </div>
        </div>
      </div>

      {/* =================================================
          TRACKING INFORMATION
      ================================================= */}

      <div className="details-card tracking-card">

        <div className="card-heading">
          <div className="heading-icon">
            <i className="bi bi-truck"></i>
          </div>

          <div>
            <h2>
              Tracking Information
            </h2>

            <p>
              Saved shipping tracking details
            </p>
          </div>
        </div>

        {trackingUrl?.trim() ? (
          <div className="tracking-preview">

            <div className="tracking-preview-item">
              <span>
                Saved Tracking URL
              </span>

              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tracking-link"
              >
                <i className="bi bi-box-arrow-up-right"></i>

                {trackingUrl}
              </a>
            </div>

          </div>
        ) : (
          <div className="tracking-notice">
            <i className="bi bi-info-circle"></i>

            <span>
              No tracking URL has been saved
              for this order.
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <div className="details-card products-card">

        <div className="card-heading">
          <div className="heading-icon">
            <i className="bi bi-bag"></i>
          </div>

          <div>
            <h2>
              Ordered Products
            </h2>

            <p>
              Products included in this order
            </p>
          </div>
        </div>

        <div className="ordered-products">

          {Array.isArray(order.items) &&
          order.items.length > 0 ? (
            order.items.map(
              (item, index) => {
                const image =
                  getProductImage(item);

                const price =
                  getProductPrice(item);

                const quantity =
                  Number(
                    item?.quantity || 0
                  );

                return (
                  <div
                    className="ordered-product"
                    key={
                      item?._id ||
                      `${
                        item?.product?._id ||
                        "product"
                      }-${index}`
                    }
                  >

                    {/* IMAGE */}

                    <div className="product-image">
                      {image ? (
                        <img
                          src={image}
                          alt={getProductName(
                            item
                          )}
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";

                            const parent =
                              event.currentTarget
                                .parentElement;

                            if (
                              parent &&
                              !parent.querySelector(
                                ".image-placeholder"
                              )
                            ) {
                              const placeholder =
                                document.createElement(
                                  "div"
                                );

                              placeholder.className =
                                "image-placeholder";

                              placeholder.innerHTML =
                                '<i class="bi bi-image"></i>';

                              parent.appendChild(
                                placeholder
                              );
                            }
                          }}
                        />
                      ) : (
                        <div className="image-placeholder">
                          <i className="bi bi-image"></i>
                        </div>
                      )}
                    </div>

                    {/* PRODUCT INFO */}

                    <div className="product-info">
                      <strong className="breakable">
                        {getProductName(
                          item
                        )}
                      </strong>

                      {item?.product?.sku && (
                        <span>
                          SKU:{" "}
                          {item.product.sku}
                        </span>
                      )}

                      {Array.isArray(
                        item?.product?.variants
                      ) &&
                        item.product.variants
                          .length > 0 && (
                          <span className="breakable">
                            Available sizes:{" "}
                            {item.product.variants.join(
                              ", "
                            )}
                          </span>
                        )}
                    </div>

                    {/* QUANTITY */}

                    <div className="product-quantity">
                      <span>
                        Qty
                      </span>

                      <strong>
                        ×{quantity}
                      </strong>
                    </div>

                    {/* PRICE */}

                    <div className="product-price">
                      <span>
                        Price
                      </span>

                      <strong>
                        {formatCurrency(
                          price *
                            quantity
                        )}
                      </strong>
                    </div>

                  </div>
                );
              }
            )
          ) : (
            <div className="empty-products">
              <i className="bi bi-bag-x"></i>

              <span>
                No products found in this
                order.
              </span>
            </div>
          )}

        </div>
      </div>

      {/* =================================================
          RETURN & REFUND
      ================================================= */}

      <div className="details-card return-refund-card">

        <div className="card-heading">
          <div className="heading-icon">
            <i className="bi bi-arrow-return-left"></i>
          </div>

          <div>
            <h2>
              Return & Refund
            </h2>

            <p>
              Return request and refund information
            </p>
          </div>
        </div>

        <div className="return-refund-grid">

          <div className="return-refund-item">
            <span>
              Return Status
            </span>

            <strong>
              {getReturnStatusLabel(
                returnStatus
              )}
            </strong>
          </div>

          <div className="return-refund-item">
            <span>
              Requested At
            </span>

            <strong>
              {formatDateTime(
                order.returnRequestedAt
              )}
            </strong>
          </div>

          <div className="return-refund-item">
            <span>
              Refund Status
            </span>

            <strong>
              <span
                className={`refund-status ${refundStatus.toLowerCase()}`}
              >
                {isCODOrder
                  ? "Not Applicable"
                  : getRefundStatusLabel(
                      refundStatus
                    )}
              </span>
            </strong>
          </div>

          <div className="return-refund-item">
            <span>
              Refund Amount
            </span>

            <strong>
              {formatCurrency(
                order.refundAmount
              )}
            </strong>
          </div>

          <div className="return-refund-item">
            <span>
              Return Reason
            </span>

            <strong className="breakable">
              {order.returnReason ||
                "No return reason provided"}
            </strong>
          </div>

          <div className="return-refund-item">
            <span>
              Refund ID
            </span>

            <strong className="breakable">
              {isCODOrder
                ? "Not Applicable"
                : order.refundId || "—"}
            </strong>
          </div>

          <div className="return-refund-item">
            <span>
              Refunded At
            </span>

            <strong>
              {isCODOrder
                ? "Not Applicable"
                : formatDateTime(
                    order.refundedAt
                  )}
            </strong>
          </div>

        </div>

        {/* RETURN CONTROL */}

        <div className="return-control">

          {hasPendingReturn ? (
            <>
              <div className="return-action-buttons">

                <button
                  type="button"
                  className="secondary-action-btn"
                  disabled={
                    updatingReturn
                  }
                  onClick={() =>
                    handleReturnStatusChange(
                      "APPROVED"
                    )
                  }
                >
                  <i className="bi bi-check-circle"></i>

                  {updatingReturn
                    ? "Updating..."
                    : "Approve Return"}
                </button>

                <button
                  type="button"
                  className="secondary-action-btn"
                  disabled={
                    updatingReturn
                  }
                  onClick={() =>
                    handleReturnStatusChange(
                      "REJECTED"
                    )
                  }
                >
                  <i className="bi bi-x-circle"></i>

                  {updatingReturn
                    ? "Updating..."
                    : "Reject Return"}
                </button>

              </div>

              <small>
                {isCODOrder
                  ? "COD return approval does not create an online refund. Handle the cash refund according to your store return process."
                  : isRazorpayOrder
                  ? "Approving a paid Razorpay return automatically creates the refund through the backend."
                  : "Return approval will be processed by the backend."}
              </small>
            </>
          ) : (
            <small>
              {returnStatus === "NONE"
                ? "No return request has been submitted for this order."
                : `Return status is ${getReturnStatusLabel(
                    returnStatus
                  )}. No further return decision is available.`}
            </small>
          )}

        </div>
      </div>

      {/* =================================================
          SUMMARY + TIMELINE
      ================================================= */}

      <div className="details-two-column bottom-grid">

        {/* SUMMARY */}

        <div className="details-card">

          <div className="card-heading">
            <div className="heading-icon">
              <i className="bi bi-calculator"></i>
            </div>

            <div>
              <h2>
                Order Summary
              </h2>

              <p>
                Payment breakdown
              </p>
            </div>
          </div>

          <div className="summary-list">

            <div className="summary-row">
              <span>
                Subtotal
              </span>

              <strong>
                {formatCurrency(
                  order.totalAmount
                )}
              </strong>
            </div>

            <div className="summary-row">
              <span>
                Discount
              </span>

              <strong className="discount-value">
                -{" "}
                {formatCurrency(
                  order.discountAmount
                )}
              </strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total">
              <span>
                Final Amount
              </span>

              <strong>
                {formatCurrency(
                  order.finalAmount
                )}
              </strong>
            </div>

          </div>
        </div>

        {/* TIMELINE */}

        <div className="details-card timeline-card">

          <div className="card-heading">
            <div className="heading-icon">
              <i className="bi bi-clock-history"></i>
            </div>

            <div>
              <h2>
                Order Timeline
              </h2>

              <p>
                Current order progress
              </p>
            </div>
          </div>

          <div className="timeline">

            {getOrderStatus(
              order.orderStatus
            ) === "CANCELLED" ? (
              <div className="timeline-item cancelled">

                <div className="timeline-dot">
                  <i className="bi bi-x-lg"></i>
                </div>

                <div>
                  <strong>
                    Order Cancelled
                  </strong>

                  <span>
                    This order has been cancelled.
                  </span>
                </div>

              </div>
            ) : (
              timelineItems.map(
                (item) => (
                  <div
                    key={item.key}
                    className={`timeline-item ${
                      getTimelineActive(
                        item.key
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    <div className="timeline-dot">
                      <i
                        className={`bi ${item.icon}`}
                      ></i>
                    </div>

                    <div>
                      <strong>
                        {item.label}
                      </strong>

                      <span>
                        {getTimelineActive(
                          item.key
                        )
                          ? "Completed"
                          : "Waiting"}
                      </span>
                    </div>
                  </div>
                )
              )
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

export default OrderDetails;