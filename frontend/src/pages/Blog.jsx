import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";
import "./Blog.css";

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

function Blog() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleReadMore = () => {
    navigate("/blog/featured", {
      state: { blog: featuredBlog },
    });
  };

  const handleReadArticle = (blog) => {
    navigate(`/blog/${blog.id}`, {
      state: { blog },
    });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();

    toast.success("Thank you for subscribing!", {
      duration: 2000,
      position: "top-center",
    });

    e.target.reset();
  };

  return (
    <>
      <Navbar />

      <main className="blog-page">
        {/* HERO */}
        <section className="blog-hero">
          <div className="blog-hero-overlay">
            <p>RIZO JOURNAL</p>
            <h1>BLOG</h1>
          </div>
        </section>

        {/* FEATURED BLOG */}
        <section className="featured-blog">
          <div className="featured-blog-image">
            <img
              src={featuredBlog.image}
              alt={featuredBlog.title}
            />
          </div>

          <div className="featured-blog-content">
            <span>{featuredBlog.category}</span>

            <h2>{featuredBlog.title}</h2>

            <p>{featuredBlog.description}</p>

            <button type="button" onClick={handleReadMore}>
              READ MORE →
            </button>
          </div>
        </section>

        {/* LATEST STORIES */}
        <section className="latest-stories">
          <div className="section-heading">
            <p>FROM RIZO</p>
            <h2>LATEST STORIES</h2>
          </div>

          <div className="blog-grid">
            {blogs.map((blog) => (
              <article className="blog-card" key={blog.id}>
                <div className="blog-card-image">
                  <img src={blog.image} alt={blog.title} />
                </div>

                <div className="blog-card-content">
                  <div className="blog-meta">
                    <span>{blog.category}</span>
                    <span>{blog.date}</span>
                  </div>

                  <h3>{blog.title}</h3>

                  <p>{blog.description}</p>

                  <button
                    type="button"
                    onClick={() => handleReadArticle(blog)}
                  >
                    READ ARTICLE →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="blog-newsletter">
          <div className="newsletter-content">
            <p>STAY IN STYLE</p>

            <h2>JOIN THE RIZO JOURNAL</h2>

            <span>
              Subscribe to receive the latest fashion stories, style
              inspiration and updates from RIZO.
            </span>

            <form onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Enter your email address"
                required
              />

              <button type="submit">SUBSCRIBE →</button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Blog;