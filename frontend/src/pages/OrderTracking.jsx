import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./OrderTracking.css";

const API_URL = "http://localhost:5000/api";

const OrderTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnMessage, setReturnMessage] = useState("");
  const [returnError, setReturnError] = useState("");

  // =========================================================
  // FETCH LATEST ORDER
  // =========================================================

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchLatestOrder = async () => {
      if (!order?._id) return;

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${API_URL}/orders/${order._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.order) {
          setOrder(response.data.order);
        }
      } catch (error) {
        console.error("Fetch latest order error:", error);
      }
    };

    fetchLatestOrder();
  }, [navigate]);

  // =========================================================
  // BACK TO ORDERS
  // =========================================================

  const handleBackToOrders = () => {
    window.scrollTo(0, 0);
    navigate("/orders");
  };

  // =========================================================
  // IMAGE HELPERS
  // =========================================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (typeof image !== "string") {
      return "";
    }

    const cleanImage = image.trim();

    if (!cleanImage) {
      return "";
    }

    // Full URL
    if (
      cleanImage.startsWith("http://") ||
      cleanImage.startsWith("https://")
    ) {
      return cleanImage;
    }

    // Backend /uploads/... or /images/...
    if (cleanImage.startsWith("/")) {
      return `http://localhost:5000${cleanImage}`;
    }

    // uploads/... or images/...
    return `http://localhost:5000/${cleanImage}`;
  };

  const getProductImage = (item) => {
    const product = item?.product;

    // Product image
    if (product?.image) {
      return product.image;
    }

    // Product productImage
    if (product?.productImage) {
      return product.productImage;
    }

    // Product images array
    if (
      Array.isArray(product?.images) &&
      product.images.length > 0
    ) {
      const firstImage = product.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (firstImage?.url) {
        return firstImage.url;
      }

      if (firstImage?.image) {
        return firstImage.image;
      }
    }

    // Order item image
    if (item?.image) {
      return item.image;
    }

    // Order item productImage
    if (item?.productImage) {
      return item.productImage;
    }

    // Order item images array
    if (
      Array.isArray(item?.images) &&
      item.images.length > 0
    ) {
      const firstImage = item.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (firstImage?.url) {
        return firstImage.url;
      }

      if (firstImage?.image) {
        return firstImage.image;
      }
    }

    return "";
  };

  const getProductName = (item) => {
    return (
      item?.product?.name ||
      item?.product?.productName ||
      item?.name ||
      item?.productName ||
      "Product"
    );
  };

  const getProductPrice = (item) => {
    return (
      item?.price ||
      item?.product?.price ||
      item?.productPrice ||
      0
    );
  };

  // =========================================================
  // RETURN MODAL
  // =========================================================

  const openReturnModal = () => {
    setReturnReason("");
    setCustomReason("");
    setReturnMessage("");
    setReturnError("");
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    if (returnLoading) return;

    setShowReturnModal(false);
    setReturnReason("");
    setCustomReason("");
    setReturnError("");
  };

  const handleReturnSubmit = async () => {
    setReturnError("");
    setReturnMessage("");

    if (!returnReason) {
      setReturnError("Please select a return reason.");
      return;
    }

    if (
      returnReason === "Other" &&
      !customReason.trim()
    ) {
      setReturnError("Please enter your reason.");
      return;
    }

    const finalReason =
      returnReason === "Other"
        ? customReason.trim()
        : returnReason;

    try {
      setReturnLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${API_URL}/orders/${order._id}/return`,
        {
          reason: finalReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.order) {
        setOrder(response.data.order);
      }

      setReturnMessage(
        response.data?.message ||
          "Return request submitted successfully."
      );

      setShowReturnModal(false);
    } catch (error) {
      console.error("Return request error:", error);

      setReturnError(
        error.response?.data?.message ||
          "Failed to submit return request."
      );
    } finally {
      setReturnLoading(false);
    }
  };

  // =========================================================
  // ORDER CHECK
  // =========================================================

  if (!order) {
    return (
      <div className="tracking-page">
        <div className="tracking-empty">
          <h2>Order Not Found</h2>

          <p>
            We could not find the order you are looking for.
          </p>

          <button
            type="button"
            onClick={handleBackToOrders}
          >
            BACK TO ORDERS
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // ORDER STATUS
  // =========================================================

  const status = (
    order.orderStatus || "PENDING"
  ).toUpperCase();

  const steps = [
    {
      key: "PENDING",
      title: "Order Placed",
      description:
        "Your order has been placed successfully.",
    },
    {
      key: "CONFIRMED",
      title: "Confirmed",
      description:
        "Your order has been confirmed.",
    },
    {
      key: "PROCESSING",
      title: "Processing",
      description:
        "Your order is being prepared.",
    },
    {
      key: "SHIPPED",
      title: "Shipped",
      description:
        "Your order has been shipped.",
    },
    {
      key: "OUT_FOR_DELIVERY",
      title: "Out for Delivery",
      description:
        "Your order is out for delivery.",
    },
    {
      key: "DELIVERED",
      title: "Delivered",
      description:
        "Your order has been delivered.",
    },
  ];

  const normalizedStatus = status;

  const currentIndex = steps.findIndex(
    (step) => step.key === normalizedStatus
  );

  // =========================================================
  // RETURN STATUS
  // =========================================================

  const returnStatus = (
    order.returnStatus || "NONE"
  ).toUpperCase();

  const canRequestReturn =
    status === "DELIVERED" &&
    returnStatus === "NONE";

  const isReturnRequested =
    returnStatus === "REQUESTED";

  const isReturnApproved =
    returnStatus === "APPROVED";

  const isReturnRejected =
    returnStatus === "REJECTED";

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="tracking-page">
      <div className="tracking-container">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="tracking-header">
          <span>ORDER TRACKING</span>

          <h1>
            #
            {order._id
              ?.slice(-8)
              .toUpperCase()}
          </h1>
        </div>

        {/* =====================================================
            ORDER INFORMATION
        ===================================================== */}

        <div className="tracking-order-info">
          <div>
            <p>ORDER DATE</p>

            <h3>
              {order.createdAt
                ? new Date(
                    order.createdAt
                  ).toLocaleDateString()
                : "-"}
            </h3>
          </div>

          <div>
            <p>PAYMENT</p>

            <h3>
              {order.paymentMethod || "-"}
            </h3>
          </div>

          <div>
            <p>TOTAL</p>

            <h3>
              ₹
              {Number(
                order.totalAmount || 0
              ).toFixed(2)}
            </h3>
          </div>
        </div>

        {/* =====================================================
            CANCELLED ORDER
        ===================================================== */}

        {status === "CANCELLED" ? (
          <div className="cancelled-box">
            <div className="cancelled-icon">
              ×
            </div>

            <h2>Order Cancelled</h2>

            <p>
              This order has been cancelled.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                TRACKING STEPS
            ================================================= */}

            <div className="tracking-steps">
              {steps.map((step, index) => {
                const isCompleted =
                  currentIndex >= 0 &&
                  index <= currentIndex;

                const isActive =
                  index === currentIndex;

                return (
                  <div
                    key={step.key}
                    className={`tracking-step ${
                      isCompleted
                        ? "completed"
                        : ""
                    } ${
                      isActive
                        ? "active"
                        : ""
                    }`}
                  >
                    <div className="step-left">
                      <div className="step-circle">
                        {isCompleted
                          ? "✓"
                          : ""}
                      </div>

                      {index <
                        steps.length - 1 && (
                        <div
                          className={`step-line ${
                            currentIndex >
                            index
                              ? "filled"
                              : ""
                          }`}
                        />
                      )}
                    </div>

                    <div className="step-content">
                      <h3>
                        {step.title}
                      </h3>

                      <p>
                        {step.description}
                      </p>

                      {isActive && (
                        <span className="current-status">
                          CURRENT STATUS
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                COURIER TRACKING
            ================================================= */}

            <div className="courier-tracking-section">
              <div className="courier-tracking-header">
                <span>
                  SHIPMENT TRACKING
                </span>

                <h2>
                  Track Your Package
                </h2>
              </div>

              <div className="courier-tracking-info">
                <div className="courier-tracking-item">
                  <p>COURIER</p>

                  <h3>
                    {order.courier ||
                      "Not Assigned"}
                  </h3>
                </div>

                <div className="courier-tracking-item">
                  <p>
                    TRACKING NUMBER
                  </p>

                  <h3>
                    {order.trackingNumber ||
                      "Not Available"}
                  </h3>
                </div>
              </div>

              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="track-package-btn"
                >
                  TRACK PACKAGE
                </a>
              )}
            </div>

            {/* =================================================
                RETURN SECTION
            ================================================= */}

            {status === "DELIVERED" && (
              <div className="return-section">
                <h2>
                  Return Your Order
                </h2>

                {canRequestReturn && (
                  <>
                    <p>
                      If you are not satisfied
                      with your purchase, you can
                      request a return for this
                      order.
                    </p>

                    <button
                      type="button"
                      className="return-order-btn"
                      onClick={
                        openReturnModal
                      }
                    >
                      REQUEST RETURN
                    </button>
                  </>
                )}

                {isReturnRequested && (
                  <>
                    <p>
                      Your return request has
                      been submitted and is
                      waiting for approval.
                    </p>

                    <button
                      type="button"
                      className="return-order-btn disabled"
                      disabled
                    >
                      RETURN REQUESTED
                    </button>
                  </>
                )}

                {isReturnApproved && (
                  <>
                    <p>
                      Your return request has
                      been approved.
                    </p>

                    <button
                      type="button"
                      className="return-order-btn disabled"
                      disabled
                    >
                      RETURN APPROVED
                    </button>
                  </>
                )}

                {isReturnRejected && (
                  <>
                    <p>
                      Your return request has
                      been rejected.
                    </p>

                    <button
                      type="button"
                      className="return-order-btn disabled"
                      disabled
                    >
                      RETURN REJECTED
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* =====================================================
            RETURN MESSAGE
        ===================================================== */}

        {returnMessage && (
          <div className="tracking-return-message success">
            {returnMessage}
          </div>
        )}

        {returnError &&
          !showReturnModal && (
            <div className="tracking-return-message error">
              {returnError}
            </div>
          )}

        {/* =====================================================
            ORDER PRODUCTS
        ===================================================== */}

        <div className="tracking-products">
          <h2>
            Order Items
          </h2>

          {order.items?.map(
            (item, index) => {
              const image =
                getProductImage(item);

              const productName =
                getProductName(item);

              const productPrice =
                getProductPrice(item);

              const imageUrl =
                getImageUrl(image);

              return (
                <div
                  className="tracking-product"
                  key={
                    item?._id ||
                    item?.product?._id ||
                    index
                  }
                >
                  <div className="tracking-product-image">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={productName}
                        onError={(e) => {
                          console.error(
                            "Product image failed:",
                            imageUrl
                          );

                          e.currentTarget.style.display =
                            "none";

                          const parent =
                            e.currentTarget
                              .parentElement;

                          if (parent) {
                            parent.innerHTML =
                              "<span>No Image</span>";
                          }
                        }}
                      />
                    ) : (
                      <span>
                        No Image
                      </span>
                    )}
                  </div>

                  <div className="tracking-product-details">
                    <h3>
                      {productName}
                    </h3>

                    <p>
                      Quantity:{" "}
                      {item.quantity || 1}
                    </p>

                    <p>
                      Price: ₹
                      {Number(
                        productPrice
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="tracking-product-price">
                    ₹
                    {(
                      Number(
                        productPrice
                      ) *
                      Number(
                        item.quantity || 1
                      )
                    ).toFixed(2)}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* =====================================================
            BACK BUTTON
        ===================================================== */}

        <button
          type="button"
          className="tracking-back-btn"
          onClick={handleBackToOrders}
        >
          BACK TO ORDERS
        </button>
      </div>

      {/* =======================================================
          RETURN MODAL
      ======================================================= */}

      {showReturnModal && (
        <div className="return-modal-overlay">
          <div className="return-modal">

            <button
              type="button"
              className="return-modal-close"
              onClick={
                closeReturnModal
              }
              disabled={returnLoading}
              aria-label="Close"
            >
              ×
            </button>

            <h2>
              Request Return
            </h2>

            <p className="return-modal-description">
              Please select a reason for
              returning this order.
            </p>

            <label htmlFor="returnReason">
              RETURN REASON
            </label>

            <select
              id="returnReason"
              value={returnReason}
              onChange={(e) => {
                setReturnReason(
                  e.target.value
                );

                setReturnError("");
              }}
              disabled={returnLoading}
            >
              <option value="">
                Select a reason
              </option>

              <option value="Product damaged">
                Product damaged
              </option>

              <option value="Wrong product received">
                Wrong product received
              </option>

              <option value="Product not as described">
                Product not as described
              </option>

              <option value="Size or fit issue">
                Size or fit issue
              </option>

              <option value="Changed my mind">
                Changed my mind
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            {returnReason === "Other" && (
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(
                    e.target.value
                  );

                  setReturnError("");
                }}
                placeholder="Please describe your reason"
                disabled={returnLoading}
              />
            )}

            {returnError && (
              <p className="return-modal-error">
                {returnError}
              </p>
            )}

            <div className="return-modal-actions">
              <button
                type="button"
                className="return-cancel-btn"
                onClick={
                  closeReturnModal
                }
                disabled={returnLoading}
              >
                CANCEL
              </button>

              <button
                type="button"
                className="return-submit-btn"
                onClick={
                  handleReturnSubmit
                }
                disabled={returnLoading}
              >
                {returnLoading
                  ? "SUBMITTING..."
                  : "SUBMIT RETURN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;