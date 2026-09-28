import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Checkout.css";

const API_URL = "http://localhost:5000/api";

function Checkout() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // BUY NOW
  // =========================================================

  const buyNowProduct = location.state?.buyNow
    ? location.state.product
    : null;

  const isBuyNow = Boolean(buyNowProduct);

  // =========================================================
  // STATES
  // =========================================================

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // AVAILABLE COUPONS
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [billingAddress, setBillingAddress] = useState("same");
  const [error, setError] = useState("");

  // =========================================================
  // AUTH
  // =========================================================

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================================================
  // LOAD RAZORPAY SCRIPT
  // =========================================================

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  // =========================================================
  // FETCH CART
  // =========================================================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchCart();
  }, [token, navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/cart`,
        authConfig
      );

      setCart(response.data.cart || response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");

        toast.error("Session expired. Please login again.");

        navigate("/login");
      } else {
        const message =
          error.response?.data?.message ||
          "Failed to load cart.";

        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH AVAILABLE ACTIVE COUPONS
  // =========================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchAvailableCoupons();
  }, [token]);

  const fetchAvailableCoupons = async () => {
    try {
      setCouponsLoading(true);

      const response = await axios.get(
        `${API_URL}/coupons?status=active`,
        authConfig
      );

      const couponData =
        response.data.coupons ||
        response.data.data ||
        response.data ||
        [];

      const couponsArray = Array.isArray(couponData)
        ? couponData
        : [];

      // Extra frontend safety check for expiry
      const currentDate = new Date();

      const activeCoupons = couponsArray.filter(
        (item) => {
          if (
            item.active === false ||
            item.isActive === false
          ) {
            return false;
          }

          const expiryDate =
            item.expiryDate ||
            item.expiry;

          if (
            expiryDate &&
            new Date(expiryDate) < currentDate
          ) {
            return false;
          }

          return true;
        }
      );

      setAvailableCoupons(activeCoupons);
    } catch (error) {
      console.error(
        "Error fetching available coupons:",
        error
      );

      setAvailableCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  // =========================================================
  // CART HELPERS
  // =========================================================

  const getCartItems = () => {
    if (isBuyNow && buyNowProduct) {
      return [
        {
          product: buyNowProduct,
          quantity: buyNowProduct.quantity || 1,
          size: buyNowProduct.selectedSize || "",
        },
      ];
    }

    if (!cart) {
      return [];
    }

    return cart.items || cart.products || [];
  };

  const getProduct = (item) => {
    return item.product || item.productId || item;
  };

  const getQuantity = (item) => {
    return Number(item.quantity || 1);
  };

  const getPrice = (item) => {
    const product = getProduct(item);

    return Number(
      product.salePrice ??
        product.regularPrice ??
        product.price ??
        item.price ??
        0
    );
  };

  const cartItems = getCartItems();

  // =========================================================
  // PRICE CALCULATIONS
  // =========================================================

  const subtotal = cartItems.reduce(
    (total, item) => {
      return total + getPrice(item) * getQuantity(item);
    },
    0
  );

  const deliveryCharge =
    subtotal === 0 ? 0 : subtotal < 699 ? 50 : 0;

  const discount = coupon?.discountAmount || 0;

  const totalAmount = Math.max(
    0,
    subtotal + deliveryCharge - discount
  );

  // =========================================================
  // COUPON
  // =========================================================

  const validateCoupon = async (
    codeFromButton = null
  ) => {
    const code = (
      codeFromButton || couponCode
    )
      .trim()
      .toUpperCase();

    if (!code) {
      setCouponMessage("Please enter a coupon code.");
      setCoupon(null);
      toast.error("Please enter a coupon code.");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponMessage("");

      const response = await axios.get(
        `${API_URL}/coupons/code/${code}`,
        authConfig
      );

      const couponData =
        response.data.coupon || response.data;

      if (!couponData) {
        setCoupon(null);
        setCouponMessage("Invalid coupon.");
        toast.error("Invalid coupon.");
        return;
      }

      // Active check
      if (
        couponData.active === false ||
        couponData.isActive === false
      ) {
        setCoupon(null);
        setCouponMessage(
          "This coupon is inactive."
        );
        toast.error("This coupon is inactive.");
        return;
      }

      // Expiry check
      const expiryDate =
        couponData.expiryDate ||
        couponData.expiry;

      if (
        expiryDate &&
        new Date(expiryDate) < new Date()
      ) {
        setCoupon(null);
        setCouponMessage(
          "This coupon has expired."
        );
        toast.error("This coupon has expired.");
        return;
      }

      // Minimum purchase
      const minimumPurchase = Number(
        couponData.minimumPurchase || 0
      );

      if (subtotal < minimumPurchase) {
        setCoupon(null);

        const message =
          `Minimum purchase should be ₹${minimumPurchase}.`;

        setCouponMessage(message);
        toast.error(message);
        return;
      }

      // Calculate discount
      let discountAmount = 0;

      const discountType =
        couponData.discountType ||
        couponData.type;

      const discountValue = Number(
        couponData.discountValue ||
          couponData.discount ||
          0
      );

      if (discountType === "percentage") {
        discountAmount =
          (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }

      // Maximum discount
      if (couponData.maxDiscount) {
        discountAmount = Math.min(
          discountAmount,
          Number(couponData.maxDiscount)
        );
      }

      if (couponData.maximumDiscount) {
        discountAmount = Math.min(
          discountAmount,
          Number(couponData.maximumDiscount)
        );
      }

      // Discount cannot exceed subtotal
      discountAmount = Math.min(
        discountAmount,
        subtotal
      );

      discountAmount = Math.max(
        0,
        discountAmount
      );

      setCoupon({
        ...couponData,
        discountAmount,
      });

      setCouponCode(
        couponData.code || code
      );

      const successMessage =
        `Coupon ${
          couponData.code || code
        } applied successfully.`;

      setCouponMessage(successMessage);

      toast.success(successMessage);
    } catch (error) {
      console.error(
        "Coupon error:",
        error
      );

      setCoupon(null);

      const message =
        error.response?.data?.message ||
        "Invalid coupon code.";

      setCouponMessage(message);
      toast.error(message);
    } finally {
      setCouponLoading(false);
    }
  };

  // =========================================================
  // APPLY DISPLAYED COUPON
  // =========================================================

  const handleAvailableCoupon = (code) => {
    setCouponCode(code);
    validateCoupon(code);
  };

  // =========================================================
  // REMOVE COUPON
  // =========================================================

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    setCouponMessage("");

    toast.success("Coupon removed.");
  };

  // =========================================================
  // CREATE ORDER DATA
  // =========================================================

  const getOrderData = (form) => {
    const formData = new FormData(form);

    // =======================================================
    // SHIPPING ADDRESS
    // =======================================================

    const firstName =
      formData.get("firstName") || "";

    const lastName =
      formData.get("lastName") || "";

    const shippingAddressData = {
      fullName:
        `${firstName} ${lastName}`.trim(),

      phone:
        formData.get("phone") || "",

      address:
        formData.get("address") || "",

      apartment:
        formData.get("apartment") || "",

      city:
        formData.get("city") || "",

      state:
        formData.get("state") || "",

      pincode:
        formData.get("pincode") || "",

      country:
        formData.get("country") || "India",
    };

    // =======================================================
    // SHIPPING VALIDATION
    // =======================================================

    if (!shippingAddressData.fullName) {
      throw new Error(
        "Please enter your name."
      );
    }

    if (!shippingAddressData.phone) {
      throw new Error(
        "Please enter your phone number."
      );
    }

    if (!shippingAddressData.address) {
      throw new Error(
        "Please enter your address."
      );
    }

    if (!shippingAddressData.city) {
      throw new Error(
        "Please enter your city."
      );
    }

    if (!shippingAddressData.state) {
      throw new Error(
        "Please select your state."
      );
    }

    if (!shippingAddressData.pincode) {
      throw new Error(
        "Please enter your pincode."
      );
    }

    // =======================================================
    // BILLING ADDRESS
    // =======================================================

    let billingAddressData;

    // Same as shipping
    if (billingAddress === "same") {
      billingAddressData = {
        ...shippingAddressData,
      };
    }

    // Different billing address
    if (billingAddress === "different") {
      const billingFirstName =
        formData.get("billingFirstName") || "";

      const billingLastName =
        formData.get("billingLastName") || "";

      billingAddressData = {
        fullName:
          `${billingFirstName} ${billingLastName}`.trim(),

        phone:
          formData.get("billingPhone") || "",

        address:
          formData.get("billingAddress") || "",

        apartment:
          formData.get("billingApartment") || "",

        city:
          formData.get("billingCity") || "",

        state:
          formData.get("billingState") || "",

        pincode:
          formData.get("billingPincode") || "",

        country:
          formData.get("billingCountry") || "India",
      };

      // =====================================================
      // BILLING VALIDATION
      // =====================================================

      if (!billingAddressData.fullName) {
        throw new Error(
          "Please enter your billing name."
        );
      }

      if (!billingAddressData.phone) {
        throw new Error(
          "Please enter your billing phone number."
        );
      }

      if (!billingAddressData.address) {
        throw new Error(
          "Please enter your billing address."
        );
      }

      if (!billingAddressData.city) {
        throw new Error(
          "Please enter your billing city."
        );
      }

      if (!billingAddressData.state) {
        throw new Error(
          "Please select your billing state."
        );
      }

      if (!billingAddressData.pincode) {
        throw new Error(
          "Please enter your billing pincode."
        );
      }

      if (!billingAddressData.country) {
        throw new Error(
          "Please select your billing country."
        );
      }
    }

    // =======================================================
    // ORDER ITEMS
    // =======================================================

    const orderItems = cartItems.map(
      (item) => {
        const product = getProduct(item);

        return {
          product:
            product._id ||
            product.id ||
            item.product,

          quantity:
            getQuantity(item),

          price:
            getPrice(item),

          size:
            item.size ||
            item.selectedSize ||
            "",
        };
      }
    );

    // =======================================================
    // ORDER DATA
    // =======================================================

    return {
      user: userId,

      items: orderItems,

      shippingAddress:
        shippingAddressData,

      billingAddress:
        billingAddressData,

      totalAmount: subtotal,

      shippingCharge:
        deliveryCharge,

      discountAmount:
        discount,

      finalAmount:
        totalAmount,

      couponCode:
        coupon?.code ||
        couponCode.trim().toUpperCase() ||
        null,

      paymentMethod:
        paymentMethod === "razorpay"
          ? "RAZORPAY"
          : "COD",
    };
  };

  // =========================================================
  // RAZORPAY PAYMENT
  // =========================================================

  const handleRazorpayPayment = async (
    form
  ) => {
    try {
      setPlacingOrder(true);
      setError("");

      // Load Razorpay
      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          "Razorpay SDK failed to load. Please check your internet connection."
        );
      }

      // Prepare order data
      const orderData =
        getOrderData(form);

      console.log(
        "RAZORPAY ORDER DATA:",
        orderData
      );

      // =====================================================
      // STEP 1: CREATE MONGODB ORDER
      // =====================================================

      const mongoOrderResponse =
        await axios.post(
          `${API_URL}/orders`,
          orderData,
          authConfig
        );

      console.log(
        "MONGODB ORDER RESPONSE:",
        mongoOrderResponse.data
      );

      const mongoOrder =
        mongoOrderResponse.data.order;

      if (!mongoOrder?._id) {
        throw new Error(
          "MongoDB order was not created."
        );
      }

      const mongoOrderId =
        mongoOrder._id;

      // =====================================================
      // STEP 2: CREATE RAZORPAY ORDER
      // =====================================================

      const razorpayOrderResponse =
        await axios.post(
          `${API_URL}/orders/razorpay/create-order`,
          {
            amount: totalAmount,
            orderId: mongoOrderId,
          },
          authConfig
        );

      console.log(
        "RAZORPAY ORDER RESPONSE:",
        razorpayOrderResponse.data
      );

      const razorpayOrder =
        razorpayOrderResponse.data.order;

      if (!razorpayOrder?.id) {
        throw new Error(
          "Razorpay order was not created."
        );
      }

      // =====================================================
      // STEP 3: GET RAZORPAY KEY
      // =====================================================

      const razorpayKey =
        import.meta.env
          .VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error(
          "Razorpay Key ID is missing. Add VITE_RAZORPAY_KEY_ID to frontend .env file."
        );
      }

      // =====================================================
      // STEP 4: OPEN RAZORPAY CHECKOUT
      // =====================================================

      const options = {
        key: razorpayKey,

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency || "INR",

        name: "Rizo",

        description:
          "Rizo E-commerce Order",

        order_id:
          razorpayOrder.id,

        handler: async function (
          razorpayResponse
        ) {
          try {
            console.log(
              "RAZORPAY SUCCESS RESPONSE:",
              razorpayResponse
            );

            // =================================================
            // STEP 5: VERIFY PAYMENT
            // =================================================

            const verifyResponse =
              await axios.post(
                `${API_URL}/orders/razorpay/verify`,
                {
                  orderId:
                    mongoOrderId,

                  razorpay_order_id:
                    razorpayResponse.razorpay_order_id,

                  razorpay_payment_id:
                    razorpayResponse.razorpay_payment_id,

                  razorpay_signature:
                    razorpayResponse.razorpay_signature,
                },
                authConfig
              );

            console.log(
              "PAYMENT VERIFICATION RESPONSE:",
              verifyResponse.data
            );

            if (
              verifyResponse.data.success
            ) {
              toast.success(
                "Payment successful! Order placed successfully."
              );

              if (!isBuyNow) {
                await fetchCart();
              }

              navigate("/orders");
            } else {
              const message =
                "Payment verification failed.";

              setError(message);
              toast.error(message);
            }
          } catch (error) {
            console.error(
              "PAYMENT VERIFICATION ERROR:",
              error.response?.data ||
                error.message
            );

            const message =
              error.response?.data?.message ||
              error.response?.data?.error ||
              "Payment verification failed.";

            setError(message);
            toast.error(message);
          } finally {
            setPlacingOrder(false);
          }
        },

        prefill: {
          name:
            orderData.shippingAddress
              .fullName,

          contact:
            orderData.shippingAddress
              .phone,
        },

        notes: {
          orderId:
            mongoOrderId,
        },

        theme: {
          color: "#202020",
        },

        modal: {
          ondismiss: function () {
            console.log(
              "Razorpay payment popup closed."
            );

            setPlacingOrder(false);

            const message =
              "Payment cancelled";

            setError(message);

            toast.error(
              "Payment cancelled"
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response
          );

          setPlacingOrder(false);

          const message =
            response.error?.description ||
            "Payment failed";

          setError(message);

          toast.error(
            message
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "RAZORPAY ERROR:",
        error.response?.data ||
          error.message
      );

      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to start Razorpay payment.";

      setError(message);
      toast.error(message);

      setPlacingOrder(false);
    }
  };

  // =========================================================
  // PLACE ORDER
  // =========================================================

  const handlePlaceOrder = async (
    event
  ) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!token) {
      toast.error(
        "Please login before placing your order."
      );

      navigate("/login");
      return;
    }

    if (!userId) {
      const message =
        "User information not found. Please login again.";

      setError(message);
      toast.error(message);
      return;
    }

    if (cartItems.length === 0) {
      const message =
        "No products available to place the order.";

      setError(message);
      toast.error(message);
      return;
    }

    // =======================================================
    // RAZORPAY
    // =======================================================

    if (paymentMethod === "razorpay") {
      try {
        await handleRazorpayPayment(form);
      } catch (error) {
        console.error(
          "RAZORPAY HANDLE ERROR:",
          error
        );
      }

      return;
    }

    // =======================================================
    // COD
    // =======================================================

    if (paymentMethod !== "cod") {
      const message =
        "Online payment is not available yet. Please select Cash on Delivery.";

      setError(message);
      toast.error(message);
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");

      let orderData;

      try {
        orderData =
          getOrderData(form);
      } catch (validationError) {
        const message =
          validationError.message ||
          "Please check your delivery details.";

        setError(message);
        toast.error(message);
        setPlacingOrder(false);
        return;
      }

      console.log(
        "COD ORDER DATA:",
        orderData
      );

      // =====================================================
      // CREATE COD ORDER
      // =====================================================

      const response =
        await axios.post(
          `${API_URL}/orders`,
          orderData,
          authConfig
        );

      console.log(
        "COD ORDER SUCCESS:",
        response.data
      );

      toast.success(
        "Order placed successfully!"
      );

      if (!isBuyNow) {
        setCart(null);
      }

      navigate("/orders");
    } catch (error) {
      console.error(
        "ORDER ERROR:",
        error.response?.data ||
          error.message
      );

      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to place order.";

      setError(message);
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // =========================================================
  // LOGIN CHECK
  // =========================================================

  if (!token) {
    return (
      <>
        <Navbar />

        <main className="checkout-empty-page">
          <div className="checkout-empty">
            <h2>
              Login Required
            </h2>

            <p>
              Please login before
              proceeding to checkout.
            </p>

            <Link
              to="/login"
              className="checkout-shop-btn"
            >
              LOGIN
            </Link>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="checkout-loading">
          Loading checkout...
        </div>

        <Footer />
      </>
    );
  }

  // =========================================================
  // EMPTY CART
  // =========================================================

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />

        <main className="checkout-empty-page">
          <div className="checkout-empty-logo">
            <img
              src="/logo.png"
              alt="Rizo"
            />
          </div>

          <div className="checkout-empty">
            <h2>
              Your cart is empty
            </h2>

            <p>
              Add some products to your
              cart before checkout.
            </p>

            <button
              onClick={() =>
                navigate("/shop")
              }
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================================================
  // CHECKOUT PAGE
  // =========================================================

  return (
    <>
      <Navbar />

      <main className="figma-checkout">
        {/* ERROR */}

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        {/* CHECKOUT CARD */}

        <form
          className="figma-checkout-container"
          onSubmit={handlePlaceOrder}
        >
          {/* =================================================
              LEFT SIDE
              ================================================= */}

          <section className="delivery-section">
            {/* DELIVERY */}

            <h2 className="delivery-title">
              Delivery
            </h2>

            {/* COUNTRY */}

            <div className="checkout-field">
              <label>
                Country/region
              </label>

              <select
                name="country"
                defaultValue="India"
              >
                <option value="India">
                  India
                </option>
              </select>
            </div>

            {/* NAME */}

            <div className="checkout-row">
              <div className="checkout-field">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  required
                />
              </div>

              <div className="checkout-field">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            {/* ADDRESS */}

            <div className="checkout-field">
              <input
                type="text"
                name="address"
                placeholder="Address"
                required
              />
            </div>

            {/* APARTMENT */}

            <div className="checkout-field">
              <input
                type="text"
                name="apartment"
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            {/* CITY / STATE / PIN */}

            <div className="checkout-location-row">
              <div className="checkout-field">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  required
                />
              </div>

              <div className="checkout-field">
                <select
                  name="state"
                  defaultValue="Kerala"
                  required
                >
                  <option value="Kerala">
                    Kerala
                  </option>

                  <option value="Tamil Nadu">
                    Tamil Nadu
                  </option>

                  <option value="Karnataka">
                    Karnataka
                  </option>

                  <option value="Maharashtra">
                    Maharashtra
                  </option>

                  <option value="Delhi">
                    Delhi
                  </option>
                </select>
              </div>

              <div className="checkout-field">
                <input
                  type="text"
                  name="pincode"
                  placeholder="PIN code"
                  pattern="[0-9]{6}"
                  title="Please enter a valid 6-digit PIN code"
                  required
                />
              </div>
            </div>

            {/* PHONE */}

            <div className="checkout-field">
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit phone number"
                required
              />
            </div>

            {/* SAVE INFO */}

            <label className="save-info">
              <input
                type="checkbox"
                name="saveInfo"
              />

              <span>
                Save this information for next time
              </span>
            </label>

            {/* =================================================
                COUPON
                ================================================= */}

            <div className="coupon-section">
              <h2>
                Discount code
              </h2>

              <div className="discount-box">
                <input
                  type="text"
                  placeholder="Discount code or gift card"
                  value={couponCode}
                  onChange={(event) =>
                    setCouponCode(
                      event.target.value.toUpperCase()
                    )
                  }
                  disabled={!!coupon}
                />

                {!coupon ? (
                  <button
                    type="button"
                    onClick={() =>
                      validateCoupon()
                    }
                    disabled={couponLoading}
                  >
                    {couponLoading
                      ? "Applying..."
                      : "Apply"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={removeCoupon}
                  >
                    Remove
                  </button>
                )}
              </div>

              {couponMessage && (
                <p className="coupon-message">
                  {couponMessage}
                </p>
              )}

              {/* AVAILABLE COUPONS */}

              {availableCoupons.length > 0 && (
                <div className="available-coupons">
                  <h3>
                    Available Coupons
                  </h3>

                  {availableCoupons.map(
                    (availableCoupon) => {
                      const code =
                        availableCoupon.code ||
                        availableCoupon.couponCode ||
                        "";

                      const discountType =
                        availableCoupon.discountType ||
                        availableCoupon.type;

                      const discountValue =
                        availableCoupon.discountValue ??
                        availableCoupon.discount ??
                        0;

                      const minimumPurchase =
                        Number(
                          availableCoupon.minimumPurchase ||
                            0
                        );

                      return (
                        <div
                          className="available-coupon"
                          key={
                            availableCoupon._id ||
                            code
                          }
                        >
                          <div className="available-coupon-info">
                            <strong>
                              {code}
                            </strong>

                            <span>
                              {discountType ===
                              "percentage"
                                ? `${discountValue}% OFF`
                                : `₹${discountValue} OFF`}
                            </span>

                            {minimumPurchase > 0 && (
                              <small>
                                Min. purchase ₹
                                {minimumPurchase.toLocaleString(
                                  "en-IN"
                                )}
                              </small>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleAvailableCoupon(
                                code
                              )
                            }
                            disabled={
                              couponLoading ||
                              !!coupon
                            }
                          >
                            APPLY
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {couponsLoading && (
                <p className="coupon-loading">
                  Loading available coupons...
                </p>
              )}
            </div>
          </section>

          {/* =================================================
              RIGHT SIDE
              ================================================= */}

          <section className="checkout-right">
            {/* PRODUCTS */}

            <div className="order-summary-products">
              {cartItems.map(
                (item, index) => {
                  const product =
                    getProduct(item);

                  const productId =
                    product._id ||
                    product.id ||
                    index;

                  const price =
                    getPrice(item);

                  const quantity =
                    getQuantity(item);

                  let image =
                    product.image ||
                    product.images?.[0] ||
                    item.image ||
                    "/placeholder.png";

                  if (
                    image &&
                    !image.startsWith("http")
                  ) {
                    image =
                      `http://localhost:5000${
                        image.startsWith("/")
                          ? ""
                          : "/"
                      }${image}`;
                  }

                  return (
                    <div
                      className="figma-product"
                      key={productId}
                    >
                      <div className="figma-product-image">
                        <img
                          src={image}
                          alt={
                            product.name ||
                            "Product"
                          }
                        />

                        <span className="product-quantity">
                          {quantity}
                        </span>
                      </div>

                      <div className="figma-product-name">
                        <h4>
                          {product.name ||
                            "Product"}
                        </h4>

                        {item.size && (
                          <small>
                            Size: {item.size}
                          </small>
                        )}
                      </div>

                      <strong>
                        ₹
                        {(
                          price * quantity
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>
                  );
                }
              )}
            </div>

            {/* PRICE DETAILS */}

            <div className="price-details">
              <div className="price-row">
                <span>
                  Subtotal
                </span>

                <span>
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              {discount > 0 && (
                <div className="price-row">
                  <span>
                    Discount
                    {coupon?.code
                      ? ` (${coupon.code})`
                      : ""}
                  </span>

                  <span>
                    -₹
                    {discount.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              )}

              <div className="price-row">
                <span>
                  Shipping
                </span>

                <span className="shipping-value">
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${deliveryCharge}`}
                </span>
              </div>
            </div>

            {/* TOTAL */}

            <div className="figma-total">
              <div>
                <h2>
                  Total
                </h2>

                <small>
                  Including taxes
                </small>
              </div>

              <strong>
                <span className="currency">
                  INR
                </span>

                ₹
                {totalAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            {/* =================================================
                PAYMENT
                ================================================= */}

            <div className="payment-section">
              <h2>
                Payment
              </h2>

              <p className="payment-subtitle">
                All transactions are secure
                and encrypted.
              </p>

              {/* COD */}

              <label
                className={`payment-method ${
                  paymentMethod === "cod"
                    ? "active-payment"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={
                    paymentMethod === "cod"
                  }
                  onChange={() =>
                    setPaymentMethod("cod")
                  }
                />

                <div className="payment-method-content">
                  <strong>
                    Cash on Delivery
                  </strong>
                </div>

                <span className="payment-icons">
                  COD
                </span>
              </label>

              {paymentMethod === "cod" && (
                <div className="payment-info-box">
                  <p>
                    You can pay cash when
                    your order is delivered.
                  </p>
                </div>
              )}

              {/* RAZORPAY */}

              <label
                className={`payment-method ${
                  paymentMethod === "razorpay"
                    ? "active-payment"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={
                    paymentMethod ===
                    "razorpay"
                  }
                  onChange={() =>
                    setPaymentMethod(
                      "razorpay"
                    )
                  }
                />

                <div className="payment-method-content">
                  <strong>
                    Razorpay
                    (UPI, Cards & NetBanking)
                  </strong>
                </div>

                <span className="payment-icons">
                  UPI&nbsp;&nbsp;VISA&nbsp;&nbsp;MC
                </span>
              </label>

              {paymentMethod ===
                "razorpay" && (
                <div className="payment-info-box">
                  <p>
                    You will be redirected to
                    Razorpay secure payment
                    checkout.
                  </p>
                </div>
              )}
            </div>

            {/* =================================================
                BILLING
                ================================================= */}

            <div className="billing-section">
              <h2>
                Billing address
              </h2>

              <label className="billing-option">
                <input
                  type="radio"
                  name="billing"
                  value="same"
                  checked={
                    billingAddress === "same"
                  }
                  onChange={() =>
                    setBillingAddress("same")
                  }
                />

                <span>
                  Same as shipping address
                </span>
              </label>

              <label className="billing-option">
                <input
                  type="radio"
                  name="billing"
                  value="different"
                  checked={
                    billingAddress ===
                    "different"
                  }
                  onChange={() =>
                    setBillingAddress(
                      "different"
                    )
                  }
                />

                <span>
                  Use a different billing
                  address
                </span>
              </label>

              {/* DIFFERENT BILLING ADDRESS FORM */}

              {billingAddress ===
                "different" && (
                <div className="billing-address-form">
                  {/* BILLING NAME */}

                  <div className="checkout-row">
                    <div className="checkout-field">
                      <input
                        type="text"
                        name="billingFirstName"
                        placeholder="First name"
                        required
                      />
                    </div>

                    <div className="checkout-field">
                      <input
                        type="text"
                        name="billingLastName"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  {/* BILLING ADDRESS */}

                  <div className="checkout-field">
                    <input
                      type="text"
                      name="billingAddress"
                      placeholder="Address"
                      required
                    />
                  </div>

                  {/* BILLING APARTMENT */}

                  <div className="checkout-field">
                    <input
                      type="text"
                      name="billingApartment"
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>

                  {/* BILLING CITY / STATE / PIN */}

                  <div className="checkout-location-row">
                    <div className="checkout-field">
                      <input
                        type="text"
                        name="billingCity"
                        placeholder="City"
                        required
                      />
                    </div>

                    <div className="checkout-field">
                      <select
                        name="billingState"
                        defaultValue="Kerala"
                        required
                      >
                        <option value="Kerala">
                          Kerala
                        </option>

                        <option value="Tamil Nadu">
                          Tamil Nadu
                        </option>

                        <option value="Karnataka">
                          Karnataka
                        </option>

                        <option value="Maharashtra">
                          Maharashtra
                        </option>

                        <option value="Delhi">
                          Delhi
                        </option>
                      </select>
                    </div>

                    <div className="checkout-field">
                      <input
                        type="text"
                        name="billingPincode"
                        placeholder="PIN code"
                        pattern="[0-9]{6}"
                        title="Please enter a valid 6-digit PIN code"
                        required
                      />
                    </div>
                  </div>

                  {/* BILLING COUNTRY */}

                  <div className="checkout-field">
                    <select
                      name="billingCountry"
                      defaultValue="India"
                      required
                    >
                      <option value="India">
                        India
                      </option>
                    </select>
                  </div>

                  {/* BILLING PHONE */}

                  <div className="checkout-field">
                    <input
                      type="tel"
                      name="billingPhone"
                      placeholder="Phone"
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PLACE ORDER */}

            <button
              type="submit"
              className="figma-pay-button"
              disabled={placingOrder}
            >
              {placingOrder
                ? "PROCESSING..."
                : paymentMethod === "cod"
                ? "PLACE ORDER"
                : "PAY WITH RAZORPAY"}
            </button>

            {/* POLICY LINKS */}

            <div className="checkout-policy-links">
              <Link to="/refund-policy">
                Refund policy
              </Link>

              <span>|</span>

              <Link to="/shipping-policy">
                Shipping policy
              </Link>

              <span>|</span>

              <Link to="/privacy-policy">
                Privacy policy
              </Link>

              <span>|</span>

              <Link to="/terms-of-service">
                Terms of service
              </Link>
            </div>
          </section>
        </form>

        {/* BACK BUTTON */}

        <button
          type="button"
          className="checkout-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ← Back
        </button>
      </main>

      <Footer />
    </>
  );
}

export default Checkout;