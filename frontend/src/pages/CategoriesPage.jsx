import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./CategoriesPage.css";

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/categories/tree"
        );

        const data = await response.json();

        if (response.ok) {
          const fashionCategories = (data.categories || []).filter(
            (category) => {
              const name = category.name
                ?.toLowerCase()
                .replace(/[’']/g, "");

              return (
                name === "mens fashion" ||
                name === "womens fashion"
              );
            }
          );

          setCategories(fashionCategories);
        }
      } catch (error) {
        console.error("Category API Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      <Navbar />

      <main className="customer-categories-page">
        <section className="categories-heading">
          <h1>Shop by Category</h1>

          <p>
            Explore our collections and find your perfect style.
          </p>
        </section>

        <section className="fashion-category-section">
          {loading ? (
            <p className="categories-message">
              Loading categories...
            </p>
          ) : (
            <div className="fashion-category-grid">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                  className="fashion-category-card"
                >
                  <div className="fashion-category-content">
                    <h2>{category.name}</h2>

                    <p>
                      Explore our latest {category.name} collection
                    </p>

                    <span>Explore Collection →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

export default CategoriesPage;