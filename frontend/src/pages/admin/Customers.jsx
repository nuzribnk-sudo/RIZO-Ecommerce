import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Customers.css";

const API_URL = "https://rizo-ecommerce-backend.onrender.com/api";
const CUSTOMERS_PER_PAGE = 10;

const Customers = () => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  // Search / filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Summary cards
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [blockedCustomers, setBlockedCustomers] = useState(0);

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
  // SAFE RESPONSE PARSER
  // =========================================================

  const parseResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    throw new Error(
      `Server returned ${response.status}: ${text.slice(
        0,
        200
      )}`
    );
  };

  // =========================================================
  // GET INITIALS
  // =========================================================

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) =>
        word.charAt(0).toUpperCase()
      )
      .join("");
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // FETCH CUSTOMER COUNTS
  // =========================================================

  const fetchCustomerCounts = useCallback(
    async () => {
      try {
        const headers = getHeaders();

        const baseUrl = `${API_URL}/users?page=1&limit=1&sort=newest`;

        const [
          totalResponse,
          activeResponse,
          blockedResponse,
        ] = await Promise.all([
          fetch(baseUrl, {
            method: "GET",
            headers,
          }),

          fetch(
            `${API_URL}/users?page=1&limit=1&sort=newest&status=active`,
            {
              method: "GET",
              headers,
            }
          ),

          fetch(
            `${API_URL}/users?page=1&limit=1&sort=newest&status=blocked`,
            {
              method: "GET",
              headers,
            }
          ),
        ]);

        const totalData =
          await parseResponse(totalResponse);

        const activeData =
          await parseResponse(activeResponse);

        const blockedData =
          await parseResponse(blockedResponse);

        if (!totalResponse.ok) {
          throw new Error(
            totalData?.message ||
              "Failed to fetch customer count."
          );
        }

        if (!activeResponse.ok) {
          throw new Error(
            activeData?.message ||
              "Failed to fetch active customer count."
          );
        }

        if (!blockedResponse.ok) {
          throw new Error(
            blockedData?.message ||
              "Failed to fetch blocked customer count."
          );
        }

        setTotalCustomers(
          Number(totalData?.total || 0)
        );

        setActiveCustomers(
          Number(activeData?.total || 0)
        );

        setBlockedCustomers(
          Number(blockedData?.total || 0)
        );
      } catch (error) {
        console.error(
          "Customer count error:",
          error
        );
      }
    },
    []
  );

  // =========================================================
  // FETCH CUSTOMERS
  // =========================================================

  const fetchCustomers = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          throw new Error(
            "Authentication required. Please login again."
          );
        }

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set(
          "limit",
          String(CUSTOMERS_PER_PAGE)
        );
        params.set("sort", sort);

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (statusFilter !== "all") {
          params.set(
            "status",
            statusFilter
          );
        }

        const response = await fetch(
          `${API_URL}/users?${params.toString()}`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        const data =
          await parseResponse(response);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to fetch customers."
          );
        }

        const users = Array.isArray(
          data?.users
        )
          ? data.users
          : [];

        setCustomers(users);

        setTotalPages(
          Math.max(
            Number(data?.totalPages || 1),
            1
          )
        );

        // Keep total card synced with backend response
        // when no filter is active.
        if (
          statusFilter === "all" &&
          !search.trim()
        ) {
          setTotalCustomers(
            Number(data?.total || 0)
          );
        }
      } catch (error) {
        console.error(
          "Customers fetch error:",
          error
        );

        setCustomers([]);

        setError(
          error?.message ||
            "Unable to load customers."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      search,
      statusFilter,
      sort,
    ]
  );

  // =========================================================
  // FETCH CUSTOMERS + COUNTS
  // =========================================================

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchCustomerCounts();
  }, [fetchCustomerCounts]);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  // =========================================================
  // STATUS FILTER
  // =========================================================

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  // =========================================================
  // SORT
  // =========================================================

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSort("newest");
    setPage(1);
  };

  // =========================================================
  // VIEW CUSTOMER
  // =========================================================

  const handleViewCustomer = (customer) => {
    if (!customer?._id) {
      return;
    }

    navigate(
      `/admin/customers/${customer._id}`,
      {
        state: {
          customer,
        },
      }
    );
  };

  // =========================================================
  // BLOCK / UNBLOCK CUSTOMER
  // =========================================================

  const handleToggleStatus = async (
    customer
  ) => {
    if (!customer?._id) {
      return;
    }

    const isBlocked =
      customer.status === "blocked";

    const newStatus = isBlocked
      ? "active"
      : "blocked";

    const actionText = isBlocked
      ? "unblock"
      : "block";

    // =====================================================
    // TOASTIFY CONFIRMATION
    // =====================================================

    toast(
      ({ closeToast }) => (
        <div
          style={{
            width: "100%",
            padding: "2px",
            background: "#ffffff",
            color: "#222222",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "700",
              marginBottom: "5px",
            }}
          >
            {isBlocked
              ? "Unblock Customer?"
              : "Block Customer?"}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#777777",
              lineHeight: "1.5",
              marginBottom: "12px",
            }}
          >
            Are you sure you want to{" "}
            {actionText}{" "}
            <strong>
              {customer.name ||
                "this customer"}
            </strong>
            ?
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={closeToast}
              style={{
                border: "none",
                background: "#f3f3f3",
                color: "#444444",
                borderRadius: "7px",
                padding: "7px 12px",
                fontSize: "12px",
                fontWeight: "600",
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
                  setActionLoading(
                    customer._id
                  );
                  setError("");

                  const response =
                    await fetch(
                      `${API_URL}/users/${customer._id}/status`,
                      {
                        method: "PATCH",
                        headers:
                          getHeaders(),
                        body: JSON.stringify({
                          status:
                            newStatus,
                        }),
                      }
                    );

                  const data =
                    await parseResponse(
                      response
                    );

                  if (!response.ok) {
                    throw new Error(
                      data?.message ||
                        `Failed to ${actionText} customer.`
                    );
                  }

                  // Update current customer in table
                  setCustomers(
                    (previousCustomers) =>
                      previousCustomers.map(
                        (item) =>
                          String(
                            item._id
                          ) ===
                          String(
                            customer._id
                          )
                            ? {
                                ...item,
                                ...(data?.user ||
                                  {}),
                                status:
                                  newStatus,
                              }
                            : item
                      )
                  );

                  // Refresh summary cards
                  await fetchCustomerCounts();

                  // =================================================
                  // TOASTIFY SUCCESS
                  // =================================================

                  toast.success(
                    data?.message ||
                      `Customer ${
                        newStatus ===
                        "blocked"
                          ? "blocked"
                          : "unblocked"
                      } successfully.`,
                    {
                      className:
                        "rizo-admin-toast",
                      hideProgressBar: true,
                    }
                  );
                } catch (error) {
                  console.error(
                    "Customer status update error:",
                    error
                  );

                  // =================================================
                  // TOASTIFY ERROR
                  // =================================================

                  toast.error(
                    error?.message ||
                      "Failed to update customer status.",
                    {
                      className:
                        "rizo-admin-toast",
                      hideProgressBar: true,
                    }
                  );
                } finally {
                  setActionLoading("");
                }
              }}
              style={{
                border: "none",
                background: "#dc3545",
                color: "#ffffff",
                borderRadius: "7px",
                padding: "7px 12px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {isBlocked
                ? "Unblock"
                : "Block"}
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        hideProgressBar: true,
        className:
          "rizo-admin-toast",
      }
    );
  };

  // =========================================================
  // PAGINATION
  // =========================================================

  const handlePreviousPage = () => {
    if (page <= 1) return;

    setPage(
      (previousPage) =>
        previousPage - 1
    );
  };

  const handleNextPage = () => {
    if (page >= totalPages) return;

    setPage(
      (previousPage) =>
        previousPage + 1
    );
  };

  const handlePageChange = (pageNumber) => {
    if (
      pageNumber < 1 ||
      pageNumber > totalPages
    ) {
      return;
    }

    setPage(pageNumber);
  };

  // =========================================================
  // PAGE NUMBER LIST
  // =========================================================

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (
        let index = 1;
        index <= totalPages;
        index += 1
      ) {
        pages.push(index);
      }

      return pages;
    }

    if (page <= 3) {
      return [
        1,
        2,
        3,
        4,
        "...",
        totalPages,
      ];
    }

    if (page >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      page - 1,
      page,
      page + 1,
      "...",
      totalPages,
    ];
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading && customers.length === 0) {
    return (
      <div className="customers-page">
        <div className="customers-page-header">
          <div>
            <span className="customers-eyebrow">
              CUSTOMER MANAGEMENT
            </span>

            <h1>Customers</h1>

            <p>
              Manage registered customers and
              their account status.
            </p>
          </div>
        </div>

        <div className="customers-loading">
          <div className="customers-spinner"></div>

          <span>
            Loading customers...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="customers-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="customers-page-header">
        <div className="customers-heading">
          <span className="customers-eyebrow">
            CUSTOMER MANAGEMENT
          </span>

          <h1>Customers</h1>

          <p>
            Manage registered customers,
            account status, and customer
            information.
          </p>
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="customers-summary-grid">
        {/* TOTAL */}

        <div className="customer-summary-card total">
          <div className="customer-summary-icon">
            <i className="bi bi-people-fill"></i>
          </div>

          <div className="customer-summary-content">
            <span>
              Total Customers
            </span>

            <strong>
              {totalCustomers}
            </strong>

            <small>
              All registered customers
            </small>
          </div>
        </div>

        {/* ACTIVE */}

        <div className="customer-summary-card active">
          <div className="customer-summary-icon">
            <i className="bi bi-person-check-fill"></i>
          </div>

          <div className="customer-summary-content">
            <span>
              Active Customers
            </span>

            <strong>
              {activeCustomers}
            </strong>

            <small>
              Currently active accounts
            </small>
          </div>
        </div>

        {/* BLOCKED */}

        <div className="customer-summary-card blocked">
          <div className="customer-summary-icon">
            <i className="bi bi-person-x-fill"></i>
          </div>

          <div className="customer-summary-content">
            <span>
              Blocked Customers
            </span>

            <strong>
              {blockedCustomers}
            </strong>

            <small>
              Blocked accounts
            </small>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER CARD
      ===================================================== */}

      <div className="customers-filter-card">
        <div className="customers-filter-header">
          <div>
            <h2>Customer List</h2>

            <p>
              Search and manage your customers.
            </p>
          </div>
        </div>

        <div className="customers-filters">
          {/* SEARCH */}

          <div className="customer-search-box">
            <i className="bi bi-search"></i>

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, email or phone..."
            />

            {search && (
              <button
                type="button"
                className="customer-search-clear"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>

          {/* STATUS */}

          <div className="customer-filter-field">
            <label htmlFor="customer-status">
              Status
            </label>

            <select
              id="customer-status"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="all">
                All Customers
              </option>

              <option value="active">
                Active
              </option>

              <option value="blocked">
                Blocked
              </option>
            </select>
          </div>

          {/* SORT */}

          <div className="customer-filter-field">
            <label htmlFor="customer-sort">
              Sort
            </label>

            <select
              id="customer-sort"
              value={sort}
              onChange={handleSortChange}
            >
              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="name_asc">
                Name A-Z
              </option>

              <option value="name_desc">
                Name Z-A
              </option>
            </select>
          </div>

          {/* CLEAR */}

          {(search ||
            statusFilter !== "all" ||
            sort !== "newest") && (
            <button
              type="button"
              className="customers-clear-btn"
              onClick={handleClearFilters}
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="customers-error">
          <i className="bi bi-exclamation-circle"></i>

          <span>{error}</span>

          <button
            type="button"
            onClick={fetchCustomers}
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}

      <div className="customers-table-card">
        <div className="customers-table-wrapper">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {customers.length > 0 ? (
                customers.map((customer) => {
                  const isBlocked =
                    customer.status ===
                    "blocked";

                  const isUpdating =
                    actionLoading ===
                    customer._id;

                  return (
                    <tr
                      key={customer._id}
                    >
                      {/* CUSTOMER */}

                      <td>
                        <div className="customer-table-user">
                          <div className="customer-avatar">
                            {getInitials(
                              customer.name
                            )}
                          </div>

                          <div className="customer-table-user-info">
                            <strong>
                              {customer.name ||
                                "Unknown Customer"}
                            </strong>

                            <span>
                              Customer
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}

                      <td>
                        <span className="customer-email">
                          {customer.email ||
                            "-"}
                        </span>
                      </td>

                      {/* PHONE */}

                      <td>
                        <span className="customer-phone">
                          {customer.phone ||
                            "-"}
                        </span>
                      </td>

                      {/* JOINED */}

                      <td>
                        <span className="customer-date">
                          {formatDate(
                            customer.createdAt
                          )}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`customer-status-badge ${
                            isBlocked
                              ? "blocked"
                              : "active"
                          }`}
                        >
                          <span className="status-dot"></span>

                          {isBlocked
                            ? "Blocked"
                            : "Active"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="customer-actions">
                          {/* VIEW */}

                          <button
                            type="button"
                            className="customer-action-btn view"
                            title="View Customer"
                            onClick={() =>
                              handleViewCustomer(
                                customer
                              )
                            }
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {/* BLOCK / UNBLOCK */}

                          <button
                            type="button"
                            className={`customer-action-btn ${
                              isBlocked
                                ? "unblock"
                                : "block"
                            }`}
                            title={
                              isBlocked
                                ? "Unblock Customer"
                                : "Block Customer"
                            }
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              handleToggleStatus(
                                customer
                              )
                            }
                          >
                            {isUpdating ? (
                              <i className="bi bi-arrow-repeat customer-action-loading"></i>
                            ) : (
                              <i
                                className={
                                  isBlocked
                                    ? "bi bi-person-check"
                                    : "bi bi-person-x"
                                }
                              ></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="customers-empty-cell"
                  >
                    <div className="customers-empty">
                      <div className="customers-empty-icon">
                        <i className="bi bi-people"></i>
                      </div>

                      <h3>
                        No Customers Found
                      </h3>

                      <p>
                        No customers match your
                        current search or filters.
                      </p>

                      {(search ||
                        statusFilter !==
                          "all") && (
                        <button
                          type="button"
                          onClick={
                            handleClearFilters
                          }
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          MOBILE CUSTOMER CARDS
      ===================================================== */}

      <div className="customers-mobile-list">
        {customers.length > 0 ? (
          customers.map((customer) => {
            const isBlocked =
              customer.status ===
              "blocked";

            const isUpdating =
              actionLoading ===
              customer._id;

            return (
              <div
                className="customer-mobile-card"
                key={customer._id}
              >
                {/* TOP */}

                <div className="customer-mobile-top">
                  <div className="customer-mobile-user">
                    <div className="customer-avatar">
                      {getInitials(
                        customer.name
                      )}
                    </div>

                    <div>
                      <strong>
                        {customer.name ||
                          "Unknown Customer"}
                      </strong>

                      <span>
                        Customer
                      </span>
                    </div>
                  </div>

                  <span
                    className={`customer-status-badge ${
                      isBlocked
                        ? "blocked"
                        : "active"
                    }`}
                  >
                    <span className="status-dot"></span>

                    {isBlocked
                      ? "Blocked"
                      : "Active"}
                  </span>
                </div>

                {/* INFO */}

                <div className="customer-mobile-info">
                  <div className="customer-mobile-row">
                    <span>
                      <i className="bi bi-envelope"></i>
                      Email
                    </span>

                    <strong>
                      {customer.email ||
                        "-"}
                    </strong>
                  </div>

                  <div className="customer-mobile-row">
                    <span>
                      <i className="bi bi-telephone"></i>
                      Phone
                    </span>

                    <strong>
                      {customer.phone ||
                        "-"}
                    </strong>
                  </div>

                  <div className="customer-mobile-row">
                    <span>
                      <i className="bi bi-calendar3"></i>
                      Joined
                    </span>

                    <strong>
                      {formatDate(
                        customer.createdAt
                      )}
                    </strong>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="customer-mobile-actions">
                  <button
                    type="button"
                    className="customer-mobile-view-btn"
                    onClick={() =>
                      handleViewCustomer(
                        customer
                      )
                    }
                  >
                    <i className="bi bi-eye"></i>
                    View Customer
                  </button>

                  <button
                    type="button"
                    className={`customer-mobile-status-btn ${
                      isBlocked
                        ? "unblock"
                        : "block"
                    }`}
                    disabled={isUpdating}
                    onClick={() =>
                      handleToggleStatus(
                        customer
                      )
                    }
                  >
                    {isUpdating ? (
                      <i className="bi bi-arrow-repeat customer-action-loading"></i>
                    ) : (
                      <i
                        className={
                          isBlocked
                            ? "bi bi-person-check"
                            : "bi bi-person-x"
                        }
                      ></i>
                    )}

                    {isBlocked
                      ? "Unblock"
                      : "Block"}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="customers-mobile-empty">
            <div className="customers-empty-icon">
              <i className="bi bi-people"></i>
            </div>

            <h3>
              No Customers Found
            </h3>

            <p>
              No customers match your current
              search or filters.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {customers.length > 0 && (
        <div className="customers-pagination">
          <div className="customers-pagination-info">
            Showing{" "}
            <strong>
              {(page - 1) *
                CUSTOMERS_PER_PAGE +
                1}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(
                page *
                  CUSTOMERS_PER_PAGE,
                totalCustomers
              )}
            </strong>{" "}
            of{" "}
            <strong>
              {totalCustomers}
            </strong>{" "}
            customers
          </div>

          <div className="customers-pagination-controls">
            {/* PREVIOUS */}

            <button
              type="button"
              className="pagination-arrow"
              disabled={page <= 1}
              onClick={
                handlePreviousPage
              }
              aria-label="Previous page"
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            {/* PAGE NUMBERS */}

            {getPageNumbers().map(
              (pageNumber, index) => {
                if (
                  pageNumber === "..."
                ) {
                  return (
                    <span
                      key={`dots-${index}`}
                      className="pagination-dots"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    type="button"
                    key={pageNumber}
                    className={`pagination-number ${
                      page === pageNumber
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handlePageChange(
                        pageNumber
                      )
                    }
                  >
                    {pageNumber}
                  </button>
                );
              }
            )}

            {/* NEXT */}

            <button
              type="button"
              className="pagination-arrow"
              disabled={
                page >= totalPages
              }
              onClick={
                handleNextPage
              }
              aria-label="Next page"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;