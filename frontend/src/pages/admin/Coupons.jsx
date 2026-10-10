import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "./Coupons.css";

const API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/coupons";

function Coupons() {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH COUPONS
  // =========================================================

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append(
          "search",
          search.trim()
        );
      }

      if (statusFilter !== "all") {
        params.append(
          "status",
          statusFilter
        );
      }

      const queryString =
        params.toString();

      const url = queryString
        ? `${API_URL}?${queryString}`
        : API_URL;

      console.log(
        "COUPONS API URL:",
        url
      );

      const response = await fetch(url, {
        cache: "no-store",
      });

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        const text =
          await response.text();

        throw new Error(
          `Server returned ${response.status}. ${text.slice(
            0,
            100
          )}`
        );
      }

      const data =
        await response.json();

      console.log(
        "COUPONS API RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch coupons"
        );
      }

      setCoupons(
        Array.isArray(data.coupons)
          ? data.coupons
          : []
      );
    } catch (error) {
      console.error(
        "Error fetching coupons:",
        error
      );

      setError(
        error.message ||
          "Failed to fetch coupons"
      );

      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // =========================================================
  // FETCH WHEN SEARCH / FILTER CHANGES
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons();
    }, 300);

    return () =>
      clearTimeout(timer);
  }, [fetchCoupons]);

  // =========================================================
  // COUPON STATUS
  // =========================================================

  const getCouponStatus = (coupon) => {
    if (coupon.expiry) {
      const expiryDate =
        new Date(coupon.expiry);

      if (
        !Number.isNaN(
          expiryDate.getTime()
        ) &&
        expiryDate < new Date()
      ) {
        return "Expired";
      }
    }

    return coupon.isActive
      ? "Active"
      : "Inactive";
  };

  // =========================================================
  // DISCOUNT FORMAT
  // =========================================================

  const formatDiscount = (coupon) => {
    const discountValue = Number(
      coupon.discountValue || 0
    );

    if (
      coupon.discountType ===
      "percentage"
    ) {
      return `${discountValue}%`;
    }

    return `₹${discountValue.toLocaleString(
      "en-IN"
    )}`;
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-GB"
    );
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalCoupons =
    coupons.length;

  const activeCoupons =
    coupons.filter(
      (coupon) =>
        getCouponStatus(coupon) ===
        "Active"
    ).length;

  const expiringSoon =
    coupons.filter((coupon) => {
      if (!coupon.expiry) {
        return false;
      }

      const expiryDate =
        new Date(coupon.expiry);

      if (
        Number.isNaN(
          expiryDate.getTime()
        )
      ) {
        return false;
      }

      const today = new Date();

      const difference =
        expiryDate.getTime() -
        today.getTime();

      const days =
        difference /
        (1000 * 60 * 60 * 24);

      return (
        days >= 0 &&
        days <= 7
      );
    }).length;

  const totalUsed =
    coupons.reduce(
      (total, coupon) =>
        total +
        Number(
          coupon.usedCount || 0
        ),
      0
    );

  // =========================================================
  // DELETE COUPON
  // =========================================================

  const handleDelete = async (
    coupon
  ) => {
    toast(
      ({ closeToast }) => (
        <div
          style={{
            width: "100%",
            padding: "4px 2px",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#222222",
              marginBottom: "6px",
            }}
          >
            Delete coupon "{coupon.code}"?
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#777777",
              lineHeight: "1.5",
              marginBottom: "14px",
            }}
          >
            This action cannot be undone.
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={closeToast}
              style={{
                border: "none",
                background: "#f2f2f2",
                color: "#444444",
                padding: "7px 13px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                closeToast();
                deleteCoupon(coupon);
              }}
              style={{
                border: "none",
                background: "#dc3545",
                color: "#ffffff",
                padding: "7px 13px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        hideProgressBar: true,
        className:
          "rizo-admin-toast",
      }
    );
  };

  // =========================================================
  // DELETE COUPON API
  // =========================================================

  const deleteCoupon = async (
    coupon
  ) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${coupon._id}`,
        {
          method: "DELETE",
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data =
          await response.json();
      } else {
        const text =
          await response.text();

        throw new Error(
          `Server returned ${response.status}. ${text.slice(
            0,
            100
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete coupon"
        );
      }

      // =====================================================
      // SUCCESS TOAST
      // =====================================================

      toast.success(
        data.message ||
          "Coupon deleted successfully",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      await fetchCoupons();
    } catch (error) {
      console.error(
        "Error deleting coupon:",
        error
      );

      setError(
        error.message ||
          "Failed to delete coupon"
      );

      // =====================================================
      // ERROR TOAST
      // =====================================================

      toast.error(
        error.message ||
          "Failed to delete coupon",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
    }
  };

  // =========================================================
  // EDIT COUPON
  // =========================================================

  const handleEdit = (coupon) => {
    navigate(
      `/admin/coupons/edit/${coupon._id}`
    );
  };

  // =========================================================
  // VIEW COUPON
  // =========================================================

  const handleView = (coupon) => {
    navigate(
      `/admin/coupons/view/${coupon._id}`
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="coupons-page">
        <div className="coupons-loading">
          Loading coupons...
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="coupons-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="coupons-header">
        <div>
          <h1>Coupons</h1>

          <p>
            Manage discount coupons and
            promotional offers
          </p>
        </div>

        <button
          type="button"
          className="add-coupon-btn"
          onClick={() =>
            navigate(
              "/admin/coupons/add"
            )
          }
        >
          <i className="bi bi-plus-lg"></i>
          Add Coupon
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="coupon-error">
          <i className="bi bi-exclamation-circle"></i>

          <span>{error}</span>

          <button
            type="button"
            onClick={fetchCoupons}
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="coupon-summary">
        <div className="coupon-summary-card">
          <div className="coupon-summary-icon">
            <i className="bi bi-ticket-perforated"></i>
          </div>

          <div>
            <span>Total Coupons</span>
            <strong>
              {totalCoupons}
            </strong>
          </div>
        </div>

        <div className="coupon-summary-card">
          <div className="coupon-summary-icon">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <span>Active Coupons</span>
            <strong>
              {activeCoupons}
            </strong>
          </div>
        </div>

        <div className="coupon-summary-card">
          <div className="coupon-summary-icon">
            <i className="bi bi-clock"></i>
          </div>

          <div>
            <span>Expiring Soon</span>
            <strong>
              {expiringSoon}
            </strong>
          </div>
        </div>

        <div className="coupon-summary-card">
          <div className="coupon-summary-icon">
            <i className="bi bi-people"></i>
          </div>

          <div>
            <span>Total Used</span>
            <strong>
              {totalUsed}
            </strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div className="coupon-filter-bar">
        <div className="coupon-search">
          <i className="bi bi-search"></i>

          <input
            id="couponSearch"
            name="couponSearch"
            type="text"
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="coupon-status-filter">
          <label htmlFor="couponStatus">
            Status
          </label>

          <select
            id="couponStatus"
            name="couponStatus"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="expired">
              Expired
            </option>
          </select>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="coupons-table-card">
        <div className="coupons-table-wrapper">
          <table className="coupons-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>
                  Minimum Purchase
                </th>
                <th>Usage</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {coupons.length > 0 ? (
                coupons.map((coupon) => {
                  const status =
                    getCouponStatus(
                      coupon
                    );

                  return (
                    <tr
                      key={coupon._id}
                    >
                      {/* CODE */}

                      <td>
                        <div className="coupon-code">
                          {coupon.code}
                        </div>
                      </td>

                      {/* TYPE */}

                      <td>
                        <span className="coupon-type">
                          {coupon.couponType ===
                          "category"
                            ? "Category"
                            : coupon.couponType ===
                              "product"
                            ? "Product"
                            : "General"}
                        </span>
                      </td>

                      {/* DISCOUNT */}

                      <td>
                        <strong className="coupon-discount">
                          {formatDiscount(
                            coupon
                          )}
                        </strong>
                      </td>

                      {/* MINIMUM PURCHASE */}

                      <td>
                        ₹
                        {Number(
                          coupon.minimumPurchase ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      {/* USAGE */}

                      <td>
                        <span className="coupon-usage">
                          {coupon.usedCount ||
                            0}
                          /
                          {coupon.usageLimit ||
                            0}
                        </span>
                      </td>

                      {/* EXPIRY DATE */}

                      <td>
                        {formatDate(
                          coupon.expiry
                        )}
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`coupon-status status-${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="coupon-actions">
                          {/* VIEW */}

                          <button
                            type="button"
                            className="view-action"
                            title="View"
                            aria-label={`View ${coupon.code}`}
                            onClick={() =>
                              handleView(
                                coupon
                              )
                            }
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            className="edit-action"
                            title="Edit"
                            aria-label={`Edit ${coupon.code}`}
                            onClick={() =>
                              handleEdit(
                                coupon
                              )
                            }
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            className="delete-action"
                            title="Delete"
                            aria-label={`Delete ${coupon.code}`}
                            onClick={() =>
                              handleDelete(
                                coupon
                              )
                            }
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="no-coupons"
                  >
                    <div>
                      <i className="bi bi-ticket-perforated"></i>

                      <p>
                        No coupons found
                      </p>

                      <span>
                        {search ||
                        statusFilter !==
                          "all"
                          ? "Try changing your search or filter."
                          : "There are no coupons available yet."}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Coupons;