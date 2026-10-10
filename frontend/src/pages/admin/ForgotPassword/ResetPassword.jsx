import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/rizo-logo.png";
import "./ResetPassword.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api/auth";

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    sessionStorage.getItem("resetEmail") || ""
  );
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setMessage(
        data.message || "Password reset successfully. Redirecting to login..."
      );

      sessionStorage.removeItem("resetEmail");

      setTimeout(() => {
        navigate("/admin/login", { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        {/* Brand */}
        <div className="reset-brand">
          <img src={logo} alt="RIZO Logo" className="reset-logo" />

          <h1>RIZO</h1>
          <p>Admin Panel</p>
        </div>

        {/* Heading */}
        <div className="reset-heading">
          <div className="reset-icon">
            <i className="bi bi-key"></i>
          </div>

          <h2>Reset Password</h2>

          <p>
            Enter the OTP sent to your email and create a new password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="reset-group">
            <label htmlFor="reset-email">Email Address</label>

            <input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* OTP */}
          <div className="reset-group">
            <label htmlFor="reset-otp">OTP</label>

            <input
              id="reset-otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              maxLength={6}
              required
            />
          </div>

          {/* New Password */}
          <div className="reset-group">
            <label htmlFor="new-password">New Password</label>

            <input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="reset-group">
            <label htmlFor="confirm-password">Confirm Password</label>

            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="reset-message reset-error">
              <i className="bi bi-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="reset-message reset-success">
              <i className="bi bi-check-circle"></i>
              <span>{message}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="reset-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat"></i>
                Resetting...
              </>
            ) : (
              <>
                Reset Password
                <i className="bi bi-check2"></i>
              </>
            )}
          </button>
        </form>

        {/* Back */}
        <button
          type="button"
          className="reset-back-btn"
          onClick={() => navigate("/admin/login")}
        >
          <i className="bi bi-arrow-left"></i>
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;