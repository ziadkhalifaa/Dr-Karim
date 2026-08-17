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
import Footer from "./components/Footer";
import { useRoute } from "./lib/router";
import AssessmentPage from "./features/assessment/pages/AssessmentPage";
import { AuthProvider } from "./context/AuthProvider";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import DoctorDashboard from "./features/doctor/DoctorDashboard";
import PatientDashboard from "./features/patient/PatientDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceSinglePage from "./pages/ServiceSinglePage";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleSinglePage from "./pages/ArticleSinglePage";
import ContactPage from "./pages/ContactPage";
import ContentPage from "./pages/ContentPage";
import PackagesPage from "./features/patient/PackagesPage";
import PaymentPage from "./features/patient/PaymentPage";

export default function App() {
  const path = useRoute();

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

  return (
    <PublicSite>
      <Header />
      <main>
        <Hero />
        <Mission />
        <AssessmentSection />
        <ValuesSection />
        <Banner />
        <CareSection />
        <ServicesSection />
        <PackagesSection />
        <MedicalTipsSection />
        <TestimonialsSection />
        <WarningSection />
        <div className="spacer" />
      </main>
      <Footer />
    </PublicSite>
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
