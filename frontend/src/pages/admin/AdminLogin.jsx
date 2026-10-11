
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/rizo-logo.png";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://rizo-ecommerce-backend.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password"
        );
      }

      // Check admin role
      if (data.user?.role !== "admin") {
        throw new Error(
          "You are not authorized as an admin"
        );
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save user details
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Navigate to admin dashboard
      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (error) {
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        {/* Logo */}
        <div className="login-brand">
          <img
            src={logo}
            alt="RIZO Logo"
            className="rizo-logo"
          />
          <h1>RIZO</h1>
          <p>Admin Panel</p>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h2>Welcome Back</h2>
          <p>Login to manage your store</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="login-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="login-group">
            <label>Password</label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                aria-pressed={showPassword}
              >
                <i
                  className={
                    showPassword
                      ? "bi bi-eye-slash"
                      : "bi bi-eye"
                  }
                  aria-hidden="true"
                ></i>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          {/* Forgot Password */}
          <div className="login-options">
            <button
              type="button"
              className="forgot-password"
              onClick={() =>
                navigate("/admin/forgot-password")
              }
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
