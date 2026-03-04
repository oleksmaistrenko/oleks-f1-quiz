import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { trackEvent } from "./firebase";
import QuizGame from "./components/quiz/QuizGame";
import QuizAdmin from "./components/quiz/QuizAdmin";
import Login from "./components/auth/Login";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import UsersList from "./components/admin/UsersList";
import Rankings from "./components/pages/Rankings";
import Rules from "./components/pages/Rules";
import HeadToHead from "./components/pages/HeadToHead";
import Dashboard from "./components/pages/Dashboard";
import Terms from "./components/pages/Terms";
import Privacy from "./components/pages/Privacy";
import { ToastProvider } from "./components/ui/Toast";
import "./styles/index.css";
import "./styles/App.css";

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackEvent("page_view", { page_path: location.pathname });
  }, [location]);
  return null;
}

function App() {
  return (
    <Router>
      <PageViewTracker />
      <ToastProvider>
        <div className="min-h-screen">
          <Header />
          <main className="main-content">
            <div className="container">
              <Routes>
                <Route path="/" element={<QuizGame />} />
                <Route path="/admin" element={<QuizAdmin />} />
                <Route path="/login" element={<Login />} />
                <Route path="/quiz/:id" element={<QuizGame />} />
                <Route path="/users" element={<UsersList />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/head-to-head" element={<HeadToHead />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
