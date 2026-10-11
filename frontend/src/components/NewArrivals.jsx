import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import "./NewArrivals.css";

function NewArrivals() {
  const [activeFashion, setActiveFashion] = useState("MEN'S FASHION");
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch categories first
        const categoryResponse = await fetch(
          "https://rizo-ecommerce-backend.onrender.com/api/categories/tree"
        );

        const categoryData = await categoryResponse.json();

        if (!categoryResponse.ok) {
          throw new Error(
            categoryData.message || "Failed to fetch categories"
          );
        }

        const categories = categoryData.categories || [];

        setCategoryTree(categories);

        // Find selected main category
        const selectedCategory = categories.find((category) => {
          const categoryName = category.name
            ?.toLowerCase()
            .replace(/[’']/g, "");

          if (activeFashion === "MEN'S FASHION") {
            return (
              categoryName === "mens fashion" ||
              category.slug === "mens-fashion" ||
              category.slug === "men-s-fashion"
            );
          }

          return (
            categoryName === "womens fashion" ||
            category.slug === "womens-fashion" ||
            category.slug === "women-s-fashion"
          );
        });

        if (!selectedCategory) {
          setProducts([]);
          return;
        }

        // Get child category IDs
        const childCategoryIds = (
          selectedCategory.children || []
        ).map((category) => String(category._id));

        // Include parent category also
        const categoryIds = [
          String(selectedCategory._id),
          ...childCategoryIds,
        ];

        // Backend filtering
        const params = new URLSearchParams();

        // Keep limit 8
        params.append("limit", "8");
        params.append("sort", "newest");

        // Send category filter to backend
        params.append("category", categoryIds.join(","));

        const productResponse = await fetch(
  `https://rizo-ecommerce-backend.onrender.com/api/products?${params.toString()}`
);

        const productData = await productResponse.json();

        if (!productResponse.ok) {
          throw new Error(
            productData.message || "Failed to fetch products"
          );
        }

        setProducts(productData.products || []);
      } catch (error) {
        console.error("New Arrivals API Error:", error);
        setError(error.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeFashion]);

  const filteredProducts = products
    .filter((product) => product.status === "active")
    .sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 4);

  const handleViewMore = () => {
    navigate("/new-arrivals", {
      state: {
        activeFashion: activeFashion,
      },
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="new-arrivals" id="new-arrivals">
      <div className="new-arrivals-heading">
        <h2>New Arrivals</h2>

        <p className="new-arrivals-description">
          Step into the latest drops that define the season.
          <br />
          From bold basics to fresh fits — just landed.
        </p>

        <div className="fashion-buttons">
          <button
            className={`fashion-btn ${
              activeFashion === "MEN'S FASHION" ? "active" : ""
            }`}
            onClick={() => setActiveFashion("MEN'S FASHION")}
          >
            Men's Fashion
          </button>

          <button
            className={`fashion-btn ${
              activeFashion === "WOMEN'S FASHION" ? "active" : ""
            }`}
            onClick={() => setActiveFashion("WOMEN'S FASHION")}
          >
            Women's Fashion
          </button>
        </div>
      </div>

      {loading && (
        <p className="new-arrivals-message">
          Loading products...
        </p>
      )}

      {!loading && error && (
        <p className="new-arrivals-message">
          Error: {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                />
              ))
            ) : (
              <p className="new-arrivals-message">
                No products found.
              </p>
            )}
          </div>

          {filteredProducts.length > 0 && (
            <div className="view-more-wrapper">
              <button
                className="view-more-btn"
                onClick={handleViewMore}
              >
                View More
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default NewArrivals;