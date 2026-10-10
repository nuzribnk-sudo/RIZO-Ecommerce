import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddProduct.css";

const CATEGORY_API_URL =  "https://rizo-ecommerce-backend.onrender.com/api/categories";;
const PRODUCT_API_URL =  "https://rizo-ecommerce-backend.onrender.com/api/products";

function AddProduct() {
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    sku: "",
    name: "",
    category: "",
    regularPrice: "",
    salePrice: "",
    stock: "",
    variants: [],
    description: "",
    isBestSeller: false,
  });

  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // SIZES
  // =========================================================

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const numericSizes = [
    "28",
    "30",
    "32",
    "34",
    "36",
    "38",
    "40",
    "42",
    "44",
  ];

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const response = await fetch(CATEGORY_API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setCategories(data);
        } else if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else if (Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);

        toast.error("Failed to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // =========================================================
  // MAIN CATEGORIES
  // =========================================================

  const mainCategories = categories.filter(
    (category) => !category.parent
  );

  // =========================================================
  // GET SUBCATEGORIES
  // =========================================================

  const getSubcategories = (mainCategoryId) => {
    return categories.filter((subcategory) => {
      if (!subcategory.parent) {
        return false;
      }

      const parentId =
        typeof subcategory.parent === "object"
          ? subcategory.parent?._id
          : subcategory.parent;

      return parentId === mainCategoryId;
    });
  };

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // SIZE SELECTION
  // =========================================================

  const handleSizeChange = (size) => {
    setProduct((prev) => {
      const alreadySelected =
        prev.variants.includes(size);

      return {
        ...prev,
        variants: alreadySelected
          ? prev.variants.filter(
              (item) => item !== size
            )
          : [...prev.variants, size],
      };
    });
  };

  // =========================================================
  // BEST SELLER
  // =========================================================

  const handleBestSellerChange = (e) => {
    setProduct((prev) => ({
      ...prev,
      isBestSeller: e.target.checked,
    }));
  };

  // =========================================================
  // IMAGE SELECTION
  // MAXIMUM 5 IMAGES
  // =========================================================

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(
      e.target.files || []
    );

    if (!selectedFiles.length) {
      return;
    }

    const remainingSlots = 5 - images.length;

    if (remainingSlots <= 0) {
      toast.error(
        "You can upload a maximum of 5 images."
      );

      e.target.value = "";
      return;
    }

    const filesToAdd = selectedFiles.slice(
      0,
      remainingSlots
    );

    if (selectedFiles.length > remainingSlots) {
      toast.warning(
        `You can select only ${remainingSlots} more image(s).`
      );
    }

    setImages((prev) => [
      ...prev,
      ...filesToAdd,
    ]);

    // Allow selecting the same image again later
    e.target.value = "";
  };

  // =========================================================
  // REMOVE IMAGE
  // =========================================================

  const removeImage = (index) => {
    setImages((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  };

  // =========================================================
  // GENERATE SLUG
  // =========================================================

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // =========================================================
  // SUBMIT PRODUCT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name.trim()) {
      toast.error("Please enter product name.");
      return;
    }

    if (!product.category) {
      toast.error("Please select a category.");
      return;
    }

    if (product.regularPrice === "") {
      toast.error("Please enter regular price.");
      return;
    }

    if (product.stock === "") {
      toast.error("Please enter stock.");
      return;
    }

    if (images.length === 0) {
      toast.error(
        "Please select at least one product image."
      );
      return;
    }

    try {
      setSaving(true);

      // =====================================================
      // PRODUCT DATA
      // =====================================================

      const productData = {
        sku: product.sku.trim(),
        name: product.name.trim(),
        slug: generateSlug(product.name),
        category: product.category,
        regularPrice: Number(
          product.regularPrice
        ),
        salePrice:
          product.salePrice === ""
            ? 0
            : Number(product.salePrice),
        stock: Number(product.stock),

        // XS/S/M/L + 28/30/32 etc.
        variants: product.variants,

        description:
          product.description.trim(),

        isBestSeller:
          product.isBestSeller,
      };

      // =====================================================
      // CREATE PRODUCT
      // =====================================================

      const response = await fetch(
        PRODUCT_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(productData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create product"
        );
      }

      const createdProduct =
        data.product ||
        data.data ||
        data;

      if (!createdProduct?._id) {
        throw new Error(
          "Product created, but product ID was not returned."
        );
      }

      // =====================================================
      // UPLOAD ALL PRODUCT IMAGES
      // =====================================================

      const imageFormData =
        new FormData();

      images.forEach((image) => {
        imageFormData.append(
          "images",
          image
        );
      });

      const imageResponse =
        await fetch(
          `${PRODUCT_API_URL}/${createdProduct._id}/images`,
          {
            method: "POST",
            body: imageFormData,
          }
        );

      const imageData =
        await imageResponse.json();

      if (!imageResponse.ok) {
        throw new Error(
          imageData.message ||
            "Product created, but image upload failed."
        );
      }

      // =====================================================
      // SUCCESS TOAST
      // =====================================================

      toast.success(
        "Product added successfully!"
      );

      // =====================================================
      // RESET FORM
      // =====================================================

      setProduct({
        sku: "",
        name: "",
        category: "",
        regularPrice: "",
        salePrice: "",
        stock: "",
        variants: [],
        description: "",
        isBestSeller: false,
      });

      setImages([]);

      setTimeout(() => {
        navigate("/admin/products");
      }, 700);
    } catch (error) {
      console.error(
        "Add product error:",
        error
      );

      toast.error(
        error.message ||
          "Something went wrong while adding the product."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    navigate("/admin/products");
  };

  // =========================================================
  // JSX
  // =========================================================

  return (
    <div className="add-product-page">
      <div className="add-product-content">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="add-product-header">
          <div className="add-product-heading">
            <h1>Add Product</h1>

            <p>
              Create a new product and add it to your store.
            </p>
          </div>

          <button
            type="button"
            className="back-products-btn"
            onClick={handleCancel}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Products
          </button>
        </div>

        {/* =================================================
            FORM CARD
        ================================================= */}

        <div className="add-product-card">
          <form onSubmit={handleSubmit}>

            {/* =================================================
                PRODUCT DETAILS
            ================================================= */}

            <div className="form-section-title">
              <h2>Product Details</h2>

              <p>
                Add the basic information for your product.
              </p>
            </div>

            {/* =================================================
                ROW 1
            ================================================= */}

            <div className="form-row">

              {/* SKU */}

              <div className="form-group">
                <label htmlFor="sku">
                  SKU
                </label>

                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={product.sku}
                  onChange={handleChange}
                  placeholder="Enter SKU"
                />
              </div>

              {/* PRODUCT NAME */}

              <div className="form-group">
                <label htmlFor="name">
                  Product Name <span>*</span>
                </label>

                <input
                  type="text"
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

            </div>

            {/* =================================================
                ROW 2
            ================================================= */}

            <div className="form-row">

              {/* CATEGORY */}

              <div className="form-group">
                <label htmlFor="category">
                  Category <span>*</span>
                </label>

                <select
                  id="category"
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {!loadingCategories &&
                    mainCategories.map(
                      (mainCategory) => {
                        const mainCategoryId =
                          mainCategory._id ||
                          mainCategory.id;

                        const subcategories =
                          getSubcategories(
                            mainCategoryId
                          );

                        return (
                          <React.Fragment
                            key={mainCategoryId}
                          >
                            <option
                              value={
                                mainCategoryId
                              }
                            >
                              {mainCategory.name}
                            </option>

                            {subcategories.map(
                              (subcategory) => {
                                const subcategoryId =
                                  subcategory._id ||
                                  subcategory.id;

                                return (
                                  <option
                                    key={
                                      subcategoryId
                                    }
                                    value={
                                      subcategoryId
                                    }
                                  >
                                    {"   ↳ "}
                                    {
                                      subcategory.name
                                    }
                                  </option>
                                );
                              }
                            )}
                          </React.Fragment>
                        );
                      }
                    )}
                </select>

                <small className="size-hint">
                  Select a main category or subcategory.
                </small>
              </div>

              {/* STOCK */}

              <div className="form-group">
                <label htmlFor="stock">
                  Stock <span>*</span>
                </label>

                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={product.stock}
                  onChange={handleChange}
                  placeholder="Enter stock quantity"
                  min="0"
                  required
                />
              </div>

            </div>

            {/* =================================================
                PRICING
            ================================================= */}

            <div className="form-section-title compact">
              <h2>Pricing</h2>

              <p>
                Set the regular and sale price for this product.
              </p>
            </div>

            {/* =================================================
                ROW 3
            ================================================= */}

            <div className="form-row">

              {/* REGULAR PRICE */}

              <div className="form-group">
                <label htmlFor="regularPrice">
                  Regular Price <span>*</span>
                </label>

                <div className="price-input">
                  <span>₹</span>

                  <input
                    type="number"
                    id="regularPrice"
                    name="regularPrice"
                    value={
                      product.regularPrice
                    }
                    onChange={handleChange}
                    placeholder="Enter regular price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* SALE PRICE */}

              <div className="form-group">
                <label htmlFor="salePrice">
                  Sale Price
                </label>

                <div className="price-input">
                  <span>₹</span>

                  <input
                    type="number"
                    id="salePrice"
                    name="salePrice"
                    value={
                      product.salePrice
                    }
                    onChange={handleChange}
                    placeholder="Enter sale price"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

            </div>

            {/* =================================================
                SIZES
            ================================================= */}

            <div className="form-group sizes-group">

              <label>
                Available Sizes
              </label>

              {/* LETTER SIZES */}

              <small className="size-category-label">
                Letter Sizes
              </small>

              <div className="size-selection">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-option ${
                      product.variants.includes(
                        size
                      )
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleSizeChange(size)
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* NUMERIC SIZES */}

              <small className="size-category-label numeric-size-label">
                Numeric Sizes
              </small>

              <div className="size-selection">
                {numericSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-option ${
                      product.variants.includes(
                        size
                      )
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleSizeChange(size)
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>

              <small className="size-hint">
                Select all sizes available for this product.
              </small>

            </div>

            {/* =================================================
                BEST SELLER
            ================================================= */}

            <div className="form-group best-seller-group">

              <div className="best-seller-content">
                <label className="best-seller-title">
                  Best Seller
                </label>

                <small>
                  Highlight this product as a best seller.
                </small>
              </div>

              <label className="best-seller-checkbox">
                <input
                  type="checkbox"
                  checked={
                    product.isBestSeller
                  }
                  onChange={
                    handleBestSellerChange
                  }
                />

                <span>
                  Mark this product as Best Seller
                </span>
              </label>

            </div>

            {/* =================================================
                PRODUCT IMAGES
            ================================================= */}

            <div className="form-group product-image-full">

              <label htmlFor="images">
                Product Images <span>*</span>
              </label>

              <div className="file-upload-box">

                <label
                  htmlFor="images"
                  className="choose-image-btn"
                >
                  <i className="bi bi-upload"></i>
                  Choose Images
                </label>

                <input
                  type="file"
                  id="images"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={
                    handleImageChange
                  }
                />

              </div>

              {/* IMAGE PREVIEW */}

              {images.length > 0 && (
                <div className="product-image-preview">

                  {images.map(
                    (image, index) => (
                      <div
                        className="preview-image-box"
                        key={`${image.name}-${index}`}
                      >

                        <img
                          src={URL.createObjectURL(
                            image
                          )}
                          alt={`Product ${
                            index + 1
                          }`}
                        />

                        <button
                          type="button"
                          className="remove-preview-btn"
                          onClick={() =>
                            removeImage(index)
                          }
                          aria-label={`Remove image ${
                            index + 1
                          }`}
                        >
                          <i className="bi bi-x"></i>
                        </button>

                        <span className="image-number">
                          {index + 1}
                        </span>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="form-group description-group">

              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={
                  product.description
                }
                onChange={handleChange}
                placeholder="Enter product description"
                rows="5"
              ></textarea>

              <small className="size-hint">
                Add a clear description of the product for
                customers.
              </small>

            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-product-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="bi bi-arrow-repeat"></i>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg"></i>
                    Add Product
                  </>
                )}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;