import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Cart.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  // =========================
  // FETCH CART
  // =========================

  const fetchCart = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();

      console.log("CART API RESPONSE:", data);

      setCart(
        data.cart || {
          items: [],
        }
      );
    } catch (error) {
      console.error("Cart error:", error);

      setCart({
        items: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD CART
  // =========================

  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [token]);

  // =========================
  // PRODUCT PRICE
  // =========================

  const getProductPrice = (item) => {
    const product = item.product || item;

    return (
      product.salePrice ??
      product.regularPrice ??
      product.price ??
      item.price ??
      0
    );
  };

  // =========================
  // PRODUCT IMAGE
  // =========================

  const getProductImage = (item) => {
    const product = item.product || item;

    if (product.images && product.images.length > 0) {
      return product.images[0].startsWith("http")
        ? product.images[0]
        : `http://localhost:5000${product.images[0]}`;
    }

    return "/images/no-image.png";
  };

  // =========================
  // PRODUCT NAME
  // =========================

  const getProductName = (item) => {
    const product = item.product || item;

    return product.name || "Product";
  };

  // =========================
  // QUANTITY
  // =========================

  const getQuantity = (item) => {
    return item.quantity || 1;
  };

  // =========================
  // UPDATE QUANTITY
  // =========================

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    try {
      const response = await fetch(
        `${API_URL}/cart/update/${productId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            quantity,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      fetchCart();
    } catch (error) {
      console.error(
        "Update quantity error:",
        error
      );
    }
  };

  // =========================
  // REMOVE ITEM
  // =========================

  const removeItem = async (productId) => {
    try {
      const response = await fetch(
        `${API_URL}/cart/remove/${productId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      setMessage("Item removed from cart");

      setTimeout(() => {
        setMessage("");
      }, 2000);

      fetchCart();
    } catch (error) {
      console.error(
        "Remove item error:",
        error
      );
    }
  };

  // =========================
  // NOT LOGGED IN
  // =========================

  if (!token) {
    return (
      <>
        <Navbar />

        <main className="cart-page">
          <div className="empty-cart">
            <h2>Please Login</h2>

            <p>
              Please login to your account to view your cart items.
            </p>

            <Link
              to="/login"
              className="continue-shopping"
            >
              LOGIN
            </Link>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="cart-page">
          <div className="cart-loading">
            Loading your cart...
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================
  // CART ITEMS
  // =========================

  const items = cart?.items || [];

  // =========================
  // EMPTY CART
  // =========================

  if (items.length === 0) {
    return (
      <>
        <Navbar />

        <main className="cart-page">
          <div className="empty-cart">
            <h2>Your Cart is Empty</h2>

            <p>
              Looks like you haven't added anything to your cart yet.
            </p>

            <Link
              to="/shop"
              className="continue-shopping"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================
  // TOTALS
  // =========================

  const subtotal = items.reduce(
    (total, item) => {
      const price = getProductPrice(item);
      const quantity = getQuantity(item);

      return total + price * quantity;
    },
    0
  );

  const delivery =
    subtotal === 0 || subtotal >= 699
      ? 0
      : 50;

  const total = subtotal + delivery;

  // =========================
  // MAIN CART
  // =========================

  return (
    <>
      <Navbar />

      <main className="cart-page">
        <div className="cart-wrapper">

          {/* CART TOP */}

          <div className="cart-top">
            <h1>Your Cart</h1>

            {message && (
              <div className="cart-message">
                {message}
              </div>
            )}
          </div>

          {/* CART HEADER */}

          <div className="cart-header">
            <span>PRODUCT</span>

            <span>QUANTITY</span>

            <span>TOTAL</span>
          </div>

          {/* CART ITEMS */}

          <div className="cart-items">
            {items.map((item) => {
              const product =
                item.product || item;

              const productId =
                product._id ||
                product.id ||
                item.productId;

              const price =
                getProductPrice(item);

              const quantity =
                getQuantity(item);

              const itemTotal =
                price * quantity;

              return (
                <div
                  className="cart-item"
                  key={productId}
                >

                  {/* PRODUCT */}

                  <div className="cart-product">
                    <img
                      src={getProductImage(item)}
                      alt={getProductName(item)}
                    />

                    <div className="cart-product-info">
                      <h3>
                        {getProductName(item)}
                      </h3>

                      <p>
                        ₹
                        {Number(
                          price
                        ).toLocaleString("en-IN")}
                      </p>

                      {item.size && (
                        <span>
                          Size: {item.size}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QUANTITY + DELETE */}

                  <div className="cart-quantity-wrapper">

                    <div className="cart-quantity">
                      <button
                        onClick={() =>
                          updateQuantity(
                            productId,
                            quantity - 1
                          )
                        }
                        disabled={
                          quantity <= 1
                        }
                      >
                        −
                      </button>

                      <span>
                        {quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(
                            productId,
                            quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() =>
                        removeItem(productId)
                      }
                      title="Remove"
                    >
                      🗑
                    </button>

                  </div>

                  {/* TOTAL */}

                  <div className="cart-item-total">
                    <span>
                      ₹
                      {Number(
                        itemTotal
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

          {/* BOTTOM */}

          <div className="cart-bottom">

            {/* ORDER SUMMARY */}

            <div className="cart-summary">

              <h2>
                ORDER SUMMARY
              </h2>

              <div className="summary-row">
                <span>
                  Subtotal
                </span>

                <span>
                  ₹
                  {Number(
                    subtotal
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="summary-row">
                <span>
                  Delivery
                </span>

                <span>
                  {delivery === 0
                    ? "FREE"
                    : `₹${delivery}`}
                </span>
              </div>

              <div className="summary-total">
                <span>
                  Total
                </span>

                <span>
                  ₹
                  {Number(
                    total
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <p className="delivery-note">
                Free delivery on orders above &#8377;699
              </p>

              <Link
                to="/checkout"
                className="checkout-btn"
              >
                PROCEED TO CHECKOUT
              </Link>

            </div>

            {/* CONTINUE SHOPPING */}

            <Link
              to="/shop"
              className="cart-continue-btn"
            >
              CONTINUE SHOPPING
            </Link>

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default Cart;



