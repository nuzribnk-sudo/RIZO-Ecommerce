import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { toast } from "react-hot-toast";

import Navbar from "../components/Navbar";

import Footer from "../components/Footer";

import "./Orders.css";

const API_URL = "http://localhost:5000/api";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // FETCH ORDERS
  // =========================

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");

        return;
      }

      const response = await axios.get(
        `${API_URL}/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(response.data.orders || []);
    } catch (err) {
      console.error(
        "Error fetching orders:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("token");

        localStorage.removeItem("userId");

        navigate("/login");

        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FORMAT STATUS
  // =========================

  const formatStatus = (status) => {
    if (!status) return "Pending";

    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  // =========================
  // PRODUCT IMAGE
  // =========================

  const getProductImage = (item) => {
    const image =
      item?.product?.images?.[0] ||
      item?.product?.image ||
      item?.image ||
      item?.productImage;

    if (!image) {
      return "/images/product-placeholder.jpg";
    }

    if (typeof image !== "string") {
      return "/images/product-placeholder.jpg";
    }

    if (image.startsWith("http")) {
      return image;
    }

    if (image.startsWith("/")) {
      return image;
    }

    return `http://localhost:5000/${image}`;
  };

  // =========================
  // PRODUCT NAME
  // =========================

  const getProductName = (item) => {
    return (
      item?.product?.name ||
      item?.productName ||
      item?.name ||
      "Product"
    );
  };

  // =========================
  // PRODUCT PRICE
  // =========================

  const getProductPrice = (item) => {
    return (
      item?.price ??
      item?.salePrice ??
      item?.regularPrice ??
      item?.product?.salePrice ??
      item?.product?.price ??
      0
    );
  };

  // =========================
  // PRODUCT SIZE
  // =========================

  const getProductSize = (item) => {
    return (
      item?.size ||
      item?.selectedSize ||
      "N/A"
    );
  };

  // =========================
  // PRODUCT QUANTITY
  // =========================

  const getQuantity = (item) => {
    return item?.quantity || 1;
  };

  // =========================
  // TRACK ORDER
  // =========================

  const handleTrackOrder = (order) => {
    navigate(
      `/track-order/${order._id}`,
      {
        state: {
          order,
        },
      }
    );
  };

  // =========================
  // CANCEL ORDER
  // =========================

  const handleCancelOrder = (orderId) => {
    toast.custom(
      (t) => (
        <div className="cancel-toast">
          <p>
            Are you sure you want to cancel this order?
          </p>

          <div className="cancel-toast-buttons">
            <button
              className="cancel-toast-no"
              onClick={() => {
                toast.dismiss(t.id);
              }}
            >
              NO
            </button>

            <button
              className="cancel-toast-yes"
              onClick={async () => {
                toast.dismiss(t.id);

                try {
                  setError("");

                  const token =
                    localStorage.getItem("token");

                  if (!token) {
                    navigate("/login");

                    return;
                  }

                  const response =
                    await axios.put(
                      `${API_URL}/orders/${orderId}/cancel`,
                      {},
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                  const updatedOrder =
                    response.data.order;

                  // Keep existing order object so images/items don't blink
                  setOrders((previousOrders) =>
                    previousOrders.map((order) => {
                      if (
                        order._id !== orderId
                      ) {
                        return order;
                      }

                      return {
                        ...order,

                        orderStatus:
                          updatedOrder?.orderStatus ||
                          updatedOrder?.status ||
                          "CANCELLED",

                        status:
                          updatedOrder?.status ||
                          updatedOrder?.orderStatus ||
                          "CANCELLED",

                        paymentStatus:
                          updatedOrder?.paymentStatus ??
                          order.paymentStatus,

                        refundStatus:
                          updatedOrder?.refundStatus ??
                          order.refundStatus,

                        refundAmount:
                          updatedOrder?.refundAmount ??
                          order.refundAmount,

                        refundId:
                          updatedOrder?.refundId ??
                          order.refundId,

                        returnStatus:
                          updatedOrder?.returnStatus ??
                          order.returnStatus,
                      };
                    })
                  );

                  // SUCCESS TOAST
                  toast.success(
                    "Order cancelled successfully.",
                    {
                      duration: 2000,
                      position: "top-center",
                    }
                  );
                } catch (err) {
                  console.error(
                    "Cancel order error:",
                    err
                  );

                  // ERROR TOAST
                  toast.error(
                    err.response?.data?.message ||
                      "Failed to cancel the order.",
                    {
                      duration: 2000,
                      position: "top-right",
                    }
                  );
                }
              }}
            >
              YES
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      }
    );
  };

  // =========================
  // REQUEST RETURN
  // =========================

  const handleReturnOrder = async (orderId) => {
    const reason = window.prompt(
      "Please enter the reason for returning this order:"
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      toast.error(
        "Return reason is required.",
        {
          duration: 2000,
          position: "top-center",
        }
      );

      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");

        return;
      }

      const response = await axios.post(
        `${API_URL}/orders/${orderId}/return`,
        {
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedOrder =
        response.data.order;

      setOrders((previousOrders) =>
        previousOrders.map((order) => {
          if (order._id !== orderId) {
            return order;
          }

          return {
            ...order,

            returnStatus:
              updatedOrder?.returnStatus ||
              "REQUESTED",

            returnReason:
              updatedOrder?.returnReason ||
              reason.trim(),

            returnRequestedAt:
              updatedOrder?.returnRequestedAt ||
              order.returnRequestedAt,

            refundStatus:
              updatedOrder?.refundStatus ??
              order.refundStatus,

            refundAmount:
              updatedOrder?.refundAmount ??
              order.refundAmount,
          };
        })
      );

      toast.success(
        "Return request submitted successfully.",
        {
          duration: 2000,
          position: "top-right",
        }
      );
    } catch (err) {
      console.error(
        "Return request error:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          "Failed to submit return request.",
        {
          duration: 2000,
          position: "top-right",
        }
      );
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="orders-page">
          <div className="orders-container">
            <div className="orders-loading">
              Loading your orders...
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <>
      <Navbar />

      <main className="orders-page">
        <div className="orders-container">

          {error && (
            <div className="orders-alert orders-error">
              {error}
            </div>
          )}

          {/* =========================
              NO ORDERS
          ========================= */}

          {orders.length === 0 ? (
            <div className="orders-empty">
              <h3>Your Orders</h3>

              <p>
                You haven't placed any orders yet.
              </p>

              <button
                className="orders-back-button"
                onClick={() => navigate(-1)}
              >
                ← BACK
              </button>
            </div>
          ) : (
            <section className="orders-content">

              {/* =========================
                  HEADER
              ========================= */}

              <div className="orders-header">
                <div className="orders-product-heading">
                  PRODUCT
                </div>

                <div className="orders-status-heading">
                  STATUS
                </div>
              </div>

              {/* =========================
                  ORDER LIST
              ========================= */}

              {orders.map((order) => {
                const items =
                  order.items || [];

                const firstItem =
                  items[0];

                if (!firstItem) {
                  return null;
                }

                const status =
                  order.orderStatus ||
                  order.status ||
                  "PENDING";

                const normalizedStatus =
                  status
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/_/g, "-");

                const itemCount =
                  items.length;

                const returnStatus =
                  order.returnStatus ||
                  "NONE";

                const refundStatus =
                  order.refundStatus ||
                  "NOT_APPLICABLE";

                const isCancelled =
                  status.toUpperCase() ===
                  "CANCELLED";

                const isDelivered =
                  status.toUpperCase() ===
                  "DELIVERED";

                const canCancel =
                  !isCancelled &&
                  !isDelivered;

                const canRequestReturn =
                  isDelivered &&
                  returnStatus === "NONE";

                return (
                  <div
                    className="order-card"
                    key={order._id}
                  >

                    {/* =========================
                        LEFT PRODUCT AREA
                    ========================= */}

                    <div className="order-product-section">

                      <div className="order-product-row">

                        {/* PRODUCT IMAGE */}

                        <img
                          src={getProductImage(
                            firstItem
                          )}
                          alt={getProductName(
                            firstItem
                          )}
                          className="order-product-img"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/images/product-placeholder.jpg";
                          }}
                        />

                        {/* PRODUCT INFORMATION */}

                        <div className="order-product-info">

                          <h3>
                            {getProductName(
                              firstItem
                            )}
                          </h3>

                          <p className="order-product-price">
                            ₹
                            {Number(
                              getProductPrice(
                                firstItem
                              )
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <p className="order-product-meta">
                            Size:{" "}
                            {getProductSize(
                              firstItem
                            )}
                            &nbsp; | &nbsp;
                            Quantity:{" "}
                            {getQuantity(
                              firstItem
                            )}
                          </p>

                          {itemCount > 1 && (
                            <p className="order-product-meta">
                              +{" "}
                              {itemCount - 1}{" "}
                              more{" "}
                              {itemCount - 1 ===
                              1
                                ? "item"
                                : "items"}
                            </p>
                          )}

                          <p className="order-product-meta order-product-id">
                            Order #
                            {order._id?.slice(
                              -8
                            )}
                          </p>

                          {/* =========================
                              BILLING ADDRESS
                          ========================= */}

                          {order.billingAddress && (
                            <div className="order-billing-address">

                              <p className="order-product-meta">
                                <strong>
                                  Billing Address
                                </strong>
                              </p>

                              {order
                                .billingAddress
                                .fullName && (
                                <p className="order-product-meta">
                                  {
                                    order
                                      .billingAddress
                                      .fullName
                                  }
                                </p>
                              )}

                              {order
                                .billingAddress
                                .address && (
                                <p className="order-product-meta">
                                  {
                                    order
                                      .billingAddress
                                      .address
                                  }

                                  {order
                                    .billingAddress
                                    .apartment
                                    ? `, ${order.billingAddress.apartment}`
                                    : ""}
                                </p>
                              )}

                              <p className="order-product-meta">
                                {
                                  order
                                    .billingAddress
                                    .city
                                }

                                {order
                                  .billingAddress
                                  .city &&
                                order
                                  .billingAddress
                                  .state
                                  ? ", "
                                  : ""}

                                {
                                  order
                                    .billingAddress
                                    .state
                                }

                                {order
                                  .billingAddress
                                  .pincode
                                  ? ` - ${order.billingAddress.pincode}`
                                  : ""}
                              </p>

                              {order
                                .billingAddress
                                .country && (
                                <p className="order-product-meta">
                                  {
                                    order
                                      .billingAddress
                                      .country
                                  }
                                </p>
                              )}

                              {order
                                .billingAddress
                                .phone && (
                                <p className="order-product-meta">
                                  Phone:{" "}
                                  {
                                    order
                                      .billingAddress
                                      .phone
                                  }
                                </p>
                              )}

                            </div>
                          )}

                          {/* RETURN STATUS */}

                          {returnStatus !==
                            "NONE" && (
                            <p className="order-product-meta">
                              Return:{" "}
                              {formatStatus(
                                returnStatus
                              )}
                            </p>
                          )}

                          {/* REFUND STATUS */}

                          {refundStatus !==
                            "NOT_APPLICABLE" && (
                            <p className="order-product-meta">
                              Refund:{" "}
                              {formatStatus(
                                refundStatus
                              )}
                            </p>
                          )}

                          {/* REFUND AMOUNT */}

                          {order.refundAmount >
                            0 && (
                            <p className="order-product-meta">
                              Refund Amount: ₹
                              {Number(
                                order.refundAmount
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          )}

                        </div>
                      </div>
                    </div>

                    {/* =========================
                        RIGHT STATUS AREA
                    ========================= */}

                    <div className="order-status-section">

                      <div
                        className={`order-status ${normalizedStatus}`}
                      >
                        {formatStatus(
                          status
                        )}
                      </div>

                      {/* TRACK */}

                      <button
                        className="order-track-button"
                        onClick={() =>
                          handleTrackOrder(
                            order
                          )
                        }
                      >
                        TRACK YOUR ORDER
                      </button>

                      {/* CANCEL */}

                      {canCancel && (
                        <button
                          className="order-cancel-button"
                          onClick={() =>
                            handleCancelOrder(
                              order._id
                            )
                          }
                        >
                          CANCEL ORDER
                        </button>
                      )}

                      {/* RETURN */}

                      {canRequestReturn && (
                        <button
                          className="order-return-button"
                          onClick={() =>
                            handleReturnOrder(
                              order._id
                            )
                          }
                        >
                          REQUEST RETURN
                        </button>
                      )}

                      {/* RETURN REQUESTED */}

                      {returnStatus ===
                        "REQUESTED" && (
                        <div className="order-refund-message">
                          Return request submitted
                        </div>
                      )}

                      {/* RETURN APPROVED */}

                      {returnStatus ===
                        "APPROVED" && (
                        <div className="order-refund-message">
                          Return approved
                        </div>
                      )}

                      {/* RETURN REJECTED */}

                      {returnStatus ===
                        "REJECTED" && (
                        <div className="order-refund-message">
                          Return rejected
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

            </section>
          )}

          {/* =========================
              BACK BUTTON
          ========================= */}

          {orders.length > 0 && (
            <button
              className="orders-back-button"
              onClick={() => navigate(-1)}
            >
              ← BACK
            </button>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

export default Orders;