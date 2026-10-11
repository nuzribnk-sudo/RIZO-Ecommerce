import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

import Footer from "../components/Footer";

import "./Register.css";

function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    event.target.setCustomValidity("");
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const fullName = `${formData.firstName} ${formData.lastName}`;

      const response = await fetch(
        "https://rizo-ecommerce-backend.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("registerEmail", formData.email);

      navigate("/verify-otp", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const eyeIcon = (visible) => {
    if (visible) {
      return (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 9.5 6-.4.8-1.4 2.2-3 3.5" />
          <path d="M6.1 6.1C4.4 7.2 3.2 8.7 2.5 10c1 2 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
        </svg>
      );
    }

    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  };

  return (
    <>
      <Navbar />

      <main className="register-page">
        <section className="register-form-section">
          <div className="register-container">

            <div className="register-header">
              <h1>Register</h1>

              <p className="register-subtitle">
                Create an account and start your shopping journey.
              </p>
            </div>

            {error && (
              <p className="register-error-message">
                {error}
              </p>
            )}

            <form
              className="register-form"
              onSubmit={handleRegister}
            >
              {/* FIRST NAME + LAST NAME */}

              <div className="register-row">
                <div className="register-field">
                  <label htmlFor="firstName">
                    FIRST NAME
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    onInvalid={(event) => {
                      event.target.setCustomValidity(
                        "Please enter your first name."
                      );
                    }}
                    required
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="lastName">
                    LAST NAME
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    onInvalid={(event) => {
                      event.target.setCustomValidity(
                        "Please enter your last name."
                      );
                    }}
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div className="register-field">
                <label htmlFor="email">
                  EMAIL ADDRESS
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  onInvalid={(event) => {
                    if (!event.target.value.trim()) {
                      event.target.setCustomValidity(
                        "Please enter your email address."
                      );
                    } else {
                      event.target.setCustomValidity(
                        "Please enter a valid email address."
                      );
                    }
                  }}
                  required
                />
              </div>

              {/* PHONE */}

              <div className="register-field">
                <label htmlFor="phone">
                  PHONE NUMBER
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  onInvalid={(event) => {
                    event.target.setCustomValidity(
                      "Please enter your phone number."
                    );
                  }}
                  required
                />
              </div>

              {/* PASSWORD + CONFIRM PASSWORD */}

              <div className="register-row">
                <div className="register-field">
                  <label htmlFor="password">
                    PASSWORD
                  </label>

                  <div className="register-input-wrapper">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      onInvalid={(event) => {
                        event.target.setCustomValidity(
                          "Please enter your password."
                        );
                      }}
                      required
                    />

                    <button
                      type="button"
                      className="register-password-eye"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {eyeIcon(showPassword)}
                    </button>
                  </div>
                </div>

                <div className="register-field">
                  <label htmlFor="confirmPassword">
                    CONFIRM PASSWORD
                  </label>

                  <div className="register-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onInvalid={(event) => {
                        event.target.setCustomValidity(
                          "Please confirm your password."
                        );
                      }}
                      required
                    />

                    <button
                      type="button"
                      className="register-password-eye"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {eyeIcon(showConfirmPassword)}
                    </button>
                  </div>
                </div>
              </div>

              {/* TERMS */}

              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  required
                  onInvalid={(event) => {
                    event.target.setCustomValidity(
                      "Please accept the terms and conditions."
                    );
                  }}
                  onChange={(event) => {
                    event.target.setCustomValidity("");
                  }}
                />

                <span>
                  I agree to the terms and conditions.
                </span>
              </label>

              {/* BUTTON */}

              <button
                type="submit"
                className="register-btn"
                disabled={loading}
              >
                {loading
                  ? "CREATING ACCOUNT..."
                  : "CREATE ACCOUNT"}
              </button>
            </form>

            <div className="register-login">
              <span>
                Already have an account?
              </span>

              <Link to="/login">
                LOGIN
              </Link>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Register;