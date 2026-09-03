import React, { Suspense, lazy } from "react";
import { AppProvider } from "./context/AppProvider";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Mission from "./components/Mission";
import AssessmentSection from "./components/AssessmentSection";
import ValuesSection from "./components/ValuesSection";
import Banner from "./components/Banner";
import CareSection from "./components/CareSection";
import ServicesSection from "./components/ServicesSection";
import MedicalTipsSection from "./components/MedicalTipsSection";
import TestimonialsSection from "./components/TestimonialsSection";
import WarningSection from "./components/WarningSection";
import PackagesSection from "./components/PackagesSection";
import StoreSection from "./components/StoreSection";
import CalorieCalculator from "./components/CalorieCalculator";
import Footer from "./components/Footer";
import { useRoute } from "./lib/router";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./features/store/CartContext";
import { RefreshCw } from "lucide-react";

// Lazy Loaded Pages
const AssessmentPage = lazy(() => import("./features/assessment/pages/AssessmentPage"));
const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const RegisterPage = lazy(() => import("./features/auth/RegisterPage"));
const DoctorDashboard = lazy(() => import("./features/doctor/DoctorDashboard"));
const PatientDashboard = lazy(() => import("./features/patient/PatientDashboard"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ServiceSinglePage = lazy(() => import("./pages/ServiceSinglePage"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage"));
const ArticleSinglePage = lazy(() => import("./pages/ArticleSinglePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const PackagesPage = lazy(() => import("./features/patient/PackagesPage"));
const PaymentPage = lazy(() => import("./features/patient/PaymentPage"));
const StoreFront = lazy(() => import("./features/store/StoreFront"));
const ProductDetail = lazy(() => import("./features/store/ProductDetail"));
const Checkout = lazy(() => import("./features/store/Checkout"));

const SuspenseFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
    <RefreshCw size={40} className="spin" style={{ color: "var(--dash-primary)" }} />
  </div>
);

export default function App() {
  const path = useRoute();

  React.useEffect(() => {
    window.scrollTo(0, 0);

    const titles = {
      "/": "د. كريم الليثي | استشاري التغذية العلاجية والرياضية",
      "/about": "عن الدكتور | د. كريم الليثي",
      "/services": "خدماتنا | د. كريم الليثي",
      "/articles": "المقالات والنصائح الطبية | د. كريم الليثي",
      "/contact": "تواصل معنا | د. كريم الليثي",
      "/login": "تسجيل الدخول | د. كريم الليثي",
      "/register": "حساب جديد | د. كريم الليثي",
      "/assessment": "التقييم الطبي الشامل | د. كريم الليثي",
      "/store": "المتجر | د. كريم الليثي",
      "/checkout": "إتمام الطلب | د. كريم الليثي",
      "/privacy": "سياسة الخصوصية | د. كريم الليثي",
      "/terms": "شروط الاستخدام | د. كريم الليثي",
      "/faq": "الأسئلة الشائعة | د. كريم الليثي",
    };

    if (titles[path]) {
      document.title = titles[path];
    } else if (path.startsWith("/doctor")) {
      document.title = "لوحة تحكم الدكتور | د. كريم الليثي";
    } else if (path.startsWith("/patient")) {
      document.title = "لوحة تحكم المريض | د. كريم الليثي";
    } else if (path.startsWith("/services/")) {
      document.title = "تفاصيل الخدمة | د. كريم الليثي";
    } else if (path.startsWith("/tips/")) {
      document.title = "المقال الطبي | د. كريم الليثي";
    } else if (path.startsWith("/store/")) {
      document.title = "تفاصيل المنتج | د. كريم الليثي";
    }
  }, [path]);

  const renderContent = () => {
    if (path === "/login") return <AppProvider><AuthProvider><LoginPage /></AuthProvider></AppProvider>;
    if (path === "/register") return <AppProvider><AuthProvider><RegisterPage /></AuthProvider></AppProvider>;
    if (path.startsWith("/doctor")) return <AppProvider><AuthProvider><ProtectedRoute roles={["doctor", "staff"]}><DoctorDashboard path={path} /></ProtectedRoute></AuthProvider></AppProvider>;
    if (path.startsWith("/patient")) return <AppProvider><AuthProvider><ProtectedRoute roles={["patient"]}><PatientDashboard path={path} /></ProtectedRoute></AuthProvider></AppProvider>;

    if (path === "/assessment") {
      return (
        <AppProvider>
          <AuthProvider>
            <AssessmentPage />
          </AuthProvider>
        </AppProvider>
      );
    }
    if (path === "/packages") return <AppProvider><AuthProvider><ProtectedRoute roles={["patient"]}><PackagesPage /></ProtectedRoute></AuthProvider></AppProvider>;
    if (path.startsWith("/payment")) return <AppProvider><AuthProvider><ProtectedRoute roles={["patient"]}><PaymentPage path={path} /></ProtectedRoute></AuthProvider></AppProvider>;

    if (path === "/about") return <PublicSite><AboutPage /></PublicSite>;
    if (path === "/services") return <PublicSite><ServicesPage /></PublicSite>;
    if (path.startsWith("/services/")) return <PublicSite><ServiceSinglePage code={path.replace("/services/", "")} /></PublicSite>;
    if (path === "/articles") return <PublicSite><ArticlesPage /></PublicSite>;
    if (path.startsWith("/tips/")) return <PublicSite><ArticleSinglePage slug={path.replace("/tips/", "")} /></PublicSite>;
    if (path === "/contact") return <PublicSite><ContactPage /></PublicSite>;
    if (path === "/privacy") return <PublicSite><ContentPage title="سياسة الخصوصية" slug="privacy-policy" /></PublicSite>;
    if (path === "/terms") return <PublicSite><ContentPage title="شروط الاستخدام" slug="terms-of-use" /></PublicSite>;
    if (path === "/faq") return <PublicSite><ContentPage title="الأسئلة الشائعة" slug="faq" /></PublicSite>;

    if (path === "/store") return <PublicSite><Header /><CartProvider><StoreFront /></CartProvider><Footer /></PublicSite>;
    if (path.startsWith("/store/")) {
      const slug = decodeURIComponent(path.replace("/store/", ""));
      return <PublicSite><Header /><CartProvider><ProductDetail slug={slug} /></CartProvider><Footer /></PublicSite>;
    }
    if (path === "/checkout") return <PublicSite><Header /><CartProvider><Checkout /></CartProvider><Footer /></PublicSite>;

    return (
      <PublicSite>
        <Header />
        <main>
          <Hero />
          <Mission />
          <AssessmentSection />
          <CalorieCalculator />
          <ValuesSection />
          <Banner />
          <CareSection />
          <ServicesSection />
          <PackagesSection />
          <StoreSection />
          <MedicalTipsSection />
          <TestimonialsSection />
          <WarningSection />
          <div className="spacer" />
        </main>
        <Footer />
      </PublicSite>
    );
  };

  return (
    <Suspense fallback={<SuspenseFallback />}>
      {renderContent()}
    </Suspense>
  );
}

// The public website is auth-aware (logged-in patients/doctors previewing the
// site get a different header and section treatments).
function PublicSite({ children }) {
  return (
    <AppProvider>
      <AuthProvider>{children}</AuthProvider>
    </AppProvider>
  );
}
