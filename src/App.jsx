import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthForm from "./pages/AuthForm";
import Timetable from "./pages/Timetable";
import SearchPage from "./pages/SearchPage";


export default function App() {
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  };

  return (
    <Router>
        <Routes>
          <Route
            path="/auth"
            element={<AuthForm />}
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <Timetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable/:username"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/timetable" replace />} />
        </Routes>
    </Router>
  );
}