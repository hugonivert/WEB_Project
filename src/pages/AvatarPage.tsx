import { lazy, Suspense, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import AvatarViewer from "../components/avatar/AvatarViewer";
import { fetchAvatarProfile, updateAvatarProfile, type AvatarProfileDto } from "../api/avatar";
import { readAuthSession } from "../lib/auth";
import type { PlannerProfile } from "../api/planner";

const AvataaarsCreator = lazy(() => import("../components/avatar/AvataaarsCreator"));

export default function AvatarPage() {
  const [user, setUser] = useState<PlannerProfile | null>(null);
  const [avatarProfile, setAvatarProfile] = useState<AvatarProfileDto | null>(null);
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

  async function handleAvatarExported(avatarUrl: string) {
    if (!user) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const updatedProfile = await updateAvatarProfile(user.id, avatarUrl);
      setAvatarProfile(updatedProfile);
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
        description="Build a 2D Avataaars avatar directly in the page, save it, and preview it here."
        badge="Avataaars"
      />

      {errorMessage ? <p className="avatar-error-text">{errorMessage}</p> : null}

      <div className="route-grid route-grid-2">
        <SectionCard
          title="Avatar creator"
          description="Customize your Avataaars avatar directly in the page and save it to your profile."
        >
          <Suspense fallback={<p className="section-card-copy">Loading avatar editor...</p>}>
            <AvataaarsCreator
              initialAvatarUrl={avatarProfile?.avatarUrl ?? null}
              isSaving={isSaving}
              onAvatarSaved={handleAvatarExported}
            />
          </Suspense>
        </SectionCard>

        <SectionCard
          title="Your avatar"
          description="This block shows the 2D avatar currently saved on your account."
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
