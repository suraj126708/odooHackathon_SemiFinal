/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ProfilePage from "./Pages/ProfilePage";
import ProtectedRoute from "./Authorisation/ProtectedRoute";
import { AuthProvider, useAuth } from "./Authorisation/AuthProvider";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<AuthHome />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

function AuthHome() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return <Navigate to={isAuthenticated ? "/profile" : "/login"} replace />;
}

export default App;
