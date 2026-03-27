import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { fetchUserProfile, type SportType, type UserProfileDto } from "../api/social";

const SPORT_ICONS: Record<SportType, string> = {
  RUNNING: "Runner",
  GYM: "Gym",
  CYCLING: "Bike",
  MOBILITY: "Mobility",
  SWIMMING: "Swim",
  OTHER: "Sport",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchUserProfile(userId)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="route-shell">
        <PageHeader eyebrow="Profile" title="Profile" description="Loading..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="route-shell">
        <PageHeader eyebrow="Profile" title="Profile" description="User not found" />
        <div className="section-card" style={{ marginTop: 16 }}>
          <p className="section-card-copy" style={{ color: "#dc2626" }}>
            {error ?? "This profile could not be loaded."}
          </p>
          <button
            className="secondary-button"
            style={{ marginTop: 12 }}
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="route-shell">
      <PageHeader
        eyebrow="Profile"
        title={profile.displayName}
        description="Athlete profile"
      />

      <button
        className="secondary-button"
        style={{ marginBottom: 20 }}
        onClick={() => navigate(-1)}
      >
        Back
      </button>

      <SectionCard title="Overview">
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--color-border, #e2e8f0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "User"
            )}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>{profile.displayName}</p>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>
              {profile.totalPoints} points this week
            </p>
          </div>
        </div>
      </SectionCard>

      <div style={{ marginTop: 16 }}>
        <SectionCard title="Recent achievements">
          {profile.recentAchievements.length === 0 ? (
            <p className="section-card-copy">No completed missions yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {profile.recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="mini-panel"
                  style={{
                    borderLeft: "3px solid #a855f7",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12, flexShrink: 0, fontWeight: 700 }}>
                    {SPORT_ICONS[achievement.sport as SportType] ?? "Sport"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
                      {achievement.title}
                    </p>
                    <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                      +{achievement.rewardPoints} pts · {timeAgo(achievement.completedAt)}
                    </p>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      background: "#f3e8ff",
                      color: "#7c3aed",
                      borderRadius: 8,
                      padding: "2px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Done
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
