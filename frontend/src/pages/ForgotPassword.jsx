import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
       "https://rizo-ecommerce-backend.onrender.com/api/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      setMessage(
        response.data?.message ||
          "OTP sent to your email."
      );

      // Save email for Reset Password page
      localStorage.setItem(
        "forgotPasswordEmail",
        email.trim()
      );

      // Go to reset password page
      setTimeout(() => {
        navigate("/reset-password");
      }, 1200);

    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to process forgot password request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="forgot-password-page">

        <section className="forgot-password-container">

          {/* HEADER */}

          <div className="forgot-password-header">

            <p>
              PASSWORD RECOVERY
            </p>

            <h1>
              FORGOT PASSWORD?
            </h1>

            <span>
              Enter your email address and we
              will send you an OTP to reset
              your password.
            </span>

          </div>

          {/* SUCCESS MESSAGE */}

          {message && (
            <p className="forgot-success-message">
              {message}
            </p>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <p className="forgot-error-message">
              {error}
            </p>
          )}

          {/* FORM */}

          <form
            className="forgot-password-form"
            onSubmit={handleForgotPassword}
          >

            <div className="forgot-password-field">

              <label htmlFor="email">
                EMAIL ADDRESS
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>

            <button
              type="submit"
              className="forgot-password-btn"
              disabled={loading}
            >
              {loading
                ? "SENDING..."
                : "SEND RESET OTP"}
            </button>

          </form>

          {/* BACK TO LOGIN */}

          <div className="forgot-back-login">

            <Link to="/login">
              ← BACK TO LOGIN
            </Link>

          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}

export default ForgotPassword;