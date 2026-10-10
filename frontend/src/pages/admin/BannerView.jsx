import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./BannerView.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api/banners";

function BannerView() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH BANNER
  // =========================
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/${id}`);
        const responseText = await response.text();

        let data;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Server returned non-JSON response (${response.status})`
          );
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch banner");
        }

        setBanner(data.banner);
      } catch (error) {
        console.error("Error fetching banner:", error);
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [id]);

  // =========================
  // GET BANNER STATUS
  // =========================
  const getBannerStatus = () => {
    if (!banner) {
      return {
        label: "Inactive",
        className: "inactive",
      };
    }

    // If end date has passed
    if (
      banner.endDate &&
      new Date(banner.endDate).getTime() < new Date().getTime()
    ) {
      return {
        label: "Expired",
        className: "expired",
      };
    }

    // Active banner
    if (banner.status === "active") {
      return {
        label: "Active",
        className: "active",
      };
    }

    // Inactive banner
    return {
      label: "Inactive",
      className: "inactive",
    };
  };

  // =========================
  // DATE FORMAT
  // =========================
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB");
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="banner-view-page">
        <div className="banner-view-loading">
          Loading banner...
        </div>
      </div>
    );
  }

  // =========================
  // BANNER NOT FOUND
  // =========================
  if (!banner) {
    return (
      <div className="banner-view-page">
        <div className="banner-view-empty">
          <h2>Banner not found</h2>

          <button
            type="button"
            onClick={() => navigate("/admin/banners")}
          >
            Back to Banners
          </button>
        </div>
      </div>
    );
  }

  const bannerStatus = getBannerStatus();

  return (
    <div className="banner-view-page">

      {/* =========================
          HEADER
      ========================= */}
      <div className="banner-view-header">

        <div>
          <h1>Banner Details</h1>
          <p>View banner information</p>
        </div>

        <div className="banner-view-header-actions">

          {/* BACK BUTTON */}
          <button
            type="button"
            className="back-banner-btn"
            onClick={() => navigate("/admin/banners")}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Banners
          </button>

          {/* EDIT BUTTON */}
          <button
            type="button"
            className="edit-banner-view-btn"
            onClick={() =>
              navigate(`/admin/banners/edit/${banner._id}`)
            }
          >
            <i className="bi bi-pencil"></i>
            Edit Banner
          </button>

        </div>
      </div>

      {/* =========================
          MAIN CARD
      ========================= */}
      <div className="banner-view-card">

        {/* =========================
            IMAGE
        ========================= */}
        <div className="banner-view-image-section">

          {banner.image ? (
            <img
              src={banner.image}
              alt={banner.title || "Banner"}
              className="banner-view-image"
            />
          ) : (
            <div className="banner-view-no-image">
              <i className="bi bi-image"></i>
              <span>No Image Available</span>
            </div>
          )}

        </div>

        {/* =========================
            DETAILS
        ========================= */}
        <div className="banner-view-details">

          {/* TITLE + STATUS */}
          <div className="banner-view-title-row">

            <div>
              <span className="detail-label">
                TITLE
              </span>

              <h2>
                {banner.title || "-"}
              </h2>
            </div>

            {/* STATUS */}
            <span
              className={`banner-view-status ${bannerStatus.className}`}
            >
              <span className="status-dot"></span>
              {bannerStatus.label}
            </span>

          </div>

          {/* DETAIL GRID */}
          <div className="banner-detail-grid">

            {/* DESCRIPTION */}
            <div className="banner-detail-item">

              <span className="detail-label">
                DESCRIPTION
              </span>

              <p>
                {banner.description || "-"}
              </p>

            </div>

            {/* LINK */}
            <div className="banner-detail-item">

              <span className="detail-label">
                LINK
              </span>

              <p>
                {banner.link || "-"}
              </p>

            </div>

            {/* START DATE */}
            <div className="banner-detail-item">

              <span className="detail-label">
                START DATE
              </span>

              <p>
                {formatDate(banner.startDate)}
              </p>

            </div>

            {/* END DATE */}
            <div className="banner-detail-item">

              <span className="detail-label">
                END DATE
              </span>

              <p>
                {formatDate(banner.endDate)}
              </p>

            </div>

            {/* CREATED AT */}
            <div className="banner-detail-item">

              <span className="detail-label">
                CREATED AT
              </span>

              <p>
                {formatDate(banner.createdAt)}
              </p>

            </div>

            {/* LAST UPDATED */}
            <div className="banner-detail-item">

              <span className="detail-label">
                LAST UPDATED
              </span>

              <p>
                {formatDate(banner.updatedAt)}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default BannerView;