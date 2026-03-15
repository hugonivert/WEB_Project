import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import PlannerPage from "./pages/PlannerPage";
import PerformancePage from "./pages/PerformancePage";
import SocialHubPage from "./pages/SocialHubPage";
import AvatarPage from "./pages/AvatarPage";

const AUTH_STORAGE_KEY = "fitquest_auth";

function isLoggedIn(): boolean {
  try {
    return Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return false;
  }
}

export default function App() {
  const loggedIn = isLoggedIn();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={loggedIn ? <Navigate to="/planner" replace /> : <LoginPage />}
        />
        <Route element={<AppLayout />}>
          <Route
            index
            element={loggedIn ? <Navigate to="/planner" replace /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/planner"
            element={loggedIn ? <PlannerPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/performance"
            element={loggedIn ? <PerformancePage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/social"
            element={loggedIn ? <SocialHubPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/avatar"
            element={loggedIn ? <AvatarPage /> : <Navigate to="/login" replace />}
          />
        </Route>
        <Route
          path="*"
          element={loggedIn ? <Navigate to="/planner" replace /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
