import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchPerformanceDashboard, type DeltaValue, type PerformanceDashboard } from "../api/performance";
import { readAuthSession } from "../lib/auth";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${minutes}m`;
}

function formatDelta(delta: DeltaValue | null) {
  if (!delta) {
    return "No comparison";
  }

  if (delta.percent === null) {
    return `${delta.absolute >= 0 ? "+" : ""}${delta.absolute}`;
  }

  return `${delta.percent >= 0 ? "+" : ""}${delta.percent}%`;
}

function formatPace(minutesPerKm: number | null) {
  if (!minutesPerKm) {
    return "-";
  }

  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

export default function PerformancePage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<PerformanceDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        const session = readAuthSession();
        if (!session?.user.id) {
          if (isMounted) {
            navigate("/login", { replace: true });
          }
          return;
        }

        const nextDashboard = await fetchPerformanceDashboard(session.user.id);

        if (!isMounted) {
          return;
        }

        setDashboard(nextDashboard);
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load performance data.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const weeklyCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        label: "Running distance",
        value: `${dashboard.weekly.running.distanceKm} km`,
        delta: formatDelta(dashboard.weekly.running.distanceDelta),
      },
      {
        label: "Cycling distance",
        value: `${dashboard.weekly.cycling.distanceKm} km`,
        delta: formatDelta(dashboard.weekly.cycling.distanceDelta),
      },
      {
        label: "Gym total load",
        value: `${dashboard.weekly.gym.totalLoadKg} kg`,
        delta: formatDelta(dashboard.weekly.gym.totalLoadDelta),
      },
      {
        label: "Mobility time",
        value: formatDuration(dashboard.weekly.mobility.durationMinutes),
        delta: formatDelta(dashboard.weekly.mobility.durationDelta),
      },
    ];
  }, [dashboard]);

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Performance"
        title="Science-driven training analysis"
        description="Weekly, monthly and cumulative analytics computed from completed sessions in your planner."
        badge="Connected to planner sessions"
      />

      {isLoading ? <p className="route-copy">Loading dashboard...</p> : null}
      {errorMessage ? <p className="route-copy">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && dashboard ? (
        <>
          <div className="route-grid route-grid-4">
            {weeklyCards.map((card) => (
              <SectionCard key={card.label} title={card.label} description={`Delta: ${card.delta}`}>
                <p className="metric-value">{card.value}</p>
              </SectionCard>
            ))}
          </div>

          <div className="route-grid route-grid-2">
            <SectionCard title="Weekly distance trend" description="Last 10 weeks (running + cycling)">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dashboard.trends.weeklyDistance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="runningKm" stroke="#ea580c" strokeWidth={2} />
                    <Line type="monotone" dataKey="cyclingKm" stroke="#0284c7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Monthly distance trend" description="Last 6 months (running + cycling)">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dashboard.trends.monthlyDistance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="runningKm" stroke="#ea580c" strokeWidth={2} />
                    <Line type="monotone" dataKey="cyclingKm" stroke="#0284c7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <div className="route-grid route-grid-2">
            <SectionCard title="Monthly summary" description="Current month by sport">
              <ul className="list-clean">
                <li>
                  Running: {dashboard.monthly.running.distanceKm} km,{" "}
                  {formatDuration(dashboard.monthly.running.durationMinutes)}, pace{" "}
                  {formatPace(dashboard.monthly.running.avgPaceMinPerKm)}
                </li>
                <li>
                  Cycling: {dashboard.monthly.cycling.distanceKm} km,{" "}
                  {formatDuration(dashboard.monthly.cycling.durationMinutes)}, avg speed{" "}
                  {dashboard.monthly.cycling.avgSpeedKmH ?? "-"} km/h
                </li>
                <li>
                  Gym: {dashboard.monthly.gym.sessions} sessions, {dashboard.monthly.gym.totalSets} sets,{" "}
                  {dashboard.monthly.gym.totalLoadKg} kg
                </li>
                <li>
                  Mobility: {dashboard.monthly.mobility.sessions} sessions,{" "}
                  {formatDuration(dashboard.monthly.mobility.durationMinutes)}, top area{" "}
                  {dashboard.monthly.mobility.topFocusArea ?? "-"}
                </li>
              </ul>
            </SectionCard>

            <SectionCard title="Cumulative summary" description="From your first completed session">
              <ul className="list-clean">
                <li>
                  Running total: {dashboard.cumulative.running.distanceKm} km over{" "}
                  {dashboard.cumulative.running.sessions} sessions
                </li>
                <li>
                  Cycling total: {dashboard.cumulative.cycling.distanceKm} km over{" "}
                  {dashboard.cumulative.cycling.sessions} sessions
                </li>
                <li>
                  Gym total load: {dashboard.cumulative.gym.totalLoadKg} kg ({dashboard.cumulative.gym.totalSets} sets)
                </li>
                <li>
                  Mobility total time: {formatDuration(dashboard.cumulative.mobility.durationMinutes)}
                </li>
              </ul>
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
