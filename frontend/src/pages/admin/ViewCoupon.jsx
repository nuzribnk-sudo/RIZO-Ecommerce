import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ViewCoupon.css";

const COUPON_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/coupons";

const PRODUCT_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/products";

function ViewCoupon() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [coupon, setCoupon] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     FETCH COUPON
  ========================================================= */

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${COUPON_API_URL}/all`);

        if (!response.ok) {
          throw new Error("Failed to fetch coupons");
        }

        const data = await response.json();

        const couponList = Array.isArray(data)
          ? data
          : data.coupons || data.data || [];

        const foundCoupon = couponList.find(
          (item) => String(item._id) === String(id)
        );

        if (!foundCoupon) {
          setCoupon(null);
          return;
        }

        setCoupon(foundCoupon);

        /* -----------------------------------------------------
           Product can be populated object OR ObjectId
        ----------------------------------------------------- */

        if (foundCoupon.product) {
          if (typeof foundCoupon.product === "object") {
            setProduct(foundCoupon.product);
          } else {
            try {
              const productResponse = await fetch(
                `${PRODUCT_API_URL}/${foundCoupon.product}`
              );

              if (productResponse.ok) {
                const productData = await productResponse.json();

                const productResult =
                  productData.product ||
                  productData.data ||
                  productData;

                setProduct(productResult);
              }
            } catch (productError) {
              console.error("Product fetch error:", productError);
            }
          }
        }
      } catch (error) {
        console.error("Coupon fetch error:", error);
        setCoupon(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupon();
  }, [id]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getCouponType = () => {
    switch (coupon?.couponType) {
      case "cart":
        return "Cart Coupon";

      case "category":
        return "Category Coupon";

      case "product":
        return "Product Coupon";

      case "general":
        return "General Coupon";

      default:
        return "General Coupon";
    }
  };

  const getDiscountType = () => {
    if (coupon?.discountType === "percentage") {
      return "Percentage";
    }

    return "Fixed Amount";
  };

  const getDiscountValue = () => {
    if (!coupon) return "—";

    const value = Number(coupon.discountValue || 0);

    if (coupon.discountType === "percentage") {
      return `${value}%`;
    }

    return `₹${value.toLocaleString("en-IN")}`;
  };

  const getCategoryName = () => {
    if (!coupon?.category) return "—";

    if (typeof coupon.category === "object") {
      return (
        coupon.category.name ||
        coupon.category.title ||
        "Category"
      );
    }

    return "Category";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCouponStatus = () => {
    if (!coupon) return "inactive";

    if (coupon.expiry) {
      const expiryDate = new Date(coupon.expiry);
      const now = new Date();

      if (expiryDate < now) {
        return "expired";
      }
    }

    if (coupon.isActive) {
      return "active";
    }

    return "inactive";
  };

  const getStatusText = () => {
    const status = getCouponStatus();

    if (status === "expired") {
      return "Expired";
    }

    if (status === "active") {
      return "Active";
    }

    return "Inactive";
  };

  const getProductImage = () => {
    if (!product?.images || !Array.isArray(product.images)) {
      return null;
    }

    if (product.images.length === 0) {
      return null;
    }

    const firstImage = product.images[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    if (typeof firstImage === "object") {
      return (
        firstImage.url ||
        firstImage.secure_url ||
        firstImage.path ||
        firstImage.image ||
        null
      );
    }

    return null;
  };

  const getProductName = () => {
    return product?.name || "Product";
  };

  const getProductSku = () => {
    return product?.sku || "—";
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="view-coupon-page">
        <div className="view-coupon-loading">
          Loading coupon details...
        </div>
      </div>
    );
  }

  /* =========================================================
     EMPTY
  ========================================================= */

  if (!coupon) {
    return (
      <div className="view-coupon-page">
        <div className="view-coupon-empty">
          <i className="bi bi-ticket-perforated"></i>

          <h2>Coupon Not Found</h2>

          <p>
            The coupon you are looking for does not exist.
          </p>

          <button
            type="button"
            onClick={() => navigate("/admin/coupons")}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Coupons
          </button>
        </div>
      </div>
    );
  }

  const status = getCouponStatus();
  const productImage = getProductImage();

  return (
    <div className="view-coupon-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="view-coupon-header">
        <h1>View Coupon</h1>

        <p>
          View complete details of this coupon
        </p>
      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="view-coupon-card">

        {/* ===================================================
            TOP SUMMARY
        =================================================== */}

        <div className="view-coupon-top">

          {/* Coupon info */}

          <div className="coupon-main-info">

            <div className="coupon-icon">
              <i className="bi bi-ticket-perforated"></i>
            </div>

            <div>
              <span className="coupon-label">
                Coupon Code
              </span>

              <h2>
                {coupon.code || "—"}
              </h2>
            </div>

          </div>

          {/* Status */}

          <div className={`view-status ${status}`}>
            <span className="status-dot"></span>
            {getStatusText()}
          </div>

          {/* =================================================
              PRODUCT
          ================================================= */}

          {coupon.couponType === "product" && (
            <div className="coupon-product-summary">

              <div className="coupon-product-image">

                {productImage ? (
                  <img
                    src={productImage}
                    alt={getProductName()}
                  />
                ) : (
                  <i className="bi bi-box-seam"></i>
                )}

              </div>

              <div className="coupon-product-info">

                <span className="coupon-product-label">
                  Product
                </span>

                <strong>
                  {getProductName()}
                </strong>

                <small>
                  SKU: {getProductSku()}
                </small>

              </div>

            </div>
          )}

        </div>

        {/* ===================================================
            DETAILS
        =================================================== */}

        <div className="coupon-details-grid">

          {/* Coupon Type */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-tag"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Coupon Type</span>

              <strong>
                {getCouponType()}
              </strong>
            </div>

          </div>

          {/* Discount */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-percent"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Discount</span>

              <strong>
                {getDiscountValue()}
              </strong>
            </div>

          </div>

          {/* Discount Type */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-coin"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Discount Type</span>

              <strong>
                {getDiscountType()}
              </strong>
            </div>

          </div>

          {/* Category */}

          {coupon.couponType === "category" && (
            <div className="coupon-detail-item">

              <div className="coupon-detail-icon">
                <i className="bi bi-grid"></i>
              </div>

              <div className="coupon-detail-content">
                <span>Category</span>

                <strong>
                  {getCategoryName()}
                </strong>
              </div>

            </div>
          )}

          {/* Minimum Purchase */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-cart3"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Minimum Purchase</span>

              <strong>
                ₹
                {Number(
                  coupon.minimumPurchase || 0
                ).toLocaleString("en-IN")}
              </strong>
            </div>

          </div>

          {/* Maximum Discount */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-gift"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Maximum Discount</span>

              <strong>
                {coupon.maxDiscount
                  ? `₹${Number(
                      coupon.maxDiscount
                    ).toLocaleString("en-IN")}`
                  : "No Limit"}
              </strong>
            </div>

          </div>

          {/* Usage Limit */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-people"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Usage Limit</span>

              <strong>
                {coupon.usageLimit ?? "—"}
              </strong>
            </div>

          </div>

          {/* Used Count */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-file-earmark-text"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Used Count</span>

              <strong>
                {coupon.usedCount ?? 0}
              </strong>
            </div>

          </div>

          {/* Created Date */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-calendar3"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Created Date</span>

              <strong>
                {formatDate(coupon.createdAt)}
              </strong>
            </div>

          </div>

          {/* Expiry Date */}

          <div className="coupon-detail-item">

            <div className="coupon-detail-icon">
              <i className="bi bi-calendar-x"></i>
            </div>

            <div className="coupon-detail-content">
              <span>Expiry Date</span>

              <strong>
                {formatDate(coupon.expiry)}
              </strong>
            </div>

          </div>

        </div>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="view-coupon-actions">

          <button
            type="button"
            className="coupon-back-btn"
            onClick={() => navigate("/admin/coupons")}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Coupons
          </button>

          <button
            type="button"
            className="coupon-edit-btn"
            onClick={() =>
              navigate(`/admin/coupons/edit/${coupon._id}`)
            }
          >
            <i className="bi bi-pencil"></i>
            Edit Coupon
          </button>

        </div>

      </div>
    </div>
  );
}

export default ViewCoupon;