import { useEffect, useMemo, useState } from "react";

import { useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";

import Footer from "../components/Footer";

import ProductCard from "../components/ProductCard";

import "./NewArrivalsPage.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";

function NewArrivalsPage() {
  const location = useLocation();

  // ================= ACTIVE FASHION =================

  const [activeFashion, setActiveFashion] = useState(
    location.state?.activeFashion || "MEN'S FASHION"
  );

  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= FILTERS =================

  const [availability, setAvailability] = useState("all");
  const [priceOrder, setPriceOrder] = useState("default");
  const [sortBy, setSortBy] = useState("newest");

  // ================= PAGINATION =================

  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 8;

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: productsPerPage,
    totalProducts: 0,
    totalPages: 0,
  });

  // ================= FETCH CATEGORY TREE =================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/categories/tree`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch categories"
          );
        }

        setCategoryTree(data.categories || []);
      } catch (error) {
        console.error("Category API Error:", error);

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ================= FIND SELECTED CATEGORY =================

  const selectedCategory = useMemo(() => {
    if (!categoryTree.length) {
      return null;
    }

    const isMen = activeFashion === "MEN'S FASHION";

    return categoryTree.find((category) => {
      const slug = String(category.slug || "")
        .toLowerCase()
        .trim();

      const name = String(category.name || "")
        .toLowerCase()
        .trim();

      if (isMen) {
        return (
          slug === "men-s-fashion" ||
          slug === "mens-fashion" ||
          name === "men's fashion" ||
          name === "mens fashion"
        );
      }

      return (
        slug === "womens-fashion" ||
        slug === "women-s-fashion" ||
        slug === "women-fashion" ||
        name === "women's fashion" ||
        name === "womens fashion" ||
        name === "women fashion"
      );
    });
  }, [categoryTree, activeFashion]);

  // ================= GET CHILD CATEGORY IDS =================

  const childCategoryIds = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    return (selectedCategory.children || [])
      .map((category) => category?._id)
      .filter(Boolean)
      .map((id) => String(id));
  }, [selectedCategory]);

  // ================= DEBUG CATEGORY =================

  useEffect(() => {
    if (selectedCategory) {
      console.log(
        `${activeFashion} category:`,
        selectedCategory
      );

      console.log(
        `${activeFashion} child category IDs:`,
        childCategoryIds
      );
    }
  }, [
    selectedCategory,
    childCategoryIds,
    activeFashion,
  ]);

  // ================= FETCH PRODUCTS =================

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    if (childCategoryIds.length === 0) {
      console.warn(
        `${activeFashion} has no child categories.`
      );

      setProducts([]);

      setPagination({
        currentPage: 1,
        limit: productsPerPage,
        totalProducts: 0,
        totalPages: 0,
      });

      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        // ================= PAGINATION =================

        params.append("page", currentPage);
        params.append("limit", productsPerPage);

        // ================= CATEGORY =================

        params.append(
          "category",
          childCategoryIds.join(",")
        );

        // ================= AVAILABILITY =================

        if (availability === "in-stock") {
          params.append("availability", "in-stock");
        }

        if (availability === "out-of-stock") {
          params.append("availability", "out-of-stock");
        }

        // ================= SORTING =================

        if (priceOrder === "low-high") {
          params.append("sort", "price-low");
        } else if (priceOrder === "high-low") {
          params.append("sort", "price-high");
        } else if (sortBy === "featured") {
          params.append("sort", "featured");
        } else {
          params.append("sort", "newest");
        }

        // ================= API REQUEST =================

        const response = await fetch(
          `${API_URL}/products?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch products"
          );
        }

        // ================= PRODUCTS =================

        setProducts(data.products || []);

        // ================= PAGINATION =================

        setPagination(
          data.pagination || {
            currentPage,
            limit: productsPerPage,
            totalProducts: 0,
            totalPages: 0,
          }
        );
      } catch (error) {
        console.error(
          "New Arrivals Product API Error:",
          error
        );

        setError(error.message);

        setProducts([]);

        setPagination({
          currentPage: 1,
          limit: productsPerPage,
          totalProducts: 0,
          totalPages: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    selectedCategory,
    childCategoryIds,
    currentPage,
    availability,
    priceOrder,
    sortBy,
    activeFashion,
  ]);

  // ================= CHANGE PAGE =================

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================= CHANGE FASHION =================

  const handleFashionChange = (fashion) => {
    setActiveFashion(fashion);

    setCurrentPage(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================= AVAILABILITY CHANGE =================

  const handleAvailabilityChange = (value) => {
    setAvailability(value);

    setCurrentPage(1);
  };

  // ================= PRICE CHANGE =================

  const handlePriceChange = (value) => {
    setPriceOrder(value);

    setCurrentPage(1);
  };

  // ================= SORT CHANGE =================

  const handleSortChange = (value) => {
    setSortBy(value);

    // Reset price sorting
    setPriceOrder("default");

    setCurrentPage(1);
  };

  // ================= RESET PAGE WHEN FILTER CHANGES =================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    availability,
    priceOrder,
    sortBy,
    activeFashion,
  ]);

  // ================= PAGE TOP =================

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ================= UI =================

  return (
    <>
      <Navbar />

      <main className="new-arrivals-page">

        {/* ================= HEADING ================= */}

        <section className="new-arrivals-page-heading">
          <h1>New Arrivals</h1>

          <p className="new-arrivals-page-description">
            Step into the latest drops that define the season.
            <br />
            From bold basics to fresh fits — just landed.
          </p>

          {/* ================= FASHION BUTTONS ================= */}

          <div className="fashion-buttons">
            <button
              className={`fashion-btn ${
                activeFashion === "MEN'S FASHION"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleFashionChange("MEN'S FASHION")
              }
            >
              Men's Fashion
            </button>

            <button
              className={`fashion-btn ${
                activeFashion === "WOMEN'S FASHION"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleFashionChange("WOMEN'S FASHION")
              }
            >
              Women's Fashion
            </button>
          </div>
        </section>

        {/* ================= PRODUCTS SECTION ================= */}

        <section className="new-arrivals-page-products">

          {/* ================= FILTER BAR ================= */}

          {!loading && !error && (
            <section className="shop-filter-bar">

              <div className="filter-left">
                <span className="filter-title">
                  FILTER
                </span>

                <select
                  value={availability}
                  onChange={(e) =>
                    handleAvailabilityChange(
                      e.target.value
                    )
                  }
                >
                  <option value="all">
                    AVAILABILITY
                  </option>

                  <option value="in-stock">
                    IN STOCK
                  </option>

                  <option value="out-of-stock">
                    OUT OF STOCK
                  </option>
                </select>

                <select
                  value={priceOrder}
                  onChange={(e) =>
                    handlePriceChange(
                      e.target.value
                    )
                  }
                >
                  <option value="default">
                    PRICE
                  </option>

                  <option value="low-high">
                    LOW TO HIGH
                  </option>

                  <option value="high-low">
                    HIGH TO LOW
                  </option>
                </select>
              </div>

              <div className="filter-right">

                <div className="sort-by">
                  <span>SORT BY:</span>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      handleSortChange(
                        e.target.value
                      )
                    }
                  >
                    <option value="newest">
                      NEWEST
                    </option>

                    <option value="featured">
                      FEATURED
                    </option>
                  </select>
                </div>

                <span className="product-count">
                  {products.length} PRODUCTS
                </span>

              </div>

            </section>
          )}

          {/* ================= SKELETON LOADING ================= */}

          {loading && (
            <div className="new-arrivals-page-grid">
              {Array.from({
                length: productsPerPage,
              }).map((_, index) => (
                <ProductCard
                  key={index}
                  loading={true}
                />
              ))}
            </div>
          )}

          {/* ================= ERROR ================= */}

          {!loading && error && (
            <p className="new-arrivals-page-message">
              Error: {error}
            </p>
          )}

          {/* ================= PRODUCTS ================= */}

          {!loading && !error && (
            <>
              {products.length > 0 ? (
                <>
                  <div className="new-arrivals-page-grid">

                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                      />
                    ))}

                  </div>

                  {/* ================= PAGINATION ================= */}

                  {pagination.totalPages > 1 && (
                    <div className="pagination">

                      <button
                        className="pagination-arrow"
                        onClick={() =>
                          handlePageChange(
                            currentPage - 1
                          )
                        }
                        disabled={currentPage === 1}
                      >
                        ←
                      </button>

                      {Array.from(
                        {
                          length:
                            pagination.totalPages,
                        },
                        (_, index) => index + 1
                      ).map((page) => (
                        <button
                          key={page}
                          className={
                            currentPage === page
                              ? "active-page"
                              : ""
                          }
                          onClick={() =>
                            handlePageChange(page)
                          }
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        className="pagination-arrow"
                        onClick={() =>
                          handlePageChange(
                            currentPage + 1
                          )
                        }
                        disabled={
                          currentPage ===
                          pagination.totalPages
                        }
                      >
                        →
                      </button>

                    </div>
                  )}
                </>
              ) : (
                <p className="new-arrivals-page-message">
                  No products found.
                </p>
              )}
            </>
          )}

        </section>
      </main>

      <Footer />
    </>
  );
}

export default NewArrivalsPage;