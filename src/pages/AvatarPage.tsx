import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import AvatarViewer from "../components/avatar/AvatarViewer";
import ReadyPlayerMeCreator from "../components/avatar/ReadyPlayerMeCreator";
import { fetchAvatarProfile, updateAvatarProfile, type AvatarProfileDto } from "../api/avatar";
import { readAuthSession } from "../lib/auth";
import type { PlannerProfile } from "../api/planner";

const rpmSubdomain = import.meta.env.VITE_RPM_SUBDOMAIN || "demo";

export default function AvatarPage() {
  const [user, setUser] = useState<PlannerProfile | null>(null);
  const [avatarProfile, setAvatarProfile] = useState<AvatarProfileDto | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAvatarPage() {
      try {
        setIsLoading(true);

        const session = readAuthSession();
        if (!session?.user.id) {
          setErrorMessage("Not connected. Please log in again.");
          setIsLoading(false);
          return;
        }

        const profile: PlannerProfile = {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          avatarUrl: session.user.avatarUrl ?? null,
          profile: {
            primarySport: "RUNNING",
            bio: null,
            timezone: "Europe/Paris",
          },
        };

        if (isCancelled) {
          return;
        }

        setUser(profile);

        const avatarResponse = await fetchAvatarProfile(profile.id);

        if (isCancelled) {
          return;
        }

        setAvatarProfile(avatarResponse);
        setErrorMessage(null);
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

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Avatar"
        title="Create your avatar"
        description="Use the creator on the left, then view the final avatar on the right."
        badge="Ready Player Me"
      />

      {errorMessage ? <p className="avatar-error-text">{errorMessage}</p> : null}

      <div className="route-grid route-grid-2">
        <SectionCard
          title="Avatar creator"
          description="Open the creator, finish your avatar, and export it to save it on your profile."
        >
          <div className="stack-sm">
            <div className="action-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => setIsEditorOpen((current) => !current)}
              >
                {isEditorOpen ? "Hide creator" : "Create avatar"}
              </button>
              <span className="section-card-copy">
                {isSaving ? "Saving avatar..." : "Export from the creator to update the preview."}
              </span>
            </div>

            {isEditorOpen ? (
              <ReadyPlayerMeCreator subdomain={rpmSubdomain} onAvatarExported={handleAvatarExported} />
            ) : (
              <div className="mini-panel">
                <strong>Start here</strong>
                <p className="section-card-copy">
                  Click "Create avatar" to open the editor.
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Your avatar"
          description="This block shows the avatar currently saved on your account."
        >
          {isLoading ? (
            <div className="avatar-viewer avatar-viewer-empty">
              <p className="section-card-copy">Loading avatar viewer...</p>
            </div>
          ) : (
            <AvatarViewer
              avatarUrl={avatarProfile?.avatarUrl ?? null}
              displayName={avatarProfile?.displayName ?? user?.displayName ?? "Connected user"}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
