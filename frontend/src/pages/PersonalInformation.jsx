import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

import Footer from "../components/Footer";

import toast from "react-hot-toast";

import "./PersonalInformation.css";

function PersonalInformation() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // ================= GET PROFILE =================

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/users/profile",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch profile"
          );
        }

        const userData = data.user || data;

        setName(userData.name || "");
        setEmail(userData.email || "");
        setPhone(userData.phone || "");

        // Update localStorage
        localStorage.setItem(
          "user",
          JSON.stringify(userData)
        );
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // ================= PHONE VALIDATION =================

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 10) {
      setPhone(value);
    }

    setError("");
  };

  // ================= UPDATE PROFILE =================

  const handleSave = async (e) => {
    e.preventDefault();

    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (phone && phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "http://localhost:5000/api/users/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      // Backend response could be data.user or direct user object
      const updatedUser = data.user || data;

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      // Success message as toast only
      toast.success(
        data.message || "Profile updated successfully!"
      );

      setTimeout(() => {
        navigate("/profile");
      }, 1200);
    } catch (error) {
      console.error("Profile update error:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="personal-page">
        <div className="personal-container">
          <h1>PERSONAL INFORMATION</h1>

          {loading && (
            <p className="profile-message">
              Loading profile...
            </p>
          )}

          {error && (
            <p className="phone-error">
              {error}
            </p>
          )}

          {!loading && (
            <form
              className="personal-form"
              onSubmit={handleSave}
            >
              {/* FULL NAME */}

              <div className="personal-field">
                <label>FULL NAME</label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* EMAIL */}

              <div className="personal-field">
                <label>EMAIL ADDRESS</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* PHONE */}

              <div className="personal-field">
                <label>PHONE NUMBER</label>

                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter your 10 digit phone number"
                  maxLength="10"
                />
              </div>

              {/* BUTTONS */}

              <div className="personal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => navigate("/profile")}
                  disabled={saving}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="save-profile-btn"
                  disabled={saving}
                >
                  {saving
                    ? "SAVING..."
                    : "SAVE CHANGES"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default PersonalInformation;