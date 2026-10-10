import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import "./AddProduct.css";

const CATEGORY_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/categories";

const PRODUCT_API_URL =
  "https://rizo-ecommerce-backend.onrender.com/api/products";

function EditProduct() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [product, setProduct] = useState({
    sku: "",
    name: "",
    category: "",
    regularPrice: "",
    salePrice: "",
    stock: "",
    variants: [],
    description: "",
    status: "active",
    isBestSeller: false,
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [loadingProduct, setLoadingProduct] =
    useState(true);
  const [saving, setSaving] = useState(false);

  const [existingImages, setExistingImages] =
    useState([]);

  const [newImages, setNewImages] = useState([]);

  // =========================================================
  // LETTER SIZES
  // =========================================================

  const sizes = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
  ];

  // =========================================================
  // NUMERIC SIZES
  // =========================================================

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
  // FETCH PRODUCT
  // =========================================================

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);

        const response = await fetch(
          `${PRODUCT_API_URL}/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = await response.json();

        const p =
          data.product ||
          data.data ||
          data;

        setProduct({
          sku: p.sku || "",
          name: p.name || "",
          category:
            p.category?._id ||
            p.category ||
            "",
          regularPrice:
            p.regularPrice ?? "",
          salePrice:
            p.salePrice ?? "",
          stock: p.stock ?? "",
          variants: Array.isArray(p.variants)
            ? p.variants
            : [],
          description:
            p.description || "",
          status:
            p.status || "active",
          isBestSeller:
            p.isBestSeller === true,
        });

        setExistingImages(
          Array.isArray(p.images)
            ? p.images
            : []
        );
      } catch (error) {
        console.error(
          "Error fetching product:",
          error
        );

        toast.error(
          error.message ||
            "Failed to load product."
        );
      } finally {
        setLoadingProduct(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const response = await fetch(
          CATEGORY_API_URL
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch categories"
          );
        }

        const data =
          await response.json();

        if (Array.isArray(data)) {
          setCategories(data);
        } else if (
          Array.isArray(data.categories)
        ) {
          setCategories(data.categories);
        } else if (
          Array.isArray(data.data)
        ) {
          setCategories(data.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error
        );

        toast.error(
          "Failed to load categories."
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // =========================================================
  // MAIN CATEGORIES
  // =========================================================

  const mainCategories =
    categories.filter(
      (category) => !category.parent
    );

  // =========================================================
  // GET SUBCATEGORIES
  // =========================================================

  const getSubcategories = (
    mainCategoryId
  ) => {
    return categories.filter(
      (subcategory) => {
        if (!subcategory.parent) {
          return false;
        }

        const parentId =
          typeof subcategory.parent ===
          "object"
            ? subcategory.parent?._id
            : subcategory.parent;

        return (
          parentId === mainCategoryId
        );
      }
    );
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
      isBestSeller:
        e.target.checked,
    }));
  };

  // =========================================================
  // NEW IMAGE SELECTION
  // MAXIMUM 5 IMAGES TOTAL
  // =========================================================

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(
      e.target.files || []
    );

    if (!selectedFiles.length) {
      return;
    }

    const totalImages =
      existingImages.length +
      newImages.length;

    const remainingSlots =
      5 - totalImages;

    if (remainingSlots <= 0) {
      toast.error(
        "You can have a maximum of 5 images."
      );

      e.target.value = "";

      return;
    }

    const filesToAdd =
      selectedFiles.slice(
        0,
        remainingSlots
      );

    if (
      selectedFiles.length >
      remainingSlots
    ) {
      toast.warning(
        `Only ${remainingSlots} more image(s) can be added.`
      );
    }

    setNewImages((prev) => [
      ...prev,
      ...filesToAdd,
    ]);

    e.target.value = "";
  };

  // =========================================================
  // REMOVE EXISTING IMAGE
  // =========================================================

  const removeExistingImage = (index) => {
    setExistingImages((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  };

  // =========================================================
  // REMOVE NEW IMAGE
  // =========================================================

  const removeNewImage = (index) => {
    setNewImages((prev) =>
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
  // UPDATE PRODUCT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name.trim()) {
      toast.error(
        "Please enter product name."
      );

      return;
    }

    if (!product.category) {
      toast.error(
        "Please select a category."
      );

      return;
    }

    if (product.regularPrice === "") {
      toast.error(
        "Please enter regular price."
      );

      return;
    }

    if (product.stock === "") {
      toast.error(
        "Please enter stock."
      );

      return;
    }

    if (
      existingImages.length === 0 &&
      newImages.length === 0
    ) {
      toast.error(
        "Please keep at least one product image."
      );

      return;
    }

    if (
      existingImages.length +
        newImages.length >
      5
    ) {
      toast.error(
        "You can have a maximum of 5 images."
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

        slug: generateSlug(
          product.name
        ),

        category: product.category,

        regularPrice: Number(
          product.regularPrice
        ),

        salePrice:
          product.salePrice === ""
            ? 0
            : Number(
                product.salePrice
              ),

        stock: Number(
          product.stock
        ),

        variants:
          product.variants,

        description:
          product.description.trim(),

        status: product.status,

        isBestSeller:
          product.isBestSeller,
      };

      // =====================================================
      // UPDATE PRODUCT
      // =====================================================

      const response = await fetch(
        `${PRODUCT_API_URL}/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            productData
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update product"
        );
      }

      // =====================================================
      // UPLOAD NEW IMAGES
      // =====================================================

      if (newImages.length > 0) {
        const imageFormData =
          new FormData();

        newImages.forEach((image) => {
          imageFormData.append(
            "images",
            image
          );
        });

        const imageResponse =
          await fetch(
            `${PRODUCT_API_URL}/${id}/images`,
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
              "Product updated, but new image upload failed."
          );
        }
      }

      // =====================================================
      // UPDATE EXISTING IMAGE LIST
      // =====================================================

      if (
        Array.isArray(existingImages)
      ) {
        try {
          const imageUpdateResponse =
            await fetch(
              `${PRODUCT_API_URL}/${id}/images`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  images:
                    existingImages,
                }),
              }
            );

          if (
            !imageUpdateResponse.ok
          ) {
            console.warn(
              "Existing image list could not be updated."
            );
          }
        } catch (imageError) {
          console.warn(
            "Image list update skipped:",
            imageError
          );
        }
      }

      // =====================================================
      // SUCCESS TOAST
      // =====================================================

      toast.success(
        "Product updated successfully!",
        {
          hideProgressBar: true,
        }
      );

      // Give Toastify a moment to display before navigation

      setTimeout(() => {
        navigate(
          "/admin/products"
        );
      }, 700);
    } catch (error) {
      console.error(
        "Update product error:",
        error
      );

      toast.error(
        error.message ||
          "Something went wrong while updating the product."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    navigate(
      "/admin/products"
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingProduct) {
    return (
      <div className="add-product-page">
        <div className="add-product-content">
          <div
            style={{
              minHeight: "300px",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              color: "#777",
              fontSize: "13px",
            }}
          >
            Loading product...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // JSX
  // =========================================================

  return (
    <div className="add-product-page">
      <div className="add-product-content">

        {/* HEADER */}

        <div className="add-product-header">
          <div className="add-product-heading">
            <h1>
              Edit Product
            </h1>

            <p>
              Update product details,
              pricing, stock and images.
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

        {/* CARD */}

        <div className="add-product-card">
          <form onSubmit={handleSubmit}>

            {/* SKU + NAME */}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sku">
                  SKU
                </label>

                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={product.sku}
                  onChange={
                    handleChange
                  }
                  placeholder="Enter SKU"
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">
                  Product Name
                </label>

                <input
                  type="text"
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={
                    handleChange
                  }
                  placeholder="Enter product name"
                  required
                />
              </div>
            </div>

            {/* CATEGORY + STOCK */}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={
                    product.category
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {!loadingCategories &&
                    mainCategories.map(
                      (
                        mainCategory
                      ) => {
                        const mainCategoryId =
                          mainCategory._id ||
                          mainCategory.id;

                        const subcategories =
                          getSubcategories(
                            mainCategoryId
                          );

                        return (
                          <React.Fragment
                            key={
                              mainCategoryId
                            }
                          >
                            <option
                              value={
                                mainCategoryId
                              }
                            >
                              ✦{" "}
                              {
                                mainCategory.name
                              }
                            </option>

                            {subcategories.map(
                              (
                                subcategory
                              ) => {
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
                  Select a main category or
                  subcategory.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="stock">
                  Stock
                </label>

                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={product.stock}
                  onChange={
                    handleChange
                  }
                  placeholder="Enter stock quantity"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* PRICES */}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="regularPrice">
                  Regular Price
                </label>

                <input
                  type="number"
                  id="regularPrice"
                  name="regularPrice"
                  value={
                    product.regularPrice
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter regular price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="salePrice">
                  Sale Price
                </label>

                <input
                  type="number"
                  id="salePrice"
                  name="salePrice"
                  value={
                    product.salePrice
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter sale price"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* SIZES */}

            <div className="form-group sizes-group">
              <label>
                Available Sizes
              </label>

              <small className="size-category-label">
                Letter Sizes
              </small>

              <div className="size-selection">
                {sizes.map(
                  (size) => (
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
                        handleSizeChange(
                          size
                        )
                      }
                    >
                      {size}
                    </button>
                  )
                )}
              </div>

              <small className="size-category-label numeric-size-label">
                Numeric Sizes
              </small>

              <div className="size-selection">
                {numericSizes.map(
                  (size) => (
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
                        handleSizeChange(
                          size
                        )
                      }
                    >
                      {size}
                    </button>
                  )
                )}
              </div>

              <small className="size-hint">
                Select all sizes available
                for this product.
              </small>
            </div>

            {/* BEST SELLER */}

            <div className="form-group best-seller-group">
              <div className="best-seller-content">
                <label className="best-seller-title">
                  Best Seller
                </label>

                <small>
                  Highlight this product as
                  a best seller.
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

            {/* PRODUCT IMAGES */}

            <div className="form-group product-image-full">
              <label htmlFor="images">
                Product Images{" "}
                <span>*</span>
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

              {/* EXISTING IMAGES */}

              {existingImages.length >
                0 && (
                <div className="product-image-preview">
                  {existingImages.map(
                    (
                      image,
                      index
                    ) => {
                      const imageUrl =
                        typeof image ===
                        "string"
                          ? image
                          : image?.url ||
                            image?.secure_url ||
                            image?.path ||
                            "";

                      return (
                        <div
                          className="preview-image-box"
                          key={`${imageUrl}-${index}`}
                        >
                          <img
                            src={
                              imageUrl
                            }
                            alt={`Product ${
                              index + 1
                            }`}
                          />

                          <button
                            type="button"
                            className="remove-preview-btn"
                            onClick={() =>
                              removeExistingImage(
                                index
                              )
                            }
                            aria-label="Remove image"
                          >
                            <i className="bi bi-x"></i>
                          </button>

                          <span className="image-number">
                            {index + 1}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* NEW IMAGES */}

              {newImages.length >
                0 && (
                <div className="product-image-preview">
                  {newImages.map(
                    (
                      image,
                      index
                    ) => (
                      <div
                        className="preview-image-box"
                        key={`${image.name}-${index}`}
                      >
                        <img
                          src={URL.createObjectURL(
                            image
                          )}
                          alt={`New product ${
                            index + 1
                          }`}
                        />

                        <button
                          type="button"
                          className="remove-preview-btn"
                          onClick={() =>
                            removeNewImage(
                              index
                            )
                          }
                          aria-label="Remove image"
                        >
                          <i className="bi bi-x"></i>
                        </button>

                        <span className="image-number">
                          {existingImages.length +
                            index +
                            1}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* STATUS */}

            <div className="form-group">
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                name="status"
                value={product.status}
                onChange={
                  handleChange
                }
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            {/* DESCRIPTION */}

            <div className="form-group">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={
                  product.description
                }
                onChange={
                  handleChange
                }
                placeholder="Enter product description"
                rows="5"
              ></textarea>
            </div>

            {/* ACTIONS */}

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
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg"></i>
                    Update Product
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

export default EditProduct;