import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { friendActivities, leaderboard, weeklyMissions } from "../data/mockData";

type SocialTab = "feed" | "missions" | "leaderboard";

export default function SocialHubPage() {
  const [activeTab, setActiveTab] = useState<SocialTab>("feed");

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Community"
        title="Friends activity, AI missions and leaderboard"
        description="This route groups the social layer that is separate from training planning but still tied to engagement and rewards."
        badge="Owner suggestion: Member 4"
      />

      <div className="tab-row">
        {[
          { id: "feed", label: "Activity feed" },
          { id: "missions", label: "Weekly missions" },
          { id: "leaderboard", label: "Leaderboard" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SocialTab)}
            className={activeTab === tab.id ? "tab-button tab-button-active" : "tab-button"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "feed" ? (
        <SectionCard
          title="Friends feed"
          description="Recent activity snapshots. Replace with API data, likes, comments or follows later."
        >
          <div className="stack-sm">
            {friendActivities.map((item) => (
              <div key={`${item.user}-${item.when}`} className="mini-panel">
                <strong>{item.user}</strong>
                <p>{item.activity}</p>
                <p className="section-card-copy">{item.detail}</p>
                <span className="owner-pill owner-pill-subtle">{item.when}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "missions" ? (
        <SectionCard
          title="AI weekly missions"
          description="Mission generation placeholder. This is where your AI planning module can later inject tailored challenges."
        >
          <div className="stack-sm">
            {weeklyMissions.map((mission) => (
              <div key={mission.title} className="mini-panel">
                <strong>{mission.title}</strong>
                <p>{mission.progress}</p>
                <p className="section-card-copy">Reward: {mission.reward}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "leaderboard" ? (
        <SectionCard
          title="Friends leaderboard"
          description="Points earned through missions and activity streaks."
        >
          <div className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <div key={entry.name} className="leaderboard-row">
                <span className="leaderboard-rank">#{index + 1}</span>
                <strong>{entry.name}</strong>
                <span>{entry.points} pts</span>
                <span className="section-card-copy">{entry.streak}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
