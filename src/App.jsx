import { AppProvider } from "./context/AppProvider";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Mission from "./components/Mission";
import AssessmentSection from "./components/AssessmentSection";
import ValuesSection from "./components/ValuesSection";
import Banner from "./components/Banner";
import CareSection from "./components/CareSection";
import ServicesSection from "./components/ServicesSection";
import ProofSection from "./components/ProofSection";
import WarningSection from "./components/WarningSection";
import Footer from "./components/Footer";
import { useRoute } from "./lib/router";
import AssessmentPage from "./features/assessment/pages/AssessmentPage";
import { AuthProvider } from "./context/AuthProvider";
import LoginPage from "./features/auth/LoginPage";
import DoctorDashboard from "./features/doctor/DoctorDashboard";
import PatientDashboard from "./features/patient/PatientDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

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
        <ProofSection />
        <WarningSection />
        <div className="spacer" />
      </main>
      <Footer />
    </AppProvider>
  );
}
