import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Invoicing.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";

const Invoicing = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FETCH ORDERS
  // =========================

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_URL}/orders?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("INVOICE ORDERS RESPONSE:", response.data);

      const ordersData =
        response.data?.orders ||
        response.data?.data ||
        response.data;

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : []
      );
    } catch (err) {
      console.error("Error fetching invoice orders:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load your invoices."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FORMAT STATUS
  // =========================

  const formatStatus = (status) => {
    if (!status) return "Pending";

    return status
      .toLowerCase()
      .replace(/\_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // =========================
  // PRODUCT NAME
  // =========================

  const getProductName = (item) => {
    if (item?.product?.name) {
      return item.product.name;
    }

    if (item?.productName) {
      return item.productName;
    }

    if (typeof item?.product === "string") {
      return "Product";
    }

    return "Product";
  };

  // =========================
  // PRODUCT IMAGE
  // =========================

  const getProductImage = (item) => {
    if (item?.image) {
      return item.image;
    }

    if (item?.product?.image) {
      return item.product.image;
    }

    if (
      item?.product?.images &&
      item.product.images.length > 0
    ) {
      return item.product.images[0];
    }

    return "";
  };

  // =========================
  // FORMAT DATE
  // =========================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================
  // GET TOTAL
  // =========================

  const getOrderTotal = (order) => {
    return Number(
      order?.finalAmount ??
        order?.totalAmount ??
        order?.total ??
        0
    );
  };

  // =========================
  // GET SUBTOTAL
  // =========================

  const getSubtotal = (order) => {
    if (order?.subtotal !== undefined) {
      return Number(order.subtotal);
    }

    if (Array.isArray(order?.items)) {
      return order.items.reduce(
        (total, item) =>
          total +
          Number(item?.price || 0) *
            Number(item?.quantity || 1),
        0
      );
    }

    return 0;
  };

  // =========================
  // GET DELIVERY
  // =========================

  const getDelivery = (order) => {
    if (order?.delivery !== undefined) {
      return Number(order.delivery);
    }

    const subtotal = getSubtotal(order);
    const total = getOrderTotal(order);

    const delivery = total - subtotal;

    return delivery > 0 ? delivery : 0;
  };

  // =========================
  // LOGIN CHECK
  // =========================

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="invoice-page">
          <div className="invoice-empty">
            <h2>Loading invoices...</h2>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================
  // LOGIN
  // =========================

  if (!token || !userId) {
    return (
      <>
        <Navbar />

        <main className="invoice-page">
          <section className="invoice-empty">
            <h2>Please Login</h2>

            <p>
              Please login to view your invoices.
            </p>

            <Link
              to="/login"
              className="invoice-shop-btn"
            >
              LOGIN
            </Link>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <>
        <Navbar />

        <main className="invoice-page">
          <section className="invoice-empty">
            <h2>Something went wrong</h2>

            <p>{error}</p>

            <button
              className="invoice-shop-btn"
              onClick={fetchOrders}
            >
              TRY AGAIN
            </button>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  // =========================
  // MAIN PAGE
  // =========================

  return (
    <>
      <Navbar />

      <main className="invoice-page">

        {/* HEADING */}

        <section className="invoice-heading">
          <p>RIZO ACCOUNT</p>

          <h1>INVOICES</h1>

          <span>
            View your order invoices and billing details.
          </span>
        </section>

        {/* EMPTY */}

        {orders.length === 0 ? (
          <section className="invoice-empty">
            <h2>No invoices available</h2>

            <p>
              Your invoices will appear here after
              you place an order.
            </p>

            <Link
              to="/shop"
              className="invoice-shop-btn"
            >
              START SHOPPING
            </Link>
          </section>
        ) : (

          /* INVOICE LIST */

          <section className="invoice-container">

            {orders
              .slice()
              .reverse()
              .map((order) => {

                const orderTotal =
                  getOrderTotal(order);

                const subtotal =
                  getSubtotal(order);

                const delivery =
                  getDelivery(order);

                const status =
                  order?.orderStatus ||
                  "PENDING";

                return (
                  <article
                    className="invoice-card"
                    key={order._id}
                  >

                    {/* INVOICE HEADER */}

                    <div className="invoice-card-top">

                      <div>
                        <span>INVOICE</span>

                        <h2>
                          #{order._id}
                        </h2>
                      </div>

                      <div className="invoice-status">

                        <span>STATUS</span>

                        <strong>
                          {formatStatus(status)}
                        </strong>

                      </div>

                    </div>

                    {/* ORDER DETAILS */}

                    <div className="invoice-details">

                      <div>
                        <span>
                          ORDER DATE
                        </span>

                        <strong>
                          {formatDate(
                            order.createdAt
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          PAYMENT
                        </span>

                        <strong>
                          {order.paymentMethod ||
                            "N/A"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          TOTAL
                        </span>

                        <strong>
                          ₹
                          {orderTotal.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                    </div>

                    {/* PRODUCTS */}

                    <div className="invoice-products">

                      <h3>
                        ORDER ITEMS
                      </h3>

                      {Array.isArray(
                        order.items
                      ) &&
                        order.items.map(
                          (item, index) => {

                            const productName =
                              getProductName(item);

                            const productImage =
                              getProductImage(item);

                            const quantity =
                              Number(
                                item?.quantity || 1
                              );

                            const price =
                              Number(
                                item?.price || 0
                              );

                            return (
                              <div
                                className="invoice-product"
                                key={`${order._id}-${index}`}
                              >

                                <div className="invoice-product-left">

                                  <div className="invoice-product-image">

                                    {productImage ? (
                                      <img
                                        src={
                                          productImage
                                        }
                                        alt={
                                          productName
                                        }
                                      />
                                    ) : (
                                      <span>
                                        No Image
                                      </span>
                                    )}

                                  </div>

                                  <div>

                                    <h4>
                                      {productName}
                                    </h4>

                                    <p>
                                      Size:{" "}
                                      {item?.size ||
                                        "N/A"}
                                    </p>

                                    <p>
                                      Quantity:{" "}
                                      {quantity}
                                    </p>

                                  </div>

                                </div>

                                <strong>
                                  ₹
                                  {(
                                    price *
                                    quantity
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </strong>

                              </div>
                            );
                          }
                        )}

                    </div>

                    {/* TOTAL */}

                    <div className="invoice-footer">

                      <div>
                        <span>
                          SUBTOTAL
                        </span>

                        <strong>
                          ₹
                          {subtotal.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          DELIVERY
                        </span>

                        <strong>
                          {delivery === 0
                            ? "FREE"
                            : `₹${delivery.toLocaleString(
                                "en-IN"
                              )}`}
                        </strong>
                      </div>

                      <div className="invoice-grand-total">

                        <span>
                          TOTAL AMOUNT
                        </span>

                        <strong>
                          ₹
                          {orderTotal.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>

                    </div>

                  </article>
                );
              })}

          </section>
        )}

      </main>

      <Footer />
    </>
  );
};

export default Invoicing;