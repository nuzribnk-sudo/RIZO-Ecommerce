import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import axios from "axios";

import toast from "react-hot-toast";

import "./ProductCard.css";

const API_URL = "http://localhost:5000/api";

function ProductCard({ product, loading = false }) {
  const navigate = useNavigate();

  const [wishlistIds, setWishlistIds] = useState([]);
  const [updatingWishlist, setUpdatingWishlist] = useState(false);

  // ================= SKELETON LOADING =================

  if (loading) {
    return (
      <div className="product-card">
        <div className="product-image-wrapper">
          <div
            style={{
              width: "100%",
              height: "100%",
              minHeight: "300px",
              background: "#f1f1f1",
            }}
          />
        </div>

        <div className="product-info">
          <div
            style={{
              width: "70%",
              height: "18px",
              background: "#f1f1f1",
              marginBottom: "10px",
            }}
          />

          <div
            style={{
              width: "40%",
              height: "16px",
              background: "#f1f1f1",
            }}
          />
        </div>
      </div>
    );
  }

  // ================= PRODUCT ID =================

  const productId = product?._id || product?.id;

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

  useEffect(() => {
    const fetchWishlist = async () => {
      const token = getToken();

      console.log("FETCHING WISHLIST...");
      console.log("TOKEN EXISTS:", !!token);

      if (!token) {
        setWishlistIds([]);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/wishlist`,
          getAuthConfig(),
        );

        console.log("WISHLIST RESPONSE:", response.data);

        const products = response.data.wishlist?.products || [];

        const ids = products.map((item) =>
          String(item?._id || item?.id || item),
        );

        setWishlistIds(ids);
      } catch (error) {
        console.error(
          "FETCH WISHLIST ERROR:",
          error.response?.data || error.message,
        );

        setWishlistIds([]);
      }
    };

    fetchWishlist();
  }, []);

  // ================= PRODUCT IMAGE =================

  let productImage = product?.images?.[0] || product?.image || "";

  if (
    productImage &&
    !productImage.startsWith("http") &&
    !productImage.startsWith("data:")
  ) {
    productImage = `http://localhost:5000${
      productImage.startsWith("/") ? "" : "/"
    }${productImage}`;
  }

  if (!productImage) {
    productImage = "https://via.placeholder.com/500x600?text=No+Image";
  }

  // ================= PRODUCT PRICE =================

  const productPrice =
    product?.salePrice !== null &&
    product?.salePrice !== undefined &&
    product?.salePrice !== ""
      ? product.salePrice
      : (product?.regularPrice ?? product?.price ?? 0);

  // ================= WISHLIST CHECK =================

  const isWishlisted = wishlistIds.includes(String(productId));

  // ================= WISHLIST =================

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("❤️ HEART CLICKED");
    console.log("PRODUCT ID:", productId);
    console.log("IS WISHLISTED:", isWishlisted);

    const token = getToken();

    console.log("TOKEN:", token ? "EXISTS" : "NOT FOUND");

    // ================= LOGIN CHECK =================

    if (!token) {
      toast.error("Please login to add products to your wishlist.");

      navigate("/login");
      return;
    }

    try {
      setUpdatingWishlist(true);

      // ================= REMOVE =================

      if (isWishlisted) {
        console.log("REMOVING FROM WISHLIST:", productId);

        const response = await axios.delete(
          `${API_URL}/wishlist/remove/${productId}`,
          getAuthConfig(),
        );

        console.log("REMOVE RESPONSE:", response.data);

        setWishlistIds((prev) => prev.filter((id) => id !== String(productId)));

        toast.success("Product removed from wishlist!");

        // Navbar wishlist count update
        window.dispatchEvent(new Event("wishlistUpdated"));
      }

      // ================= ADD =================
      else {
        console.log("ADDING TO WISHLIST:", productId);

        const response = await axios.post(
          `${API_URL}/wishlist/add`,
          {
            productId: productId,
          },
          getAuthConfig(),
        );

        console.log("ADD RESPONSE:", response.data);

        setWishlistIds((prev) => [...prev, String(productId)]);

        toast.success("Product added to wishlist!");

        // Navbar wishlist count update
        window.dispatchEvent(new Event("wishlistUpdated"));
      }
    } catch (error) {
      console.error("WISHLIST ERROR:", error.response?.data || error.message);

      toast.error(error.response?.data?.message || "Failed to update wishlist");
    } finally {
      setUpdatingWishlist(false);
    }
  };

  // ================= IMAGE ERROR =================

  const handleImageError = (e) => {
    e.currentTarget.src = "https://via.placeholder.com/500x600?text=No+Image";
  };

  // ================= UI =================

  return (
    <div className="product-card">
      {/* WISHLIST BUTTON */}

      <button
        type="button"
        className={`wishlist-btn ${isWishlisted ? "active-wishlist" : ""}`}
        onClick={handleWishlist}
        disabled={updatingWishlist}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isWishlisted ? "♥" : "♡"}
      </button>

      {/* PRODUCT LINK */}

      <Link to={`/product/${productId}`} className="product-link">
        <div className="product-image-wrapper">
          <img
            src={productImage}
            alt={product?.name || "Product"}
            className="product-image"
            onError={handleImageError}
          />
        </div>

        <div className="product-info">
          <h3>{product?.name || "Product Name"}</h3>

          <p className="product-price">
            ₹{Number(productPrice).toLocaleString("en-IN")}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
