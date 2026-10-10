import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddCoupon.css";

const COUPON_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/coupons";

const CATEGORY_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/categories";

const PRODUCT_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/products";

function EditCoupon() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [coupon, setCoupon] = useState({
    code: "",
    couponType: "cart",
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
  const [productSearch, setProductSearch] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
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
          : data.categories ||
            data.data ||
            [];

        setCategories(categoryList);
      } catch (error) {
        console.error(
          "Category fetch error:",
          error
        );
      }
    };

    fetchCategories();
  }, []);

  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${PRODUCT_API_URL}?limit=10`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch products"
          );
        }

        const data =
          await response.json();

        const productList = Array.isArray(
          data
        )
          ? data
          : data.products ||
            data.data ||
            [];

        setProducts(productList);
      } catch (error) {
        console.error(
          "Product fetch error:",
          error
        );
      }
    };

    fetchProducts();
  }, []);

  // =========================================================
  // FETCH SINGLE COUPON
  // =========================================================

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        setLoading(true);

        // Backend currently provides coupon list endpoint,
        // so we fetch coupons and find the required coupon by ID.

        const response = await fetch(
          `${COUPON_API_URL}/all`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch coupons"
          );
        }

        const data =
          await response.json();

        const couponList = Array.isArray(
          data
        )
          ? data
          : data.coupons ||
            data.data ||
            [];

        const foundCoupon =
          couponList.find(
            (item) =>
              String(item._id) ===
              String(id)
          );

        if (!foundCoupon) {
          throw new Error(
            "Coupon not found"
          );
        }

        // -----------------------------------------------------
        // CATEGORY ID
        // -----------------------------------------------------

        const categoryId =
          foundCoupon.category &&
          typeof foundCoupon.category ===
            "object"
            ? foundCoupon.category._id
            : foundCoupon.category;

        // -----------------------------------------------------
        // PRODUCT ID
        // -----------------------------------------------------

        const productId =
          foundCoupon.product &&
          typeof foundCoupon.product ===
            "object"
            ? foundCoupon.product._id
            : foundCoupon.product;

        // -----------------------------------------------------
        // COUPON TYPE
        // -----------------------------------------------------

        const couponType =
          foundCoupon.couponType ||
          "cart";

        // -----------------------------------------------------
        // EXPIRY DATE
        // -----------------------------------------------------

        const formattedExpiry =
          foundCoupon.expiry
            ? String(
                foundCoupon.expiry
              ).split("T")[0]
            : "";

        // -----------------------------------------------------
        // SET FORM DATA
        // -----------------------------------------------------

        setCoupon({
          code: foundCoupon.code || "",

          couponType: couponType,

          category:
            couponType === "category"
              ? categoryId || ""
              : "",

          product:
            couponType === "product"
              ? productId || ""
              : "",

          discountType:
            foundCoupon.discountType ||
            "percentage",

          discountValue:
            foundCoupon.discountValue ??
            "",

          minimumPurchase:
            foundCoupon.minimumPurchase ??
            "",

          maximumDiscount:
            foundCoupon.maxDiscount ??
            "",

          usageLimit:
            foundCoupon.usageLimit ??
            "",

          expiryDate:
            formattedExpiry,

          isActive:
            foundCoupon.isActive !==
            undefined
              ? Boolean(
                  foundCoupon.isActive
                )
              : true,
        });

        // -----------------------------------------------------
        // SET PRODUCT SEARCH NAME
        // -----------------------------------------------------

        if (
          couponType === "product" &&
          foundCoupon.product &&
          typeof foundCoupon.product ===
            "object" &&
          foundCoupon.product.name
        ) {
          setProductSearch(
            foundCoupon.product.name
          );
        }
      } catch (error) {
        console.error(
          "Fetch coupon error:",
          error
        );

        toast.error(
          error.message ||
            "Failed to load coupon",
          {
            className:
              "rizo-admin-toast",
            hideProgressBar: true,
          }
        );

        navigate("/admin/coupons");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCoupon();
    } else {
      setLoading(false);
    }
  }, [id, navigate]);

  // =========================================================
  // SET PRODUCT SEARCH AFTER PRODUCTS LOAD
  // =========================================================

  useEffect(() => {
    if (
      coupon.couponType ===
        "product" &&
      coupon.product &&
      !productSearch
    ) {
      const selectedProduct =
        products.find(
          (product) =>
            String(product._id) ===
            String(coupon.product)
        );

      if (selectedProduct) {
        setProductSearch(
          selectedProduct.name || ""
        );
      }
    }
  }, [
    products,
    coupon.product,
    coupon.couponType,
    productSearch,
  ]);

  // =========================================================
  // HANDLE INPUT
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
  // CHANGE COUPON TYPE
  // =========================================================

  const handleCouponTypeChange = (
    e
  ) => {
    const newType = e.target.value;

    setCoupon((prev) => ({
      ...prev,
      couponType: newType,

      category:
        newType === "category"
          ? prev.category
          : "",

      product:
        newType === "product"
          ? prev.product
          : "",
    }));

    if (newType !== "product") {
      setProductSearch("");
    }
  };

  // =========================================================
  // PRODUCT SEARCH
  // =========================================================

  const filteredProducts =
    products.filter((product) => {
      const searchValue =
        productSearch
          .trim()
          .toLowerCase();

      if (!searchValue) {
        return true;
      }

      return (
        product.name
          ?.toLowerCase()
          .includes(searchValue) ||
        product.sku
          ?.toLowerCase()
          .includes(searchValue)
      );
    });

  // =========================================================
  // SELECTED PRODUCT
  // =========================================================

  const selectedProduct =
    products.find(
      (product) =>
        String(product._id) ===
        String(coupon.product)
    );

  // =========================================================
  // PRODUCT IMAGE HELPER
  // =========================================================

  const getProductImage = (
    product
  ) => {
    if (
      product?.images &&
      product.images.length > 0
    ) {
      return product.images[0];
    }

    return null;
  };

  // =========================================================
  // SELECT PRODUCT
  // =========================================================

  const handleProductSelect = (
    product
  ) => {
    setCoupon((prev) => ({
      ...prev,
      product: product._id,
    }));

    setProductSearch(
      product.name || ""
    );
  };

  // =========================================================
  // REMOVE SELECTED PRODUCT
  // =========================================================

  const handleRemoveProduct = () => {
    setCoupon((prev) => ({
      ...prev,
      product: "",
    }));

    setProductSearch("");
  };

  // =========================================================
  // UPDATE COUPON
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
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      return;
    }

    // -------------------------------------------------------
    // CATEGORY
    // -------------------------------------------------------

    if (
      coupon.couponType ===
        "category" &&
      !coupon.category
    ) {
      toast.error(
        "Please select a category",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      return;
    }

    // -------------------------------------------------------
    // PRODUCT
    // -------------------------------------------------------

    if (
      coupon.couponType ===
        "product" &&
      !coupon.product
    ) {
      toast.error(
        "Please select a product",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      return;
    }

    // -------------------------------------------------------
    // DISCOUNT VALUE
    // -------------------------------------------------------

    if (
      coupon.discountValue ===
        "" ||
      Number(coupon.discountValue) <=
        0
    ) {
      toast.error(
        "Please enter a valid discount value",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      return;
    }

    // -------------------------------------------------------
    // PERCENTAGE
    // -------------------------------------------------------

    if (
      coupon.discountType ===
        "percentage" &&
      Number(coupon.discountValue) >
        100
    ) {
      toast.error(
        "Percentage discount cannot be more than 100%",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      return;
    }

    // -------------------------------------------------------
    // MINIMUM PURCHASE
    // -------------------------------------------------------

    if (
      coupon.minimumPurchase ===
        "" ||
      Number(coupon.minimumPurchase) <
        1
    ) {
      toast.error(
        "Minimum purchase must be at least ₹1",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      return;
    }

    // -------------------------------------------------------
    // MAXIMUM DISCOUNT
    // -------------------------------------------------------

    if (
      coupon.maximumDiscount ===
        "" ||
      Number(coupon.maximumDiscount) <=
        0
    ) {
      toast.error(
        "Maximum discount must be greater than 0",
        {
          className:
            "rizo-admin-toast",
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
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      return;
    }

    // -------------------------------------------------------
    // EXPIRY
    // -------------------------------------------------------

    if (!coupon.expiryDate) {
      toast.error(
        "Please select expiry date",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      return;
    }

    // =======================================================
    // UPDATE
    // =======================================================

    try {
      setSaving(true);

      const requestBody = {
        code: coupon.code
          .trim()
          .toUpperCase(),

        couponType:
          coupon.couponType,

        category:
          coupon.couponType ===
          "category"
            ? coupon.category
            : null,

        product:
          coupon.couponType ===
          "product"
            ? coupon.product
            : null,

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

        expiry:
          coupon.expiryDate,

        isActive: Boolean(
          coupon.isActive
        ),
      };

      console.log(
        "UPDATE COUPON DATA:",
        requestBody
      );

      // =====================================================
      // PUT REQUEST
      // =====================================================

      const response = await fetch(
        `${COUPON_API_URL}/${id}`,
        {
          method: "PUT",

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
      // RESPONSE
      // =====================================================

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data = null;

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
          `Server returned ${response.status}: ${text.slice(
            0,
            200
          )}`
        );
      }

      // =====================================================
      // CHECK RESPONSE
      // =====================================================

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update coupon"
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      toast.success(
        data?.message ||
          "Coupon updated successfully",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
        }
      );

      navigate("/admin/coupons");
    } catch (error) {
      console.error(
        "UPDATE COUPON ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Failed to update coupon",
        {
          className:
            "rizo-admin-toast",
          hideProgressBar: true,
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
      <div className="add-coupon-page">
        <div className="add-coupon-card">
          <div
            style={{
              minHeight: "250px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#777",
              fontSize: "13px",
            }}
          >
            Loading coupon...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="add-coupon-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="add-coupon-header">
        <div>
          <h1>Edit Coupon</h1>

          <p>
            Update coupon details
          </p>
        </div>

        <button
          type="button"
          className="back-coupon-btn"
          onClick={() =>
            navigate(
              "/admin/coupons"
            )
          }
          disabled={saving}
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
            <h2>
              Coupon Details
            </h2>

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
                  <option value="cart">
                    Cart Coupon
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
                      Select category
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
                  PRODUCT
              ================================================= */}

              {coupon.couponType ===
                "product" && (
                <div className="form-group product-select-group">
                  <label>
                    Select Product{" "}
                    <span>*</span>
                  </label>

                  {/* SEARCH BOX */}

                  <div className="product-search-box">
                    <i className="bi bi-search"></i>

                    <input
                      type="text"
                      placeholder="Search product by name or SKU..."
                      value={
                        productSearch
                      }
                      onChange={(e) => {
                        setProductSearch(
                          e.target.value
                        );

                        setCoupon(
                          (prev) => ({
                            ...prev,
                            product:
                              "",
                          })
                        );
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

                          setCoupon(
                            (prev) => ({
                              ...prev,
                              product:
                                "",
                            })
                          );
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>

                  {/* PRODUCT RESULTS */}

                  {!coupon.product && (
                    <div className="product-search-results">
                      {productSearch.trim() ===
                      "" ? (
                        <div className="product-loading">
                          Type a product name or SKU
                          to search
                        </div>
                      ) : filteredProducts.length >
                        0 ? (
                        filteredProducts
                          .slice(0, 8)
                          .map(
                            (product) => {
                              const image =
                                getProductImage(
                                  product
                                );

                              return (
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
                                    {image ? (
                                      <img
                                        src={
                                          image
                                        }
                                        alt={
                                          product.name
                                        }
                                      />
                                    ) : (
                                      <div className="product-no-image">
                                        <i className="bi bi-image"></i>
                                      </div>
                                    )}
                                  </div>

                                  {/* PRODUCT DETAILS */}

                                  <div className="product-result-info">
                                    <strong>
                                      {
                                        product.name
                                      }
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

                                  <i className="bi bi-chevron-right product-result-arrow"></i>
                                </button>
                              );
                            }
                          )
                      ) : (
                        <div className="no-products-found">
                          No products found
                        </div>
                      )}
                    </div>
                  )}

                  {/* SELECTED PRODUCT */}

                  {coupon.product &&
                    selectedProduct && (
                      <div className="selected-product-box">
                        <div className="selected-product-content">
                          {/* SELECTED IMAGE */}

                          <div className="selected-product-image">
                            {getProductImage(
                              selectedProduct
                            ) ? (
                              <img
                                src={getProductImage(
                                  selectedProduct
                                )}
                                alt={
                                  selectedProduct.name
                                }
                              />
                            ) : (
                              <div className="product-no-image">
                                <i className="bi bi-image"></i>
                              </div>
                            )}
                          </div>

                          {/* SELECTED NAME */}

                          <div className="selected-product-info">
                            <strong>
                              {
                                selectedProduct.name
                              }
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
                        </div>

                        {/* REMOVE */}

                        <button
                          type="button"
                          className="remove-selected-product"
                          onClick={
                            handleRemoveProduct
                          }
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    )}
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
                  EXPIRY
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
                immediately.
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
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-coupon-btn"
              disabled={saving}
            >
              <i className="bi bi-check-lg"></i>

              {saving
                ? "Updating..."
                : "Update Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCoupon;