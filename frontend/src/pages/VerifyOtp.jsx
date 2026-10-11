import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./VerifyOtp.css";

function VerifyOtp() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [timeLeft, setTimeLeft] = useState(60);

  const email = localStorage.getItem("registerEmail");

  // ================= TOAST AUTO HIDE =================
  useEffect(() => {
    if (!message && !error) return;

    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [message, error]);

  // ================= COUNTDOWN TIMER =================
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // ================= FORMAT TIME =================
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // ================= VERIFY OTP =================
  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError("Email not found. Please register again.");
      return;
    }

    if (timeLeft <= 0) {
      setError("OTP expired. Please resend OTP.");
      return;
    }

    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
       "https://rizo-ecommerce-backend.onrender.com/api/auth/verify-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "OTP verification failed"
        );
      }

      // ================= SAVE LOGIN TOKEN =================
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // ================= SAVE USER DETAILS =================
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        if (data.user._id || data.user.id) {
          localStorage.setItem(
            "userId",
            data.user._id || data.user.id
          );
        }
      }

      // ================= SUCCESS TOAST =================
      setMessage(
        data.message || "Email verified successfully!"
      );

      // Remove registration email
      localStorage.removeItem("registerEmail");

      // ================= GO TO HOME =================
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (error) {
      console.error("OTP Verification Error:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= RESEND OTP =================
  const handleResendOtp = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Email not found. Please register again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
       "https://rizo-ecommerce-backend.onrender.com/api/auth/resend-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to resend OTP"
        );
      }

      // ================= SUCCESS TOAST =================
      setMessage(
        data.message || "New OTP sent successfully"
      );

      // Restart timer
      setTimeLeft(60);

      // Clear old OTP
      setOtp("");
    } catch (error) {
      console.error("Resend OTP Error:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* ================= TOAST ================= */}

      {message && (
        <div className="verify-toast verify-toast-success">
          <span className="verify-toast-icon">✓</span>

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="verify-toast verify-toast-error">
          <span className="verify-toast-icon">!</span>

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <main className="verify-otp-page">
        <section className="verify-otp-container">

          {/* ================= HEADER ================= */}

          <div className="verify-otp-header">
            <p>EMAIL VERIFICATION</p>

            <h1>Verify OTP</h1>

            <span>
              Enter the verification code sent to your email
              address.
            </span>
          </div>

          {/* ================= EMAIL ================= */}

          {email && (
            <p className="otp-email">
              {email}
            </p>
          )}

          {/* ================= TIMER ================= */}

          <div className="otp-timer">
            {timeLeft > 0 ? (
              <>
                OTP expires in{" "}
                <strong>
                  {formatTime(timeLeft)}
                </strong>
              </>
            ) : (
              <strong>OTP EXPIRED</strong>
            )}
          </div>

          {/* ================= OTP FORM ================= */}

          <form
            className="verify-otp-form"
            onSubmit={handleVerifyOtp}
          >
            <div className="verify-otp-field">
              <label htmlFor="otp">
                ENTER OTP
              </label>

              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                disabled={timeLeft <= 0}
                required
              />
            </div>

            <button
              type="submit"
              className="verify-otp-btn"
              disabled={
                loading || timeLeft <= 0
              }
            >
              {loading
                ? "VERIFYING..."
                : timeLeft <= 0
                ? "OTP EXPIRED"
                : "VERIFY OTP"}
            </button>
          </form>

          {/* ================= RESEND OTP ================= */}

          <div className="resend-otp">
            <span>
              Didn't receive the OTP?
            </span>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
            >
              {loading
                ? "SENDING..."
                : "RESEND OTP"}
            </button>
          </div>

          {/* ================= BACK TO LOGIN ================= */}

          <div className="back-login">
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

export default VerifyOtp;