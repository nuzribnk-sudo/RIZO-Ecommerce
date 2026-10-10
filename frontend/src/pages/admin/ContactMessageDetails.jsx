import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./ContactMessageDetails.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api/contacts";

function ContactMessageDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  // =========================================================
  // GET CONTACT MESSAGE
  // =========================================================

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch contact messages"
          );
        }

        const contacts =
          data.contacts ||
          data.messages ||
          data.data ||
          [];

        const selectedContact = contacts.find(
          (item) => String(item._id) === String(id)
        );

        if (!selectedContact) {
          throw new Error("Contact message not found");
        }

        setContact(selectedContact);
      } catch (err) {
        console.error("Fetch contact error:", err);

        setError(
          err.message || "Failed to load contact message"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchContact();
    } else {
      setError("Admin login session not found.");
      setLoading(false);
    }
  }, [id, token]);

  // =========================================================
  // UPDATE STATUS
  // Backend accepts: read / replied
  // =========================================================

  const handleStatusChange = async (newStatus) => {
    if (!contact || newStatus === contact.status) {
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        `${API_URL}/${contact._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update status"
        );
      }

      const updatedContact =
        data.contact ||
        data.messageData ||
        data.data;

      if (updatedContact) {
        setContact(updatedContact);
      } else {
        setContact((prev) => ({
          ...prev,
          status: newStatus,
        }));
      }

      toast.success(
        "Contact message status updated successfully",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
    } catch (err) {
      console.error("Update status error:", err);

      toast.error(
        err.message || "Failed to update status",
        {
          className: "rizo-admin-toast",
          hideProgressBar: true,
        }
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================================================
  // DELETE CONTACT
  // =========================================================

  const handleDelete = async () => {
    if (!contact) return;

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
                  setDeleting(true);

                  const response = await fetch(
                    `${API_URL}/${contact._id}`,
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
                      data.message ||
                        "Failed to delete contact message"
                    );
                  }

                  toast.success(
                    "Contact message deleted successfully",
                    {
                      className: "rizo-admin-toast",
                      hideProgressBar: true,
                    }
                  );

                  navigate("/admin/contact-messages");
                } catch (err) {
                  console.error(
                    "Delete contact error:",
                    err
                  );

                  toast.error(
                    err.message ||
                      "Failed to delete contact message",
                    {
                      className: "rizo-admin-toast",
                      hideProgressBar: true,
                    }
                  );
                } finally {
                  setDeleting(false);
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
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // =========================================================
  // STATUS
  // =========================================================

  const isReplied = contact?.status === "replied";

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="contact-details-page">
        <div className="contact-details-loading">
          <div className="contact-loading-spinner"></div>

          <p>
            Loading contact message...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !contact) {
    return (
      <div className="contact-details-page">
        <div className="contact-details-error">
          <i className="bi bi-exclamation-circle"></i>

          <h3>
            Contact message not found
          </h3>

          <p>
            {error || "Something went wrong."}
          </p>

          <button
            className="contact-back-btn"
            onClick={() =>
              navigate("/admin/contact-messages")
            }
          >
            <i className="bi bi-arrow-left"></i>
            Back to Contact Messages
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="contact-details-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="contact-details-header">
        <div className="contact-details-heading">
          <div>
            <h1>
              Contact Message
            </h1>

            <p>
              View and manage customer enquiry details
            </p>
          </div>

          <span
            className={`contact-status-badge ${
              isReplied
                ? "replied"
                : "read"
            }`}
          >
            <span className="contact-status-dot"></span>

            {isReplied
              ? "Replied"
              : "Read"}
          </span>
        </div>
      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="contact-details-card">
        {/* ===================================================
            CUSTOMER SECTION
        =================================================== */}

        <section className="contact-info-section">
          <div className="contact-section-title">
            <div className="contact-section-icon">
              <i className="bi bi-person"></i>
            </div>

            <div>
              <h2>
                Customer Information
              </h2>

              <p>
                Customer details submitted with the enquiry
              </p>
            </div>
          </div>

          <div className="contact-info-grid">
            {/* NAME */}

            <div className="contact-info-item">
              <span className="contact-info-label">
                Name
              </span>

              <span className="contact-info-value">
                {contact.name || "—"}
              </span>
            </div>

            {/* EMAIL */}

            <div className="contact-info-item">
              <span className="contact-info-label">
                Email
              </span>

              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="contact-info-value contact-email"
                >
                  {contact.email}
                </a>
              ) : (
                <span className="contact-info-value">
                  —
                </span>
              )}
            </div>

            {/* PHONE */}

            <div className="contact-info-item">
              <span className="contact-info-label">
                Phone
              </span>

              {contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="contact-info-value contact-phone"
                >
                  {contact.phone}
                </a>
              ) : (
                <span className="contact-info-value">
                  —
                </span>
              )}
            </div>

            {/* RECEIVED ON */}

            <div className="contact-info-item">
              <span className="contact-info-label">
                Received On
              </span>

              <span className="contact-info-value">
                {formatDate(contact.createdAt)}
              </span>
            </div>
          </div>
        </section>

        {/* ===================================================
            MESSAGE SECTION
        =================================================== */}

        <section className="contact-message-section">
          <div className="contact-section-title">
            <div className="contact-section-icon">
              <i className="bi bi-chat-left-text"></i>
            </div>

            <div>
              <h2>
                Message Details
              </h2>

              <p>
                Customer enquiry information
              </p>
            </div>
          </div>

          <div className="contact-message-content">
            {/* SUBJECT */}

            <div className="contact-subject-block">
              <span className="contact-info-label">
                Subject
              </span>

              <h3>
                {contact.subject ||
                  "No subject"}
              </h3>
            </div>

            {/* MESSAGE */}

            <div className="contact-message-block">
              <span className="contact-info-label">
                Message
              </span>

              <div className="contact-message-text">
                {contact.message ||
                  "No message available."}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            STATUS SECTION
        =================================================== */}

        <section className="contact-status-section">
          <div className="contact-section-title">
            <div className="contact-section-icon">
              <i className="bi bi-check2-circle"></i>
            </div>

            <div>
              <h2>
                Message Status
              </h2>

              <p>
                Update the current status of this enquiry
              </p>
            </div>
          </div>

          <div className="contact-status-control">
            <label htmlFor="contact-status">
              Current Status
            </label>

            <select
              id="contact-status"
              value={contact.status || "read"}
              onChange={(e) =>
                handleStatusChange(
                  e.target.value
                )
              }
              disabled={updating}
            >
              <option value="read">
                Read
              </option>

              <option value="replied">
                Replied
              </option>
            </select>

            {updating && (
              <span className="contact-updating-text">
                Updating...
              </span>
            )}
          </div>
        </section>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="contact-details-actions">
          <button
            className="contact-action-back"
            onClick={() =>
              navigate(
                "/admin/contact-messages"
              )
            }
          >
            <i className="bi bi-arrow-left"></i>
            Back to Contact Messages
          </button>

          <button
            className="contact-action-delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            <i className="bi bi-trash3"></i>

            {deleting
              ? "Deleting..."
              : "Delete Message"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContactMessageDetails;