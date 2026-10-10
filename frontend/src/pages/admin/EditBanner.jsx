import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./EditBanner.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api/banners";

function EditBanner() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [banner, setBanner] = useState({
    title: "",
    description: "",
    link: "",
    status: "active",
    startDate: "",
    endDate: "",
    image: "",
  });

  const [newImage, setNewImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // FETCH BANNER
  // =========================================================

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch banner"
          );
        }

        const bannerData = data.banner;

        setBanner({
          title: bannerData.title || "",
          description: bannerData.description || "",
          link: bannerData.link || "",
          status: bannerData.status || "active",

          startDate: bannerData.startDate
            ? bannerData.startDate.split("T")[0]
            : "",

          endDate: bannerData.endDate
            ? bannerData.endDate.split("T")[0]
            : "",

          image: bannerData.image || "",
        });

        setPreview(bannerData.image || "");
      } catch (error) {
        console.error("Error fetching banner:", error);

        toast.error(error.message || "Failed to load banner.", {
          hideProgressBar: true,
          className: "rizo-admin-toast",
        });

        navigate("/admin/banners");
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [id, navigate]);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setBanner((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // IMAGE CHANGE
  // =========================================================

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Only image files
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.", {
        hideProgressBar: true,
        className: "rizo-admin-toast",
      });

      e.target.value = "";
      return;
    }

    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.", {
        hideProgressBar: true,
        className: "rizo-admin-toast",
      });

      e.target.value = "";
      return;
    }

    setNewImage(file);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!banner.title.trim()) {
      toast.error("Please enter banner title.", {
        hideProgressBar: true,
        className: "rizo-admin-toast",
      });

      return;
    }

    setSaving(true);

    try {
      // =====================================================
      // 1. UPDATE BANNER DETAILS
      // =====================================================

      const updateResponse = await fetch(
        `${API_URL}/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title: banner.title.trim(),

            description: banner.description.trim(),

            link: banner.link.trim(),

            // Dropdown selected status goes directly
            // to backend.
            status: banner.status,

            ...(banner.startDate && {
              startDate: banner.startDate,
            }),

            ...(banner.endDate && {
              endDate: banner.endDate,
            }),

            // Keep existing image URL
            image: banner.image,
          }),
        }
      );

      const updateData = await updateResponse.json();

      console.log(
        "Update Banner Status:",
        updateResponse.status
      );

      console.log(
        "Update Banner Response:",
        updateData
      );

      if (!updateResponse.ok) {
        throw new Error(
          updateData.message ||
            "Failed to update banner"
        );
      }

      // =====================================================
      // 2. UPLOAD NEW IMAGE IF SELECTED
      // =====================================================

      if (newImage) {
        const formData = new FormData();

        formData.append("image", newImage);

        const imageResponse = await fetch(
          `${API_URL}/${id}/image`,
          {
            method: "POST",
            body: formData,
          }
        );

        const imageResponseText =
          await imageResponse.text();

        console.log(
          "Upload Image Status:",
          imageResponse.status
        );

        console.log(
          "Upload Image Response:",
          imageResponseText
        );

        let imageData;

        try {
          imageData = JSON.parse(
            imageResponseText
          );
        } catch {
          throw new Error(
            `Image upload returned non-JSON response (${imageResponse.status})`
          );
        }

        if (!imageResponse.ok) {
          throw new Error(
            imageData.message ||
              "Image upload failed"
          );
        }
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      toast.success("Banner updated successfully!", {
        hideProgressBar: true,
        className: "rizo-admin-toast",
      });

      navigate("/admin/banners");
    } catch (error) {
      console.error(
        "Error updating banner:",
        error
      );

      toast.error(
        error.message ||
          "Something went wrong",
        {
          hideProgressBar: true,
          className: "rizo-admin-toast",
        }
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="edit-banner-page">
        <div className="edit-banner-loading">
          Loading banner...
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="edit-banner-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="edit-banner-header">
        <div>
          <span className="edit-banner-eyebrow">
            BANNER MANAGEMENT
          </span>

          <h1>
            Edit Banner
          </h1>

          <p>
            Update your website banner details
          </p>
        </div>

        <button
          type="button"
          className="back-banner-btn"
          onClick={() =>
            navigate("/admin/banners")
          }
        >
          ← Back to Banners
        </button>
      </div>

      {/* =====================================================
          FORM CARD
      ===================================================== */}

      <div className="edit-banner-card">
        <form onSubmit={handleSubmit}>

          <div className="edit-banner-layout">

            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <div className="edit-banner-form">

              {/* =================================================
                  BANNER DETAILS
              ================================================= */}

              <div className="form-section">

                <h2>
                  Banner Details
                </h2>

                <div className="form-group">

                  <label>
                    Banner Title{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={banner.title}
                    onChange={handleChange}
                    placeholder="Enter banner title"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={banner.description}
                    onChange={handleChange}
                    placeholder="Enter banner description"
                    rows="4"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Banner Link
                  </label>

                  <input
                    type="text"
                    name="link"
                    value={banner.link}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />

                </div>

                {/* =================================================
                    STATUS
                ================================================= */}

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={banner.status}
                    onChange={handleChange}
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>

                </div>

              </div>

              {/* =================================================
                  DATE SECTION
              ================================================= */}

              <div className="form-section">

                <h2>
                  Schedule
                </h2>

                <div className="date-grid">

                  <div className="form-group">

                    <label>
                      Start Date
                    </label>

                    <input
                      type="date"
                      name="startDate"
                      value={banner.startDate}
                      onChange={handleChange}
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      End Date
                    </label>

                    <input
                      type="date"
                      name="endDate"
                      value={banner.endDate}
                      onChange={handleChange}
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                RIGHT SIDE - IMAGE
            ================================================= */}

            <div className="edit-banner-image-section">

              <div className="form-section">

                <h2>
                  Banner Image
                </h2>

                <div className="current-image-box">

                  {preview ? (
                    <img
                      src={preview}
                      alt={
                        banner.title ||
                        "Banner"
                      }
                    />
                  ) : (
                    <div className="no-image">
                      No Image
                    </div>
                  )}

                </div>

                <label className="image-upload-label">
                  Change Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                <p className="image-help">
                  JPG, JPEG, PNG or WEBP.
                  Maximum size 5MB.
                </p>

                {newImage && (
                  <div className="selected-image">
                    New image selected:{" "}
                    <strong>
                      {newImage.name}
                    </strong>
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* =====================================================
              BUTTONS
          ===================================================== */}

          <div className="edit-banner-actions">

            <button
              type="button"
              className="cancel-banner-btn"
              onClick={() =>
                navigate("/admin/banners")
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-banner-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>
      </div>

    </div>
  );
}

export default EditBanner;