/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import MainLayout from "./components/MainLayout";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import AdminDashboard from "./Pages/AdminDashboard";
import Adduser from "./Pages/Admin/Adduser";
import CreateCompany from "./Pages/Admin/CreateCompany";
import ManagerDashboard from "./Pages/ManagerDashboard";
import UserDashboard from "./Pages/UserDashboard";
import ApprovalDashboard from "./Pages/MiddlePerson/ApprovalDashboard";
import ProfilePage from "./Pages/ProfilePage";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar
            theme="dark"
            toastClassName="!bg-card !text-card-foreground !border !border-border/60 !shadow-glow-sm"
          />
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<Adduser />} />
              <Route path="/admin/company/new" element={<CreateCompany />} />
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/approvals" element={<ApprovalDashboard />} />
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
