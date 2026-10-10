import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./ChangePassword.css";

const API_URL = "http://localhost:5000/api";

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // Scroll to top when page opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters!");
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from your current password!"
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/users/change-password`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to change password"
        );
      }

      setMessage(
        data.message || "Password changed successfully!"
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);

      setError(
        error.message || "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="change-password-page">
        <div className="change-password-container">

          <h1>CHANGE PASSWORD</h1>

          <p className="password-description">
            Update your password to keep your account secure.
          </p>

          {error && (
            <p className="password-error">
              {error}
            </p>
          )}

          {message && (
            <p className="password-success">
              {message}
            </p>
          )}

          <form
            className="change-password-form"
            onSubmit={handleSubmit}
          >
            <div className="password-field">
              <label>CURRENT PASSWORD</label>

              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                required
                disabled={loading}
              />
            </div>

            <div className="password-field">
              <label>NEW PASSWORD</label>

              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
                disabled={loading}
              />
            </div>

            <div className="password-field">
              <label>CONFIRM NEW PASSWORD</label>

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="update-password-btn"
              disabled={loading}
            >
              {loading
                ? "UPDATING PASSWORD..."
                : "UPDATE PASSWORD"}
            </button>
          </form>

          {/* BACK BUTTON */}
          <button
            type="button"
            className="password-back-btn"
            onClick={() => navigate("/profile")}
          >
            BACK
          </button>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default ChangePassword;