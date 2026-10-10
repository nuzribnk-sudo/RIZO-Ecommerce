import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Categories.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api/categories";
const PRODUCT_API_URL = "https://rizo-ecommerce-backend.onrender.com/api/products";

function Categories() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("main");
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    parent: "",
  });

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  };

  // =========================================================
  // HEADERS
  // =========================================================

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // =========================================================
  // SORT CATEGORIES
  // MAIN CATEGORIES FIRST
  // NEWEST MAIN CATEGORY FIRST
  // THEN SUBCATEGORIES
  // =========================================================

  const sortCategories = (categoryList) => {
    return [...categoryList].sort((a, b) => {
      const aIsMain = !a.parent;
      const bIsMain = !b.parent;

      // Main categories always come first
      if (aIsMain && !bIsMain) {
        return -1;
      }

      if (!aIsMain && bIsMain) {
        return 1;
      }

      // Within the same type,
      // newest category first
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();

      return bDate - aDate;
    });
  };

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  const fetchCategories = async (
    searchValue = search,
    statusValue = status
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      if (statusValue && statusValue !== "all") {
        params.append("status", statusValue);
      }

      const query = params.toString();

      const response = await fetch(
        query ? `${API_URL}?${query}` : API_URL,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch categories"
        );
      }

      const categoryList = data.categories || [];

      setCategories(sortCategories(categoryList));
    } catch (err) {
      console.error("Fetch categories error:", err);

      setError(
        err.message || "Failed to load categories"
      );

      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH ALL PRODUCTS
  //
  // Product API is paginated.
  // So we fetch every page to calculate
  // the correct category product count.
  // =========================================================

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);

      // -----------------------------------------------------
      // FIRST PAGE
      // -----------------------------------------------------

      const firstResponse = await fetch(
        `${PRODUCT_API_URL}?page=1&limit=10`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const firstData = await firstResponse.json();

      if (!firstResponse.ok) {
        throw new Error(
          firstData.message || "Failed to fetch products"
        );
      }

      const firstProducts = Array.isArray(
        firstData.products
      )
        ? firstData.products
        : [];

      const pagination = firstData.pagination || {};

      const totalPages =
        Number(pagination.totalPages) || 1;

      // -----------------------------------------------------
      // ONLY ONE PAGE
      // -----------------------------------------------------

      if (totalPages <= 1) {
        setProducts(firstProducts);
        return;
      }

      // -----------------------------------------------------
      // FETCH REMAINING PAGES
      // -----------------------------------------------------

      const pageRequests = [];

      for (
        let page = 2;
        page <= totalPages;
        page++
      ) {
        pageRequests.push(
          fetch(
            `${PRODUCT_API_URL}?page=${page}&limit=10`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          ).then(async (response) => {
            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message ||
                  `Failed to fetch product page ${page}`
              );
            }

            return Array.isArray(data.products)
              ? data.products
              : [];
          })
        );
      }

      const remainingPages = await Promise.all(
        pageRequests
      );

      // -----------------------------------------------------
      // COMBINE ALL PRODUCTS
      // -----------------------------------------------------

      const allProducts = [
        ...firstProducts,
        ...remainingPages.flat(),
      ];

      setProducts(allProducts);

      console.log(
        "Total products loaded:",
        allProducts.length
      );
    } catch (err) {
      console.error(
        "Fetch all products error:",
        err
      );

      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchCategories("", "all");
    fetchProducts();
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);

    fetchCategories(value, status);
  };

  // =========================================================
  // STATUS FILTER
  // =========================================================

  const handleStatusChange = (e) => {
    const value = e.target.value;

    setStatus(value);

    fetchCategories(search, value);
  };

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");

    fetchCategories("", "all");
  };

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // ADD MAIN CATEGORY
  // =========================================================

  const openAddMainModal = () => {
    setEditingCategory(null);

    setModalType("main");

    setFormData({
      name: "",
      parent: "",
    });

    setShowModal(true);
  };

  // =========================================================
  // ADD SUBCATEGORY
  // =========================================================

  const openAddSubModal = () => {
    setEditingCategory(null);

    setModalType("sub");

    setFormData({
      name: "",
      parent: "",
    });

    setShowModal(true);
  };

  // =========================================================
  // EDIT CATEGORY
  // =========================================================

  const openEditModal = (category) => {
    setEditingCategory(category);

    setModalType(
      category.parent ? "sub" : "main"
    );

    setFormData({
      name: category.name || "",
      parent: category.parent
        ? String(
            category.parent._id ||
              category.parent
          )
        : "",
    });

    setShowModal(true);
  };

  // =========================================================
  // VIEW CATEGORY
  // =========================================================

  const handleViewCategory = (category) => {
    if (!category?._id) {
      return;
    }

    navigate(
      `/admin/categories/${category._id}`
    );
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setShowModal(false);
    setEditingCategory(null);

    setFormData({
      name: "",
      parent: "",
    });
  };

  // =========================================================
  // CREATE / UPDATE CATEGORY
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      toast.error(
        "Please enter category name.",
        {
          hideProgressBar: true,
        }
      );

      return;
    }

    if (
      modalType === "sub" &&
      !formData.parent
    ) {
      toast.error(
        "Please select a parent category.",
        {
          hideProgressBar: true,
        }
      );

      return;
    }

    try {
      setSubmitting(true);

      const slug = trimmedName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload = {
        name: trimmedName,
        slug,
        parent:
          modalType === "sub" &&
          formData.parent
            ? formData.parent
            : null,
      };

      const isEditing =
        Boolean(editingCategory);

      const url = isEditing
        ? `${API_URL}/${editingCategory._id}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${
              isEditing
                ? "update"
                : "create"
            } category`
        );
      }

      toast.success(
        data.message ||
          `Category ${
            isEditing
              ? "updated"
              : "created"
          } successfully`,
        {
          hideProgressBar: true,
        }
      );

      closeModal();

      // Refresh categories
      // sortCategories() automatically
      // puts the newest main category first.
      await fetchCategories(
        search,
        status
      );
    } catch (err) {
      console.error(
        "Save category error:",
        err
      );

      toast.error(
        err.message ||
          `Failed to ${
            editingCategory
              ? "update"
              : "create"
          } category`,
        {
          hideProgressBar: true,
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE CATEGORY
  // =========================================================

  const handleDelete = async (category) => {
    toast(
      ({ closeToast }) => (
        <div
          style={{
            background: "#ffffff",
            padding: "4px 2px",
            fontFamily:
              '"Inter", "Segoe UI", Arial, sans-serif',
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              padding: "4px 4px 12px",
            }}
          >
            <strong
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#171717",
                lineHeight: 1.3,
              }}
            >
              Delete Category?
            </strong>

            <span
              style={{
                fontSize: "12px",
                fontWeight: 400,
                lineHeight: 1.5,
                color: "#777777",
              }}
            >
              Are you sure you want to delete
              "{category.name}"?
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "8px",
              padding: "0 4px 3px",
            }}
          >
            <button
              type="button"
              onClick={closeToast}
              style={{
                border: "none",
                borderRadius: "7px",
                padding: "7px 14px",
                background: "#f1f3f5",
                color: "#333333",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={async () => {
                closeToast();

                try {
                  setDeletingId(category._id);

                  const response = await fetch(
                    `${API_URL}/${category._id}`,
                    {
                      method: "DELETE",
                      headers: getHeaders(),
                    }
                  );

                  const data =
                    await response.json();

                  if (!response.ok) {
                    throw new Error(
                      data.message ||
                        "Failed to delete category"
                    );
                  }

                  toast.success(
                    data.message ||
                      "Category deleted successfully",
                    {
                      hideProgressBar: true,
                    }
                  );

                  await fetchCategories(
                    search,
                    status
                  );

                  await fetchProducts();
                } catch (err) {
                  console.error(
                    "Delete category error:",
                    err
                  );

                  toast.error(
                    err.message ||
                      "Failed to delete category",
                    {
                      hideProgressBar: true,
                    }
                  );
                } finally {
                  setDeletingId(null);
                }
              }}
              style={{
                border: "none",
                borderRadius: "7px",
                padding: "7px 14px",
                background: "#dc3545",
                color: "#ffffff",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        hideProgressBar: true,
      }
    );
  };

  // =========================================================
  // GET CATEGORY ID
  // =========================================================

  const getCategoryId = (category) => {
    if (!category) {
      return "";
    }

    if (typeof category === "object") {
      return String(
        category._id ||
          category.id ||
          ""
      );
    }

    return String(category);
  };

  // =========================================================
  // GET PARENT NAME
  // =========================================================

  const getParentName = (category) => {
    if (!category.parent) {
      return "—";
    }

    if (
      typeof category.parent ===
      "object"
    ) {
      return (
        category.parent.name ||
        "—"
      );
    }

    const parent = categories.find(
      (item) =>
        String(item._id) ===
        String(category.parent)
    );

    return parent
      ? parent.name
      : "—";
  };

  // =========================================================
  // GET CATEGORY TYPE
  // =========================================================

  const getCategoryType = (category) => {
    return category.parent
      ? "Subcategory"
      : "Main Category";
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (
    categoryStatus
  ) => {
    return categoryStatus === "active"
      ? "active"
      : "inactive";
  };

  // =========================================================
  // GET PRODUCT CATEGORY ID
  // =========================================================

  const getProductCategoryId = (
    product
  ) => {
    if (!product) {
      return "";
    }

    const category = product.category;

    if (!category) {
      return "";
    }

    if (
      typeof category === "object"
    ) {
      return String(
        category._id ||
          category.id ||
          ""
      );
    }

    return String(category);
  };

  // =========================================================
  // GET DESCENDANT CATEGORY IDS
  // =========================================================

  const getDescendantCategoryIds = (
    parentId
  ) => {
    const childIds = [];

    categories.forEach(
      (category) => {
        if (!category.parent) {
          return;
        }

        const parentIdValue =
          typeof category.parent ===
          "object"
            ? category.parent._id
            : category.parent;

        if (
          String(parentIdValue) ===
          String(parentId)
        ) {
          childIds.push(
            String(category._id)
          );

          const nestedIds =
            getDescendantCategoryIds(
              category._id
            );

          childIds.push(
            ...nestedIds
          );
        }
      }
    );

    return childIds;
  };

  // =========================================================
  // GET PRODUCT COUNT
  // =========================================================

  const getProductCount = (
    category
  ) => {
    const categoryId =
      getCategoryId(category);

    if (!categoryId) {
      return 0;
    }

    const categoryIds = [
      categoryId,
      ...getDescendantCategoryIds(
        categoryId
      ),
    ];

    return products.filter(
      (product) => {
        const productCategoryId =
          getProductCategoryId(
            product
          );

        return categoryIds.includes(
          productCategoryId
        );
      }
    ).length;
  };

  // =========================================================
  // STATS
  // =========================================================

  const mainCategories =
    categories.filter(
      (category) =>
        !category.parent
    );

  const subCategories =
    categories.filter(
      (category) =>
        category.parent
    );

  const activeCategories =
    categories.filter(
      (category) =>
        category.status === "active"
    );

  const inactiveCategories =
    categories.filter(
      (category) =>
        category.status === "inactive"
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="categories-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="categories-header">
        <div>
          <h1>Categories</h1>

          <p>
            Manage product categories
            and subcategories
          </p>
        </div>

        <div className="categories-header-actions">
          <button
            className="btn-secondary"
            onClick={
              openAddSubModal
            }
          >
            <i className="bi bi-diagram-3"></i>
            Add Subcategory
          </button>

          <button
            className="btn-primary"
            onClick={
              openAddMainModal
            }
          >
            <i className="bi bi-plus-lg"></i>
            Add Category
          </button>
        </div>
      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="category-stats">

        <div className="category-stat-card">
          <div className="stat-icon total">
            <i className="bi bi-grid"></i>
          </div>

          <div>
            <span>
              Total Categories
            </span>

            <strong>
              {categories.length}
            </strong>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="stat-icon main">
            <i className="bi bi-folder"></i>
          </div>

          <div>
            <span>
              Main Categories
            </span>

            <strong>
              {mainCategories.length}
            </strong>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="stat-icon sub">
            <i className="bi bi-diagram-3"></i>
          </div>

          <div>
            <span>
              Subcategories
            </span>

            <strong>
              {subCategories.length}
            </strong>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="stat-icon active">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <span>Active</span>

            <strong>
              {activeCategories.length}
            </strong>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="stat-icon inactive">
            <i className="bi bi-x-circle"></i>
          </div>

          <div>
            <span>Inactive</span>

            <strong>
              {inactiveCategories.length}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="categories-toolbar">

        <div className="category-search">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        <div className="category-filter">
          <i className="bi bi-funnel"></i>

          <select
            value={status}
            onChange={
              handleStatusChange
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>

        {(search ||
          status !== "all") && (
          <button
            className="reset-filter-btn"
            onClick={
              handleResetFilters
            }
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Reset
          </button>
        )}

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="categories-error">
          <i className="bi bi-exclamation-circle"></i>

          <span>
            {error}
          </span>

          <button
            onClick={() =>
              fetchCategories(
                search,
                status
              )
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="categories-table-card">

        <div className="table-card-header">
          <div>
            <h2>
              Category List
            </h2>

            <p>
              {loading
                ? "Loading categories..."
                : `${categories.length} categories found`}
            </p>
          </div>
        </div>

        <div className="categories-table-wrapper">

          {loading ||
          productsLoading ? (
            <div className="categories-loading">
              <i className="bi bi-arrow-repeat"></i>

              <span>
                {loading
                  ? "Loading categories..."
                  : "Calculating product counts..."}
              </span>
            </div>
          ) : categories.length === 0 ? (
            <div className="categories-empty">

              <div className="empty-icon">
                <i className="bi bi-folder-x"></i>
              </div>

              <h3>
                No categories found
              </h3>

              <p>
                Try changing your
                search or filter.
              </p>

              {(search ||
                status !== "all") && (
                <button
                  onClick={
                    handleResetFilters
                  }
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              )}

            </div>
          ) : (
            <table className="categories-table">

              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Parent</th>
                  <th>Type</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {categories.map(
                  (category) => (
                    <tr
                      key={
                        category._id
                      }
                    >

                      {/* CATEGORY */}

                      <td>
                        <div className="category-name-cell">

                          <div className="category-icon">
                            <i
                              className={
                                category.parent
                                  ? "bi bi-diagram-3"
                                  : "bi bi-folder"
                              }
                            ></i>
                          </div>

                          <div>
                            <strong>
                              {
                                category.name
                              }
                            </strong>

                            {category.description && (
                              <small>
                                {
                                  category.description
                                }
                              </small>
                            )}
                          </div>

                        </div>
                      </td>

                      {/* SLUG */}

                      <td>
                        <span className="category-slug">
                          {category.slug ||
                            "—"}
                        </span>
                      </td>

                      {/* PARENT */}

                      <td>
                        <span className="parent-category">
                          {getParentName(
                            category
                          )}
                        </span>
                      </td>

                      {/* TYPE */}

                      <td>
                        <span
                          className={`category-type ${
                            category.parent
                              ? "subcategory"
                              : "main-category"
                          }`}
                        >
                          {getCategoryType(
                            category
                          )}
                        </span>
                      </td>

                      {/* PRODUCTS */}

                      <td>
                        <span className="product-count">
                          {getProductCount(
                            category
                          )}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`category-status ${getStatusClass(
                            category.status
                          )}`}
                        >
                          <span className="status-dot"></span>

                          {category.status ===
                          "active"
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="category-actions">

                          {/* VIEW */}

                          <button
                            className="action-btn view"
                            title="View Category"
                            onClick={() =>
                              handleViewCategory(
                                category
                              )
                            }
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {/* EDIT */}

                          <button
                            className="action-btn edit"
                            title="Edit"
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* DELETE */}

                          <button
                            className="action-btn delete"
                            title="Delete"
                            disabled={
                              deletingId ===
                              category._id
                            }
                            onClick={() =>
                              handleDelete(
                                category
                              )
                            }
                          >
                            {deletingId ===
                            category._id ? (
                              <i className="bi bi-arrow-repeat"></i>
                            ) : (
                              <i className="bi bi-trash3"></i>
                            )}
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}
              </tbody>

            </table>
          )}

        </div>
      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="category-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="category-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="category-modal-header">

              <div>
                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : modalType === "sub"
                    ? "Add Subcategory"
                    : "Add Category"}
                </h2>

                <p>
                  {editingCategory
                    ? "Update category information"
                    : modalType === "sub"
                    ? "Create a new subcategory"
                    : "Create a new main category"}
                </p>
              </div>

              <button
                className="modal-close-btn"
                onClick={closeModal}
                disabled={submitting}
              >
                <i className="bi bi-x-lg"></i>
              </button>

            </div>

            {/* FORM */}

            <form
              className="category-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label>
                  Category Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter category name"
                  value={formData.name}
                  onChange={
                    handleInputChange
                  }
                  disabled={submitting}
                  autoFocus
                />

              </div>

              {modalType === "sub" && (
                <div className="form-group">

                  <label>
                    Parent Category
                    <span>*</span>
                  </label>

                  <select
                    name="parent"
                    value={
                      formData.parent
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={submitting}
                  >
                    <option value="">
                      Select parent category
                    </option>

                    {mainCategories.map(
                      (category) => (
                        <option
                          key={
                            category._id
                          }
                          value={
                            category._id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}
                  </select>

                </div>
              )}

              <div className="category-form-actions">

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-save"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <i className="bi bi-arrow-repeat"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i>

                      {editingCategory
                        ? "Update Category"
                        : "Create Category"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Categories;