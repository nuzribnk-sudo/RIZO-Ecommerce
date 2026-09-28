import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  UserRoundCheck,
  ShoppingBag,
  Search,
  Heart,
} from "lucide-react";
import logo from "../assets/logo.png";
import "./Navbar.css";

const API_URL = "http://localhost:5000/api";

function Navbar() {
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const navigate = useNavigate();
  const navbarRef = useRef(null);

  const token = localStorage.getItem("token");

  // =========================
  // CART + WISHLIST COUNTS
  // =========================
  useEffect(() => {
    const fetchCounts = async () => {
      if (!token) {
        setCartCount(0);
        setWishlistCount(0);
        return;
      }

      try {
        const cartResponse = await fetch(`${API_URL}/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          const cartItems = cartData.cart?.items || [];
          setCartCount(cartItems.length);
        } else {
          setCartCount(0);
        }

        const wishlistResponse = await fetch(`${API_URL}/wishlist`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();
          const wishlistProducts =
            wishlistData.wishlist?.products || [];

          setWishlistCount(wishlistProducts.length);
        } else {
          setWishlistCount(0);
        }
      } catch (error) {
        console.error("Navbar count fetch error:", error);
        setCartCount(0);
        setWishlistCount(0);
      }
    };

    fetchCounts();

    const handleCartWishlistUpdate = () => {
      fetchCounts();
    };

    window.addEventListener(
      "cartUpdated",
      handleCartWishlistUpdate
    );

    window.addEventListener(
      "wishlistUpdated",
      handleCartWishlistUpdate
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartWishlistUpdate
      );

      window.removeEventListener(
        "wishlistUpdated",
        handleCartWishlistUpdate
      );
    };
  }, [token]);

  // =========================
  // SEARCH SUGGESTIONS
  // =========================
  useEffect(() => {
    const searchText = search.trim();

    if (!searchText) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);

        const response = await fetch(
          `${API_URL}/products/search-suggestions?search=${encodeURIComponent(
            searchText
          )}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();

        setSuggestions(data.suggestions || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Search suggestions error:", error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  // =========================
  // SEARCH
  // =========================
  const handleSearch = (e) => {
    e.preventDefault();

    const searchText = search.trim();

    if (!searchText) {
      return;
    }

    navigate(
      `/shop?search=${encodeURIComponent(searchText)}`
    );

    setSearch("");
    setSuggestions([]);
    setShowSearch(false);
    setShowMenu(false);
  };

  // =========================
  // SUGGESTION CLICK
  // =========================
  const handleSuggestionClick = (suggestion) => {
    const searchText = suggestion.name || suggestion.sku;

    if (!searchText) {
      return;
    }

    navigate(
      `/shop?search=${encodeURIComponent(searchText)}`
    );

    setSearch("");
    setSuggestions([]);
    setShowSearch(false);
    setShowMenu(false);
  };

  // =========================
  // CLOSE SEARCH
  // =========================
  const closeSearch = () => {
    setShowSearch(false);
    setSuggestions([]);
  };

  // =========================
  // CLOSE MENU
  // =========================
  const closeMenu = () => {
    setShowMenu(false);
    setShowSearch(false);
    setSuggestions([]);
  };

  // =========================
  // OUTSIDE CLICK
  // =========================
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setShowSearch(false);
        setSuggestions([]);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // =========================
  // ESCAPE
  // =========================
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowSearch(false);
        setShowMenu(false);
        setSuggestions([]);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  return (
    <header className="navbar" ref={navbarRef}>
      {/* LOGO */}
      <Link
        to="/"
        replace
        className="logo"
        onClick={closeMenu}
      >
        <img src={logo} alt="Rizo" />
      </Link>

      {/* NAVIGATION */}
      <nav
        className={`nav-links ${
          showMenu ? "mobile-open" : ""
        }`}
      >
        <Link to="/" replace onClick={closeMenu}>
          Home
        </Link>

        <Link to="/shop" onClick={closeMenu}>
          Shop
        </Link>

        <Link
          to="/new-arrivals"
          onClick={closeMenu}
        >
          New Arrivals
        </Link>

        <Link to="/about" onClick={closeMenu}>
          About
        </Link>

        <Link to="/contact" onClick={closeMenu}>
          Contact
        </Link>
      </nav>

      {/* RIGHT ICONS */}
      <div className="nav-icons">
        {/* SEARCH */}
        <button
          type="button"
          aria-label="Search"
          onClick={() => {
            setShowSearch((prev) => !prev);
            setShowMenu(false);

            if (showSearch) {
              setSuggestions([]);
            }
          }}
        >
          <Search
            size={14}
            strokeWidth={1.5}
          />
        </button>

        {/* ACCOUNT */}
        <Link
          to={token ? "/profile" : "/login"}
          aria-label={
            token ? "Account" : "Login"
          }
          className="account-icon"
          onClick={closeSearch}
        >
          {token ? (
            <UserRoundCheck
              size={15}
              strokeWidth={1.5}
            />
          ) : (
            <UserRound
              size={15}
              strokeWidth={1.5}
            />
          )}
        </Link>

        {/* WISHLIST */}
        <Link
          to="/wishlist"
          aria-label="Wishlist"
          className="wishlist-nav-icon"
          onClick={closeSearch}
        >
          <Heart
            size={14}
            strokeWidth={1.5}
          />

          {wishlistCount > 0 && (
            <span className="nav-count wishlist-count">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* CART */}
        <Link
          to="/cart"
          aria-label="Cart"
          className="cart-nav-icon"
          onClick={closeSearch}
        >
          <ShoppingBag
            size={14}
            strokeWidth={1.5}
          />

          {cartCount > 0 && (
            <span className="nav-count cart-count">
              {cartCount}
            </span>
          )}
        </Link>

        {/* MOBILE MENU */}
        <button
          type="button"
          className="menu-toggle"
          aria-label="Menu"
          onClick={() => {
            setShowMenu((prev) => !prev);
            setShowSearch(false);
            setSuggestions([]);
          }}
        >
          {showMenu ? "✕" : "☰"}
        </button>
      </div>

      {/* SEARCH BOX */}
      {showSearch && (
        <div className="search-wrapper">
          <form
            className="search-box"
            onSubmit={handleSearch}
          >
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              autoFocus
            />

            <button type="submit">
              Search
            </button>
          </form>

          {/* SUGGESTIONS */}
          {search.trim() && (
            <div className="search-suggestions">
              {loadingSuggestions ? (
                <div className="suggestion-loading">
                  Searching...
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <button
                    type="button"
                    className="suggestion-item"
                    key={suggestion._id}
                    onClick={() =>
                      handleSuggestionClick(
                        suggestion
                      )
                    }
                  >
                    <span className="suggestion-name">
                      {suggestion.name}
                    </span>

                    {suggestion.sku && (
                      <span className="suggestion-sku">
                        {suggestion.sku}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="suggestion-empty">
                  No products found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;

