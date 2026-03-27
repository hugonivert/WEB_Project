import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import AvatarViewer from "../components/avatar/AvatarViewer";
import AvatarUnlockProgressPanel from "../components/avatar/AvatarUnlockProgressPanel";
import { fetchAvatarProfile, type AvatarProfileDto } from "../api/avatar";
import { readAuthSession } from "../lib/auth";
import type { PlannerProfile } from "../api/planner";

export default function AvatarPage() {
  const [user, setUser] = useState<PlannerProfile | null>(null);
  const [avatarProfile, setAvatarProfile] = useState<AvatarProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAvatarPage() {
      try {
        setIsLoading(true);

        const session = readAuthSession();
        if (!session?.user.id) {
          setErrorMessage("Not signed in. Please sign in again.");
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

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Avatar"
        title="Your avatar"
        description="See the avatar currently saved on your profile, then open the editor when you want to change it."
        badge=""
      />

      {errorMessage ? <p className="avatar-error-text">{errorMessage}</p> : null}

      <div className="route-grid route-grid-2">
        <SectionCard
          title=""
          description=""
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

          <div className="avatar-page-actions">
            <Link to="/avatar/edit" className="primary-button">
              Modify my avatar
            </Link>
          </div>
        </SectionCard>

        <AvatarUnlockProgressPanel avatarProfile={avatarProfile} />
      </div>
    </div>
  );
}
