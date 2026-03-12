import { Trophy, UserCircle2, CalendarRange, Activity, Newspaper } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  { to: "/planner", label: "Planner", icon: CalendarRange },
  { to: "/performance", label: "Performance", icon: Activity },
  { to: "/social", label: "Social hub", icon: Newspaper },
  { to: "/avatar", label: "Avatar", icon: UserCircle2 },
];

export default function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div>
          <p className="sidebar-brand">FitQuest</p>
          <h2 className="sidebar-title">Group starter kit</h2>
          <p className="sidebar-copy">
            Navigation, pages and mock content are ready so each teammate can work
            inside a dedicated area.
          </p>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "nav-item nav-item-active" : "nav-item"
                }
              >
                <Icon className="icon-sm" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-score-card">
          <div className="sidebar-score-row">
            <Trophy className="icon-sm" />
            <span>Weekly leaderboard</span>
          </div>
          <strong>#2 - 1640 pts</strong>
          <p className="sidebar-copy">Mock gamification visible from all pages.</p>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
