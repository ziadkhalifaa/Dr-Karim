import { AppProvider } from "./context/AppProvider";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Mission from "./components/Mission";
import AssessmentSection from "./components/AssessmentSection";
import ValuesSection from "./components/ValuesSection";
import Banner from "./components/Banner";
import CareSection from "./components/CareSection";
import ServicesSection from "./components/ServicesSection";
import TestimonialsSection from "./components/TestimonialsSection";
import WarningSection from "./components/WarningSection";
import Footer from "./components/Footer";
import { useRoute } from "./lib/router";
import AssessmentPage from "./features/assessment/pages/AssessmentPage";
import { AuthProvider } from "./context/AuthProvider";
import LoginPage from "./features/auth/LoginPage";
import DoctorDashboard from "./features/doctor/DoctorDashboard";
import PatientDashboard from "./features/patient/PatientDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ArticlesPage from "./pages/ArticlesPage";
import ContactPage from "./pages/ContactPage";
import ContentPage from "./pages/ContentPage";

export default function App() {
  const path = useRoute();

  if (path === "/login") return <AppProvider><AuthProvider><LoginPage /></AuthProvider></AppProvider>;
  if (path.startsWith("/doctor")) return <AppProvider><AuthProvider><ProtectedRoute roles={["doctor", "staff"]}><DoctorDashboard path={path} /></ProtectedRoute></AuthProvider></AppProvider>;
  if (path.startsWith("/patient")) return <AppProvider><AuthProvider><ProtectedRoute roles={["patient"]}><PatientDashboard path={path} /></ProtectedRoute></AuthProvider></AppProvider>;

  if (path === "/assessment") {
    return (
      <AppProvider>
        <AssessmentPage />
      </AppProvider>
    );
  }

  if (path === "/about") return <AppProvider><AboutPage /></AppProvider>;
  if (path === "/services") return <AppProvider><ServicesPage /></AppProvider>;
  if (path === "/articles") return <AppProvider><ArticlesPage /></AppProvider>;
  if (path === "/contact") return <AppProvider><ContactPage /></AppProvider>;
  if (path === "/privacy") return <AppProvider><ContentPage title="سياسة الخصوصية" slug="privacy-policy" /></AppProvider>;
  if (path === "/terms") return <AppProvider><ContentPage title="شروط الاستخدام" slug="terms-of-use" /></AppProvider>;
  if (path === "/faq") return <AppProvider><ContentPage title="الأسئلة الشائعة" slug="faq" /></AppProvider>;

  return (
    <AppProvider>
      <Header />
      <main>
        <Hero />
        <Mission />
        <AssessmentSection />
        <ValuesSection />
        <Banner />
        <CareSection />
        <ServicesSection />
        <TestimonialsSection />
        <WarningSection />
        <div className="spacer" />
      </main>
      <Footer />
    </AppProvider>
  );
}
