import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/rizo-logo.png";
import "./ForgotPassword.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api/auth";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP.");
      }

      setMessage(data.message || "OTP sent successfully.");

      // Save email so ResetPassword page can use it
      sessionStorage.setItem("resetEmail", email.trim());

      // Go to OTP + new password page
      setTimeout(() => {
        navigate("/admin/reset-password");
      }, 1000);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        {/* Brand */}
        <div className="forgot-brand">
          <img src={logo} alt="RIZO Logo" className="forgot-logo" />

          <h1>RIZO</h1>
          <p>Admin Panel</p>
        </div>

        {/* Heading */}
        <div className="forgot-heading">
          <div className="forgot-icon">
            <i className="bi bi-shield-lock"></i>
          </div>

          <h2>Forgot Password?</h2>

          <p>
            Enter your registered email address and we'll send you
            an OTP to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="forgot-group">
            <label htmlFor="email">Email Address</label>

            <div className="forgot-input-wrapper">
              <i className="bi bi-envelope"></i>

              <input
                id="email"
                type="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="forgot-message forgot-error">
              <i className="bi bi-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="forgot-message forgot-success">
              <i className="bi bi-check-circle"></i>
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            className="forgot-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat"></i>
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        {/* Back */}
        <button
          type="button"
          className="back-login-btn"
          onClick={() => navigate("/admin/login")}
        >
          <i className="bi bi-arrow-left"></i>
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;