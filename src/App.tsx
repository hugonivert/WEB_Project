import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import PlannerPage from "./pages/PlannerPage";
import PerformancePage from "./pages/PerformancePage";
import SocialHubPage from "./pages/SocialHubPage";
import AvatarPage from "./pages/AvatarPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/social" element={<SocialHubPage />} />
          <Route path="/avatar" element={<AvatarPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/planner" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
