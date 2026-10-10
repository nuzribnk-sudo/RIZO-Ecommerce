import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ViewProduct.css";

const API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/products";

const CATEGORY_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/categories";

function ViewProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  /* =========================================================
     FETCH PRODUCT + CATEGORIES
  ========================================================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [productResponse, categoryResponse] =
          await Promise.all([
            fetch(`${API_URL}/${id}`),
            fetch(CATEGORY_API_URL),
          ]);

        if (!productResponse.ok) {
          throw new Error("Failed to fetch product");
        }

        const productData =
          await productResponse.json();

        const categoryData =
          categoryResponse.ok
            ? await categoryResponse.json()
            : { categories: [] };

        console.log(
          "View Product:",
          productData
        );

        console.log(
          "Categories:",
          categoryData
        );

        setProduct(
          productData.product || productData
        );

        setCategories(
          categoryData.categories || []
        );
      } catch (error) {
        console.error(
          "Error fetching product:",
          error
        );

        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  /* =========================================================
     FIND CATEGORY ID
  ========================================================= */

  const getCategoryId = (category) => {
    if (!category) return null;

    if (typeof category === "object") {
      return category._id || category.id || null;
    }

    return category;
  };

  /* =========================================================
     CATEGORY + SUBCATEGORY
  ========================================================= */

  const getCategoryDetails = () => {
    if (!product?.category) {
      return {
        mainCategory: "Uncategorized",
        subCategory: null,
      };
    }

    /* -----------------------------------------
       If product.category is already an object
    ----------------------------------------- */

    if (typeof product.category === "object") {
      const category = product.category;

      const categoryName =
        category?.name || "Uncategorized";

      let parentName = null;

      if (category?.parent) {
        if (
          typeof category.parent === "object"
        ) {
          parentName =
            category.parent?.name || null;
        } else {
          const parentCategory =
            categories.find(
              (item) =>
                item._id === category.parent
            );

          parentName =
            parentCategory?.name || null;
        }
      }

      if (parentName) {
        return {
          mainCategory: parentName,
          subCategory: categoryName,
        };
      }

      return {
        mainCategory: categoryName,
        subCategory: null,
      };
    }

    /* -----------------------------------------
       If product.category is only an ID
    ----------------------------------------- */

    const categoryId = getCategoryId(
      product.category
    );

    const category = categories.find(
      (item) => item._id === categoryId
    );

    if (!category) {
      return {
        mainCategory: "Uncategorized",
        subCategory: null,
      };
    }

    /* -----------------------------------------
       Main category
    ----------------------------------------- */

    if (!category.parent) {
      return {
        mainCategory: category.name,
        subCategory: null,
      };
    }

    /* -----------------------------------------
       Subcategory
    ----------------------------------------- */

    const parentId =
      typeof category.parent === "object"
        ? category.parent?._id
        : category.parent;

    const parentCategory = categories.find(
      (item) => item._id === parentId
    );

    return {
      mainCategory:
        parentCategory?.name || "Uncategorized",

      subCategory: category.name,
    };
  };

  const {
    mainCategory,
    subCategory,
  } = getCategoryDetails();

  const isSubcategory = Boolean(
    subCategory
  );

  /* =========================================================
     PRODUCT STATUS
  ========================================================= */

  const getProductStatus = () => {
    const stock = Number(
      product?.stock || 0
    );

    if (stock === 0) {
      return {
        label: "Out of Stock",
        className: "status-out",
      };
    }

    if (stock <= 10) {
      return {
        label: "Low Stock",
        className: "status-low",
      };
    }

    if (
      product?.status === "inactive"
    ) {
      return {
        label: "Inactive",
        className: "status-inactive",
      };
    }

    return {
      label: "Active",
      className: "status-active",
    };
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="view-product-page">
        <div className="view-product-loading">
          <div className="loading-spinner"></div>

          <span>
            Loading product...
          </span>
        </div>
      </div>
    );
  }

  /* =========================================================
     PRODUCT NOT FOUND
  ========================================================= */

  if (!product) {
    return (
      <div className="view-product-page">
        <div className="view-product-empty">

          <i className="bi bi-box-seam"></i>

          <h2>
            Product Not Found
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/products")
            }
          >
            Back to Products
          </button>

        </div>
      </div>
    );
  }

  /* =========================================================
     PRODUCT DATA
  ========================================================= */

  const images = Array.isArray(
    product.images
  )
    ? product.images
    : [];

  const productStatus =
    getProductStatus();

  const stock = Number(
    product.stock || 0
  );

  const stockClass =
    stock > 0
      ? "stock-in"
      : "stock-out";

  /* =========================================================
     PRICE
  ========================================================= */

  const regularPrice = Number(
    product.regularPrice || 0
  );

  const salePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    product.salePrice !== ""
      ? Number(product.salePrice)
      : null;

  const hasSalePrice =
    salePrice !== null &&
    salePrice > 0 &&
    salePrice < regularPrice;

  const displayPrice =
    hasSalePrice
      ? salePrice
      : regularPrice;

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "N/A";

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "N/A";
    }
  };

  /* =========================================================
     HANDLERS
  ========================================================= */

  const handleEdit = () => {
    navigate(
      `/admin/products/edit/${product._id}`
    );
  };

  const handleBack = () => {
    navigate(
      "/admin/products"
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="view-product-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="view-product-header">

        <div>
          <span className="view-product-eyebrow">
            STORE MANAGEMENT
          </span>

          <h1>
            View Product
          </h1>

          <p>
            View complete product information
            and details
          </p>
        </div>

        <div className="view-header-actions">

          <button
            type="button"
            className="view-back-btn"
            onClick={handleBack}
          >
            <i className="bi bi-arrow-left"></i>

            Back to Products
          </button>

          <button
            type="button"
            className="view-edit-btn"
            onClick={handleEdit}
          >
            <i className="bi bi-pencil"></i>

            Edit Product
          </button>

        </div>

      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="view-product-card">

        {/* ===================================================
            IMAGE SECTION
        =================================================== */}

        <div className="view-image-section">

          <div className="main-product-image">

            {images.length > 0 ? (
              <img
                src={
                  images[selectedImage] ||
                  images[0]
                }
                alt={
                  product.name ||
                  "Product"
                }
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                }}
              />
            ) : (
              <div className="no-product-image">

                <i className="bi bi-image"></i>

                <span>
                  No image available
                </span>

              </div>
            )}

          </div>

          {/* =================================================
              THUMBNAILS
          ================================================= */}

          {images.length > 0 && (
            <div className="product-image-thumbnails">

              {images.map(
                (image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={`image-thumbnail ${
                      selectedImage === index
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedImage(
                        index
                      )
                    }
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${
                        index + 1
                      }`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        objectPosition:
                          "center",
                        display: "block",
                      }}
                    />
                  </button>
                )
              )}

            </div>
          )}

        </div>

        {/* ===================================================
            PRODUCT INFO
        =================================================== */}

        <div className="view-product-info">

          {/* =================================================
              TOP PRODUCT INFO
          ================================================= */}

          <div className="product-info-top">

            <div>

              {/* =============================================
                  CATEGORY + SUBCATEGORY
              ============================================= */}

              <div className="product-category-info">

                <span className="product-category-label">
                  {mainCategory}
                </span>

                {isSubcategory && (
                  <>
                    <span className="category-separator">
                      /
                    </span>

                    <span className="product-subcategory-label">
                      {subCategory}
                    </span>
                  </>
                )}

              </div>

              <h2>
                {product.name ||
                  "Unnamed Product"}
              </h2>

              <p className="product-sku">
                SKU:{" "}
                <strong>
                  {product.sku ||
                    "N/A"}
                </strong>
              </p>

            </div>

            {/* =============================================
                STATUS
            ============================================= */}

            <span
              className={`product-status ${productStatus.className}`}
            >
              <span className="status-dot"></span>

              {productStatus.label}
            </span>

          </div>

          {/* =================================================
              PRICE
          ================================================= */}

          <div className="product-price-section">

            <span className="sale-price">
              ₹
              {displayPrice.toLocaleString(
                "en-IN"
              )}
            </span>

            {hasSalePrice && (
              <>
                <span className="regular-price crossed">
                  ₹
                  {regularPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

                <span className="sale-badge">
                  SALE
                </span>
              </>
            )}

          </div>

          {/* =================================================
              INFO GRID
          ================================================= */}

          <div className="product-info-grid">

            {/* ===============================================
                STOCK
            =============================================== */}

            <div className="info-box">

              <div className="info-icon">
                <i className="bi bi-box-seam"></i>
              </div>

              <div>

                <span>
                  Stock
                </span>

                <strong
                  className={stockClass}
                >
                  {stock} units
                </strong>

              </div>

            </div>

            {/* ===============================================
                CATEGORY
            =============================================== */}

            <div className="info-box">

              <div className="info-icon">
                <i className="bi bi-grid"></i>
              </div>

              <div className="category-info-content">

                <span>
                  Category
                </span>

                <strong
                  className="category-display"
                  title={
                    isSubcategory
                      ? `${mainCategory} / ${subCategory}`
                      : mainCategory
                  }
                >

                  {mainCategory}

                  {isSubcategory && (
                    <>
                      <small>
                        /
                      </small>

                      {subCategory}
                    </>
                  )}

                </strong>

              </div>

            </div>

          </div>

          {/* =================================================
              SIZES
          ================================================= */}

          <div className="detail-section">

            <h3>
              Available Sizes
            </h3>

            {Array.isArray(
              product.variants
            ) &&
            product.variants.length > 0 ? (
              <div className="view-size-list">

                {product.variants.map(
                  (
                    variant,
                    index
                  ) => (
                    <span
                      className="view-size"
                      key={`${variant}-${index}`}
                    >
                      {variant}
                    </span>
                  )
                )}

              </div>
            ) : (
              <p className="muted-text">
                No sizes or variants
                available.
              </p>
            )}

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="detail-section">

            <h3>
              Description
            </h3>

            {product.description ? (
              <p className="product-description">
                {product.description}
              </p>
            ) : (
              <p className="muted-text">
                No description available.
              </p>
            )}

          </div>

          {/* =================================================
              PRODUCT META
          ================================================= */}

          <div className="product-meta">

            {/* PRODUCT ID */}

            <div>

              <span>
                Product ID
              </span>

              <strong
                title={product._id}
              >
                {product._id ||
                  "N/A"}
              </strong>

            </div>

            {/* STATUS */}

            <div>

              <span>
                Status
              </span>

              <strong>
                {product.status ===
                "inactive"
                  ? "Inactive"
                  : "Active"}
              </strong>

            </div>

            {/* CREATED */}

            <div>

              <span>
                Created
              </span>

              <strong>
                {formatDate(
                  product.createdAt
                )}
              </strong>

            </div>

            {/* UPDATED */}

            <div>

              <span>
                Last Updated
              </span>

              <strong>
                {formatDate(
                  product.updatedAt
                )}
              </strong>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ViewProduct;