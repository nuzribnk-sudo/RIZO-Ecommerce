import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Category.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";

const WISHLIST_API =
  "https://rizo-ecommerce-backend.onrender.com/api/wishlist";

function Category() {
  const { slug, subcategorySlug } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FILTERS ================= */

  const [availability, setAvailability] = useState("all");
  const [priceOrder, setPriceOrder] = useState("default");
  const [sortBy, setSortBy] = useState("newest");

  /* ================= PAGINATION ================= */

  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 8;

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: productsPerPage,
    totalProducts: 0,
    totalPages: 0,
  });

  /* ================= WISHLIST ================= */

  const [wishlistIds, setWishlistIds] = useState([]);
  const [updatingWishlist, setUpdatingWishlist] = useState(null);

  /* ================= TOKEN ================= */

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  /* ================= RESET PAGE ================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, subcategorySlug]);

  /* ================= FETCH WISHLIST ================= */

  useEffect(() => {
    const fetchWishlist = async () => {
      const token = getToken();

      if (!token) {
        setWishlistIds([]);
        return;
      }

      try {
        const response = await axios.get(
          WISHLIST_API,
          getAuthConfig()
        );

        const wishlistProducts =
          response.data?.wishlist?.products || [];

        const ids = wishlistProducts.map((item) =>
          String(item._id || item.id || item)
        );

        setWishlistIds(ids);
      } catch (error) {
        console.error(
          "CATEGORY WISHLIST FETCH ERROR:",
          error.response?.data || error.message
        );

        setWishlistIds([]);
      }
    };

    fetchWishlist();

    /* Update if wishlist changes somewhere else */
    const handleWishlistUpdated = () => {
      fetchWishlist();
    };

    window.addEventListener(
      "wishlistUpdated",
      handleWishlistUpdated
    );

    return () => {
      window.removeEventListener(
        "wishlistUpdated",
        handleWishlistUpdated
      );
    };
  }, []);

  /* ================= FETCH CATEGORY + PRODUCTS ================= */

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError("");

        /* ================= FETCH CATEGORY TREE ================= */

        const categoryResponse = await axios.get(
          `${API_URL}/categories/tree`
        );

        const allCategories =
          categoryResponse.data.categories || [];

        const foundCategory = allCategories.find(
          (category) => category.slug === slug
        );

        if (!foundCategory) {
          throw new Error("Category not found");
        }

        setCurrentCategory(foundCategory);

        const childCategories =
          foundCategory.children || [];

        setCategories(childCategories);

        /* ================= FIND CATEGORY IDS ================= */

        let allowedCategoryIds = [];

        /* ================= SUBCATEGORY PAGE ================= */

        if (subcategorySlug) {
          const selectedSubcategory =
            childCategories.find(
              (category) =>
                category.slug === subcategorySlug
            );

          if (!selectedSubcategory) {
            throw new Error("Subcategory not found");
          }

          allowedCategoryIds = [
            String(selectedSubcategory._id),
          ];
        }

        /* ================= MAIN CATEGORY PAGE ================= */

        else {
          allowedCategoryIds = childCategories.map(
            (category) => String(category._id)
          );
        }

        /* ================= PRODUCT API PARAMS ================= */

        const params = {
          page: currentPage,
          limit: productsPerPage,
        };

        /* ================= CATEGORY FILTER ================= */

        if (allowedCategoryIds.length > 0) {
          params.category =
            allowedCategoryIds.join(",");
        } else {
          params.category = String(foundCategory._id);
        }

        /* ================= AVAILABILITY ================= */

        if (availability === "available") {
          params.availability = "in-stock";
        } else if (availability === "soldout") {
          params.availability = "out-of-stock";
        }

        /* ================= SORTING ================= */

        if (priceOrder === "low-high") {
          params.sort = "price-low";
        } else if (priceOrder === "high-low") {
          params.sort = "price-high";
        } else {
          params.sort = sortBy;
        }

        console.log(
          "CATEGORY API PARAMS:",
          params
        );

        /* ================= FETCH PRODUCTS ================= */

        const productResponse = await axios.get(
          `${API_URL}/products`,
          {
            params,
          }
        );

        console.log(
          "CATEGORY PRODUCT API RESPONSE:",
          productResponse.data
        );

        setProducts(
          productResponse.data.products || []
        );

        setPagination(
          productResponse.data.pagination || {
            currentPage: currentPage,
            limit: productsPerPage,
            totalProducts: 0,
            totalPages: 0,
          }
        );
      } catch (error) {
        console.error(
          "CATEGORY ERROR:",
          error.response?.data || error.message
        );

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load category"
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

    fetchCategoryData();
  }, [
    slug,
    subcategorySlug,
    availability,
    priceOrder,
    sortBy,
    currentPage,
  ]);

  /* ================= FIX PAGE ================= */

  useEffect(() => {
    if (
      pagination.totalPages > 0 &&
      currentPage > pagination.totalPages
    ) {
      setCurrentPage(pagination.totalPages);
    }
  }, [
    pagination.totalPages,
    currentPage,
  ]);

  /* ================= AVAILABILITY ================= */

  const handleAvailabilityChange = (value) => {
    setAvailability(value);
    setCurrentPage(1);
  };

  /* ================= PRICE ================= */

  const handlePriceChange = (value) => {
    setPriceOrder(value);
    setCurrentPage(1);
  };

  /* ================= SORT ================= */

  const handleSortChange = (value) => {
    setSortBy(value);
    setPriceOrder("default");
    setCurrentPage(1);
  };

  /* ================= PAGINATION ================= */

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

  /* ================= WISHLIST HANDLER ================= */

  const handleWishlist = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    const token = getToken();

    /* ================= NOT LOGGED IN ================= */

    if (!token) {
      toast.error("Please login to add products to your wishlist.");

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

      /* ================= REMOVE ================= */

      if (isWishlisted) {
        const response = await axios.delete(
          `${WISHLIST_API}/remove/${productId}`,
          getAuthConfig()
        );

        setWishlistIds((prev) =>
          prev.filter(
            (id) => id !== productId
          )
        );

        toast.success(
          response.data?.message ||
            "Product removed from wishlist!"
        );

        window.dispatchEvent(
          new Event("wishlistUpdated")
        );
      }

      /* ================= ADD ================= */

      else {
        const response = await axios.post(
          `${WISHLIST_API}/add`,
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
          response.data?.message ||
            "Product added to wishlist!"
        );

        window.dispatchEvent(
          new Event("wishlistUpdated")
        );
      }
    } catch (error) {
      console.error(
        "CATEGORY WISHLIST ERROR:",
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

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="category-page">
          <p className="category-loading">
            Loading category...
          </p>
        </main>

        <Footer />
      </>
    );
  }

  /* ================= ERROR ================= */

  if (error) {
    return (
      <>
        <Navbar />

        <main className="category-page">
          <p className="category-loading">
            {error}
          </p>
        </main>

        <Footer />
      </>
    );
  }

  /* ================= SELECTED SUBCATEGORY ================= */

  const selectedSubcategory =
    categories.find(
      (category) =>
        category.slug === subcategorySlug
    );

  /* ================= PAGE TITLE ================= */

  const pageTitle = selectedSubcategory
    ? `All Products in ${selectedSubcategory.name}`
    : currentCategory?.name;

  /* ================= PAGE DESCRIPTION ================= */

  const pageDescription = selectedSubcategory
    ? `Explore all products in ${selectedSubcategory.name}.`
    : `Explore our ${currentCategory?.name} collection.`;

  /* ================= RETURN ================= */

  return (
    <>
      <Navbar />

      <main className="category-page">

        {/* ================= HEADING ================= */}

        <section className="category-page-heading">
          <h1>{pageTitle}</h1>

          <p className="category-page-description">
            {pageDescription}
          </p>
        </section>


        {/* ================= SUBCATEGORIES ================= */}

        {categories.length > 0 && (
          <section className="subcategory-section">
            <div className="subcategory-list">

              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/category/${slug}/${category.slug}`}
                  className={`subcategory-item ${
                    subcategorySlug ===
                    category.slug
                      ? "active"
                      : ""
                  }`}
                >
                  {category.name}
                </Link>
              ))}

            </div>
          </section>
        )}


        {/* ================= FILTER BAR ================= */}

        <section className="category-filter-bar">

          <div className="category-filter-left">

            <span className="category-filter-title">
              FILTER
            </span>


            {/* AVAILABILITY */}

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

              <option value="available">
                IN STOCK
              </option>

              <option value="soldout">
                OUT OF STOCK
              </option>
            </select>


            {/* PRICE */}

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


          <div className="category-filter-right">

            {/* SORT */}

            <div className="category-sort-by">

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


            {/* PRODUCT COUNT */}

            <span className="category-product-count">
              {products.length} PRODUCTS
            </span>

          </div>

        </section>


        {/* ================= PRODUCTS ================= */}

        <section className="category-page-products">

          {products.length > 0 ? (

            <div className="category-page-grid">

              {products.map((product) => {

                const productId =
                  product._id || product.id;

                const productPrice =
                  product.salePrice !== null &&
                  product.salePrice !== undefined &&
                  product.salePrice > 0
                    ? product.salePrice
                    : product.regularPrice ||
                      product.price ||
                      0;

                let productImage =
                  product.images?.[0] ||
                  product.image ||
                  "";

                if (
                  productImage &&
                  !productImage.startsWith("http")
                ) {
                  productImage =
                    `${API_URL.replace(
                      "/api",
                      ""
                    )}${
                      productImage.startsWith("/")
                        ? ""
                        : "/"
                    }${productImage}`;
                }

                const isWishlisted =
                  wishlistIds.includes(
                    String(productId)
                  );

                const isUpdating =
                  updatingWishlist ===
                  String(productId);

                return (

                  <Link
                    key={productId}
                    to={`/product/${productId}`}
                    className="category-product-card"
                  >

                    <div className="category-product-image">

                      {/* ================= WISHLIST ================= */}

                      <button
                        type="button"
                        className={`category-wishlist-btn ${
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
                        disabled={isUpdating}
                        title={
                          isWishlisted
                            ? "Remove from Wishlist"
                            : "Add to Wishlist"
                        }
                        aria-label={
                          isWishlisted
                            ? "Remove from Wishlist"
                            : "Add to Wishlist"
                        }
                      >
                        {isWishlisted
                          ? "♥"
                          : "♡"}
                      </button>


                      {/* ================= PRODUCT IMAGE ================= */}

                      <img
                        src={productImage}
                        alt={
                          product.name ||
                          "Product"
                        }
                      />

                    </div>


                    {/* ================= PRODUCT INFO ================= */}

                    <div className="category-product-info">

                      <h3>
                        {product.name}
                      </h3>

                      <p className="product-price">
                        ₹{" "}
                        {Number(
                          productPrice
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>

                    </div>

                  </Link>
                );
              })}

            </div>

          ) : (

            <p className="no-category-products">
              No products found.
            </p>

          )}


          {/* ================= PAGINATION ================= */}

          {pagination.totalPages > 1 && (

            <div className="category-pagination">

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

        </section>

      </main>

      <Footer />
    </>
  );
}

export default Category;