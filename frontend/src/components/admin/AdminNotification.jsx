import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminNotification.css";

const API_URL = "http://localhost:5000/api";

function AdminNotification() {
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // GET TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  };

  // =========================================================
  // NOTIFICATION ICON
  // =========================================================

  const getNotificationIcon = (type) => {
    switch (type) {
      case "PRODUCT":
        return "bi-box-seam";

      case "ORDER":
        return "bi-bag-check";

      case "USER":
        return "bi-person-plus";

      default:
        return "bi-info-circle";
    }
  };

  // =========================================================
  // NOTIFICATION TYPE CLASS
  // =========================================================

  const getNotificationTypeClass = (type) => {
    switch (type) {
      case "PRODUCT":
        return "stock";

      case "ORDER":
        return "order";

      case "USER":
        return "customer";

      default:
        return "system";
    }
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatNotificationTime = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) {
      return "";
    }

    const now = new Date();

    const differenceInSeconds = Math.floor(
      (now.getTime() - notificationDate.getTime()) / 1000
    );

    if (differenceInSeconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(differenceInSeconds / 60);

    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return notificationDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        setError("Admin login session not found.");
        return;
      }

      const response = await fetch(`${API_URL}/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch notifications"
        );
      }

      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Notification fetch error:", error);

      if (showLoader) {
        setError(
          error.message || "Failed to load notifications"
        );
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    // Fetch immediately when notification component mounts
    fetchNotifications(true);

    // Check for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // =========================================================
  // REFRESH WHEN NOTIFICATION PANEL OPENS
  // =========================================================

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications(true);
    }
  }, [showNotifications, fetchNotifications]);

  // =========================================================
  // MARK SINGLE NOTIFICATION AS READ
  // =========================================================

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark notification as read"
        );
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const handleMarkAllAsRead = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(
        `${API_URL}/notifications/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to mark all notifications as read"
        );
      }

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );
    }
  };

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(
        `${API_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete notification"
        );
      }

      setNotifications((prev) =>
        prev.filter(
          (notification) =>
            notification._id !== notificationId
        )
      );
    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );
    }
  };

  // =========================================================
  // VIEW NOTIFICATION
  // =========================================================

  const handleViewNotification = async (
    event,
    notification
  ) => {
    event.stopPropagation();

    // Mark notification as read
    await handleMarkAsRead(notification._id);

    // Close notification dropdown
    setShowNotifications(false);

    // Navigate according to notification type
    if (notification.type === "PRODUCT") {
      navigate("/admin/inventory");
    } else if (notification.type === "ORDER") {
      navigate("/admin/orders");
    } else if (notification.type === "USER") {
      navigate("/admin/customers");
    }
  };

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // =========================================================
  // JSX
  // =========================================================

  return (
    <div className="notification-wrapper">
      {/* =====================================================
          NOTIFICATION BUTTON
      ===================================================== */}

      <button
        className="notification-btn"
        onClick={() =>
          setShowNotifications((prev) => !prev)
        }
        aria-label="Notifications"
        type="button"
      >
        <i className="bi bi-bell"></i>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* =====================================================
          NOTIFICATION PANEL
      ===================================================== */}

      {showNotifications && (
        <div className="notification-panel">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="notification-panel-header">
            <div>
              <h3>Notifications</h3>

              <p>
                Stock, order and customer updates
                from your store
              </p>
            </div>

            <button
              className="notification-close-btn"
              onClick={() =>
                setShowNotifications(false)
              }
              aria-label="Close notifications"
              type="button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* =================================================
              MARK ALL
          ================================================= */}

          {unreadCount > 0 &&
            !loading &&
            !error && (
              <div className="notification-actions">
                <button
                  onClick={handleMarkAllAsRead}
                  type="button"
                >
                  Mark all as read
                </button>
              </div>
            )}

          {/* =================================================
              NOTIFICATION LIST
          ================================================= */}

          <div className="notification-list">
            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (
              <div className="notification-empty">
                <i className="bi bi-arrow-repeat notification-loading-icon"></i>

                <h4>
                  Loading notifications
                </h4>

                <p>
                  Please wait...
                </p>
              </div>
            ) : error ? (
              /* =================================================
                 ERROR
              ================================================= */

              <div className="notification-empty">
                <i className="bi bi-exclamation-circle"></i>

                <h4>
                  Unable to load notifications
                </h4>

                <p>{error}</p>

                <button
                  className="notification-retry-btn"
                  onClick={() =>
                    fetchNotifications(true)
                  }
                  type="button"
                >
                  Try Again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              /* =================================================
                 EMPTY
              ================================================= */

              <div className="notification-empty">
                <i className="bi bi-bell-slash"></i>

                <h4>
                  No notifications
                </h4>

                <p>
                  You’re all caught up!
                </p>
              </div>
            ) : (
              /* =================================================
                 NOTIFICATIONS
              ================================================= */

              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${
                    !notification.isRead
                      ? "unread"
                      : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      handleMarkAsRead(
                        notification._id
                      );
                    }
                  }}
                >
                  {/* =========================================
                      ICON
                  ========================================= */}

                  <div
                    className={`notification-icon ${getNotificationTypeClass(
                      notification.type
                    )}`}
                  >
                    <i
                      className={`bi ${getNotificationIcon(
                        notification.type
                      )}`}
                    ></i>
                  </div>

                  {/* =========================================
                      CONTENT
                  ========================================= */}

                  <div className="notification-content">
                    <h4>
                      {notification.title}
                    </h4>

                    <p>
                      {notification.message}
                    </p>

                    <span>
                      {formatNotificationTime(
                        notification.createdAt
                      )}
                    </span>

                    {/* =====================================
                        PRODUCT NOTIFICATION
                    ===================================== */}

                    {notification.type === "PRODUCT" && (
                      <button
                        className="notification-view-btn"
                        onClick={(event) =>
                          handleViewNotification(
                            event,
                            notification
                          )
                        }
                        type="button"
                      >
                        View Inventory
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    )}

                    {/* =====================================
                        ORDER NOTIFICATION
                    ===================================== */}

                    {notification.type === "ORDER" && (
                      <button
                        className="notification-view-btn"
                        onClick={(event) =>
                          handleViewNotification(
                            event,
                            notification
                          )
                        }
                        type="button"
                      >
                        View Orders
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    )}

                    {/* =====================================
                        USER / CUSTOMER NOTIFICATION
                    ===================================== */}

                    {notification.type === "USER" && (
                      <button
                        className="notification-view-btn"
                        onClick={(event) =>
                          handleViewNotification(
                            event,
                            notification
                          )
                        }
                        type="button"
                      >
                        View Customers
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    )}
                  </div>

                  {/* =========================================
                      ACTIONS
                  ========================================= */}

                  <div className="notification-item-actions">
                    {!notification.isRead && (
                      <span
                        className="notification-unread-dot"
                        title="Unread"
                      ></span>
                    )}

                    <button
                      className="notification-delete-btn"
                      onClick={(event) => {
                        event.stopPropagation();

                        handleDeleteNotification(
                          notification._id
                        );
                      }}
                      aria-label="Delete notification"
                      title="Delete"
                      type="button"
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          {!loading &&
            !error &&
            notifications.length > 0 && (
              <button
                className="view-all-notifications"
                onClick={() =>
                  setShowNotifications(false)
                }
                type="button"
              >
                Close Notifications
                <i className="bi bi-x-lg"></i>
              </button>
            )}
        </div>
      )}
    </div>
  );
}

export default AdminNotification;