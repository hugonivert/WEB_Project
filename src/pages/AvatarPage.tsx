import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { avatarRewards } from "../data/mockData";

export default function AvatarPage() {
  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Avatar"
        title="Cosmetics, progression and unlockables"
        description="This page is ready for the teammate handling rewards, skins, progression systems and the avatar customisation UI."
        badge="Owner suggestion: Member 5"
      />

      <div className="route-grid route-grid-2">
        <SectionCard
          title="Current profile"
          description="Minimal progression block to anchor the future avatar feature."
        >
          <div className="avatar-preview">
            <div className="avatar-orb">AQ</div>
            <div>
              <p className="metric-value metric-value-small">Level 12</p>
              <p className="section-card-copy">6420 XP · Member since September 2025</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Unlock roadmap"
          description="Mock rewards linked to age on platform, missions and performance."
        >
          <div className="stack-sm">
            {avatarRewards.map((reward) => (
              <div key={reward.name} className="mini-panel">
                <strong>{reward.name}</strong>
                <p className="section-card-copy">{reward.condition}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
