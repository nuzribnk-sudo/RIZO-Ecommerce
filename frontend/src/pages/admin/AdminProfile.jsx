import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";

function AdminProfile() {
  const navigate = useNavigate();

  // =========================================================
  // PROFILE STATE
  // =========================================================

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
    createdAt: "",
    updatedAt: "",
  });

  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // PASSWORD STATE
  // =========================================================

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);

  // =========================================================
  // MESSAGE STATE
  // =========================================================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // GET TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  };

  // =========================================================
  // FETCH ADMIN PROFILE
  // =========================================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/admin/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch admin profile"
        );
      }

      const admin = data.admin;

      const profileData = {
        name: admin?.name || "",
        email: admin?.email || "",
        phone: admin?.phone || "",
        role: admin?.role || "",
        status: admin?.status || "",
        createdAt: admin?.createdAt || "",
        updatedAt: admin?.updatedAt || "",
      };

      setProfile(profileData);

      setEditData({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      });
    } catch (err) {
      console.error("FETCH PROFILE ERROR:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    fetchProfile();
  }, []);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // EDIT INPUT CHANGE
  // =========================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const token = getToken();

      if (!token) {
        setError("Please login again.");
        return;
      }

      if (!editData.name.trim()) {
        setError("Name is required.");
        return;
      }

      if (!editData.email.trim()) {
        setError("Email is required.");
        return;
      }

      const response = await fetch(`${API_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editData.name.trim(),
          email: editData.email.trim(),
          phone: editData.phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      const admin = data.admin;

      const updatedProfile = {
        name: admin?.name || "",
        email: admin?.email || "",
        phone: admin?.phone || "",
        role: admin?.role || "",
        status: admin?.status || "",
        createdAt: admin?.createdAt || profile.createdAt,
        updatedAt: admin?.updatedAt || profile.updatedAt,
      };

      setProfile(updatedProfile);

      setEditData({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
      });

      setIsEditing(false);
      setMessage("Profile updated successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // PASSWORD INPUT CHANGE
  // =========================================================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setMessage("");
      setError("");

      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = passwordData;

      const token = getToken();

      if (!token) {
        setError("Please login again.");
        return;
      }

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        setError("Please fill all password fields.");
        return;
      }

      if (newPassword.length < 6) {
        setError(
          "New password must be at least 6 characters."
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        setError(
          "New password and confirm password do not match."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/admin/change-password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to change password"
        );
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);

      setMessage("Password changed successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error("CHANGE PASSWORD ERROR:", err);
      setError(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // =========================================================
  // CANCEL PROFILE EDIT
  // =========================================================

  const handleCancelEdit = () => {
    setEditData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
    });

    setIsEditing(false);
    setError("");
  };

  // =========================================================
  // CANCEL PASSWORD
  // =========================================================

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowPasswordForm(false);
    setError("");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="admin-profile-page">
        <div className="profile-loading">
          <i className="bi bi-arrow-repeat"></i>
          <span>Loading admin profile...</span>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="admin-profile-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="profile-header">
        <div>
          <span className="profile-eyebrow">
            ACCOUNT SETTINGS
          </span>

          <h1>Admin Profile</h1>

          <p>
            Manage your account information and security settings.
          </p>
        </div>

        <button
          type="button"
          className="profile-back-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          <i className="bi bi-arrow-left"></i>
          Back to Dashboard
        </button>
      </div>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {message && (
        <div className="profile-message success">
          <i className="bi bi-check-circle-fill"></i>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="profile-message error">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          MAIN PROFILE GRID
      ===================================================== */}

      <div className="profile-main-grid">

        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <div className="profile-left-column">

          {/* PROFILE CARD */}

          <section className="profile-card">

            <div className="profile-card-top">

              <div className="profile-avatar">
                <i className="bi bi-person-fill"></i>
              </div>

              <div className="profile-identity">

                <span className="profile-label">
                  ADMIN ACCOUNT
                </span>

                <h2>
                  {profile.name || "Admin"}
                </h2>

                <div className="profile-role">
                  <i className="bi bi-shield-check"></i>

                  {profile.role === "admin"
                    ? "Administrator"
                    : profile.role || "-"}
                </div>

                <span
                  className={`profile-status ${
                    profile.status === "blocked"
                      ? "blocked"
                      : "active"
                  }`}
                >
                  <span className="status-dot"></span>

                  {profile.status
                    ? profile.status.charAt(0).toUpperCase() +
                      profile.status.slice(1)
                    : "Active"}
                </span>
              </div>
            </div>

            <div className="profile-divider"></div>

            {!isEditing ? (
              <div className="profile-contact-list">

                <div className="profile-contact-item">
                  <div className="contact-icon">
                    <i className="bi bi-person"></i>
                  </div>

                  <div>
                    <span>Full Name</span>
                    <strong>
                      {profile.name || "-"}
                    </strong>
                  </div>
                </div>

                <div className="profile-contact-item">
                  <div className="contact-icon">
                    <i className="bi bi-envelope"></i>
                  </div>

                  <div>
                    <span>Email Address</span>
                    <strong>
                      {profile.email || "-"}
                    </strong>
                  </div>
                </div>

                <div className="profile-contact-item">
                  <div className="contact-icon">
                    <i className="bi bi-telephone"></i>
                  </div>

                  <div>
                    <span>Phone Number</span>
                    <strong>
                      {profile.phone || "-"}
                    </strong>
                  </div>
                </div>

              </div>
            ) : (
              <div className="profile-edit-form">

                <div className="profile-input-group">
                  <label htmlFor="admin-name">
                    Full Name
                  </label>

                  <input
                    id="admin-name"
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="profile-input-group">
                  <label htmlFor="admin-email">
                    Email Address
                  </label>

                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleEditChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="profile-input-group">
                  <label htmlFor="admin-phone">
                    Phone Number
                  </label>

                  <input
                    id="admin-phone"
                    type="text"
                    name="phone"
                    value={editData.phone}
                    onChange={handleEditChange}
                    placeholder="Enter phone number"
                  />
                </div>

              </div>
            )}

            <div className="profile-card-footer">

              {!isEditing ? (
                <button
                  type="button"
                  className="primary-profile-btn"
                  onClick={() => {
                    setIsEditing(true);
                    setError("");
                    setMessage("");
                  }}
                >
                  <i className="bi bi-pencil"></i>
                  Edit Profile
                </button>
              ) : (
                <div className="edit-footer-actions">

                  <button
                    type="button"
                    className="secondary-profile-btn"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary-profile-btn"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <i className="bi bi-arrow-repeat"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2"></i>
                        Save Changes
                      </>
                    )}
                  </button>

                </div>
              )}

            </div>
          </section>

          {/* ACCOUNT INFORMATION */}

          <section className="info-card">

            <div className="section-heading">
              <div className="section-heading-icon">
                <i className="bi bi-person-badge"></i>
              </div>

              <div>
                <h3>Account Information</h3>
                <p>Basic information about your admin account.</p>
              </div>
            </div>

            <div className="account-info-grid">

              <div className="account-info-item">
                <span>Role</span>

                <strong>
                  {profile.role === "admin"
                    ? "Administrator"
                    : profile.role || "-"}
                </strong>
              </div>

              <div className="account-info-item">
                <span>Account Status</span>

                <strong className="account-status-text">
                  <span
                    className={`small-status-dot ${
                      profile.status === "blocked"
                        ? "blocked"
                        : "active"
                    }`}
                  ></span>

                  {profile.status
                    ? profile.status.charAt(0).toUpperCase() +
                      profile.status.slice(1)
                    : "Active"}
                </strong>
              </div>

              <div className="account-info-item">
                <span>Joined Date</span>

                <strong>
                  {formatDate(profile.createdAt)}
                </strong>
              </div>

              <div className="account-info-item">
                <span>Last Updated</span>

                <strong>
                  {formatDate(profile.updatedAt)}
                </strong>
              </div>

            </div>
          </section>
        </div>

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div className="profile-right-column">

          {/* SECURITY CARD */}

          <section className="security-card">

            <div className="security-top">

              <div className="security-icon">
                <i className="bi bi-shield-lock"></i>
              </div>

              <div>
                <span className="profile-label">
                  ACCOUNT SECURITY
                </span>

                <h2>Security Settings</h2>

                <p>
                  Keep your administrator account secure.
                </p>
              </div>

            </div>

            <div className="security-divider"></div>

            <div className="security-item">

              <div className="security-item-icon">
                <i className="bi bi-key"></i>
              </div>

              <div className="security-item-content">
                <strong>Password</strong>

                <span>
                  Change your account password regularly.
                </span>
              </div>

            </div>

            {!showPasswordForm && (
              <button
                type="button"
                className="change-password-btn"
                onClick={() => {
                  setShowPasswordForm(true);
                  setError("");
                  setMessage("");
                }}
              >
                <i className="bi bi-key"></i>
                Change Password
              </button>
            )}

          </section>

          {/* PASSWORD FORM */}

          {showPasswordForm && (
            <section className="password-card">

              <div className="password-card-heading">

                <div>
                  <span className="profile-label">
                    UPDATE PASSWORD
                  </span>

                  <h3>Change Password</h3>

                  <p>
                    Enter your current password and choose a new one.
                  </p>
                </div>

                <button
                  type="button"
                  className="close-password-btn"
                  onClick={handleCancelPassword}
                  aria-label="Close"
                >
                  <i className="bi bi-x"></i>
                </button>

              </div>

              <div className="password-form">

                <div className="password-input-group">
                  <label htmlFor="current-password">
                    Current Password
                  </label>

                  <input
                    id="current-password"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="password-input-group">
                  <label htmlFor="new-password">
                    New Password
                  </label>

                  <input
                    id="new-password"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="password-input-group">
                  <label htmlFor="confirm-password">
                    Confirm New Password
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>

              </div>

              <div className="password-actions">

                <button
                  type="button"
                  className="secondary-profile-btn"
                  onClick={handleCancelPassword}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-profile-btn"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <>
                      <i className="bi bi-arrow-repeat"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2"></i>
                      Update Password
                    </>
                  )}
                </button>

              </div>

            </section>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminProfile;