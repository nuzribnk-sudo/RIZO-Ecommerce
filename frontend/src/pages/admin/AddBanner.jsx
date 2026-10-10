import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddBanner.css";

const API_URL =  "https://rizo-ecommerce-backend.onrender.com/api/banners";

function AddBanner() {
  const navigate = useNavigate();

  const [banner, setBanner] = useState({
    title: "",
    description: "",
    link: "",
    status: "active",
    startDate: "",
    endDate: "",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Maximum image size: 5MB
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  // =========================================================
  // HANDLE TEXT / SELECT / DATE CHANGES
  // =========================================================

  const handleChange = (e) => {
    setBanner({
      ...banner,
      [e.target.name]: e.target.value,
    });
  };

  // =========================================================
  // HANDLE IMAGE SELECTION
  // =========================================================

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];

    if (!selectedImage) {
      setImage(null);
      return;
    }

    // Only allow image files
    if (!selectedImage.type.startsWith("image/")) {
      toast.error("Please select a valid image file.", {
        className: "rizo-admin-toast",
        hideProgressBar: true,
      });

      e.target.value = "";
      setImage(null);
      return;
    }

    // Maximum file size: 5MB
    if (selectedImage.size > MAX_IMAGE_SIZE) {
      toast.error(
        "Image size must be 5MB or less. Please choose a smaller image.",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      e.target.value = "";
      setImage(null);
      return;
    }

    setImage(selectedImage);
  };

  // =========================================================
  // SUBMIT BANNER
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!banner.title.trim()) {
      toast.error("Please enter banner title.", {
        className: "rizo-admin-toast",
        hideProgressBar: true,
      });
      return;
    }

    if (!banner.description.trim()) {
      toast.error("Please enter banner description.", {
        className: "rizo-admin-toast",
        hideProgressBar: true,
      });
      return;
    }

    if (!image) {
      toast.error("Please select a banner image.", {
        className: "rizo-admin-toast",
        hideProgressBar: true,
      });
      return;
    }

    // Final 5MB validation
    if (image.size > MAX_IMAGE_SIZE) {
      toast.error(
        "Image size must be 5MB or less. Please choose a smaller image.",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // CREATE BANNER + UPLOAD IMAGE
      // =====================================================

      const formData = new FormData();

      // Text fields
      formData.append("title", banner.title.trim());

      formData.append(
        "description",
        banner.description.trim()
      );

      formData.append(
        "link",
        banner.link.trim()
      );

      formData.append(
        "status",
        banner.status
      );

      // Optional dates
      if (banner.startDate) {
        formData.append(
          "startDate",
          banner.startDate
        );
      }

      if (banner.endDate) {
        formData.append(
          "endDate",
          banner.endDate
        );
      }

      // IMPORTANT:
      // Backend expects the uploaded file as "image"
      formData.append("image", image);

      // -----------------------------------------------------
      // Send multipart/form-data
      // -----------------------------------------------------

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      // Read response as text first
      const responseText = await response.text();

      console.log(
        "Create Banner Status:",
        response.status
      );

      console.log(
        "Create Banner Response:",
        responseText
      );

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned non-JSON response (${response.status})`
        );
      }

      // -----------------------------------------------------
      // ERROR
      // -----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create banner"
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      toast.success("Banner added successfully!", {
        className: "rizo-admin-toast",
        hideProgressBar: true,
      });

      navigate("/admin/banners");
    } catch (error) {
      console.error(
        "Error adding banner:",
        error
      );

      toast.error(
        error.message || "Something went wrong",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="add-banner-page">
      <div className="add-banner-content">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="add-banner-header">
          <div className="add-banner-heading">
            <h1>Add Banner</h1>

            <p>
              Create a new promotional banner for your store
            </p>
          </div>

          <button
            type="button"
            className="back-banners-btn"
            onClick={() =>
              navigate("/admin/banners")
            }
          >
            <i className="bi bi-arrow-left"></i>
            Back to Banners
          </button>
        </div>

        {/* =================================================
            FORM CARD
        ================================================= */}

        <div className="add-banner-card">
          <form onSubmit={handleSubmit}>

            {/* =================================================
                BANNER TITLE
            ================================================= */}

            <div className="form-group">
              <label>Banner Title</label>

              <input
                type="text"
                name="title"
                placeholder="Example: Summer Sale"
                value={banner.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="form-group">
              <label>Description</label>

              <textarea
                name="description"
                placeholder="Enter banner description..."
                value={banner.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            {/* =================================================
                LINK + STATUS
            ================================================= */}

            <div className="form-row">
              <div className="form-group">
                <label>Banner Link</label>

                <input
                  type="text"
                  name="link"
                  placeholder="/shop"
                  value={banner.link}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Status</label>

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
                START DATE + END DATE
            ================================================= */}

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>

                <input
                  type="date"
                  name="startDate"
                  value={banner.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>

                <input
                  type="date"
                  name="endDate"
                  value={banner.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* =================================================
                BANNER IMAGE
            ================================================= */}

            <div className="form-group">
              <label>Banner Image</label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />

              {/* Image Guidelines */}

              <small className="image-upload-note">
                <i className="bi bi-info-circle"></i>

                Maximum image size:{" "}
                <strong>5MB</strong>
                {" • "}
                Only image files are allowed.
              </small>

              {/* Selected Image Size */}

              {image && (
                <small className="selected-image-size">
                  Selected image:{" "}
                  <strong>
                    {(
                      image.size /
                      (1024 * 1024)
                    ).toFixed(2)}{" "}
                    MB
                  </strong>
                </small>
              )}

              {/* Image Preview */}

              {image && (
                <div className="banner-image-preview">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Banner preview"
                  />
                </div>
              )}
            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="form-actions">
              <button
                type="button"
                className="cancel-banner-btn"
                onClick={() =>
                  navigate("/admin/banners")
                }
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-banner-btn"
                disabled={loading}
              >
                <i className="bi bi-plus-lg"></i>

                {loading
                  ? "Adding..."
                  : "Add Banner"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default AddBanner;