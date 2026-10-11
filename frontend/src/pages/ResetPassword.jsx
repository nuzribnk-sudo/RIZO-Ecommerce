import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Login.css";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    localStorage.getItem("forgotPasswordEmail") || ""
  );

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !email ||
      !otp ||
      !newPassword ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://rizo-ecommerce-backend.onrender.com/api/auth/reset-password",
        {
          email,
          otp,
          newPassword,
        }
      );

      setMessage(
        response.data?.message ||
          "Password reset successfully!"
      );

      localStorage.removeItem(
        "forgotPasswordEmail"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="reset-password-page">
        <section className="reset-password-container">

          <div className="reset-password-header">

            <h1>RESET PASSWORD</h1>

            <span>
              Enter the OTP sent to your email
              and create a new password.
            </span>
          </div>

          {message && (
            <p className="reset-success-message">
              {message}
            </p>
          )}

          {error && (
            <p className="reset-error-message">
              {error}
            </p>
          )}

          <form
            className="reset-password-form"
            onSubmit={handleResetPassword}
          >

            {/* EMAIL */}

            <div className="reset-password-field">
              <label htmlFor="email">
                EMAIL ADDRESS
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            {/* OTP */}

            <div className="reset-password-field">
              <label htmlFor="otp">
                OTP
              </label>

              <input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value)
                }
                maxLength="6"
                required
              />
            </div>

            {/* NEW PASSWORD */}

            <div className="reset-password-field">
              <label htmlFor="newPassword">
                NEW PASSWORD
              </label>

              <input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                required
              />
            </div>

            {/* CONFIRM PASSWORD */}

            <div className="reset-password-field">
              <label htmlFor="confirmPassword">
                CONFIRM PASSWORD
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                required
              />
            </div>

            {/* RESET BUTTON */}

            <button
              type="submit"
              className="reset-password-btn"
              disabled={loading}
            >
              {loading
                ? "RESETTING..."
                : "RESET PASSWORD"}
            </button>

          </form>

          <div className="reset-back-login">
            <Link to="/login">
              BACK TO LOGIN
            </Link>
          </div>

        </section>
      </main>

      <Footer />
    </>
  );
}

export default ResetPassword;