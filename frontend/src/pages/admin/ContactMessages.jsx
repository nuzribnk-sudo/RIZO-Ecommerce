import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import "./ContactMessages.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api/contacts";

const ContactMessages = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =========================================================
  // FETCH CONTACT MESSAGES
  // Search + Status are sent to backend API
  // =========================================================
  const fetchMessages = async (
    searchValue = "",
    statusValue = "all"
  ) => {
    try {
      setLoading(true);

      const token = getToken();

      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      if (statusValue && statusValue !== "all") {
        params.append("status", statusValue);
      }

      const queryString = params.toString();

      const requestUrl = queryString
        ? `${API_URL}?${queryString}`
        : API_URL;

      const response = await fetch(requestUrl, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch contact messages"
        );
      }

      setMessages(data.contacts || data.messages || []);
    } catch (error) {
      console.error(
        "Fetch contact messages error:",
        error
      );

      toast.error(
        error.message || "Failed to fetch contact messages",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL FETCH
  // =========================================================
  useEffect(() => {
    fetchMessages("", "all");
  }, []);

  // =========================================================
  // SEARCH API CALL
  // 400ms debounce
  // =========================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMessages(search, statusFilter);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getName = (message) => {
    return (
      message?.name ||
      message?.fullName ||
      message?.user?.name ||
      "Unknown Customer"
    );
  };

  const getEmail = (message) => {
    return (
      message?.email ||
      message?.user?.email ||
      "No email"
    );
  };

  const getPhone = (message) => {
    return (
      message?.phone ||
      message?.user?.phone ||
      "No phone"
    );
  };

  const getSubject = (message) => {
    return message?.subject || "General Enquiry";
  };

  const getMessageText = (message) => {
    return (
      message?.message ||
      message?.description ||
      message?.content ||
      message?.comment ||
      "No message"
    );
  };

  // =========================================================
  // STATUS
  // Backend allows ONLY: read / replied
  // =========================================================

  const getStatus = (message) => {
    const status = message?.status || "read";

    return ["read", "replied"].includes(
      status.toLowerCase()
    )
      ? status.toLowerCase()
      : "read";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalMessages = messages.length;

  const readMessages = messages.filter(
    (message) => getStatus(message) === "read"
  ).length;

  const repliedMessages = messages.filter(
    (message) => getStatus(message) === "replied"
  ).length;

  // =========================================================
  // STATUS FILTER
  // Immediate API call
  // =========================================================

  const handleStatusChange = (e) => {
    const value = e.target.value;

    setStatusFilter(value);

    fetchMessages(search, value);
  };

  // =========================================================
  // DELETE MESSAGE
  // =========================================================

  const deleteMessage = async (id) => {
    toast(
      ({ closeToast }) => (
        <div
          style={{
            padding: "4px 0",
            width: "100%",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "#222",
              marginBottom: "5px",
            }}
          >
            Delete contact message?
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#777",
              marginBottom: "14px",
              lineHeight: "1.5",
            }}
          >
            Are you sure you want to delete this contact
            message?
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={closeToast}
              style={{
                border: "none",
                background: "#f1f1f1",
                color: "#444",
                padding: "7px 13px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={async () => {
                closeToast();

                try {
                  const token = getToken();

                  const response = await fetch(
                    `${API_URL}/${id}`,
                    {
                      method: "DELETE",

                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(
                      data.message ||
                        "Failed to delete contact message"
                    );
                  }

                  setMessages((prevMessages) =>
                    prevMessages.filter(
                      (message) => message._id !== id
                    )
                  );

                  toast.success(
                    data.message ||
                      "Contact message deleted successfully",
                    {
                      className: "rizo-admin-toast",
                      hideProgressBar: true,
                    }
                  );
                } catch (error) {
                  console.error(
                    "Delete message error:",
                    error
                  );

                  toast.error(
                    error.message ||
                      "Failed to delete contact message",
                    {
                      className: "rizo-admin-toast",
                      hideProgressBar: true,
                    }
                  );
                }
              }}
              style={{
                border: "none",
                background: "#dc3545",
                color: "#fff",
                padding: "7px 14px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeButton: false,
        hideProgressBar: true,
        className: "rizo-admin-toast",
      }
    );
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "replied") {
      return "status-replied";
    }

    return "status-read";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="contact-messages-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="contact-page-header">
        <div>
          <h1>Contact Messages</h1>

          <p>
            Manage customer enquiries and contact requests.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={() =>
            fetchMessages(search, statusFilter)
          }
          type="button"
          title="Refresh"
        >
          <i className="bi bi-arrow-clockwise"></i>

          <span>Refresh</span>
        </button>
      </div>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="contact-stats">

        {/* Total */}

        <div className="contact-stat-card">
          <div className="stat-icon">
            <i className="bi bi-envelope"></i>
          </div>

          <div>
            <span>Total Messages</span>

            <strong>{totalMessages}</strong>
          </div>
        </div>

        {/* Read */}

        <div className="contact-stat-card">
          <div className="stat-icon pending-icon">
            <i className="bi bi-envelope-open"></i>
          </div>

          <div>
            <span>Read</span>

            <strong>{readMessages}</strong>
          </div>
        </div>

        {/* Replied */}

        <div className="contact-stat-card">
          <div className="stat-icon resolved-icon">
            <i className="bi bi-check2-circle"></i>
          </div>

          <div>
            <span>Replied</span>

            <strong>{repliedMessages}</strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="contact-toolbar">

        {/* Search */}

        <div className="contact-search">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search by name, email, subject..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {/* Status Filter */}

        <div className="contact-filter">
          <i className="bi bi-funnel"></i>

          <select
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="all">
              All Status
            </option>

            <option value="read">
              Read
            </option>

            <option value="replied">
              Replied
            </option>
          </select>
        </div>

      </div>

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <div className="contact-table-card">

        {/* Table Header */}

        <div className="contact-table-header">
          <div>
            <h2>Customer Enquiries</h2>

            <p>
              {messages.length} message
              {messages.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="contact-loading">
            <i className="bi bi-arrow-repeat"></i>

            <span>
              Loading messages...
            </span>
          </div>
        ) : messages.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="contact-empty">

            <div className="empty-icon">
              <i className="bi bi-envelope-open"></i>
            </div>

            <h3>
              No contact messages found
            </h3>

            <p>
              {search ||
              statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Customer contact messages will appear here."}
            </p>

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <div className="contact-table-wrapper">

            <table className="contact-table">

              <thead>
                <tr>
                  <th>Customer</th>

                  <th>Subject</th>

                  <th>Message</th>

                  <th>Date</th>

                  <th>Status</th>

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {messages.map((message) => {

                  const status = getStatus(message);

                  const createdDate =
                    message.createdAt ||
                    message.created_at;

                  return (
                    <tr key={message._id}>

                      {/* =============================
                          CUSTOMER
                      ============================== */}

                      <td>

                        <div className="customer-cell">

                          <div className="customer-avatar">
                            {getName(message)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="customer-info">

                            <strong>
                              {getName(message)}
                            </strong>

                            <span>
                              {getEmail(message)}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* =============================
                          SUBJECT
                      ============================== */}

                      <td>

                        <div className="subject-cell">
                          {getSubject(message)}
                        </div>

                      </td>

                      {/* =============================
                          MESSAGE
                      ============================== */}

                      <td>

                        <div className="message-preview">
                          {getMessageText(message)}
                        </div>

                      </td>

                      {/* =============================
                          DATE
                      ============================== */}

                      <td>

                        <div className="date-cell">

                          <strong>
                            {formatDate(createdDate)}
                          </strong>

                          <span>
                            {formatTime(createdDate)}
                          </span>

                        </div>

                      </td>

                      {/* =============================
                          STATUS
                      ============================== */}

                      <td>

                        <span
                          className={`message-status ${getStatusClass(
                            status
                          )}`}
                        >
                          <span className="status-dot"></span>

                          {status === "replied"
                            ? "Replied"
                            : "Read"}
                        </span>

                      </td>

                      {/* =============================
                          ACTIONS
                      ============================== */}

                      <td>

                        <div className="contact-actions">

                          {/* View */}

                          <button
                            type="button"
                            className="icon-action view-action"
                            title="View message"
                            onClick={() =>
                              navigate(
                                `/admin/contact-messages/${message._id}`
                              )
                            }
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {/* Delete */}

                          <button
                            type="button"
                            className="icon-action delete-action"
                            title="Delete message"
                            onClick={() =>
                              deleteMessage(message._id)
                            }
                          >
                            <i className="bi bi-trash3"></i>
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default ContactMessages;