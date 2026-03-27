import SectionCard from "../SectionCard";
import type { AvatarProfileDto } from "../../api/avatar";

type AvatarUnlockProgressPanelProps = {
  avatarProfile: AvatarProfileDto | null;
};

export default function AvatarUnlockProgressPanel({
  avatarProfile,
}: AvatarUnlockProgressPanelProps) {
  const nextUnlock = avatarProfile?.unlockCatalog.nextUnlock ?? null;
  const unlockedRewards = avatarProfile?.unlockProgress.filter((rule) => rule.isUnlocked) ?? [];

  return (
    <SectionCard
      title="Unlock progression"
      description="Accessories and outfits are unlocked with your cumulative running distance."
    >
      {avatarProfile ? (
        <div className="stack-sm">
          <div className="mini-panel">
            <strong>{avatarProfile.runningProgress.totalRunningKm.toFixed(2)} km completed</strong>
            <p className="section-card-copy">
              {avatarProfile.runningProgress.completedRuns} validated run(s) counted for unlocks.
            </p>
          </div>

          {nextUnlock ? (
            <>
              <div className="mini-panel">
                <strong>Next unlock: {nextUnlock.title}</strong>
                <p className="section-card-copy">{nextUnlock.description}</p>
                <p className="section-card-copy">
                  {nextUnlock.remainingKm.toFixed(2)} km remaining before this{" "}
                  {nextUnlock.rewardType === "ACCESSORY" ? "accessory" : "outfit"} unlocks.
                </p>
              </div>

              <div className="avatar-progress-bar" aria-hidden="true">
                <span
                  className="avatar-progress-fill"
                  style={{ width: `${Math.max(0, Math.min(nextUnlock.progressPercent, 100))}%` }}
                />
              </div>

              <p className="metric-value metric-value-small">
                {nextUnlock.currentKm.toFixed(2)} / {nextUnlock.thresholdKm} km
              </p>
            </>
          ) : (
            <div className="mini-panel">
              <strong>Everything unlocked</strong>
              <p className="section-card-copy">
                You have unlocked all currently configured accessories and outfits.
              </p>
            </div>
          )}

          <div className="mini-panel">
            <strong>Unlocked rewards</strong>
            <p className="section-card-copy">
              {unlockedRewards.length
                ? unlockedRewards.map((rule) => rule.title).join(" · ")
                : "No accessory or outfit unlocked yet. Your avatar keeps only the base physical customization for now."}
            </p>
          </div>
        </div>
      ) : (
        <p className="section-card-copy">No unlock rule configured yet.</p>
      )}
    </SectionCard>
  );
}
