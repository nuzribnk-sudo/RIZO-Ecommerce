import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddCoupon.css";

const COUPON_API_URL =
    "https://rizo-ecommerce-backend.onrender.com/api/coupons/create";

const CATEGORY_API_URL =
   "https://rizo-ecommerce-backend.onrender.com/api/categories";

const PRODUCT_API_URL =
   "https://rizo-ecommerce-backend.onrender.com/api/products";

function AddCoupon() {
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState({
    code: "",
    couponType: "general",
    category: "",
    product: "",
    discountType: "percentage",
    discountValue: "",
    minimumPurchase: "",
    maximumDiscount: "",
    usageLimit: "",
    expiryDate: "",
    isActive: true,
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] =
    useState(false);
  const [loadingProducts, setLoadingProducts] =
    useState(false);

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const response = await fetch(
          CATEGORY_API_URL
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch categories"
          );
        }

        const data = await response.json();

        const categoryList = Array.isArray(data)
          ? data
          : data.categories || data.data || [];

        setCategories(categoryList);
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // =========================================================
  // SEARCH PRODUCTS
  // =========================================================

  useEffect(() => {
    const searchProducts = async () => {
      const searchValue =
        productSearch.trim();

      // Don't search when empty
      if (!searchValue) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      try {
        setLoadingProducts(true);

        // -----------------------------------------------------
        // FIRST PAGE
        // -----------------------------------------------------

        const firstResponse = await fetch(
          `${PRODUCT_API_URL}?search=${encodeURIComponent(
            searchValue
          )}&page=1&limit=10`
        );

        if (!firstResponse.ok) {
          throw new Error(
            "Failed to search products"
          );
        }

        const firstData =
          await firstResponse.json();

        const firstProducts = Array.isArray(
          firstData
        )
          ? firstData
          : firstData.products ||
            firstData.data ||
            [];

        const totalPages =
          firstData.pagination?.totalPages ||
          1;

        let allSearchResults = [
          ...firstProducts,
        ];

        // -----------------------------------------------------
        // FETCH REMAINING PAGES
        // -----------------------------------------------------

        if (totalPages > 1) {
          const pageRequests = [];

          for (
            let page = 2;
            page <= totalPages;
            page++
          ) {
            pageRequests.push(
              fetch(
                `${PRODUCT_API_URL}?search=${encodeURIComponent(
                  searchValue
                )}&page=${page}&limit=10`
              )
                .then((response) => {
                  if (!response.ok) {
                    throw new Error(
                      `Failed to fetch page ${page}`
                    );
                  }

                  return response.json();
                })
                .then((data) => {
                  return Array.isArray(data)
                    ? data
                    : data.products ||
                        data.data ||
                        [];
                })
            );
          }

          const remainingPages =
            await Promise.all(
              pageRequests
            );

          remainingPages.forEach(
            (pageProducts) => {
              allSearchResults.push(
                ...pageProducts
              );
            }
          );
        }

        setProducts(allSearchResults);
      } catch (error) {
        console.error(
          "Product search error:",
          error
        );

        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    const timer = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch]);

  // =========================================================
  // HANDLE NORMAL INPUTS
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setCoupon((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =========================================================
  // HANDLE COUPON TYPE
  // =========================================================

  const handleCouponTypeChange = (e) => {
    const value = e.target.value;

    setCoupon((prev) => ({
      ...prev,
      couponType: value,
      category: "",
      product: "",
    }));

    setProductSearch("");
    setProducts([]);
    setSelectedProduct(null);
  };

  // =========================================================
  // SELECT PRODUCT
  // =========================================================

  const handleProductSelect = (product) => {
    setCoupon((prev) => ({
      ...prev,
      product: product._id,
    }));

    // Store complete product object
    // so image + name can be displayed after selection
    setSelectedProduct(product);

    // Clear search after selecting
    setProductSearch("");
    setProducts([]);
  };

  // =========================================================
  // REMOVE SELECTED PRODUCT
  // =========================================================

  const clearSelectedProduct = () => {
    setCoupon((prev) => ({
      ...prev,
      product: "",
    }));

    setSelectedProduct(null);
    setProductSearch("");
    setProducts([]);
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // -------------------------------------------------------
    // COUPON CODE
    // -------------------------------------------------------

    if (!coupon.code.trim()) {
      toast.error(
        "Please enter coupon code",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    // -------------------------------------------------------
    // CATEGORY
    // -------------------------------------------------------

    if (
      coupon.couponType === "category" &&
      !coupon.category
    ) {
      toast.error(
        "Please select a category",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    // -------------------------------------------------------
    // PRODUCT
    // -------------------------------------------------------

    if (
      coupon.couponType === "product" &&
      !coupon.product
    ) {
      toast.error(
        "Please select a product",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    // -------------------------------------------------------
    // DISCOUNT VALUE
    // -------------------------------------------------------

    if (
      coupon.discountValue === "" ||
      Number(coupon.discountValue) <= 0
    ) {
      toast.error(
        "Please enter a valid discount value greater than 0",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    // -------------------------------------------------------
    // PERCENTAGE DISCOUNT
    // -------------------------------------------------------

    if (
      coupon.discountType ===
        "percentage" &&
      Number(coupon.discountValue) > 100
    ) {
      toast.error(
        "Percentage discount cannot be more than 100%",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    // -------------------------------------------------------
    // MINIMUM PURCHASE
    // -------------------------------------------------------

    if (
      coupon.minimumPurchase === "" ||
      Number(coupon.minimumPurchase) < 1
    ) {
      toast.error(
        "Minimum purchase must be at least ₹1",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    // -------------------------------------------------------
    // MAXIMUM DISCOUNT
    // -------------------------------------------------------

    if (
      coupon.maximumDiscount === "" ||
      Number(coupon.maximumDiscount) <= 0
    ) {
      toast.error(
        "Maximum discount must be greater than 0",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    // -------------------------------------------------------
    // USAGE LIMIT
    // -------------------------------------------------------

    if (
      coupon.usageLimit === "" ||
      Number(coupon.usageLimit) < 1
    ) {
      toast.error(
        "Usage limit must be at least 1",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
      return;
    }

    // -------------------------------------------------------
    // EXPIRY DATE
    // -------------------------------------------------------

    if (!coupon.expiryDate) {
      toast.error(
        "Please select expiry date",
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
      // REQUEST BODY
      // =====================================================

      const requestBody = {
        code: coupon.code
          .trim()
          .toUpperCase(),

        couponType:
          coupon.couponType === "general"
            ? "cart"
            : coupon.couponType,

        discountType:
          coupon.discountType,

        discountValue: Number(
          coupon.discountValue
        ),

        minimumPurchase: Number(
          coupon.minimumPurchase
        ),

        maxDiscount: Number(
          coupon.maximumDiscount
        ),

        usageLimit: Number(
          coupon.usageLimit
        ),

        expiry: coupon.expiryDate,

        isActive: coupon.isActive,
      };

      // -----------------------------------------------------
      // CATEGORY COUPON
      // -----------------------------------------------------

      if (
        coupon.couponType ===
        "category"
      ) {
        requestBody.category =
          coupon.category;
      }

      // -----------------------------------------------------
      // PRODUCT COUPON
      // -----------------------------------------------------

      if (
        coupon.couponType ===
        "product"
      ) {
        requestBody.product =
          coupon.product;
      }

      // =====================================================
      // CREATE COUPON
      // =====================================================

      const response = await fetch(
        COUPON_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            requestBody
          ),
        }
      );

      // =====================================================
      // HANDLE RESPONSE
      // =====================================================

      const contentType =
        response.headers.get(
          "content-type"
        );

      let data;

      if (
        contentType &&
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
          `Server returned ${response.status} instead of JSON. ${text.slice(
            0,
            100
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create coupon"
        );
      }

      // =====================================================
      // TOASTIFY SUCCESS
      // =====================================================

      toast.success(
        data.message ||
          "Coupon created successfully",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      navigate("/admin/coupons");
    } catch (error) {
      console.error(
        "Error creating coupon:",
        error
      );

      // =====================================================
      // TOASTIFY ERROR
      // =====================================================

      toast.error(
        error.message ||
          "Something went wrong",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="add-coupon-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="add-coupon-header">
        <div>
          <h1>Add Coupon</h1>

          <p>
            Create a new discount coupon
          </p>
        </div>

        <button
          type="button"
          className="back-coupon-btn"
          onClick={() =>
            navigate("/admin/coupons")
          }
        >
          <i className="bi bi-arrow-left"></i>
          Back to Coupons
        </button>
      </div>

      {/* =====================================================
          CARD
      ===================================================== */}

      <div className="add-coupon-card">
        <form onSubmit={handleSubmit}>
          {/* =================================================
              COUPON DETAILS
          ================================================= */}

          <div className="form-section">
            <h2>Coupon Details</h2>

            <div className="form-grid">
              {/* =================================================
                  COUPON CODE
              ================================================= */}

              <div className="form-group">
                <label>
                  Coupon Code{" "}
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="code"
                  placeholder="Example: SAVE20"
                  value={coupon.code}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* =================================================
                  COUPON TYPE
              ================================================= */}

              <div className="form-group">
                <label>
                  Coupon Type{" "}
                  <span>*</span>
                </label>

                <select
                  name="couponType"
                  value={
                    coupon.couponType
                  }
                  onChange={
                    handleCouponTypeChange
                  }
                  required
                >
                  <option value="general">
                    General Coupon
                  </option>

                  <option value="category">
                    Category Coupon
                  </option>

                  <option value="product">
                    Product Coupon
                  </option>
                </select>
              </div>

              {/* =================================================
                  CATEGORY
              ================================================= */}

              {coupon.couponType ===
                "category" && (
                <div className="form-group">
                  <label>
                    Select Category{" "}
                    <span>*</span>
                  </label>

                  <select
                    name="category"
                    value={
                      coupon.category
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="">
                      {loadingCategories
                        ? "Loading categories..."
                        : "Select category"}
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category._id
                          }
                          value={
                            category._id
                          }
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {/* =================================================
                  PRODUCT SEARCH
              ================================================= */}

              {coupon.couponType ===
                "product" && (
                <div className="form-group product-select-group">
                  <label>
                    Select Product{" "}
                    <span>*</span>
                  </label>

                  {/* =================================================
                      SEARCH BOX
                  ================================================= */}

                  {!selectedProduct && (
                    <>
                      <div className="product-search-box">
                        <i className="bi bi-search"></i>

                        <input
                          type="text"
                          placeholder="Search product by name or SKU..."
                          value={
                            productSearch
                          }
                          onChange={(e) => {
                            const value =
                              e.target.value;

                            setProductSearch(
                              value
                            );

                            if (
                              coupon.product
                            ) {
                              setCoupon(
                                (
                                  prev
                                ) => ({
                                  ...prev,
                                  product:
                                    "",
                                })
                              );

                              setSelectedProduct(
                                null
                              );
                            }
                          }}
                        />

                        {productSearch && (
                          <button
                            type="button"
                            className="clear-product-search"
                            onClick={() => {
                              setProductSearch(
                                ""
                              );

                              setProducts(
                                []
                              );
                            }}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>

                      {/* =================================================
                          SEARCH RESULTS
                      ================================================= */}

                      <div className="product-search-results">
                        {loadingProducts ? (
                          <div className="product-loading">
                            <i className="bi bi-arrow-repeat"></i>

                            Searching products...
                          </div>
                        ) : productSearch.trim() ===
                          "" ? (
                          <div className="product-loading">
                            <i className="bi bi-search"></i>

                            Type a product name or SKU to search
                          </div>
                        ) : products.length >
                          0 ? (
                          products.map(
                            (product) => (
                              <button
                                type="button"
                                className="product-result-item"
                                key={
                                  product._id
                                }
                                onClick={() =>
                                  handleProductSelect(
                                    product
                                  )
                                }
                              >
                                {/* PRODUCT IMAGE */}

                                <div className="product-result-image">
                                  {product.images &&
                                  product
                                    .images
                                    .length >
                                    0 ? (
                                    <img
                                      src={
                                        product
                                          .images[0]
                                      }
                                      alt={
                                        product.name ||
                                        "Product"
                                      }
                                    />
                                  ) : (
                                    <div className="product-no-image">
                                      <i className="bi bi-image"></i>
                                    </div>
                                  )}
                                </div>

                                {/* PRODUCT NAME */}

                                <div className="product-result-info">
                                  <strong>
                                    {product.name ||
                                      product.productName ||
                                      product.title ||
                                      "Unnamed Product"}
                                  </strong>

                                  {product.sku && (
                                    <small>
                                      SKU:{" "}
                                      {
                                        product.sku
                                      }
                                    </small>
                                  )}
                                </div>

                                <i className="bi bi-chevron-right"></i>
                              </button>
                            )
                          )
                        ) : (
                          <div className="no-products-found">
                            <i className="bi bi-box"></i>

                            No products found
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* =================================================
                      SELECTED PRODUCT
                  ================================================= */}

                  {selectedProduct && (
                    <div className="selected-product-box">
                      {/* PRODUCT IMAGE */}

                      <div className="selected-product-image">
                        {selectedProduct.images &&
                        selectedProduct
                          .images.length >
                          0 ? (
                          <img
                            src={
                              selectedProduct
                                .images[0]
                            }
                            alt={
                              selectedProduct.name ||
                              "Selected Product"
                            }
                          />
                        ) : (
                          <div className="product-no-image">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                      </div>

                      {/* PRODUCT NAME */}

                      <div className="selected-product-info">
                        <strong>
                          {selectedProduct.name ||
                            selectedProduct.productName ||
                            selectedProduct.title ||
                            "Unnamed Product"}
                        </strong>

                        {selectedProduct.sku && (
                          <small>
                            SKU:{" "}
                            {
                              selectedProduct.sku
                            }
                          </small>
                        )}
                      </div>

                      {/* REMOVE */}

                      <button
                        type="button"
                        className="remove-selected-product"
                        onClick={
                          clearSelectedProduct
                        }
                        aria-label="Remove selected product"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}

                  {/* =================================================
                      HIDDEN PRODUCT FIELD
                  ================================================= */}

                  <input
                    type="hidden"
                    name="product"
                    value={coupon.product}
                    required={
                      coupon.couponType ===
                      "product"
                    }
                  />
                </div>
              )}

              {/* =================================================
                  DISCOUNT TYPE
              ================================================= */}

              <div className="form-group">
                <label>
                  Discount Type{" "}
                  <span>*</span>
                </label>

                <select
                  name="discountType"
                  value={
                    coupon.discountType
                  }
                  onChange={handleChange}
                  required
                >
                  <option value="percentage">
                    Percentage
                  </option>

                  <option value="fixed">
                    Fixed Amount
                  </option>
                </select>
              </div>

              {/* =================================================
                  DISCOUNT VALUE
              ================================================= */}

              <div className="form-group">
                <label>
                  Discount Value{" "}
                  <span>*</span>
                </label>

                <div className="input-with-symbol">
                  <input
                    type="number"
                    name="discountValue"
                    placeholder="Enter discount"
                    min="0.01"
                    step="0.01"
                    value={
                      coupon.discountValue
                    }
                    onChange={handleChange}
                    required
                  />

                  <span>
                    {coupon.discountType ===
                    "percentage"
                      ? "%"
                      : "₹"}
                  </span>
                </div>
              </div>

              {/* =================================================
                  MINIMUM PURCHASE
              ================================================= */}

              <div className="form-group">
                <label>
                  Minimum Purchase{" "}
                  <span>*</span>
                </label>

                <div className="input-with-symbol">
                  <input
                    type="number"
                    name="minimumPurchase"
                    placeholder="Enter minimum purchase"
                    min="1"
                    step="1"
                    value={
                      coupon.minimumPurchase
                    }
                    onChange={handleChange}
                    required
                  />

                  <span>₹</span>
                </div>
              </div>

              {/* =================================================
                  MAXIMUM DISCOUNT
              ================================================= */}

              <div className="form-group">
                <label>
                  Maximum Discount{" "}
                  <span>*</span>
                </label>

                <div className="input-with-symbol">
                  <input
                    type="number"
                    name="maximumDiscount"
                    placeholder="Enter maximum discount"
                    min="0.01"
                    step="0.01"
                    value={
                      coupon.maximumDiscount
                    }
                    onChange={handleChange}
                    required
                  />

                  <span>₹</span>
                </div>
              </div>

              {/* =================================================
                  USAGE LIMIT
              ================================================= */}

              <div className="form-group">
                <label>
                  Usage Limit{" "}
                  <span>*</span>
                </label>

                <input
                  type="number"
                  name="usageLimit"
                  placeholder="Enter usage limit"
                  min="1"
                  step="1"
                  value={
                    coupon.usageLimit
                  }
                  onChange={handleChange}
                  required
                />
              </div>

              {/* =================================================
                  EXPIRY DATE
              ================================================= */}

              <div className="form-group">
                <label>
                  Expiry Date{" "}
                  <span>*</span>
                </label>

                <input
                  type="date"
                  name="expiryDate"
                  value={
                    coupon.expiryDate
                  }
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* =====================================================
              STATUS
          ===================================================== */}

          <div className="coupon-status-section">
            <div>
              <h3>
                Coupon Status
              </h3>

              <p>
                Enable this coupon
                immediately after creation.
              </p>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                name="isActive"
                checked={
                  coupon.isActive
                }
                onChange={handleChange}
              />

              <span className="slider"></span>
            </label>
          </div>

          {/* =====================================================
              ACTIONS
          ===================================================== */}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-coupon-btn"
              onClick={() =>
                navigate(
                  "/admin/coupons"
                )
              }
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-coupon-btn"
              disabled={loading}
            >
              <i className="bi bi-check-lg"></i>

              {loading
                ? "Creating..."
                : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCoupon;