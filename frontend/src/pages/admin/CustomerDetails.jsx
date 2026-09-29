import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CustomerDetails.css";

const API_URL = "http://localhost:5000/api";

// =========================================================
// CUSTOMER DETAILS
// =========================================================

const CustomerDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // =========================================================
  // CUSTOMER FROM CUSTOMERS PAGE
  // =========================================================

  const customer = location.state?.customer;

  // =========================================================
  // STATE
  // =========================================================

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = useCallback(() => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("adminToken") ||
      ""
    );
  }, []);

  // =========================================================
  // FETCH CUSTOMER ORDERS
  // =========================================================

  const fetchCustomerOrders = useCallback(async () => {
    if (!customer?._id) {
      setOrders([]);
      return;
    }

    try {
      setLoadingOrders(true);
      setOrdersError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // =====================================================
      // FIRST PAGE
      // =====================================================

      const firstResponse = await fetch(
        `${API_URL}/orders/all?page=1`,
        {
          method: "GET",
          headers,
        }
      );

      const firstText = await firstResponse.text();

      let firstData = {};

      try {
        firstData = firstText ? JSON.parse(firstText) : {};
      } catch (error) {
        throw new Error(
          "Invalid response received from orders API."
        );
      }

      if (!firstResponse.ok) {
        throw new Error(
          firstData?.message ||
            `Failed to fetch orders (${firstResponse.status})`
        );
      }

      let allOrders = Array.isArray(firstData.orders)
        ? firstData.orders
        : [];

      // =====================================================
      // TOTAL PAGES
      // =====================================================

      const totalPages = Math.max(
        Number(firstData.totalPages) || 1,
        1
      );

      // =====================================================
      // FETCH REMAINING PAGES
      // =====================================================

      if (totalPages > 1) {
        for (
          let page = 2;
          page <= totalPages;
          page += 1
        ) {
          const response = await fetch(
            `${API_URL}/orders/all?page=${page}`,
            {
              method: "GET",
              headers,
            }
          );

          const text = await response.text();

          let data = {};

          try {
            data = text ? JSON.parse(text) : {};
          } catch (error) {
            throw new Error(
              `Invalid response received while loading orders page ${page}.`
            );
          }

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Failed to fetch orders page ${page} (${response.status})`
            );
          }

          if (Array.isArray(data.orders)) {
            allOrders = [
              ...allOrders,
              ...data.orders,
            ];
          }
        }
      }

      // =====================================================
      // FILTER SELECTED CUSTOMER'S ORDERS
      // =====================================================

      const customerId = String(customer._id);

      const customerOrders = allOrders.filter(
        (order) => {
          if (!order?.user) {
            return false;
          }

          const orderUserId =
            typeof order.user === "object"
              ? order.user?._id
              : order.user;

          if (!orderUserId) {
            return false;
          }

          return String(orderUserId) === customerId;
        }
      );

      // =====================================================
      // NEWEST FIRST
      // =====================================================

      customerOrders.sort((a, b) => {
        const dateA = new Date(
          a?.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b?.createdAt || 0
        ).getTime();

        return dateB - dateA;
      });

      setOrders(customerOrders);
    } catch (error) {
      console.error(
        "Customer orders fetch error:",
        error
      );

      setOrders([]);

      setOrdersError(
        error?.message ||
          "Failed to load customer orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  }, [customer?._id, getToken]);

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  useEffect(() => {
    fetchCustomerOrders();
  }, [fetchCustomerOrders]);

  // =========================================================
  // SORTED ORDERS
  // =========================================================

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(
        a?.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b?.createdAt || 0
      ).getTime();

      return dateB - dateA;
    });
  }, [orders]);

  // =========================================================
  // TOTAL SPENT
  // =========================================================

  const totalSpent = useMemo(() => {
    return orders.reduce(
      (total, order) => {
        const amount = Number(
          order?.finalAmount ??
            order?.totalAmount ??
            0
        );

        return (
          total +
          (Number.isFinite(amount) ? amount : 0)
        );
      },
      0
    );
  }, [orders]);

  // =========================================================
  // LATEST ORDER
  // =========================================================

  const latestOrder = useMemo(() => {
    if (!sortedOrders.length) {
      return null;
    }

    return sortedOrders[0];
  }, [sortedOrders]);

  // =========================================================
  // LATEST SHIPPING ADDRESS
  // =========================================================

  const shippingAddress = useMemo(() => {
    if (!latestOrder?.shippingAddress) {
      return null;
    }

    return latestOrder.shippingAddress;
  }, [latestOrder]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getInitials = (name = "") => {
    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) {
      return "CU";
    }

    if (words.length === 1) {
      return words[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();
  };

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

  const formatCurrency = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "₹0";
    }

    return `₹${value.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =========================================================
  // PRODUCT NAME
  // =========================================================

  const getProductName = (item) => {
    if (!item) {
      return "Product";
    }

    if (
      typeof item.product === "object" &&
      item.product?.name
    ) {
      return item.product.name;
    }

    if (item.productName) {
      return item.productName;
    }

    return "Product";
  };

  // =========================================================
  // PRODUCT IMAGE
  // =========================================================

  const getProductImage = (item) => {
    const product =
      typeof item?.product === "object"
        ? item.product
        : null;

    if (!product) {
      return "";
    }

    if (
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      const firstImage = product.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (
        typeof firstImage === "object"
      ) {
        return (
          firstImage.url ||
          firstImage.secure_url ||
          firstImage.path ||
          ""
        );
      }
    }

    if (product.image) {
      return product.image;
    }

    return "";
  };

  // =========================================================
  // ITEMS COUNT
  // =========================================================

  const getItemsCount = (order) => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce(
      (total, item) => {
        const quantity = Number(
          item?.quantity || 0
        );

        return (
          total +
          (Number.isFinite(quantity)
            ? quantity
            : 0)
        );
      },
      0
    );
  };

  // =========================================================
  // PAYMENT METHOD
  // =========================================================

  const getPaymentMethod = (order) => {
    if (!order?.paymentMethod) {
      return "—";
    }

    return String(
      order.paymentMethod
    ).toUpperCase();
  };

  // =========================================================
  // PAYMENT STATUS
  // =========================================================

  const getPaymentStatus = (order) => {
    if (!order?.paymentStatus) {
      return "—";
    }

    return String(
      order.paymentStatus
    ).toUpperCase();
  };

  // =========================================================
  // ORDER STATUS
  // =========================================================

  const getOrderStatus = (order) => {
    if (!order?.orderStatus) {
      return "—";
    }

    return String(
      order.orderStatus
    ).toUpperCase();
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status = "") => {
    return String(status)
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  // =========================================================
  // ADDRESS LINES
  // =========================================================

  const getAddressLines = (address) => {
    if (!address) {
      return [];
    }

    return [
      address.fullName,
      address.phone,
      address.address,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
  };

  // =========================================================
  // NO CUSTOMER
  // =========================================================

  if (!customer) {
    return (
      <div className="customer-details-page">
        <div className="customer-details-empty">
          <div className="customer-details-empty-icon">
            <i className="bi bi-person-x"></i>
          </div>

          <h2>Customer Not Found</h2>

          <p>
            Customer information was not
            available.
          </p>

          <button
            type="button"
            className="customer-details-back-btn"
            onClick={() =>
              navigate("/admin/customers")
            }
          >
            <i className="bi bi-arrow-left"></i>
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // CUSTOMER DATA
  // =========================================================

  const customerName =
    customer.name || "Unknown Customer";

  const customerEmail =
    customer.email || "No email";

  const customerPhone =
    customer.phone || "Not provided";

  const customerStatus =
    customer.status || "active";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="customer-details-page">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div className="customer-details-topbar">
        <div>
          <h1>Customer Details</h1>

          <p>
            View customer information and order
            history.
          </p>
        </div>
      </div>

      {/* =====================================================
          PROFILE HEADER
      ===================================================== */}

      <section className="customer-profile-card">
        <div className="customer-profile-left">
          <div className="customer-details-avatar">
            {getInitials(customerName)}
          </div>

          <div className="customer-profile-info">
            <div className="customer-name-row">
              <h2>{customerName}</h2>

              <span
                className={`customer-status-badge ${getStatusClass(
                  customerStatus
                )}`}
              >
                <span className="customer-status-dot"></span>

                {String(customerStatus)
                  .charAt(0)
                  .toUpperCase() +
                  String(customerStatus)
                    .slice(1)
                    .toLowerCase()}
              </span>
            </div>

            <p className="customer-email">
              <i className="bi bi-envelope"></i>
              {customerEmail}
            </p>

            <p className="customer-phone">
              <i className="bi bi-telephone"></i>
              {customerPhone}
            </p>
          </div>
        </div>

        {/* ONLY ONE BACK BUTTON */}
        <div className="customer-profile-actions">
          <button
            type="button"
            className="customer-profile-action-btn"
            onClick={() =>
              navigate("/admin/customers")
            }
          >
            <i className="bi bi-arrow-left"></i>
            Back
          </button>
        </div>
      </section>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="customer-summary-grid">

        {/* TOTAL ORDERS */}

        <div className="customer-summary-card">
          <div className="customer-summary-icon orders">
            <i className="bi bi-bag-check"></i>
          </div>

          <div>
            <span className="customer-summary-label">
              Total Orders
            </span>

            <strong>
              {loadingOrders
                ? "..."
                : orders.length}
            </strong>
          </div>
        </div>

        {/* TOTAL SPENT */}

        <div className="customer-summary-card">
          <div className="customer-summary-icon spent">
            <i className="bi bi-currency-rupee"></i>
          </div>

          <div>
            <span className="customer-summary-label">
              Total Spent
            </span>

            <strong>
              {loadingOrders
                ? "..."
                : formatCurrency(totalSpent)}
            </strong>
          </div>
        </div>

        {/* JOINED */}

        <div className="customer-summary-card">
          <div className="customer-summary-icon joined">
            <i className="bi bi-calendar3"></i>
          </div>

          <div>
            <span className="customer-summary-label">
              Joined
            </span>

            <strong>
              {formatDate(customer.createdAt)}
            </strong>
          </div>
        </div>

        {/* ACCOUNT */}

        <div className="customer-summary-card">
          <div className="customer-summary-icon status">
            <i className="bi bi-person-check"></i>
          </div>

          <div>
            <span className="customer-summary-label">
              Account
            </span>

            <strong>
              {String(customerStatus)
                .charAt(0)
                .toUpperCase() +
                String(customerStatus)
                  .slice(1)
                  .toLowerCase()}
            </strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="customer-details-grid">

        {/* PERSONAL INFORMATION */}

        <section className="customer-info-card">
          <div className="customer-section-header">
            <div>
              <h3>Personal Information</h3>

              <p>
                Customer account information
              </p>
            </div>

            <i className="bi bi-person"></i>
          </div>

          <div className="customer-info-list">

            <div className="customer-info-row">
              <span>Name</span>

              <strong>
                {customerName}
              </strong>
            </div>

            <div className="customer-info-row">
              <span>Email</span>

              <strong>
                {customerEmail}
              </strong>
            </div>

            <div className="customer-info-row">
              <span>Phone</span>

              <strong>
                {customerPhone}
              </strong>
            </div>

            <div className="customer-info-row">
              <span>Role</span>

              <strong>
                {customer.role || "user"}
              </strong>
            </div>

            <div className="customer-info-row">
              <span>Email Verified</span>

              <strong
                className={
                  customer.isEmailVerified
                    ? "verified"
                    : "not-verified"
                }
              >
                <i
                  className={
                    customer.isEmailVerified
                      ? "bi bi-check-circle-fill"
                      : "bi bi-x-circle-fill"
                  }
                ></i>

                {customer.isEmailVerified
                  ? "Verified"
                  : "Not Verified"}
              </strong>
            </div>

            <div className="customer-info-row">
              <span>Profile</span>

              <strong
                className={
                  customer.profileCompleted
                    ? "verified"
                    : "not-verified"
                }
              >
                <i
                  className={
                    customer.profileCompleted
                      ? "bi bi-check-circle-fill"
                      : "bi bi-x-circle-fill"
                  }
                ></i>

                {customer.profileCompleted
                  ? "Completed"
                  : "Incomplete"}
              </strong>
            </div>

            <div className="customer-info-row">
              <span>Joined</span>

              <strong>
                {formatDate(customer.createdAt)}
              </strong>
            </div>

            <div className="customer-info-row">
              <span>Customer ID</span>

              <strong
                className="customer-id-value"
                title={customer._id}
              >
                {customer._id || "—"}
              </strong>
            </div>
          </div>
        </section>

        {/* SHIPPING ADDRESS */}

        <section className="customer-info-card">
          <div className="customer-section-header">
            <div>
              <h3>Shipping Address</h3>

              <p>
                Latest order delivery address
              </p>
            </div>

            <i className="bi bi-geo-alt"></i>
          </div>

          {shippingAddress ? (
            <div className="customer-address-box">
              {getAddressLines(
                shippingAddress
              ).map((line, index) => (
                <div
                  className="customer-address-line"
                  key={`${line}-${index}`}
                >
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div className="customer-no-address">
              <i className="bi bi-geo-alt"></i>

              <span>
                No shipping address available.
              </span>

              <small>
                Address will appear when this
                customer has an order.
              </small>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          ORDER ERROR
      ===================================================== */}

      {ordersError && (
        <section className="customer-orders-error">
          <div>
            <i className="bi bi-exclamation-triangle"></i>

            <div>
              <strong>
                Unable to load customer orders
              </strong>

              <p>{ordersError}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchCustomerOrders}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Retry
          </button>
        </section>
      )}

      {/* =====================================================
          ACCOUNT STATUS
      ===================================================== */}

      <section className="customer-account-status-card">
        <div className="customer-account-status-left">
          <div
            className={`customer-account-status-icon ${getStatusClass(
              customerStatus
            )}`}
          >
            <i
              className={
                String(customerStatus).toLowerCase() ===
                "blocked"
                  ? "bi bi-person-lock"
                  : "bi bi-person-check"
              }
            ></i>
          </div>

          <div>
            <h3>Account Status</h3>

            <p>
              This customer account is currently{" "}
              <strong>
                {String(customerStatus)
                  .charAt(0)
                  .toUpperCase() +
                  String(customerStatus)
                    .slice(1)
                    .toLowerCase()}
              </strong>
              .
            </p>
          </div>
        </div>

        <span
          className={`customer-large-status ${getStatusClass(
            customerStatus
          )}`}
        >
          {String(customerStatus)
            .charAt(0)
            .toUpperCase() +
            String(customerStatus)
              .slice(1)
              .toLowerCase()}
        </span>
      </section>

      {/* =====================================================
          RECENT ORDERS
      ===================================================== */}

      <section className="customer-orders-card">
        <div className="customer-section-header orders-header">
          <div>
            <h3>Recent Orders</h3>

            <p>
              Orders placed by this customer
            </p>
          </div>

          <div className="customer-orders-count">
            <i className="bi bi-bag"></i>

            {loadingOrders
              ? "Loading..."
              : `${orders.length} ${
                  orders.length === 1
                    ? "Order"
                    : "Orders"
                }`}
          </div>
        </div>

        {/* LOADING */}

        {loadingOrders ? (
          <div className="customer-orders-loading">
            <div className="customer-loading-spinner"></div>

            <p>
              Loading customer orders...
            </p>
          </div>
        ) : orders.length === 0 ? (

          /* NO ORDERS */

          <div className="customer-no-orders">
            <div className="customer-no-orders-icon">
              <i className="bi bi-bag-x"></i>
            </div>

            <h4>No Orders Yet</h4>

            <p>
              This customer has not placed any
              orders.
            </p>
          </div>

        ) : (

          /* ORDERS TABLE */

          <div className="customer-orders-table-wrapper">
            <table className="customer-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Date</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Payment Status</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {sortedOrders.map((order) => {
                  const firstItem =
                    Array.isArray(order.items) &&
                    order.items.length > 0
                      ? order.items[0]
                      : null;

                  const productName =
                    getProductName(firstItem);

                  const productImage =
                    getProductImage(firstItem);

                  const orderAmount =
                    order?.finalAmount ??
                    order?.totalAmount ??
                    0;

                  return (
                    <tr key={order._id}>

                      {/* ORDER */}

                      <td>
                        <button
                          type="button"
                          className="customer-order-id"
                          title="View Order Details"
                          onClick={() =>
                            navigate(
                              `/admin/orders/${order._id}`
                            )
                          }
                        >
                          #
                          {String(
                            order._id || ""
                          ).slice(-8)}
                        </button>
                      </td>

                      {/* PRODUCT */}

                      <td>
                        <div className="customer-order-product">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={productName}
                              className="customer-order-product-image"
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="customer-order-product-placeholder">
                              <i className="bi bi-image"></i>
                            </div>
                          )}

                          <div className="customer-order-product-info">
                            <strong>
                              {productName}
                            </strong>

                            {order.items?.length >
                              1 && (
                              <small>
                                +
                                {order.items.length -
                                  1}{" "}
                                more{" "}
                                {order.items.length -
                                  1 ===
                                1
                                  ? "item"
                                  : "items"}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* DATE */}

                      <td>
                        <span className="customer-order-date">
                          {formatDate(
                            order.createdAt
                          )}
                        </span>

                        <small className="customer-order-time">
                          {formatDateTime(
                            order.createdAt
                          )
                            .split(",")
                            .slice(1)
                            .join(",")
                            .trim()}
                        </small>
                      </td>

                      {/* QTY */}

                      <td>
                        <span className="customer-order-qty">
                          {getItemsCount(order)}
                        </span>
                      </td>

                      {/* AMOUNT */}

                      <td>
                        <strong className="customer-order-amount">
                          {formatCurrency(
                            orderAmount
                          )}
                        </strong>
                      </td>

                      {/* PAYMENT METHOD */}

                      <td>
                        <span className="customer-payment-method">
                          {getPaymentMethod(order)}
                        </span>
                      </td>

                      {/* PAYMENT STATUS */}

                      <td>
                        <span
                          className={`customer-payment-status ${getStatusClass(
                            getPaymentStatus(order)
                          )}`}
                        >
                          {getPaymentStatus(order)}
                        </span>
                      </td>

                      {/* ORDER STATUS */}

                      <td>
                        <span
                          className={`customer-order-status ${getStatusClass(
                            getOrderStatus(order)
                          )}`}
                        >
                          <span className="customer-order-status-dot"></span>

                          {getOrderStatus(order)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          LATEST ORDER SUMMARY
      ===================================================== */}

      {latestOrder && (
        <section className="customer-latest-order-card">
          <div className="customer-section-header">
            <div>
              <h3>Latest Order Summary</h3>

              <p>
                Information from the customer's
                latest order
              </p>
            </div>

            <i className="bi bi-receipt"></i>
          </div>

          <div className="customer-latest-order-grid">

            {/* ORDER ID */}

            <div className="customer-latest-order-item">
              <span>Order ID</span>

              <strong>
                #
                {String(
                  latestOrder._id || ""
                ).slice(-8)}
              </strong>
            </div>

            {/* ORDER DATE */}

            <div className="customer-latest-order-item">
              <span>Order Date</span>

              <strong>
                {formatDate(
                  latestOrder.createdAt
                )}
              </strong>
            </div>

            {/* ITEMS */}

            <div className="customer-latest-order-item">
              <span>Items</span>

              <strong>
                {getItemsCount(latestOrder)}
              </strong>
            </div>

            {/* AMOUNT */}

            <div className="customer-latest-order-item">
              <span>Amount</span>

              <strong>
                {formatCurrency(
                  latestOrder.finalAmount ??
                    latestOrder.totalAmount ??
                    0
                )}
              </strong>
            </div>

            {/* PAYMENT */}

            <div className="customer-latest-order-item">
              <span>Payment</span>

              <strong>
                {getPaymentMethod(
                  latestOrder
                )}
              </strong>
            </div>

            {/* PAYMENT STATUS */}

            <div className="customer-latest-order-item">
              <span>Payment Status</span>

              <strong
                className={`latest-payment-status ${getStatusClass(
                  latestOrder.paymentStatus
                )}`}
              >
                {getPaymentStatus(
                  latestOrder
                )}
              </strong>
            </div>

            {/* ORDER STATUS */}

            <div className="customer-latest-order-item">
              <span>Order Status</span>

              <strong
                className={`latest-order-status ${getStatusClass(
                  latestOrder.orderStatus
                )}`}
              >
                {getOrderStatus(
                  latestOrder
                )}
              </strong>
            </div>

            {/* RETURN STATUS */}

            <div className="customer-latest-order-item">
              <span>Return Status</span>

              <strong>
                {latestOrder.returnStatus ||
                  "NONE"}
              </strong>
            </div>

            {/* REFUND STATUS */}

            <div className="customer-latest-order-item">
              <span>Refund Status</span>

              <strong>
                {latestOrder.refundStatus ||
                  "NOT_APPLICABLE"}
              </strong>
            </div>

            {/* REFUND AMOUNT */}

            <div className="customer-latest-order-item">
              <span>Refund Amount</span>

              <strong>
                {formatCurrency(
                  latestOrder.refundAmount ||
                    0
                )}
              </strong>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default CustomerDetails;