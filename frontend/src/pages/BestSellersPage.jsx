import { useEffect, useState } from "react";

import { Link, useSearchParams, useNavigate } from "react-router-dom";

import axios from "axios";

import toast from "react-hot-toast";

import Navbar from "../components/Navbar";

import Footer from "../components/Footer";

import "./BestSellersPage.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";

function BestSellersPage() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const searchQuery = searchParams.get("search")?.trim() || "";

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [wishlistIds, setWishlistIds] = useState([]);

  const [loadingWishlist, setLoadingWishlist] = useState(true);

  const [updatingWishlist, setUpdatingWishlist] = useState(null);

  const [availability, setAvailability] = useState("all");

  const [priceOrder, setPriceOrder] = useState("default");

  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 8,
    totalProducts: 0,
    totalPages: 0,
  });

  const productsPerPage = 8;

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  // =========================
  // GET EFFECTIVE PRICE
  // =========================

  const getProductPrice = (product) => {
    const salePrice = Number(product.salePrice);

    const regularPrice = Number(product.regularPrice);

    const price = Number(product.price);

    if (!Number.isNaN(salePrice) && salePrice > 0) {
      return salePrice;
    }

    if (!Number.isNaN(regularPrice) && regularPrice > 0) {
      return regularPrice;
    }

    if (!Number.isNaN(price) && price > 0) {
      return price;
    }

    return 0;
  };

  // =========================
  // FETCH BEST SELLERS
  // =========================

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);

        setError("");

        const params = {
          page: currentPage,
          limit: productsPerPage,
        };

        // SEARCH

        if (searchQuery) {
          params.search = searchQuery;
        }

        // AVAILABILITY

        if (availability !== "all") {
          params.availability = availability;
        }

        // SORT

        if (priceOrder === "low-high") {
          params.sort = "price-low";
        } else if (priceOrder === "high-low") {
          params.sort = "price-high";
        } else {
          params.sort = sortBy;
        }

        console.log("BEST SELLERS PARAMS:", params);

        const response = await axios.get(
          `${API_URL}/products/best-sellers`,
          {
            params,
          }
        );

        console.log(
          "BEST SELLERS RESPONSE:",
          response.data
        );

        let fetchedProducts = response.data.products || [];

        // =========================
        // FRONTEND PRICE SORT FALLBACK
        // =========================

        if (priceOrder === "low-high") {
          fetchedProducts = [...fetchedProducts].sort(
            (a, b) => {
              return (
                getProductPrice(a) -
                getProductPrice(b)
              );
            }
          );
        }

        if (priceOrder === "high-low") {
          fetchedProducts = [...fetchedProducts].sort(
            (a, b) => {
              return (
                getProductPrice(b) -
                getProductPrice(a)
              );
            }
          );
        }

        setProducts(fetchedProducts);

        setPagination(
          response.data.pagination || {
            currentPage,
            limit: productsPerPage,
            totalProducts: fetchedProducts.length,
            totalPages: 1,
          }
        );
      } catch (error) {
        console.error(
          "BEST SELLERS ERROR:",
          error.response?.data || error.message
        );

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch best sellers."
        );

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

    fetchBestSellers();
  }, [
    searchQuery,
    availability,
    priceOrder,
    sortBy,
    currentPage,
  ]);

  // =========================
  // FIX PAGE
  // =========================

  useEffect(() => {
    if (
      pagination.totalPages > 0 &&
      currentPage > pagination.totalPages
    ) {
      setCurrentPage(pagination.totalPages);
    }
  }, [pagination.totalPages, currentPage]);

  // =========================
  // FETCH WISHLIST
  // =========================

  useEffect(() => {
    const fetchWishlist = async () => {
      const token = getToken();

      if (!token) {
        setWishlistIds([]);

        setLoadingWishlist(false);

        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/wishlist`,
          getAuthConfig()
        );

        const wishlistProducts =
          response.data.wishlist?.products || [];

        const ids = wishlistProducts.map((item) =>
          String(item._id || item.id || item)
        );

        setWishlistIds(ids);
      } catch (error) {
        console.error(
          "WISHLIST ERROR:",
          error.response?.data || error.message
        );

        setWishlistIds([]);
      } finally {
        setLoadingWishlist(false);
      }
    };

    fetchWishlist();
  }, []);

  // =========================
  // WISHLIST
  // =========================

  const handleWishlist = async (e, product) => {
    e.preventDefault();

    e.stopPropagation();

    const token = getToken();

    // NOT LOGGED IN
    if (!token) {
      toast.error(
        "Please login to add products to your wishlist."
      );

      navigate("/login");

      return;
    }

    const productId = String(
      product._id || product.id
    );

    const isWishlisted =
      wishlistIds.includes(productId);

    try {
      setUpdatingWishlist(productId);

      // =========================
      // REMOVE FROM WISHLIST
      // =========================

      if (isWishlisted) {
        await axios.delete(
          `${API_URL}/wishlist/remove/${productId}`,
          getAuthConfig()
        );

        setWishlistIds((prev) =>
          prev.filter((id) => id !== productId)
        );

        toast.success(
          "Product removed from wishlist!"
        );

        // UPDATE NAVBAR WISHLIST COUNT
        window.dispatchEvent(
          new Event("wishlistUpdated")
        );
      }

      // =========================
      // ADD TO WISHLIST
      // =========================

      else {
        await axios.post(
          `${API_URL}/wishlist/add`,
          {
            productId,
          },
          getAuthConfig()
        );

        setWishlistIds((prev) => [
          ...prev,
          productId,
        ]);

        toast.success(
          "Product added to wishlist!"
        );

        // UPDATE NAVBAR WISHLIST COUNT
        window.dispatchEvent(
          new Event("wishlistUpdated")
        );
      }
    } catch (error) {
      console.error(
        "WISHLIST ERROR:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update wishlist"
      );
    } finally {
      setUpdatingWishlist(null);
    }
  };

  // =========================
  // FILTER HANDLERS
  // =========================

  const handleAvailabilityChange = (value) => {
    setAvailability(value);

    setCurrentPage(1);
  };

  const handlePriceChange = (value) => {
    setPriceOrder(value);

    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);

    setPriceOrder("default");

    setCurrentPage(1);
  };

  // =========================
  // PAGINATION
  // =========================

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <Navbar />

      <main className="best-sellers-page">
        {/* HEADING */}

        <section className="best-sellers-heading">
          <h1>BEST SELLERS</h1>

          {searchQuery && (
            <p className="best-sellers-search-text">
              Search results for:{" "}
              <strong>"{searchQuery}"</strong>
            </p>
          )}
        </section>

        {/* FILTER BAR */}

        <section className="best-sellers-filter-bar">
          <div className="best-sellers-filter-left">
            <span className="best-sellers-filter-title">
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

          <div className="best-sellers-filter-right">
            <div className="best-sellers-sort-by">
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

            <span className="best-sellers-product-count">
              {pagination.totalProducts} PRODUCTS
            </span>
          </div>
        </section>

        {/* LOADING */}

        {loading && (
          <p className="best-sellers-no-products">
            Loading best sellers...
          </p>
        )}

        {/* ERROR */}

        {!loading && error && (
          <p className="best-sellers-no-products">
            Error: {error}
          </p>
        )}

        {/* PRODUCTS */}

        {!loading && !error && (
          <section className="best-sellers-products">
            {products.length > 0 ? (
              products.map((product) => {
                const productId =
                  product._id || product.id;

                const productPrice =
                  getProductPrice(product);

                const productImage =
                  product.images?.[0] ||
                  product.image ||
                  "https://via.placeholder.com/300";

                const isWishlisted =
                  wishlistIds.includes(
                    String(productId)
                  );

                const isUpdating =
                  updatingWishlist ===
                  String(productId);

                return (
                  <Link
                    to={`/product/${productId}`}
                    className="best-sellers-product-card"
                    key={productId}
                  >
                    <div className="best-sellers-product-image">
                      <button
                        type="button"
                        className={`best-sellers-wishlist-btn ${
                          isWishlisted
                            ? "active-wishlist"
                            : ""
                        }`}
                        onClick={(e) =>
                          handleWishlist(
                            e,
                            product
                          )
                        }
                        disabled={
                          loadingWishlist ||
                          isUpdating
                        }
                        aria-label="Add to wishlist"
                      >
                        {isWishlisted
                          ? "♥"
                          : "♡"}
                      </button>

                      <img
                        src={productImage}
                        alt={
                          product.name ||
                          "Product"
                        }
                      />
                    </div>

                    <div className="best-sellers-product-info">
                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        ₹
                        {productPrice.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="best-sellers-no-products">
                No best selling products found.
              </p>
            )}
          </section>
        )}

        {/* PAGINATION */}

        {!loading &&
          !error &&
          pagination.totalPages > 1 && (
            <div className="best-sellers-pagination">
              <button
                onClick={() =>
                  handlePageChange(
                    currentPage - 1
                  )
                }
                disabled={
                  currentPage === 1
                }
              >
                ←
              </button>

              {Array.from(
                {
                  length:
                    pagination.totalPages,
                },
                (_, index) => (
                  <button
                    key={index}
                    className={
                      currentPage ===
                      index + 1
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      handlePageChange(
                        index + 1
                      )
                    }
                  >
                    {index + 1}
                  </button>
                )
              )}

              <button
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
      </main>

      <Footer />
    </>
  );
}

export default BestSellersPage;