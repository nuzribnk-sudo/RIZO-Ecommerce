
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Addresses.css";

function Addresses() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    addressType: "home",
    isDefault: false,
  });

  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000/api/addresses";

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchAddresses();
  }, [token, navigate]);

  // ================= GET ADDRESSES =================

  const fetchAddresses = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAddresses(data.addresses || []);
      } else {
        console.error(data.message || "Failed to fetch addresses");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLE INPUT =================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ================= RESET FORM =================

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      addressType: "home",
      isDefault: false,
    });
  };

  // ================= ADD ADDRESS =================

  const handleAddAddress = () => {
    setEditingId(null);
    resetForm();
    setShowForm(true);
  };

  // ================= EDIT ADDRESS =================

  const handleEdit = (address) => {
    setEditingId(address._id);

    setFormData({
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
      addressType: address.addressType || "home",
      isDefault: address.isDefault || false,
    });

    setShowForm(true);
  };

  // ================= CANCEL =================

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  // ================= ADD / UPDATE =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        resetForm();

        await fetchAddresses();
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Unable to save address");
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE ADDRESS =================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        await fetchAddresses();
      } else {
        alert(data.message || "Unable to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      alert("Unable to delete address");
    } finally {
      setLoading(false);
    }
  };

  // ================= SET DEFAULT =================

  const handleSetDefault = async (id) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/${id}/default`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        await fetchAddresses();
      } else {
        alert(data.message || "Unable to set default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      alert("Unable to set default address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="addresses-page">

        {/* ================= BIG GLASS CARD ================= */}

        <div className="addresses-container">

          {/* ================= HEADER ================= */}

          <div className="addresses-header">
            <h1>MY ADDRESSES</h1>

            {!showForm && (
              <button
                type="button"
                className="add-address-btn"
                onClick={handleAddAddress}
              >
                + ADD ADDRESS
              </button>
            )}
          </div>

          {/* ================= FORM ================= */}

          {showForm && (
            <form
              className="address-form"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="addressLine1"
                placeholder="Address Line 1"
                value={formData.addressLine1}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="addressLine2"
                placeholder="Address Line 2 (Optional)"
                value={formData.addressLine2}
                onChange={handleChange}
              />

              <input
                type="text"
                name="landmark"
                placeholder="Landmark (Optional)"
                value={formData.landmark}
                onChange={handleChange}
              />

              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="postalCode"
                placeholder="Postal Code"
                value={formData.postalCode}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleChange}
              />

              <select
                name="addressType"
                value={formData.addressType}
                onChange={handleChange}
                className="address-type-select"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>

              <label className="default-checkbox">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />

                <span>Set as default address</span>
              </label>

              <div className="address-form-buttons">
                <button
                  type="submit"
                  className="save-address-btn"
                  disabled={loading}
                >
                  {loading
                    ? "SAVING..."
                    : editingId
                    ? "UPDATE"
                    : "SAVE"}
                </button>

                <button
                  type="button"
                  className="cancel-address-btn"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          {/* ================= ADDRESS LIST ================= */}

          {!showForm && addresses.length > 0 && (
            <div className="addresses-list">
              {addresses.map((address) => (
                <div
                  className="address-wrapper"
                  key={address._id}
                >
                  <div className="address-card">

                    {address.isDefault && (
                      <span className="default-address">
                        DEFAULT
                      </span>
                    )}

                    <h3>{address.fullName}</h3>

                    <p>{address.phone}</p>

                    <p>{address.addressLine1}</p>

                    {address.addressLine2 && (
                      <p>{address.addressLine2}</p>
                    )}

                    {address.landmark && (
                      <p>
                        Landmark: {address.landmark}
                      </p>
                    )}

                    <p>
                      {address.city}, {address.state} -{" "}
                      {address.postalCode}
                    </p>

                    <p>{address.country}</p>

                    <p className="address-type">
                      {address.addressType?.toUpperCase()}
                    </p>

                    <div className="address-actions">
                      <button
                        type="button"
                        className="edit-address-btn"
                        onClick={() => handleEdit(address)}
                        disabled={loading}
                      >
                        EDIT
                      </button>

                      <button
                        type="button"
                        className="delete-address-btn"
                        onClick={() =>
                          handleDelete(address._id)
                        }
                        disabled={loading}
                      >
                        DELETE
                      </button>

                      {!address.isDefault && (
                        <button
                          type="button"
                          className="default-address-btn"
                          onClick={() =>
                            handleSetDefault(address._id)
                          }
                          disabled={loading}
                        >
                          SET DEFAULT
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= EMPTY STATE ================= */}

          {!showForm &&
            addresses.length === 0 &&
            !loading && (
              <div className="no-address">
                <p>No addresses added yet.</p>
              </div>
            )}

        </div>

        {/* ================= BACK BUTTON OUTSIDE BIG CARD ================= */}

        {!showForm && addresses.length > 0 && (
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ← BACK
          </button>
        )}

      </div>

      <Footer />
    </>
  );
}

export default Addresses;

