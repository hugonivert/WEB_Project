import {
  Trophy,
  UserCircle2,
  CalendarRange,
  Activity,
  Newspaper,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { readAuthSession } from "../lib/auth";
import { fetchLeaderboard } from "../api/social";

const navigationItems = [
  { to: "/planner", label: "Planner", icon: CalendarRange },
  { to: "/performance", label: "Performance", icon: Activity },
  { to: "/social", label: "Social hub", icon: Newspaper },
  { to: "/avatar", label: "Avatar", icon: UserCircle2 },
];

function useLeaderboardPosition() {
  const [rank, setRank] = useState<number | null>(null);
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const session = readAuthSession();
        if (!session?.user.id) return;

        const { entries } = await fetchLeaderboard();
        const entry = entries.find((e) => e.userId === session.user.id);
        if (entry) {
          setRank(entry.rank);
          setPoints(entry.points);
        } else {
          setPoints(0);
        }
      } catch {
        // silently ignore — sidebar is non-critical
      }
    }
    load();
  }, []);

  return { rank, points };
}

export default function AppLayout() {
  const { rank, points } = useLeaderboardPosition();
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div>
          <p className="sidebar-brand">FitQuest</p>
          <h2 className="sidebar-title"></h2>
          <p className="sidebar-copy">
            Welcome to FitQuest, your fitness companion! Track your workouts, complete missions, and climb the weekly leaderboard. 
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
          {points === null ? (
            <strong>Loading...</strong>
          ) : points === 0 ? (
            <strong>No points yet</strong>
          ) : (
            <strong>
              {rank !== null ? `#${rank} – ` : ""}
              {points} pts
            </strong>
          )}
          <p className="sidebar-copy">Points earned from completed missions.</p>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
