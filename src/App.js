import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QuizGame from "./components/QuizGame";
import QuizAdmin from "./components/QuizAdmin";
import Login from "./components/Login";
import Header from "./components/Header";
import UsersList from "./components/UsersList";
import Rankings from "./components/Rankings";
import Rules from "./components/Rules";
import "./index.css";

function App() {
  return (
    <Router>
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
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
