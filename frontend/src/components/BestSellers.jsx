import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import "./BestSellers.css";

const API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/products/best-sellers";

const WISHLIST_API =
  "https://rizo-ecommerce-backend.onrender.com/api/wishlist";

function BestSellers() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [wishlistIds, setWishlistIds] = useState([]);

  const [updatingWishlist, setUpdatingWishlist] =
    useState(null);

  // =========================
  // TOKEN
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
  // FETCH BEST SELLERS
  // =========================

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);

        const response = await fetch(API_URL);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch best sellers"
          );
        }

        setProducts(data.products || []);
      } catch (error) {
        console.error(
          "BEST SELLERS ERROR:",
          error
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  // =========================
  // FETCH WISHLIST
  // =========================

  useEffect(() => {
    const fetchWishlist = async () => {
      const token = getToken();

      if (!token) {
        setWishlistIds([]);
        return;
      }

      try {
        const response = await fetch(
          WISHLIST_API,
          getAuthConfig()
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch wishlist"
          );
        }

        const wishlistProducts =
          data.wishlist?.products || [];

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
          "WISHLIST FETCH ERROR:",
          error
        );

        setWishlistIds([]);
      }
    };

    fetchWishlist();
  }, []);

  // =========================
  // VIEW MORE
  // =========================

  const handleViewMore = () => {
    navigate("/best-sellers");

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);
  };

  // =========================
  // WISHLIST
  // =========================

  const handleWishlist = async (e, product) => {
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
        const response = await fetch(
          `${WISHLIST_API}/remove/${productId}`,
          {
            method: "DELETE",
            ...getAuthConfig(),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to remove from wishlist"
          );
        }

        setWishlistIds((prev) =>
          prev.filter(
            (id) => id !== productId
          )
        );

        toast.success(
          "Product removed from wishlist!"
        );

        window.dispatchEvent(
          new Event("wishlistUpdated")
        );
      }

      // =========================
      // ADD TO WISHLIST
      // =========================

      else {
        const response = await fetch(
          `${WISHLIST_API}/add`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to add to wishlist"
          );
        }

        setWishlistIds((prev) => [
          ...prev,
          productId,
        ]);

        toast.success(
          "Product added to wishlist!"
        );

        window.dispatchEvent(
          new Event("wishlistUpdated")
        );
      }
    } catch (error) {
      console.error(
        "WISHLIST ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Failed to update wishlist"
      );
    } finally {
      setUpdatingWishlist(null);
    }
  };

  // =========================
  // IMAGE URL
  // =========================

  const getImageUrl = (product) => {
    let image =
      product.images?.[0] ||
      product.image ||
      "";

    if (
      image &&
      !image.startsWith("http")
    ) {
      image = `http://localhost:5000${
        image.startsWith("/")
          ? ""
          : "/"
      }${image}`;
    }

    return image;
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="best-sellers">
        <div className="best-sellers-heading">
          <h2>Best Sellers</h2>

          <p>
            Loading best sellers...
          </p>
        </div>
      </section>
    );
  }

  // =========================
  // EMPTY
  // =========================

  if (products.length === 0) {
    return (
      <section className="best-sellers">
        <div className="best-sellers-heading">
          <h2>Best Sellers</h2>

          <p>
            No best seller products found
          </p>
        </div>
      </section>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <section className="best-sellers">
      <div className="best-sellers-heading">
        <h2>Best Sellers</h2>

        <p>
          Step into the latest drops that
          define the season.
          <br />
          From bold basics to fresh
          fits—just landed.
        </p>
      </div>

      <div className="best-sellers-grid">
        {products.slice(0, 3).map(
          (product) => {
            const productId =
              product._id ||
              product.id;

            const isWishlisted =
              wishlistIds.includes(
                String(productId)
              );

            const isUpdating =
              updatingWishlist ===
              String(productId);

            return (
              <div
                className="best-seller-card"
                key={productId}
                onClick={() =>
                  navigate(
                    `/product/${productId}`
                  )
                }
              >
                {/* Wishlist Button */}

                <button
                  type="button"
                  className={`best-seller-wishlist ${
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

                {/* Product Image */}

                <div className="best-seller-image">
                  <img
                    src={getImageUrl(
                      product
                    )}
                    alt={
                      product.name ||
                      "Best Seller"
                    }
                  />
                </div>
              </div>
            );
          }
        )}
      </div>

      <button
        className="best-sellers-button"
        onClick={handleViewMore}
      >
        View More
      </button>
    </section>
  );
}

export default BestSellers;