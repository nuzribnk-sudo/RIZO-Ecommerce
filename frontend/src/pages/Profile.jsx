import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
         "https://rizo-ecommerce-backend.onrender.com/api/users/profile",
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

        const profileData = data.user || data;

        setUser(profileData);

        localStorage.setItem(
          "user",
          JSON.stringify(profileData)
        );
      } catch (error) {
        console.error("Profile API Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // ================= LOGOUT =================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <>
      <Navbar />

      <main className="profile-page">
        <div className="profile-container">

          {/* ================= PAGE HEADER ================= */}

          <div className="profile-header">

            <h1>My Account</h1>

            <p className="profile-subtitle">
              Manage your account and orders
            </p>
          </div>

          {/* ================= LOADING ================= */}

          {loading && (
            <p className="profile-message">
              Loading profile...
            </p>
          )}

          {/* ================= ERROR ================= */}

          {error && (
            <p className="profile-error">
              {error}
            </p>
          )}

          {/* ================= USER INFO ================= */}

          {!loading && !error && (
            <>

              <div className="profile-user">

                <div className="profile-user-details">
                  <p className="profile-welcome">
                    Welcome back
                  </p>

                  <h2>
                    {user?.name || "User"}
                  </h2>

                  <p className="profile-email">
                    {user?.email || ""}
                  </p>
                </div>

                <span className="profile-user-arrow">
                  →
                </span>

              </div>

              {/* ================= ACCOUNT MENU ================= */}

              <div className="profile-menu">

                {/* PERSONAL INFORMATION */}

                <Link
                  to="/profile/personal"
                  className="profile-item"
                >
                  <div className="profile-item-content">
                    <span className="profile-item-number">
                      01
                    </span>

                    <div>
                      <h3>
                        Personal Information
                      </h3>

                      <p>
                        Manage your account details
                      </p>
                    </div>
                  </div>

                  <span className="profile-item-arrow">
                    →
                  </span>
                </Link>

                {/* MY ORDERS */}

                <Link
                  to="/orders"
                  className="profile-item"
                >
                  <div className="profile-item-content">
                    <span className="profile-item-number">
                      02
                    </span>

                    <div>
                      <h3>
                        My Orders
                      </h3>

                      <p>
                        View and track your orders
                      </p>
                    </div>
                  </div>

                  <span className="profile-item-arrow">
                    →
                  </span>
                </Link>

                {/* MY WISHLIST */}

                <Link
                  to="/wishlist"
                  className="profile-item"
                >
                  <div className="profile-item-content">
                    <span className="profile-item-number">
                      03
                    </span>

                    <div>
                      <h3>
                        My Wishlist
                      </h3>

                      <p>
                        View your favourite products
                      </p>
                    </div>
                  </div>

                  <span className="profile-item-arrow">
                    →
                  </span>
                </Link>

                {/* MY ADDRESSES */}

                <Link
                  to="/profile/addresses"
                  className="profile-item"
                >
                  <div className="profile-item-content">
                    <span className="profile-item-number">
                      04
                    </span>

                    <div>
                      <h3>
                        My Addresses
                      </h3>

                      <p>
                        Manage your delivery addresses
                      </p>
                    </div>
                  </div>

                  <span className="profile-item-arrow">
                    →
                  </span>
                </Link>

                {/* CHANGE PASSWORD */}

                <Link
                  to="/profile/change-password"
                  className="profile-item"
                >
                  <div className="profile-item-content">
                    <span className="profile-item-number">
                      05
                    </span>

                    <div>
                      <h3>
                        Change Password
                      </h3>

                      <p>
                        Update your account password
                      </p>
                    </div>
                  </div>

                  <span className="profile-item-arrow">
                    →
                  </span>
                </Link>

              </div>

              {/* ================= LOGOUT ================= */}

              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                LOG OUT
              </button>

            </>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

export default Profile;