import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./BlogDetails.css";

const blogs = [
  {
    id: 1,
    category: "FASHION",
    title: "How to Build Your Perfect Everyday Wardrobe",
    date: "August 20, 2026",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
    description:
      "Building a wardrobe that feels uniquely yours doesn't have to be complicated. Start with timeless essentials and add pieces that reflect your personality.",
  },
  {
    id: 2,
    category: "STYLE GUIDE",
    title: "5 Fashion Trends You Should Know",
    date: "August 15, 2026",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    description:
      "From timeless silhouettes to fresh seasonal details, discover the trends that are shaping modern fashion.",
  },
  {
    id: 3,
    category: "RIZO EDIT",
    title: "New Season, New Style",
    date: "August 10, 2026",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=80",
    description:
      "A new season is the perfect opportunity to refresh your wardrobe and experiment with new looks.",
  },
  {
    id: 4,
    category: "FASHION",
    title: "How to Choose the Right Outfit",
    date: "August 5, 2026",
    image:
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80",
    description:
      "Learn how to choose outfits that match your personal style, occasion and everyday comfort.",
  },
  {
    id: 5,
    category: "STYLE GUIDE",
    title: "Minimal Fashion for Everyday Life",
    date: "July 28, 2026",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    description:
      "Minimal fashion is about choosing simple, versatile pieces that work together effortlessly.",
  },
  {
    id: 6,
    category: "RIZO EDIT",
    title: "Behind the Style at RIZO",
    date: "July 20, 2026",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
    description:
      "Take a closer look at the inspiration and ideas behind the RIZO style.",
  },
];

const featuredBlog = {
  id: "featured",
  category: "RIZO JOURNAL",
  title: "Discover Your Personal Style",
  date: "August 25, 2026",
  image:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
  description:
    "Your personal style is more than just the clothes you wear. Discover how to build a wardrobe that feels authentic to you.",
};

function BlogDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const blog =
    location.state?.blog ||
    (id === "featured"
      ? featuredBlog
      : blogs.find((item) => item.id === Number(id)));

  if (!blog) {
    return (
      <>
        <Navbar />

        <main className="blog-details-page">
          <div className="blog-not-found">
            <h1>Article Not Found</h1>

            <button type="button" onClick={() => navigate("/blog")}>
              BACK TO BLOG
            </button>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="blog-details-page">
        <section className="blog-details-hero">
          <img src={blog.image} alt={blog.title} />
        </section>

        <article className="blog-details-content">
          <div className="blog-details-meta">
            <span>{blog.category}</span>
            <span>{blog.date}</span>
          </div>

          <h1>{blog.title}</h1>

          <p className="blog-details-intro">{blog.description}</p>

          <div className="blog-details-text">
            <p>
              Fashion is a way to express your personality and create a style
              that feels comfortable and authentic. Building your personal
              style starts with understanding what you enjoy wearing and what
              makes you feel confident.
            </p>

            <p>
              Instead of following every trend, focus on pieces that work well
              with your existing wardrobe. Timeless basics can easily be
              combined with seasonal pieces to create different looks.
            </p>

            <p>
              The most important part of developing your style is experimenting.
              Try different combinations, colours and silhouettes until you
              discover what feels right for you.
            </p>

            <p>
              At RIZO, we believe fashion should be simple, expressive and
              personal. Your wardrobe should reflect who you are while giving
              you the freedom to create your own look every day.
            </p>
          </div>

          <button
            type="button"
            className="back-to-blog"
            onClick={() => navigate("/blog")}
          >
            ← BACK TO BLOG
          </button>
        </article>
      </main>

      <Footer />
    </>
  );
}

export default BlogDetails;