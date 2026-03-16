import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import AvatarInventoryPanel from "../components/avatar/AvatarInventoryPanel";
import AvatarUnlockProgressPanel from "../components/avatar/AvatarUnlockProgressPanel";
import AvatarViewer from "../components/avatar/AvatarViewer";
import ReadyPlayerMeCreator from "../components/avatar/ReadyPlayerMeCreator";
import {
  fetchAvatarInventory,
  fetchAvatarProfile,
  updateAvatarProfile,
  type AvatarInventoryDto,
  type AvatarProfileDto,
} from "../api/avatar";
import { fetchTestProfile, type PlannerProfile } from "../api/planner";

const rpmSubdomain = import.meta.env.VITE_RPM_SUBDOMAIN || "demo";

export default function AvatarPage() {
  const [user, setUser] = useState<PlannerProfile | null>(null);
  const [avatarProfile, setAvatarProfile] = useState<AvatarProfileDto | null>(null);
  const [inventory, setInventory] = useState<AvatarInventoryDto | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAvatarPage() {
      try {
        setIsLoading(true);
        const profile = await fetchTestProfile();

        if (isCancelled) {
          return;
        }

        setUser(profile);

        const [avatarResponse, inventoryResponse] = await Promise.all([
          fetchAvatarProfile(profile.id),
          fetchAvatarInventory(profile.id),
        ]);

        if (isCancelled) {
          return;
        }

        setAvatarProfile(avatarResponse);
        setInventory(inventoryResponse);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load avatar data.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAvatarPage();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleAvatarExported(avatarUrl: string) {
    if (!user) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const updatedProfile = await updateAvatarProfile(user.id, avatarUrl);
      setAvatarProfile(updatedProfile);
      setIsEditorOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save avatar.");
    } finally {
      setIsSaving(false);
    }
  }

  const initials =
    user?.displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AV";

  const primaryRule = avatarProfile?.unlockProgress[0] ?? null;

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Avatar"
        title="Avatar progression"
        description="The avatar viewer is now the main stage of the page, while session-based rewards prepare the clothing unlock loop for later."
        badge="Ready Player Me MVP"
      />

      <section className="avatar-hero-card">
        <div className="avatar-hero-copy">
          <span className="route-badge">Main avatar stage</span>
          <h2 className="avatar-hero-title">{avatarProfile?.displayName ?? user?.displayName ?? "Your avatar"}</h2>
          <p className="route-copy">
            The connected user’s avatar stays front and center. Outfit rewards come from completed sport sessions, not from unrestricted editor access.
          </p>

          <div className="avatar-hero-stats">
            <div className="mini-panel">
              <strong>Profile</strong>
              <p className="section-card-copy">{user?.email ?? "Loading..."}</p>
              <p className="section-card-copy">
                Level {avatarProfile?.progression.level ?? 1} · {avatarProfile?.progression.experiencePoints ?? 0} XP
              </p>
            </div>
            <div className="mini-panel">
              <strong>Next clothing unlock</strong>
              <p className="section-card-copy">
                {primaryRule
                  ? `${primaryRule.currentProgress}/${primaryRule.threshold} completed sessions over 30 min`
                  : "Unlock rule loading..."}
              </p>
              <p className="section-card-copy">
                {primaryRule?.isUnlocked ? "Reward available" : "Progress in motion"}
              </p>
            </div>
          </div>

          <div className="action-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsEditorOpen((current) => !current)}
            >
              {isEditorOpen ? "Close creator" : "Create or update avatar"}
            </button>
            <span className="section-card-copy">{isSaving ? "Saving exported avatar..." : "Ready"}</span>
          </div>

          {errorMessage ? <p className="avatar-error-text">{errorMessage}</p> : null}
        </div>

        <div className="avatar-hero-stage">
          <div className="avatar-stage-badge">{initials}</div>
          {isLoading ? (
            <div className="avatar-viewer avatar-viewer-empty">
              <p className="section-card-copy">Loading avatar viewer...</p>
            </div>
          ) : (
            <AvatarViewer
              avatarUrl={avatarProfile?.avatarUrl ?? null}
              displayName={avatarProfile?.displayName ?? "Connected user"}
            />
          )}
        </div>
      </section>

      <div className="route-grid route-grid-3">
        <SectionCard
          title="Signup customization policy"
          description="This is the intended product rule for a new account."
        >
          <div className="stack-sm">
            <div className="mini-panel">
              <strong>Allowed at signup</strong>
              <p className="section-card-copy">
                {(avatarProfile?.creatorPolicy.allowedAtSignup ?? []).join(" · ")}
              </p>
            </div>
            <div className="mini-panel">
              <strong>Locked at signup</strong>
              <p className="section-card-copy">
                {(avatarProfile?.creatorPolicy.lockedAtSignup ?? []).join(" · ")}
              </p>
            </div>
            <p className="section-card-copy">
              {avatarProfile?.creatorPolicy.providerConstraint}
            </p>
          </div>
        </SectionCard>

        <AvatarUnlockProgressPanel avatarProfile={avatarProfile} />
        <AvatarInventoryPanel inventory={inventory} />
      </div>

      <SectionCard
        title="Avatar creator"
        description="The current embed keeps the integration functional, but strict body/face/skin-only onboarding will require a custom Ready Player Me creator flow."
      >
        {isEditorOpen ? (
          <ReadyPlayerMeCreator subdomain={rpmSubdomain} onAvatarExported={handleAvatarExported} />
        ) : (
          <div className="mini-panel">
            <strong>Why this stays separate</strong>
            <p className="section-card-copy">
              Avatar creation, 3D display, and session reward unlocks are separate concerns. That keeps the upgrade path to a stricter custom creator clean.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
