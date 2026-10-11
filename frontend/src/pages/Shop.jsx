import { useEffect, useState } from "react";

import {
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import toast from "react-hot-toast";

import Navbar from "../components/Navbar";

import Footer from "../components/Footer";

import "./Shop.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";

function Shop() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const searchQuery =
    searchParams.get("search")?.trim() || "";

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // WISHLIST
  // =========================

  const [wishlistIds, setWishlistIds] = useState([]);

  const [loadingWishlist, setLoadingWishlist] =
    useState(true);

  const [updatingWishlist, setUpdatingWishlist] =
    useState(null);

  // =========================
  // FILTERS
  // =========================

  const [availability, setAvailability] =
    useState("all");

  const [priceOrder, setPriceOrder] =
    useState("default");

  const [sortBy, setSortBy] =
    useState("newest");

  // =========================
  // PAGINATION
  // =========================

  const [currentPage, setCurrentPage] =
    useState(1);

  const productsPerPage = 8;

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: productsPerPage,
    totalProducts: 0,
    totalPages: 0,
  });

  // =========================
  // AUTH HELPERS
  // =========================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  // =========================
  // FETCH PRODUCTS
  // =========================

  useEffect(() => {
    const fetchProducts = async () => {
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

        // SORTING

        if (priceOrder === "low-high") {
          params.sort = "price-low";
        } else if (priceOrder === "high-low") {
          params.sort = "price-high";
        } else {
          params.sort = sortBy;
        }

        console.log(
          "SHOP API PARAMS:",
          params
        );

        const response = await axios.get(
          `${API_URL}/products`,
          {
            params,
          }
        );

        console.log(
          "SHOP API RESPONSE:",
          response.data
        );

        setProducts(
          response.data.products || []
        );

        setPagination(
          response.data.pagination || {
            currentPage: currentPage,
            limit: productsPerPage,
            totalProducts: 0,
            totalPages: 0,
          }
        );
      } catch (error) {
        console.error(
          "SHOP PRODUCT API ERROR:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch products"
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

    fetchProducts();
  }, [
    searchQuery,
    availability,
    priceOrder,
    sortBy,
    currentPage,
  ]);

  // =========================
  // FIX PAGE IF TOTAL PAGES CHANGE
  // =========================

  useEffect(() => {
    if (
      pagination.totalPages > 0 &&
      currentPage > pagination.totalPages
    ) {
      setCurrentPage(
        pagination.totalPages
      );
    }
  }, [
    pagination.totalPages,
    currentPage,
  ]);

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
        console.log(
          "FETCHING SHOP WISHLIST..."
        );

        const response = await axios.get(
          `${API_URL}/wishlist`,
          getAuthConfig()
        );

        console.log(
          "SHOP WISHLIST RESPONSE:",
          response.data
        );

        const wishlistProducts =
          response.data.wishlist?.products ||
          [];

        const ids = wishlistProducts.map(
          (item) =>
            String(
              item._id ||
                item.id ||
                item
            )
        );

        setWishlistIds(ids);
      } catch (error) {
        console.error(
          "SHOP FETCH WISHLIST ERROR:",
          error.response?.data ||
            error.message
        );

        setWishlistIds([]);
      } finally {
        setLoadingWishlist(false);
      }
    };

    fetchWishlist();
  }, []);

  // =========================
  // WISHLIST HANDLER
  // =========================

  const handleWishlist = async (
    e,
    product
  ) => {
    e.preventDefault();

    e.stopPropagation();

    const token = getToken();

    // =========================
    // LOGIN CHECK
    // =========================

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
        console.log(
          "REMOVING FROM WISHLIST:",
          productId
        );

        const response =
          await axios.delete(
            `${API_URL}/wishlist/remove/${productId}`,
            getAuthConfig()
          );

        console.log(
          "REMOVE WISHLIST RESPONSE:",
          response.data
        );

        setWishlistIds((prev) =>
          prev.filter(
            (id) => id !== productId
          )
        );

        // TOAST

        toast.success(
          "Product removed from wishlist!"
        );

        // Update navbar wishlist count

        window.dispatchEvent(
          new Event("wishlistUpdated")
        );
      }

      // =========================
      // ADD TO WISHLIST
      // =========================

      else {
        console.log(
          "ADDING TO WISHLIST:",
          productId
        );

        const response =
          await axios.post(
            `${API_URL}/wishlist/add`,
            {
              productId: productId,
            },
            getAuthConfig()
          );

        console.log(
          "ADD WISHLIST RESPONSE:",
          response.data
        );

        setWishlistIds((prev) => [
          ...prev,
          productId,
        ]);

        // TOAST

        toast.success(
          "Product added to wishlist!"
        );

        // Update navbar wishlist count

        window.dispatchEvent(
          new Event("wishlistUpdated")
        );
      }
    } catch (error) {
      console.error(
        "SHOP WISHLIST ERROR:",
        error.response?.data ||
          error.message
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

  const handleAvailabilityChange = (
    value
  ) => {
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

  // =========================
  // UI
  // =========================

  return (
    <>
      <Navbar />

      <main className="shop-page">

        {/* =========================
            HEADING
        ========================= */}

        <section className="shop-heading">
          <h1>SHOP</h1>

          {searchQuery && (
            <p className="search-result-text">
              Search results for:{" "}
              <strong>
                "{searchQuery}"
              </strong>
            </p>
          )}
        </section>

        {/* =========================
            FILTER BAR
        ========================= */}

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

              <span>
                SORT BY:
              </span>

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

            {/* =========================
                CURRENT PAGE PRODUCT COUNT
            ========================= */}

            <span className="product-count">
              {products.length} PRODUCTS
            </span>

          </div>

        </section>

        {/* =========================
            LOADING
        ========================= */}

        {loading && (
          <p className="no-products">
            Loading products...
          </p>
        )}

        {/* =========================
            ERROR
        ========================= */}

        {!loading && error && (
          <p className="no-products">
            Error: {error}
          </p>
        )}

        {/* =========================
            PRODUCTS
        ========================= */}

        {!loading && !error && (
          <section className="shop-products">

            {products.length > 0 ? (

              products.map((product) => {

                const productId =
                  product._id ||
                  product.id;

                const productPrice =
                  product.salePrice !==
                    null &&
                  product.salePrice !==
                    undefined
                    ? product.salePrice
                    : product.regularPrice ||
                      product.price ||
                      0;

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
                    className="shop-product-card"
                    key={productId}
                  >

                    <div className="shop-product-image">

                      {/* WISHLIST */}

                      <button
                        type="button"
                        className={`shop-wishlist-btn ${
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
                        aria-label={
                          isWishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        {isWishlisted
                          ? "♥"
                          : "♡"}
                      </button>

                      <img
                        src={productImage}
                        alt={product.name}
                      />

                    </div>

                    <div className="shop-product-info">

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        ₹
                        {Number(
                          productPrice
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>

                    </div>

                  </Link>
                );
              })

            ) : (

              <p className="no-products">
                No products found.
              </p>

            )}

          </section>
        )}

        {/* =========================
            BACKEND PAGINATION
        ========================= */}

        {!loading &&
          !error &&
          pagination.totalPages > 1 && (

            <div className="shop-pagination">

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

export default Shop;