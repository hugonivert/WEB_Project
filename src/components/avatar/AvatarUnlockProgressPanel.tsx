import SectionCard from "../SectionCard";
import type { AvatarProfileDto } from "../../api/avatar";

type AvatarUnlockProgressPanelProps = {
  avatarProfile: AvatarProfileDto | null;
};

export default function AvatarUnlockProgressPanel({
  avatarProfile,
}: AvatarUnlockProgressPanelProps) {
  const primaryRule = avatarProfile?.unlockProgress[0] ?? null;

  return (
    <SectionCard
      title="Unlock progression"
      description="Cosmetic rewards are driven by sport activity rules, not by the base avatar creator."
    >
      {primaryRule ? (
        <div className="stack-sm">
          <div className="mini-panel">
            <strong>{primaryRule.title}</strong>
            <p className="section-card-copy">{primaryRule.description}</p>
          </div>

          <div className="avatar-progress-bar" aria-hidden="true">
            <span
              className="avatar-progress-fill"
              style={{
                width: `${Math.min((primaryRule.currentProgress / primaryRule.threshold) * 100, 100)}%`,
              }}
            />
          </div>

          <p className="metric-value metric-value-small">
            {primaryRule.currentProgress}/{primaryRule.threshold}
          </p>
          <p className="section-card-copy">
            Completed sessions over 30 minutes: {primaryRule.qualifyingCompletedSessions}
          </p>
          <p className="section-card-copy">
            {primaryRule.isUnlocked
              ? `Unlocked ${primaryRule.unlockedCount} clothing reward(s).`
              : `${primaryRule.threshold - primaryRule.currentProgress} more qualifying session(s) needed.`}
          </p>
        </div>
      ) : (
        <p className="section-card-copy">No unlock rule configured yet.</p>
      )}
    </SectionCard>
  );
}
