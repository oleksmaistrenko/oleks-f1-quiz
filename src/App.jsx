import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QuizGame from "./components/quiz/QuizGame";
import QuizAdmin from "./components/quiz/QuizAdmin";
import Login from "./components/auth/Login";
import Header from "./components/layout/Header";
import UsersList from "./components/admin/UsersList";
import Rankings from "./components/pages/Rankings";
import Rules from "./components/pages/Rules";
import HeadToHead from "./components/pages/HeadToHead";
import Dashboard from "./components/pages/Dashboard";
import { ToastProvider } from "./components/ui/Toast";
import "./styles/index.css";
import "./styles/App.css";

function App() {
  return (
    <Router>
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
              </Routes>
            </div>
          </main>
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
