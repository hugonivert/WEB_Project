import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppErrorBoundary from "./components/AppErrorBoundary";
import AppLayout from "./layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import PlannerPage from "./pages/PlannerPage";
import PerformancePage from "./pages/PerformancePage";
import SocialHubPage from "./pages/SocialHubPage";
import { AUTH_STORAGE_KEY, isLoggedIn } from "./lib/auth";

const AvatarPage = lazy(() => import("./pages/AvatarPage"));
const AvatarEditPage = lazy(() => import("./pages/AvatarEditPage"));

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => isLoggedIn());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        setLoggedIn(isLoggedIn());
      }
    };

    window.addEventListener("storage", onStorage);

    // For updates coming from the same tab (storage event doesn't fire),
    // we do a lightweight periodic check while the app is open.
    const interval = window.setInterval(() => {
      setLoggedIn(isLoggedIn());
    }, 750);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              loggedIn ? <Navigate to="/planner" replace /> : <LoginPage />
            }
          />
          <Route element={<AppLayout />}>
            <Route
              index
              element={
                loggedIn ? (
                  <Navigate to="/planner" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/planner"
              element={
                loggedIn ? <PlannerPage /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/performance"
              element={
                loggedIn ? <PerformancePage /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/social"
              element={
                loggedIn ? <SocialHubPage /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/avatar/edit"
              element={
                loggedIn ? (
                  <Suspense fallback={<div className="route-page">Loading avatar editor...</div>}>
                    <AvatarEditPage />
                  </Suspense>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/avatar"
              element={
                loggedIn ? (
                  <Suspense fallback={<div className="route-page">Loading avatar page...</div>}>
                    <AvatarPage />
                  </Suspense>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Route>
          <Route
            path="*"
            element={
              loggedIn ? (
                <Navigate to="/planner" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
