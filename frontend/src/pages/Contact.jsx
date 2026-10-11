import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import Footer from "../components/Footer";

import toast from "react-hot-toast";

import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    comment: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Scroll to top when page opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      setLoading(true);

      const response = await fetch(
        "https://rizo-ecommerce-backend.onrender.com/api/contacts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send message"
        );
      }

      // Success toast
      toast.success(
        "Message sent successfully! We will contact you soon."
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        comment: "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="contact-page">
        <section className="contact-section">
          <h1>Contact</h1>

          {message && (
            <p className="contact-success">
              {message}
            </p>
          )}

          {error && (
            <p className="contact-error">
              {error}
            </p>
          )}

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >
            <div className="contact-row">
              <input
                type="text"
                placeholder="NAME"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <input
                type="email"
                placeholder="EMAIL *"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <input
              type="tel"
              placeholder="PHONE NUMBER"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />

            <textarea
              placeholder="COMMENT"
              name="comment"
              rows="6"
              value={formData.comment}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? "SENDING..." : "SEND"}
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Contact;