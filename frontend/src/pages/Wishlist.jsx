import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Wishlist.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";

function Wishlist() {
  const navigate = useNavigate();
  const location = useLocation();

  const showBackToProfile =
    location.state?.fromProfile === true;

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingProduct, setUpdatingProduct] =
    useState(null);

  // ================= TOKEN =================
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    };
  };

  // ================= FETCH WISHLIST =================
  const fetchWishlist = async () => {
    const token = getToken();

    // Login ഇല്ലെങ്കിൽ empty wishlist
    if (!token) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/wishlist`,
        getAuthConfig()
      );

      setWishlist(
        response.data.wishlist?.products || []
      );
    } catch (error) {
      console.error(
        "GET WISHLIST ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to fetch wishlist"
      );

      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH ON PAGE LOAD =================
  useEffect(() => {
    fetchWishlist();
  }, []);

  // ================= REMOVE FROM WISHLIST =================
  const removeFromWishlist = async (productId) => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setUpdatingProduct(productId);

      await axios.delete(
        `${API_URL}/wishlist/remove/${productId}`,
        getAuthConfig()
      );

      // Latest wishlist fetch ചെയ്യുക
      await fetchWishlist();

      alert("Product removed from wishlist!");
    } catch (error) {
      console.error(
        "REMOVE WISHLIST ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to remove product from wishlist"
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  // ================= ADD TO CART =================
  const addToCart = async (product) => {
    const token = getToken();

    if (!token) {
      alert(
        "Please login to add products to your cart."
      );
      navigate("/login");
      return;
    }

    const productId =
      product._id || product.id;

    try {
      setUpdatingProduct(productId);

      await axios.post(
        `${API_URL}/cart/add`,
        {
          productId: productId,
          quantity: 1,
        },
        getAuthConfig()
      );

      alert(
        `${product.name} added to cart!`
      );

      // Wishlist-ൽ നിന്ന് remove ചെയ്യുന്നില്ല
    } catch (error) {
      console.error(
        "ADD TO CART ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to add product to cart"
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  // ================= LOGIN CHECK =================
  if (!getToken()) {
    return (
      <>
        <Navbar />

        <main className="wishlist-page">
          <div className="wishlist-container">

            <section className="wishlist-empty">

              <div className="empty-heart">
                ♡
              </div>

              <h2>Please Login</h2>

              <p>
                Login to view and manage your
                wishlist.
              </p>

              <Link to="/login">
                LOGIN
              </Link>

            </section>

          </div>
        </main>

        <Footer />
      </>
    );
  }

  // ================= LOADING =================
  if (loading) {
    return (
      <>
        <Navbar />

        <main className="wishlist-page">
          <div className="wishlist-container">

            <p className="no-products">
              Loading wishlist...
            </p>

          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="wishlist-page">

        <div className="wishlist-container">

          {/* ================= BACK TO PROFILE ================= */}
          {showBackToProfile && (
            <button
              type="button"
              className="wishlist-back-btn"
              onClick={() =>
                navigate("/profile")
              }
            >
              ← BACK TO PROFILE
            </button>
          )}

          {/* ================= HEADING ================= */}
          <section className="wishlist-heading">

            <h1>YOUR WISHLIST</h1>

            <span>
              Your favourite products in one place.
            </span>

          </section>

          {/* ================= ERROR ================= */}
          {error && (
            <p className="no-products">
              {error}
            </p>
          )}

          {/* ================= EMPTY WISHLIST ================= */}
          {!error && wishlist.length === 0 && (
            <section className="wishlist-empty">

              <div className="empty-heart">
                ♡
              </div>

              <h2>
                Your wishlist is empty
              </h2>

              <p>
                Save your favourite products
                here and shop them later.
              </p>

              <Link to="/shop">
                START SHOPPING
              </Link>

            </section>
          )}

          {/* ================= WISHLIST PRODUCTS ================= */}
          {!error && wishlist.length > 0 && (
            <section className="wishlist-products">

              {wishlist.map((product) => {

                // ================= PRODUCT ID =================
                const productId =
                  product._id || product.id;

                // ================= PRODUCT IMAGE =================
                const productImage =
                  product.images?.[0] ||
                  product.image ||
                  "https://via.placeholder.com/300";

                // ================= PRODUCT PRICE =================
                const productPrice =
                  product.salePrice !== null &&
                  product.salePrice !== undefined
                    ? product.salePrice
                    : product.regularPrice ||
                      product.price ||
                      0;

                const isUpdating =
                  updatingProduct === productId;

                return (
                  <article
                    className="wishlist-card"
                    key={productId}
                  >

                    {/* ================= PRODUCT IMAGE ================= */}
                    <Link
                      to={`/product/${productId}`}
                      className="wishlist-image"
                    >
                      <img
                        src={productImage}
                        alt={product.name}
                      />
                    </Link>

                    {/* ================= PRODUCT INFO ================= */}
                    <div className="wishlist-info">

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        ₹{" "}
                        {Number(
                          productPrice
                        ).toLocaleString(
                          "en-IN"
                        )}
                        /-
                      </p>

                    </div>

                    {/* ================= ACTIONS ================= */}
                    <div className="wishlist-actions">

                      <button
                        type="button"
                        className="wishlist-cart-btn"
                        onClick={() =>
                          addToCart(product)
                        }
                        disabled={isUpdating}
                      >
                        {isUpdating
                          ? "PLEASE WAIT..."
                          : "ADD TO CART"}
                      </button>

                      <button
                        type="button"
                        className="wishlist-remove-btn"
                        onClick={() =>
                          removeFromWishlist(
                            productId
                          )
                        }
                        disabled={isUpdating}
                      >
                        {isUpdating
                          ? "PLEASE WAIT..."
                          : "REMOVE"}
                      </button>

                    </div>

                  </article>
                );
              })}

            </section>
          )}

        </div>

      </main>

      <Footer />
    </>
  );
}

export default Wishlist;