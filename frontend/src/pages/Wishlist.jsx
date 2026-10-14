
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
  const [updatingProduct, setUpdatingProduct] = useState(null);
  const [toast, setToast] = useState(null);

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

  // ================= TOAST =================
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // ================= FETCH WISHLIST =================
  const fetchWishlist = async () => {
    const token = getToken();

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
      console.error("GET WISHLIST ERROR:", error);

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

      // Update the UI after successful removal
      setWishlist((previousWishlist) =>
        previousWishlist.filter(
          (product) =>
            String(product._id || product.id) !==
            String(productId)
        )
      );

      showToast("Product removed from wishlist!", "success");
    } catch (error) {
      console.error("REMOVE WISHLIST ERROR:", error);

      showToast(
        error.response?.data?.message ||
          "Failed to remove product from wishlist",
        "error"
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  // ================= ADD TO CART =================
  const addToCart = async (product) => {
    const token = getToken();

    if (!token) {
      alert("Please login to add products to your cart.");
      navigate("/login");
      return;
    }

    const productId = product._id || product.id;

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

      alert(`${product.name} added to cart!`);

      // Product stays in the wishlist.
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

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
              <div className="empty-heart">♡</div>

              <h2>Please Login</h2>

              <p>
                Login to view and manage your wishlist.
              </p>

              <Link to="/login">LOGIN</Link>
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

      {/* ================= SIMPLE TOP-CENTER TOAST ================= */}
      {toast && (
        <div
          key={`${toast.message}-${toast.type}`}
          className="wishlist-toast"
          role={toast.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <span
            className={`wishlist-toast-icon ${
              toast.type === "error" ? "error" : "success"
            }`}
            aria-hidden="true"
          >
            {toast.type === "error" ? "×" : "✓"}
          </span>

          <span className="wishlist-toast-message">
            {toast.message}
          </span>
        </div>
      )}

      <style>
        {`
          .wishlist-toast {
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 12px;
            width: max-content;
            max-width: calc(100vw - 32px);
            padding: 14px 22px;
            background: #ffffff;
            color: #222222;
            border: 1px solid #edf7ef;
            border-radius: 12px;
            box-shadow: 0 8px 28px rgba(22, 163, 74, 0.14);
            font-size: 14px;
            font-weight: 500;
            animation: wishlistToastIn 0.25s ease-out;
          }

          .wishlist-toast-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            color: #ffffff;
            font-size: 21px;
            font-weight: 700;
          }

          .wishlist-toast-icon.success {
            background: #16a34a;
          }

          .wishlist-toast-icon.error {
            background: #dc3545;
          }

          .wishlist-toast-message {
            overflow-wrap: anywhere;
          }

          @keyframes wishlistToastIn {
            from {
              opacity: 0;
              transform: translate(-50%, -8px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }

          @media (max-width: 480px) {
            .wishlist-toast {
              top: 16px;
              padding: 12px 16px;
              gap: 9px;
              font-size: 13px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .wishlist-toast {
              animation: none;
            }
          }
        `}
      </style>

      <main className="wishlist-page">
        <div className="wishlist-container">
          {/* ================= BACK TO PROFILE ================= */}
          {showBackToProfile && (
            <button
              type="button"
              className="wishlist-back-btn"
              onClick={() => navigate("/profile")}
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
            <p className="no-products">{error}</p>
          )}

          {/* ================= EMPTY WISHLIST ================= */}
          {!error && wishlist.length === 0 && (
            <section className="wishlist-empty">
              <div className="empty-heart">♡</div>

              <h2>Your wishlist is empty</h2>

              <p>
                Save your favourite products here and
                shop them later.
              </p>

              <Link to="/shop">START SHOPPING</Link>
            </section>
          )}

          {/* ================= WISHLIST PRODUCTS ================= */}
          {!error && wishlist.length > 0 && (
            <section className="wishlist-products">
              {wishlist.map((product) => {
                const productId = product._id || product.id;

                const productImage =
                  product.images?.[0] ||
                  product.image ||
                  "https://via.placeholder.com/300";

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
                    {/* PRODUCT IMAGE */}
                    <Link
                      to={`/product/${productId}`}
                      className="wishlist-image"
                    >
                      <img
                        src={productImage}
                        alt={product.name}
                      />
                    </Link>

                    {/* PRODUCT INFO */}
                    <div className="wishlist-info">
                      <h3>{product.name}</h3>

                      <p>
                        ₹{" "}
                        {Number(productPrice).toLocaleString(
                          "en-IN"
                        )}
                        /-
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="wishlist-actions">
                      <button
                        type="button"
                        className="wishlist-cart-btn"
                        onClick={() => addToCart(product)}
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
                          removeFromWishlist(productId)
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
