import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import "./Products.css";

const API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/products";

const CATEGORY_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/categories";

const PRODUCTS_PER_PAGE = 10;

function Products() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  // Search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] =
    useState(false);

  const searchWrapperRef = useRef(null);

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [bestSeller, setBestSeller] = useState("");
  const [sort, setSort] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  // Product summary
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  // =========================================================
  // AUTH HELPERS
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  };

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // =========================================================
  // CATEGORY HELPERS
  // =========================================================

  const getCategoryId = (cat) => {
    if (!cat) return "";

    if (typeof cat === "string") {
      return cat;
    }

    return cat._id || cat.id || "";
  };

  const getParentId = (cat) => {
    if (!cat || !cat.parent) {
      return null;
    }

    if (typeof cat.parent === "string") {
      return cat.parent;
    }

    return cat.parent._id || cat.parent.id || null;
  };

  const getCategoryName = (product) => {
    if (!product?.category) {
      return "Uncategorized";
    }

    if (typeof product.category === "string") {
      return "Category";
    }

    return product.category.name || "Uncategorized";
  };

  const mainCategories = useMemo(() => {
    return categories.filter((cat) => !getParentId(cat));
  }, [categories]);

  const subcategories = useMemo(() => {
    if (!category) {
      return [];
    }

    return categories.filter(
      (cat) =>
        String(getParentId(cat)) === String(category)
    );
  }, [categories, category]);

  const getDescendantCategoryIds = useCallback(
    (parentId) => {
      const result = [String(parentId)];

      const findChildren = (currentId) => {
        categories.forEach((cat) => {
          const catParentId = getParentId(cat);

          if (
            catParentId &&
            String(catParentId) === String(currentId)
          ) {
            const childId = getCategoryId(cat);

            if (
              childId &&
              !result.includes(String(childId))
            ) {
              result.push(String(childId));
              findChildren(childId);
            }
          }
        });
      };

      findChildren(parentId);

      return result;
    },
    [categories]
  );

  // =========================================================
  // PRODUCT HELPERS
  // =========================================================

  const getProductImage = (product) => {
    if (
      !product?.images ||
      !Array.isArray(product.images)
    ) {
      return null;
    }

    return product.images[0] || null;
  };

  const getEffectivePrice = (product) => {
    const salePrice = Number(product?.salePrice);
    const regularPrice = Number(product?.regularPrice);

    if (salePrice > 0) {
      return salePrice;
    }

    return regularPrice || 0;
  };

  const formatPrice = (price) => {
    return `₹${Number(price || 0).toLocaleString("en-IN")}`;
  };

  const getProductStatus = (product) => {
    if (product?.status === "inactive") {
      return {
        label: "Inactive",
        className: "status-inactive",
      };
    }

    const stock = Number(product?.stock ?? 0);

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

    return {
      label: "Active",
      className: "status-active",
    };
  };

  // =========================================================
  // SEARCH SUGGESTIONS
  // =========================================================

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_URL}/search-suggestions?search=${encodeURIComponent(
            query
          )}`,
          {
            headers: getHeaders(),
          }
        );

        const data = await response.json();

        console.log("SEARCH SUGGESTIONS:", data);

        if (response.ok && data.success) {
          const suggestions = Array.isArray(
            data.suggestions
          )
            ? data.suggestions
            : [];

          setSearchSuggestions(suggestions);

          setShowSearchSuggestions(
            suggestions.length > 0
          );
        } else {
          setSearchSuggestions([]);
          setShowSearchSuggestions(false);
        }
      } catch (error) {
        console.error(
          "Search suggestion error:",
          error
        );

        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // =========================================================
  // CLOSE SEARCH SUGGESTIONS ON OUTSIDE CLICK
  // =========================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target)
      ) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // =========================================================
  // SELECT SEARCH SUGGESTION
  // =========================================================

  const handleSuggestionClick = (product) => {
    setSearch(product.name || "");
    setShowSearchSuggestions(false);
    setSearchSuggestions([]);
    setCurrentPage(1);
  };

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(
        CATEGORY_API_URL,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to fetch categories"
        );
      }

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
  }, []);

  // =========================================================
  // FETCH PRODUCT SUMMARY
  // =========================================================

  const fetchSummary = useCallback(async () => {
    try {
      const headers = getHeaders();

      const [
        totalResponse,
        activeResponse,
        lowStockResponse,
        outOfStockResponse,
      ] = await Promise.all([
        fetch(`${API_URL}?limit=1`, {
          headers,
        }),

        fetch(`${API_URL}/active`, {
          headers,
        }),

        fetch(
          `${API_URL}?availability=low-stock&limit=1`,
          {
            headers,
          }
        ),

        fetch(
          `${API_URL}?availability=out-of-stock&limit=1`,
          {
            headers,
          }
        ),
      ]);

      const [
        totalData,
        activeData,
        lowStockData,
        outOfStockData,
      ] = await Promise.all([
        totalResponse.json(),
        activeResponse.json(),
        lowStockResponse.json(),
        outOfStockResponse.json(),
      ]);

      setSummary({
        total:
          Number(
            totalData?.pagination
              ?.totalProducts
          ) || 0,

        active: Array.isArray(
          activeData?.products
        )
          ? activeData.products.length
          : Array.isArray(activeData)
          ? activeData.length
          : 0,

        lowStock:
          Number(
            lowStockData?.pagination
              ?.totalProducts
          ) || 0,

        outOfStock:
          Number(
            outOfStockData?.pagination
              ?.totalProducts
          ) || 0,
      });
    } catch (error) {
      console.error(
        "Product summary error:",
        error
      );
    }
  }, []);

  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  const fetchProducts = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(currentPage)
        );

        params.set(
          "limit",
          String(PRODUCTS_PER_PAGE)
        );

        // ---------------------------------------------------
        // SEARCH
        // ---------------------------------------------------

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        // ---------------------------------------------------
        // CATEGORY
        // ---------------------------------------------------

        if (subcategory) {
          params.set(
            "category",
            subcategory
          );
        } else if (category) {
          const categoryIds =
            getDescendantCategoryIds(
              category
            );

          if (categoryIds.length > 0) {
            params.set(
              "category",
              categoryIds.join(",")
            );
          }
        }

        // ---------------------------------------------------
        // AVAILABILITY
        // ---------------------------------------------------

        if (availability) {
          /*
            /api/products supports:

            in-stock
            low-stock
            out-of-stock

            /api/products/best-sellers supports:

            in-stock
            out-of-stock

            Therefore low-stock is not sent when
            Best Sellers is selected.
          */

          if (
            !(
              bestSeller ===
                "best-seller" &&
              availability ===
                "low-stock"
            )
          ) {
            params.set(
              "availability",
              availability
            );
          }
        }

        // ---------------------------------------------------
        // SORT
        // ---------------------------------------------------

        if (sort) {
          params.set("sort", sort);
        }

        // ---------------------------------------------------
        // ENDPOINT
        // ---------------------------------------------------

        let endpoint = API_URL;

        if (
          bestSeller ===
          "best-seller"
        ) {
          endpoint = `${API_URL}/best-sellers`;
        }

        const response = await fetch(
          `${endpoint}?${params.toString()}`,
          {
            headers: getHeaders(),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to fetch products"
          );
        }

        const productList =
          Array.isArray(data?.products)
            ? data.products
            : [];

        setProducts(productList);

        setTotalProducts(
          Number(
            data?.pagination
              ?.totalProducts
          ) || 0
        );

        setTotalPages(
          Math.max(
            Number(
              data?.pagination
                ?.totalPages
            ) || 1,
            1
          )
        );
      } catch (error) {
        console.error(
          "Product fetch error:",
          error
        );

        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);

        setError(
          error.message ||
            "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      search,
      category,
      subcategory,
      availability,
      bestSeller,
      sort,
      getDescendantCategoryIds,
    ]
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchCategories();
    fetchSummary();
  }, [
    fetchCategories,
    fetchSummary,
  ]);

  // =========================================================
  // PRODUCT LOAD
  // =========================================================

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // =========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    category,
    subcategory,
    availability,
    bestSeller,
    sort,
  ]);

  // =========================================================
  // CATEGORY CHANGE
  // =========================================================

  const handleCategoryChange = (value) => {
    setCategory(value);
    setSubcategory("");
    setCurrentPage(1);
  };

  const handleSubcategoryChange = (value) => {
    setSubcategory(value);
    setCurrentPage(1);
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDelete = async (productId) => {
    toast(
      ({ closeToast }) => (
        <div className="delete-confirm-toast">
          <div className="delete-confirm-message">
            <strong>
              Delete Product?
            </strong>

            <span>
              Are you sure you want to
              delete this product?
            </span>
          </div>

          <div className="delete-confirm-actions">
            <button
              type="button"
              className="delete-cancel-btn"
              onClick={closeToast}
            >
              Cancel
            </button>

            <button
              type="button"
              className="delete-confirm-btn"
              onClick={async () => {
                closeToast();

                try {
                  setDeletingId(productId);

                  const response =
                    await fetch(
                      `${API_URL}/${productId}`,
                      {
                        method: "DELETE",
                        headers:
                          getHeaders(),
                      }
                    );

                  const data =
                    await response.json();

                  if (!response.ok) {
                    throw new Error(
                      data?.message ||
                        "Failed to delete product"
                    );
                  }

                  await Promise.all([
                    fetchProducts(),
                    fetchSummary(),
                  ]);

                  toast.success(
                    "Product deleted successfully!",
                    {
                      className:
                        "rizo-admin-toast",
                      hideProgressBar: true,
                    }
                  );
                } catch (error) {
                  console.error(
                    "Delete product error:",
                    error
                  );

                  toast.error(
                    error.message ||
                      "Failed to delete product.",
                    {
                      className:
                        "rizo-admin-toast",
                      hideProgressBar: true,
                    }
                  );
                } finally {
                  setDeletingId(null);
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        className:
          "rizo-admin-toast delete-confirm-toast-wrapper",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
      }
    );
  };

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const handleResetFilters = () => {
    setSearch("");
    setSearchSuggestions([]);
    setShowSearchSuggestions(false);

    setCategory("");
    setSubcategory("");
    setAvailability("");
    setBestSeller("");
    setSort("");
    setCurrentPage(1);
  };

  const hasFilters =
    search ||
    category ||
    subcategory ||
    availability ||
    bestSeller ||
    sort;

  // =========================================================
  // PAGINATION
  // =========================================================

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const paginationItems = useMemo(() => {
    const pages = [];

    if (totalPages <= 7) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 4) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      currentPage - 1
    );

    const end = Math.min(
      totalPages - 1,
      currentPage + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    if (
      currentPage <
      totalPages - 3
    ) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }, [
    currentPage,
    totalPages,
  ]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="products-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="products-header">
        <div>
          <h1>Products</h1>

          <p>
            Manage your products, stock
            and product availability.
          </p>
        </div>

        <button
          type="button"
          className="add-product-btn"
          onClick={() =>
            navigate(
              "/admin/products/add"
            )
          }
        >
          <i className="bi bi-plus-lg"></i>
          Add Product
        </button>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="product-summary-grid">

        {/* TOTAL */}

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-products">
            <i className="bi bi-box-seam"></i>
          </div>

          <div className="summary-content">
            <span>
              Total Products
            </span>

            <strong>
              {summary.total}
            </strong>
          </div>
        </div>

        {/* ACTIVE */}

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-active">
            <i className="bi bi-check-circle"></i>
          </div>

          <div className="summary-content">
            <span>
              Active Products
            </span>

            <strong>
              {summary.active}
            </strong>
          </div>
        </div>

        {/* LOW STOCK */}

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-low">
            <i className="bi bi-exclamation-triangle"></i>
          </div>

          <div className="summary-content">
            <span>
              Low Stock
            </span>

            <strong>
              {summary.lowStock}
            </strong>
          </div>
        </div>

        {/* OUT OF STOCK */}

        <div className="product-summary-card">
          <div className="summary-icon summary-icon-out">
            <i className="bi bi-x-circle"></i>
          </div>

          <div className="summary-content">
            <span>
              Out of Stock
            </span>

            <strong>
              {summary.outOfStock}
            </strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div className="products-filter-card">

        {/* SEARCH */}

        <div
          className="filter-search"
          ref={searchWrapperRef}
        >
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search products, SKU..."
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );
            }}
            onFocus={() => {
              if (
                searchSuggestions.length >
                0
              ) {
                setShowSearchSuggestions(
                  true
                );
              }
            }}
          />

          {/* SEARCH SUGGESTIONS */}

          {showSearchSuggestions &&
            searchSuggestions.length >
              0 && (
              <div className="search-suggestions-dropdown">
                {searchSuggestions.map(
                  (product) => (
                    <button
                      type="button"
                      key={product._id}
                      className="search-suggestion-item"
                      onClick={() =>
                        handleSuggestionClick(
                          product
                        )
                      }
                    >
                      <span className="suggestion-product-name">
                        {product.name}
                      </span>

                      <span className="suggestion-product-sku">
                        SKU:{" "}
                        {product.sku ||
                          "N/A"}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
        </div>

        {/* CATEGORY */}

        <div className="filter-control">
          <select
            value={category}
            onChange={(event) =>
              handleCategoryChange(
                event.target.value
              )
            }
          >
            <option value="">
              All Categories
            </option>

            {mainCategories.map(
              (cat) => {
                const id =
                  getCategoryId(
                    cat
                  );

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {cat.name}
                  </option>
                );
              }
            )}
          </select>
        </div>

        {/* SUBCATEGORY */}

        <div className="filter-control">
          <select
            value={subcategory}
            onChange={(event) =>
              handleSubcategoryChange(
                event.target.value
              )
            }
            disabled={
              !category ||
              subcategories.length ===
                0
            }
          >
            <option value="">
              All Subcategories
            </option>

            {subcategories.map(
              (cat) => {
                const id =
                  getCategoryId(
                    cat
                  );

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {cat.name}
                  </option>
                );
              }
            )}
          </select>
        </div>

        {/* AVAILABILITY */}

        <div className="filter-control">
          <select
            value={availability}
            onChange={(event) =>
              setAvailability(
                event.target.value
              )
            }
          >
            <option value="">
              Availability
            </option>

            <option value="in-stock">
              In Stock
            </option>

            <option value="low-stock">
              Low Stock
            </option>

            <option value="out-of-stock">
              Out of Stock
            </option>
          </select>
        </div>

        {/* PRODUCT TYPE */}

        <div className="filter-control">
          <select
            value={bestSeller}
            onChange={(event) =>
              setBestSeller(
                event.target.value
              )
            }
          >
            <option value="">
              Product Type
            </option>

            <option value="best-seller">
              Best Sellers
            </option>
          </select>
        </div>

        {/* SORT */}

        <div className="filter-control">
          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value
              )
            }
          >
            <option value="">
              Sort By
            </option>

            <option value="newest">
              Newest
            </option>

            <option value="price-low">
              Price: Low to High
            </option>

            <option value="price-high">
              Price: High to Low
            </option>
          </select>
        </div>

        {/* CLEAR */}

        {hasFilters && (
          <button
            type="button"
            className="clear-filter-btn"
            onClick={
              handleResetFilters
            }
            title="Clear filters"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Clear
          </button>
        )}
      </div>

      {/* =====================================================
          RESULT BAR
      ===================================================== */}

      <div className="products-result-bar">
        <div>
          <strong>
            {totalProducts}
          </strong>{" "}
          product
          {totalProducts !== 1
            ? "s"
            : ""}{" "}
          found
        </div>

        {bestSeller ===
          "best-seller" && (
          <span className="active-filter-label">
            <i className="bi bi-star-fill"></i>
            Best Sellers
          </span>
        )}
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="products-error">
          <i className="bi bi-exclamation-circle"></i>

          <span>{error}</span>

          <button
            type="button"
            onClick={
              fetchProducts
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          PRODUCTS TABLE
      ===================================================== */}

      <div className="products-table-card">

        {loading ? (
          <div className="products-loading">
            <div className="products-spinner"></div>

            <span>
              Loading products...
            </span>
          </div>
        ) : products.length ===
          0 ? (
          <div className="products-empty">

            <div className="empty-icon">
              <i className="bi bi-box"></i>
            </div>

            <h3>
              No products found
            </h3>

            <p>
              Try changing your
              filters or search term.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={
                  handleResetFilters
                }
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="products-table-wrapper">
            <table className="products-table">

              <thead>
                <tr>
                  <th>
                    Product
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Price
                  </th>

                  <th>
                    Stock
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Best Seller
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map(
                  (product) => {
                    const productId =
                      product?._id;

                    const image =
                      getProductImage(
                        product
                      );

                    const price =
                      getEffectivePrice(
                        product
                      );

                    const status =
                      getProductStatus(
                        product
                      );

                    return (
                      <tr
                        key={
                          productId
                        }
                      >

                        {/* PRODUCT */}

                        <td>
                          <div className="product-info">

                            <div className="product-image">
                              {image ? (
                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    product.name ||
                                    "Product"
                                  }
                                  onError={(
                                    event
                                  ) => {
                                    event.currentTarget.style.display =
                                      "none";

                                    event.currentTarget.parentElement.classList.add(
                                      "image-fallback"
                                    );
                                  }}
                                />
                              ) : (
                                <div className="image-placeholder">
                                  <i className="bi bi-image"></i>
                                </div>
                              )}
                            </div>

                            <div className="product-details">
                              <strong>
                                {product.name ||
                                  "Unnamed Product"}
                              </strong>

                              <span>
                                SKU:{" "}
                                {product.sku ||
                                  "N/A"}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* CATEGORY */}

                        <td>
                          <span className="category-name">
                            {getCategoryName(
                              product
                            )}
                          </span>
                        </td>

                        {/* PRICE */}

                        <td>
                          <div className="price-cell">

                            <strong>
                              {formatPrice(
                                price
                              )}
                            </strong>

                            {Number(
                              product?.salePrice
                            ) >
                              0 &&
                              Number(
                                product.salePrice
                              ) <
                                Number(
                                  product.regularPrice
                                ) && (
                                <span className="regular-price">
                                  {formatPrice(
                                    product.regularPrice
                                  )}
                                </span>
                              )}

                          </div>
                        </td>

                        {/* STOCK */}

                        <td>
                          <span
                            className={`stock-value ${
                              Number(
                                product.stock ??
                                  0
                              ) === 0
                                ? "stock-zero"
                                : Number(
                                    product.stock
                                  ) <= 10
                                ? "stock-low"
                                : "stock-good"
                            }`}
                          >
                            {Number(
                              product.stock ??
                                0
                            )}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`product-status ${status.className}`}
                          >
                            <span className="status-dot"></span>

                            {
                              status.label
                            }
                          </span>
                        </td>

                        {/* BEST SELLER */}

                        <td>
                          {product.isBestSeller ? (
                            <span className="best-seller-badge">
                              <i className="bi bi-star-fill"></i>
                              BEST SELLER
                            </span>
                          ) : (
                            <span className="regular-badge">
                              Regular
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="product-actions">

                            {/* VIEW */}

                            <button
                              type="button"
                              className="action-btn view-btn"
                              title="View"
                              onClick={() =>
                                navigate(
                                  `/admin/products/view/${productId}`
                                )
                              }
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              className="action-btn edit-btn"
                              title="Edit"
                              onClick={() =>
                                navigate(
                                  `/admin/products/edit/${productId}`
                                )
                              }
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              className="action-btn delete-btn"
                              title="Delete"
                              disabled={
                                deletingId ===
                                productId
                              }
                              onClick={() =>
                                handleDelete(
                                  productId
                                )
                              }
                            >
                              {deletingId ===
                              productId ? (
                                <i className="bi bi-hourglass-split"></i>
                              ) : (
                                <i className="bi bi-trash3"></i>
                              )}
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {!loading &&
        products.length > 0 &&
        totalPages > 1 && (
          <div className="products-pagination">

            {/* PREVIOUS */}

            <button
              type="button"
              className="pagination-arrow"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                goToPage(
                  currentPage - 1
                )
              }
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            {/* PAGE NUMBERS */}

            <div className="pagination-pages">
              {paginationItems.map(
                (
                  page,
                  index
                ) =>
                  page === "..." ? (
                    <span
                      key={`dots-${index}`}
                      className="pagination-dots"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      className={
                        page ===
                        currentPage
                          ? "pagination-page active"
                          : "pagination-page"
                      }
                      onClick={() =>
                        goToPage(
                          page
                        )
                      }
                    >
                      {page}
                    </button>
                  )
              )}
            </div>

            {/* NEXT */}

            <button
              type="button"
              className="pagination-arrow"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                goToPage(
                  currentPage + 1
                )
              }
            >
              <i className="bi bi-chevron-right"></i>
            </button>

          </div>
        )}
    </div>
  );
}

export default Products;