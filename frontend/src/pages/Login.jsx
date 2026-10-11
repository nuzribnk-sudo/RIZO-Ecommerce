import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Login.css";
import log1 from "../assets/log4.png";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ================= NORMAL LOGIN =================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://rizo-ecommerce-backend.onrender.com/api/auth/login",
        {
          email,
          password,
        }
      );

      const { token, user } = response.data;

      if (user?.role === "admin") {
        throw new Error("Admin account cannot login here.");
      }

      localStorage.setItem("token", token);

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      if (user?._id || user?.id) {
        localStorage.setItem(
          "userId",
          user._id || user.id
        );
      }

      if (rememberMe) {
        localStorage.setItem(
          "rememberMe",
          "true"
        );
      } else {
        localStorage.removeItem(
          "rememberMe"
        );
      }

      toast.success("Login successful!");

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= GOOGLE LOGIN =================

  const handleGoogleLogin = () => {
    setError("");
    setGoogleLoading(true);

    if (!window.google) {
      setGoogleLoading(false);

      setError(
        "Google authentication is not available. Please try again."
      );

      return;
    }

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setGoogleLoading(false);

      setError(
        "Google Client ID is not configured."
      );

      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: async (response) => {
          try {
            const idToken =
              response?.credential;

            if (!idToken) {
              throw new Error(
                "Google authentication token not received."
              );
            }

            const result =
              await axios.post(
                "https://rizo-ecommerce-backend.onrender.com/api/auth/google",
                {
                  idToken,
                }
              );

            const { token, user } =
              result.data;

            localStorage.setItem(
              "token",
              token
            );

            localStorage.setItem(
              "user",
              JSON.stringify(user)
            );

            if (user?._id || user?.id) {
              localStorage.setItem(
                "userId",
                user._id || user.id
              );
            }

            toast.success(
              "Google login successful!"
            );

            navigate("/", {
              replace: true,
            });
          } catch (error) {
            console.error(
              "GOOGLE LOGIN ERROR:",
              error.response?.data ||
                error.message
            );

            setError(
              error.response?.data?.message ||
                "Google login failed. Please try again."
            );
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      window.google.accounts.id.prompt(
        (notification) => {
          if (
            notification.isNotDisplayed() ||
            notification.isSkippedMoment()
          ) {
            setGoogleLoading(false);

            console.log(
              "Google prompt not displayed:",
              notification.getNotDisplayedReason?.()
            );
          }
        }
      );
    } catch (error) {
      console.error(
        "GOOGLE INITIALIZATION ERROR:",
        error
      );

      setGoogleLoading(false);

      setError(
        "Unable to start Google login. Please try again."
      );
    }
  };

  return (
    <>
      <Navbar />

      <main className="login-page">
        <div className="login-layout">

          {/* LEFT IMAGE */}

          <section className="login-image-section">
            <img
              src={log1}
              alt="Rizo fashion collection"
              className="login-image"
            />

            <div className="login-image-overlay"></div>

            <div className="login-image-content">
              <p className="image-small-title">
                WELCOME BACK
              </p>

              <h2>
                Style You Love,
                <br />
                Always Here.
              </h2>

              <p>
                Log in to your account and access
                your orders, wishlist and exclusive
                offers.
              </p>
            </div>
          </section>

          {/* RIGHT LOGIN */}

          <section className="login-form-section">
            <div className="login-container">

              <div className="login-header">
                <h1>Login</h1>

                <p className="login-subtitle">
                  Sign in to continue your shopping journey.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="login-form"
              >

                {/* EMAIL */}

                <div className="login-field">
                  <label htmlFor="email">
                    EMAIL ADDRESS
                  </label>

                  <div className="input-wrapper">
                    <svg
                      className="input-icon"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />

                      <path d="m3 7 9 6 9-6" />
                    </svg>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div className="login-field">
                  <label htmlFor="password">
                    PASSWORD
                  </label>

                  <div className="input-wrapper">
                    <svg
                      className="input-icon"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                      />

                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M3 3l18 18" />

                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />

                          <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.5 4 9.5 6a12 12 0 0 1-3.1 3.7" />

                          <path d="M6.1 6.1C3.9 7.4 2.7 9.2 2.5 10c1 2 4.5 6 9.5 6 1 0 1.9-.2 2.7-.5" />
                        </svg>
                      ) : (
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

                          <circle
                            cx="12"
                            cy="12"
                            r="2.5"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* OPTIONS */}

                <div className="login-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(
                          e.target.checked
                        )
                      }
                    />

                    <span className="custom-checkbox">
                      {rememberMe && "✓"}
                    </span>

                    <span className="remember-text">
                      Remember me
                    </span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* ERROR */}

                {error && (
                  <p className="login-error">
                    {error}
                  </p>
                )}

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading}
                >
                  {loading
                    ? "LOGGING IN..."
                    : "LOGIN"}
                </button>

                {/* DIVIDER */}

                <div className="login-divider">
                  <span></span>

                  <p>OR</p>

                  <span></span>
                </div>

                {/* GOOGLE */}

                <button
                  type="button"
                  className="google-login-btn"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  <svg
                    className="google-icon"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.35 12.23c0-.79-.07-1.55-.2-2.28H12v4.32h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.43Z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.5Z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M6.54 13.58A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.08.31-1.58V7.89H3.29A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.04 4.11l3.25-2.53Z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 6.39c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.45 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.71 5.39l3.25 2.53C7.31 8.11 9.46 6.39 12 6.39Z"
                    />
                  </svg>

                  <span>
                    {googleLoading
                      ? "Connecting..."
                      : "Continue with Google"}
                  </span>
                </button>

              </form>

              {/* REGISTER */}

              <div className="login-register">
                <span>
                  Don't have an account?
                </span>

                <Link to="/register">
                  Create Account
                </Link>
              </div>

            </div>
          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default Login;
