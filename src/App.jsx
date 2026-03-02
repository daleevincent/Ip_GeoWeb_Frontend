import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* If user is logged in, redirect /login -> / */}
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Protected home route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect unknown routes to login */}
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;