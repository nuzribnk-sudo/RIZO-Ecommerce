
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ViewCategories.css";

const API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/categories";

const PRODUCT_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/products";

function ViewCategories() {
  const navigate = useNavigate();
  const { id } = useParams();

  // =========================================================
  // STATE
  // =========================================================

  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH CATEGORY BY ID
  // =========================================================

  const fetchCategory = async () => {
    try {
      const response = await fetch(`${API_URL}/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch category");
      }

      const data = await response.json();

      if (!data?.success || !data?.category) {
        throw new Error("Category not found");
      }

      setCategory(data.category);
    } catch (err) {
      console.error("Category fetch error:", err);
      setError(
        err.message || "Failed to load category"
      );
    }
  };

  // =========================================================
  // FETCH ALL CATEGORIES
  // =========================================================

  const fetchAllCategories = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      if (data?.success) {
        setAllCategories(data.categories || []);
      }
    } catch (err) {
      console.error(
        "Categories fetch error:",
        err
      );
    }
  };

  // =========================================================
  // FETCH ALL PRODUCTS
  // =========================================================
  // Product backend uses pagination.
  // Fetch every page so category product count
  // and category product list are accurate.
  // =========================================================

  const fetchAllProducts = async () => {
    try {
      setProductsLoading(true);

      const firstResponse = await fetch(
        `${PRODUCT_API_URL}?page=1&limit=10`
      );

      if (!firstResponse.ok) {
        throw new Error("Failed to fetch products");
      }

      const firstData =
        await firstResponse.json();

      let allProducts = [
        ...(firstData?.products || []),
      ];

      const totalPages =
        Number(
          firstData?.pagination?.totalPages
        ) || 1;

      if (totalPages > 1) {
        const requests = [];

        for (
          let page = 2;
          page <= totalPages;
          page++
        ) {
          requests.push(
            fetch(
              `${PRODUCT_API_URL}?page=${page}&limit=10`
            ).then((response) => {
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch products page ${page}`
                );
              }

              return response.json();
            })
          );
        }

        const remainingResponses =
          await Promise.all(requests);

        remainingResponses.forEach(
          (data) => {
            if (
              Array.isArray(
                data?.products
              )
            ) {
              allProducts = [
                ...allProducts,
                ...data.products,
              ];
            }
          }
        );
      }

      setProducts(allProducts);
    } catch (err) {
      console.error(
        "Products fetch error:",
        err
      );

      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!id) {
      setError("Category ID is missing");
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      setLoading(true);

      await Promise.all([
        fetchCategory(),
        fetchAllCategories(),
        fetchAllProducts(),
      ]);

      setLoading(false);
    };

    loadPage();
  }, [id]);

  // =========================================================
  // FIND CATEGORY BY ID
  // =========================================================

  const findCategoryById = (
    categoryId
  ) => {
    if (!categoryId) return null;

    return allCategories.find(
      (item) =>
        item?._id?.toString() ===
        categoryId?.toString()
    );
  };

  // =========================================================
  // GET PARENT CATEGORY
  // =========================================================

  const getParentCategory = () => {
    if (!category?.parent) {
      return null;
    }

    const parentId =
      typeof category.parent === "object"
        ? category.parent?._id
        : category.parent;

    return findCategoryById(parentId);
  };

  // =========================================================
  // GET CHILD CATEGORIES
  // =========================================================

  const getChildCategories = (
    parentId
  ) => {
    if (!parentId) return [];

    return allCategories.filter(
      (item) => {
        const itemParent =
          typeof item?.parent === "object"
            ? item?.parent?._id
            : item?.parent;

        return (
          itemParent?.toString() ===
          parentId?.toString()
        );
      }
    );
  };

  // =========================================================
  // GET ALL DESCENDANT CATEGORY IDS
  // =========================================================

  const getDescendantCategoryIds = (
    parentId
  ) => {
    if (!parentId) return [];

    const descendantIds = [];

    const findChildren = (
      currentParentId
    ) => {
      const children =
        getChildCategories(
          currentParentId
        );

      children.forEach((child) => {
        descendantIds.push(
          child._id.toString()
        );

        findChildren(child._id);
      });
    };

    findChildren(parentId);

    return descendantIds;
  };

  // =========================================================
  // PRODUCTS BELONGING TO CATEGORY
  // =========================================================

  const categoryProductList = useMemo(() => {
    if (!category?._id) {
      return [];
    }

    const categoryId =
      category._id.toString();

    const descendantIds =
      getDescendantCategoryIds(
        category._id
      );

    const allowedCategoryIds = [
      categoryId,
      ...descendantIds,
    ];

    return products.filter(
      (product) => {
        const productCategory =
          product?.category;

        if (!productCategory) {
          return false;
        }

        const productCategoryId =
          typeof productCategory ===
          "object"
            ? productCategory?._id
            : productCategory;

        if (!productCategoryId) {
          return false;
        }

        return allowedCategoryIds.includes(
          productCategoryId.toString()
        );
      }
    );
  }, [
    category,
    products,
    allCategories,
  ]);

  // =========================================================
  // CATEGORY TYPE
  // =========================================================

  const getCategoryType = () => {
    if (!category) return "—";

    return category.parent
      ? "Subcategory"
      : "Main Category";
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
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

  // =========================================================
  // PRODUCT IMAGE
  // =========================================================

  const getProductImage = (
    product
  ) => {
    const images = product?.images;

    if (
      Array.isArray(images) &&
      images.length > 0
    ) {
      const firstImage = images[0];

      if (
        typeof firstImage ===
        "string"
      ) {
        return firstImage;
      }

      if (
        typeof firstImage ===
          "object" &&
        firstImage !== null
      ) {
        return (
          firstImage?.url ||
          firstImage?.secure_url ||
          firstImage?.path ||
          ""
        );
      }
    }

    return "";
  };

  // =========================================================
  // PRODUCT NAME
  // =========================================================

  const getProductName = (
    product
  ) => {
    return (
      product?.name ||
      "Unnamed Product"
    );
  };

  // =========================================================
  // REGULAR PRICE
  // =========================================================
  // Actual backend Product field:
  // regularPrice
  // =========================================================

  const getProductRegularPrice = (
    product
  ) => {
    const price =
      product?.regularPrice;

    if (
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return null;
    }

    const numericPrice =
      Number(price);

    return Number.isNaN(
      numericPrice
    )
      ? null
      : numericPrice;
  };

  // =========================================================
  // SALE PRICE
  // =========================================================
  // Actual backend Product field:
  // salePrice
  // =========================================================

  const getProductSalePrice = (
    product
  ) => {
    const price =
      product?.salePrice;

    if (
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return null;
    }

    const numericPrice =
      Number(price);

    return Number.isNaN(
      numericPrice
    )
      ? null
      : numericPrice;
  };

  // =========================================================
  // FORMAT PRICE
  // =========================================================

  const formatPrice = (price) => {
    if (
      price === undefined ||
      price === null
    ) {
      return "—";
    }

    return `₹${Number(
      price
    ).toLocaleString("en-IN")}`;
  };

  // =========================================================
  // PRODUCT STOCK
  // =========================================================

  const getProductStock = (
    product
  ) => {
    const stock = Number(
      product?.stock
    );

    return Number.isNaN(stock)
      ? 0
      : stock;
  };

  // =========================================================
  // PRODUCT STATUS
  // =========================================================

  const getProductStatus = (
    product
  ) => {
    return (
      product?.status ||
      "inactive"
    );
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (
    status
  ) => {
    return status === "active"
      ? "active"
      : "inactive";
  };

  // =========================================================
  // BACK TO CATEGORIES
  // =========================================================

  const handleBack = () => {
    navigate(
      "/admin/categories"
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="view-category-page">

        <div className="view-category-loading">

          <i className="bi bi-arrow-repeat"></i>

          <p>
            Loading category...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (
    error ||
    !category
  ) {
    return (
      <div className="view-category-page">

        <div className="view-category-error">

          <div className="error-icon">
            <i className="bi bi-exclamation-circle"></i>
          </div>

          <h2>
            Category Not Found
          </h2>

          <p>
            {error ||
              "Unable to load this category."}
          </p>

          <button
            className="back-btn"
            onClick={handleBack}
          >
            <i className="bi bi-arrow-left"></i>

            Back to Categories
          </button>

        </div>

      </div>
    );
  }

  // =========================================================
  // CATEGORY DATA
  // =========================================================

  const parentCategory =
    getParentCategory();

  const childCategories =
    getChildCategories(
      category._id
    );

  const descendantCategoryIds =
    getDescendantCategoryIds(
      category._id
    );

  const totalRelatedCategories =
    descendantCategoryIds.length;

  const categoryStatusClass =
    category.status === "active"
      ? "active"
      : "inactive";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="view-category-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="view-category-header">

        <div className="header-left">

          <div>

            <span className="page-eyebrow">
              CATEGORY DETAILS
            </span>

            <h1>
              {category.name}
            </h1>

            <p>
              View category information
              and related products.
            </p>

          </div>

        </div>

        <button
          className="back-category-btn"
          onClick={handleBack}
        >
          <i className="bi bi-arrow-left"></i>

          Back to Categories
        </button>

      </div>

      {/* =====================================================
          CATEGORY OVERVIEW
      ===================================================== */}

      <section className="category-overview-card">

        <div className="category-overview-main">

          <div className="category-icon-box">
            <i className="bi bi-grid"></i>
          </div>

          <div className="category-main-info">

            <div className="category-title-row">

              <h2>
                {category.name}
              </h2>

              <span
                className={`status-badge ${categoryStatusClass}`}
              >
                <span className="status-dot"></span>

                {category.status ||
                  "inactive"}
              </span>

            </div>

            <p className="category-description">
              {category.description ||
                "No category description available."}
            </p>

          </div>

        </div>

        <div className="category-overview-stats">

          <div className="overview-stat">

            <span className="stat-label">
              PRODUCTS
            </span>

            <strong>
              {categoryProductList.length}
            </strong>

          </div>

          <div className="overview-stat">

            <span className="stat-label">
              TYPE
            </span>

            <strong>
              {getCategoryType()}
            </strong>

          </div>

          <div className="overview-stat">

            <span className="stat-label">
              SUBCATEGORIES
            </span>

            <strong>
              {totalRelatedCategories}
            </strong>

          </div>

        </div>

      </section>

      {/* =====================================================
          CATEGORY INFORMATION
      ===================================================== */}

      <section className="category-info-section">

        <div className="section-heading">

          <div>

            <span className="section-eyebrow">
              INFORMATION
            </span>

            <h2>
              Category Information
            </h2>

          </div>

        </div>

        <div className="category-info-grid">

          <div className="info-item">
            <span>
              Category Name
            </span>

            <strong>
              {category.name || "—"}
            </strong>
          </div>

          <div className="info-item">
            <span>
              Slug
            </span>

            <strong>
              {category.slug || "—"}
            </strong>
          </div>

          <div className="info-item">
            <span>
              Type
            </span>

            <strong>
              {getCategoryType()}
            </strong>
          </div>

          <div className="info-item">
            <span>
              Parent Category
            </span>

            <strong>
              {parentCategory?.name ||
                "None"}
            </strong>
          </div>

          <div className="info-item">
            <span>
              Status
            </span>

            <strong>
              <span
                className={`status-text ${categoryStatusClass}`}
              >
                {category.status ||
                  "inactive"}
              </span>
            </strong>
          </div>

          <div className="info-item">
            <span>
              Created At
            </span>

            <strong>
              {formatDate(
                category.createdAt
              )}
            </strong>
          </div>

          <div className="info-item">
            <span>
              Updated At
            </span>

            <strong>
              {formatDate(
                category.updatedAt
              )}
            </strong>
          </div>

          <div className="info-item">
            <span>
              Related Categories
            </span>

            <strong>
              {totalRelatedCategories}
            </strong>
          </div>

        </div>

      </section>

      {/* =====================================================
          SUBCATEGORIES
      ===================================================== */}

      {childCategories.length > 0 && (
        <section className="subcategory-section">

          <div className="section-heading">

            <div>

              <span className="section-eyebrow">
                STRUCTURE
              </span>

              <h2>
                Subcategories
              </h2>

            </div>

            <span className="section-count">
              {childCategories.length}
            </span>

          </div>

          <div className="subcategory-grid">

            {childCategories.map(
              (subCategory) => (
                <button
                  key={subCategory._id}
                  className="subcategory-card"
                  onClick={() =>
                    navigate(
                      `/admin/categories/${subCategory._id}`
                    )
                  }
                >

                  <div className="subcategory-icon">
                    <i className="bi bi-folder2"></i>
                  </div>

                  <div className="subcategory-content">

                    <strong>
                      {subCategory.name}
                    </strong>

                    <span>
                      {subCategory.status ||
                        "inactive"}
                    </span>

                  </div>

                  <i className="bi bi-chevron-right"></i>

                </button>
              )
            )}

          </div>

        </section>
      )}

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section className="category-products-section">

        <div className="section-heading">

          <div>

            <span className="section-eyebrow">
              CATALOG
            </span>

            <h2>
              Products in this Category
            </h2>

            <p>
              Products from this category
              and its subcategories.
            </p>

          </div>

          <span className="section-count">
            {categoryProductList.length}
          </span>

        </div>

        {productsLoading ? (
          <div className="products-loading">

            <i className="bi bi-arrow-repeat"></i>

            <span>
              Loading products...
            </span>

          </div>
        ) : categoryProductList.length ===
          0 ? (
          <div className="empty-products">

            <div className="empty-products-icon">
              <i className="bi bi-box-seam"></i>
            </div>

            <h3>
              No Products Found
            </h3>

            <p>
              There are no products assigned
              to this category yet.
            </p>

          </div>
        ) : (
          <div className="products-table-wrapper">

            <table className="products-table">

              <thead>

                <tr>
                  <th>PRODUCT</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                </tr>

              </thead>

              <tbody>

                {categoryProductList.map(
                  (product) => {

                    const image =
                      getProductImage(
                        product
                      );

                    const regularPrice =
                      getProductRegularPrice(
                        product
                      );

                    const salePrice =
                      getProductSalePrice(
                        product
                      );

                    // Same effective-price logic
                    // used by backend service.

                    const hasSale =
                      regularPrice !== null &&
                      salePrice !== null &&
                      salePrice > 0 &&
                      salePrice <
                        regularPrice;

                    const displayPrice =
                      hasSale
                        ? salePrice
                        : regularPrice;

                    const stock =
                      getProductStock(
                        product
                      );

                    const productStatus =
                      getProductStatus(
                        product
                      );

                    return (
                      <tr
                        key={product._id}
                      >

                        {/* PRODUCT */}

                        <td>

                          <div className="product-info">

                            <div className="product-image">

                              {image ? (
                                <img
                                  src={image}
                                  alt={getProductName(
                                    product
                                  )}
                                />
                              ) : (
                                <div className="no-product-image">
                                  <i className="bi bi-image"></i>
                                </div>
                              )}

                            </div>

                            <div className="product-name-wrap">

                              <strong>
                                {getProductName(
                                  product
                                )}
                              </strong>

                              {product?.sku && (
                                <span>
                                  SKU:{" "}
                                  {product.sku}
                                </span>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* PRICE */}

                        <td className="product-price-cell">

                          {displayPrice !== null ? (
                            <div className="product-pricing">

                              <span className="sale-price">
                                {formatPrice(
                                  displayPrice
                                )}
                              </span>

                              {hasSale && (
                                <span className="original-price">
                                  {formatPrice(
                                    regularPrice
                                  )}
                                </span>
                              )}

                            </div>
                          ) : (
                            "—"
                          )}

                        </td>

                        {/* STOCK */}

                        <td>

                          <span
                            className={`stock-value ${
                              stock === 0
                                ? "out"
                                : stock <= 10
                                ? "low"
                                : "good"
                            }`}
                          >
                            {stock}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge small ${getStatusClass(
                              productStatus
                            )}`}
                          >

                            <span className="status-dot"></span>

                            {productStatus}

                          </span>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

export default ViewCategories;

