import { BrowserRouter, Routes, Route } from "react-router-dom";

// ================= CUSTOMER PAGES =================

import ProductDetails from "./pages/ProductDetails";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import PersonalInformation from "./pages/PersonalInformation";
import Addresses from "./pages/Addresses";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NewArrivalsPage from "./pages/NewArrivalsPage";
import BestSellersPage from "./pages/BestSellersPage";
import Category from "./pages/Category";
import VerifyOtp from "./pages/VerifyOtp";
import Wishlist from "./pages/Wishlist";
import CategoriesPage from "./pages/CategoriesPage";
import OrderTracking from "./pages/OrderTracking";
import NotFound from "./pages/NotFound";
import BlogDetails from "./pages/BlogDetails";

// ================= FOOTER PAGES =================

import Support from "./pages/Support";
import Invoicing from "./pages/Invoicing";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import FAQs from "./pages/FAQs";

// ================= POLICY PAGES =================

import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// ================= ADMIN PAGES =================

import AdminLogin from "./pages/admin/AdminLogin";
import AdminForgotPassword from "./pages/admin/ForgotPassword/ForgotPassword";
import AdminResetPassword from "./pages/admin/ForgotPassword/ResetPassword";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import AddProduct from "./pages/admin/AddProduct";
import Banners from "./pages/admin/Banners";
import Customers from "./pages/admin/Customers";
import AdminOrders from "./pages/admin/Orders";
import OrderDetails from "./pages/admin/OrderDetails";
import Coupons from "./pages/admin/Coupons";
import Inventory from "./pages/admin/Inventory";
import ContactMessages from "./pages/admin/ContactMessages";
import AdminProfile from "./pages/admin/AdminProfile";
import AddBanner from "./pages/admin/AddBanner";
import EditBanner from "./pages/admin/EditBanner";
import EditProduct from "./pages/admin/EditProduct";
import ViewProduct from "./pages/admin/ViewProduct";
import BannerView from "./pages/admin/BannerView";
import AddCoupon from "./pages/admin/AddCoupon";
import ViewCoupon from "./pages/admin/ViewCoupon";
import EditCoupon from "./pages/admin/EditCoupon";
import CustomerDetails from "./pages/admin/CustomerDetails";
import ContactMessageDetails from "./pages/admin/ContactMessageDetails";
import ViewCategories from "./pages/admin/ViewCategories";
import AdminNotFound from "./pages/admin/AdminNotFound";

import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= CUSTOMER SIDE ================= */}

        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= PROFILE ================= */}

        <Route path="/profile" element={<Profile />} />
        <Route
          path="/profile/personal"
          element={<PersonalInformation />}
        />
        <Route path="/profile/addresses" element={<Addresses />} />
        <Route
          path="/profile/change-password"
          element={<ChangePassword />}
        />

        {/* ================= AUTH ================= */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* ================= OTHER CUSTOMER PAGES ================= */}

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/new-arrivals"
          element={<NewArrivalsPage />}
        />
        <Route
          path="/best-sellers"
          element={<BestSellersPage />}
        />
        <Route
          path="/category/:slug"
          element={<Category />}
        />
        <Route
          path="/category/:slug/:subcategorySlug"
          element={<Category />}
        />
        <Route
          path="/categories"
          element={<CategoriesPage />}
        />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route
          path="/track-order/:orderId"
          element={<OrderTracking />}
        />

        {/* ================= FOOTER PAGES ================= */}

        <Route path="/support" element={<Support />} />
        <Route path="/invoicing" element={<Invoicing />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route
          path="/blog/:id"
          element={<BlogDetails />}
        />

        {/* ================= POLICY PAGES ================= */}

        <Route
          path="/refund-policy"
          element={<RefundPolicy />}
        />
        <Route
          path="/shipping-policy"
          element={<ShippingPolicy />}
        />
        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />
        <Route
          path="/terms-of-service"
          element={<TermsOfService />}
        />

        {/* ================= ADMIN LOGIN ================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/forgot-password"
          element={<AdminForgotPassword />}
        />

        <Route
          path="/admin/reset-password"
          element={<AdminResetPassword />}
        />

        {/* ================= PROTECTED ADMIN SIDE ================= */}

        <Route element={<ProtectedRoute />}>

          {/* ================= DASHBOARD ================= */}

          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            }
          />

          {/* ================= PRODUCTS ================= */}

          <Route
            path="/admin/products"
            element={
              <AdminLayout>
                <Products />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/products/add"
            element={
              <AdminLayout>
                <AddProduct />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/products/edit/:id"
            element={
              <AdminLayout>
                <EditProduct />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/products/view/:id"
            element={
              <AdminLayout>
                <ViewProduct />
              </AdminLayout>
            }
          />

          {/* ================= CATEGORIES ================= */}

          <Route
            path="/admin/categories"
            element={
              <AdminLayout>
                <Categories />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/categories/:id"
            element={
              <AdminLayout>
                <ViewCategories />
              </AdminLayout>
            }
          />

          {/* ================= BANNERS ================= */}

          <Route
            path="/admin/banners"
            element={
              <AdminLayout>
                <Banners />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/banners/add"
            element={
              <AdminLayout>
                <AddBanner />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/banners/edit/:id"
            element={
              <AdminLayout>
                <EditBanner />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/banners/view/:id"
            element={
              <AdminLayout>
                <BannerView />
              </AdminLayout>
            }
          />

          {/* ================= CUSTOMERS ================= */}

          <Route
            path="/admin/customers"
            element={
              <AdminLayout>
                <Customers />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/customers/:id"
            element={
              <AdminLayout>
                <CustomerDetails />
              </AdminLayout>
            }
          />

          {/* ================= ORDERS ================= */}

          <Route
            path="/admin/orders"
            element={
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/orders/:id"
            element={
              <AdminLayout>
                <OrderDetails />
              </AdminLayout>
            }
          />

          {/* ================= COUPONS ================= */}

          <Route
            path="/admin/coupons"
            element={
              <AdminLayout>
                <Coupons />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/coupons/add"
            element={
              <AdminLayout>
                <AddCoupon />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/coupons/view/:id"
            element={
              <AdminLayout>
                <ViewCoupon />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/coupons/edit/:id"
            element={
              <AdminLayout>
                <EditCoupon />
              </AdminLayout>
            }
          />

          {/* ================= INVENTORY ================= */}

          <Route
            path="/admin/inventory"
            element={
              <AdminLayout>
                <Inventory />
              </AdminLayout>
            }
          />

          {/* ================= CONTACT MESSAGES ================= */}

          <Route
            path="/admin/contact-messages"
            element={
              <AdminLayout>
                <ContactMessages />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/contact-messages/:id"
            element={
              <AdminLayout>
                <ContactMessageDetails />
              </AdminLayout>
            }
          />

          {/* ================= ADMIN PROFILE ================= */}

          <Route
            path="/admin/profile"
            element={
              <AdminLayout>
                <AdminProfile />
              </AdminLayout>
            }
          />

          {/* ================= ADMIN 404 ================= */}

          <Route
            path="/admin/*"
            element={
              <AdminLayout>
                <AdminNotFound />
              </AdminLayout>
            }
          />

        </Route>

        {/* ================= CUSTOMER 404 PAGE ================= */}

        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;