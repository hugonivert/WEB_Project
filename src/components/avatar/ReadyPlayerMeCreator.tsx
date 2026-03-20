import { useEffect, useMemo } from "react";

type ReadyPlayerMeCreatorProps = {
  subdomain: string;
  onAvatarExported: (avatarUrl: string, avatarId: string | null) => void;
};

type ReadyPlayerMeEvent =
  | {
      eventName?: string;
      source?: string;
      data?: {
        avatarId?: string;
        url?: string;
      };
    }
  | string;

function getAvatarExport(data: ReadyPlayerMeEvent) {
  if (typeof data === "string" && data.startsWith("https://")) {
    return {
      avatarId: null,
      avatarUrl: data,
    };
  }

  if (
    typeof data === "object" &&
    data?.source === "readyplayerme" &&
    data.eventName === "v1.avatar.exported" &&
    data.data?.url
  ) {
    return {
      avatarId: data.data.avatarId ?? null,
      avatarUrl: data.data.url,
    };
  }

  return null;
}

export default function ReadyPlayerMeCreator({
  subdomain,
  onAvatarExported,
}: ReadyPlayerMeCreatorProps) {
  const creatorUrl = useMemo(() => {
    const url = new URL(`https://${subdomain}.readyplayer.me/avatar`);
    url.searchParams.set("frameApi", "");
    url.searchParams.set("bodyType", "fullbody");
    url.searchParams.set("clearCache", "");
    return url.toString();
  }, [subdomain]);

  useEffect(() => {
    const expectedOrigin = new URL(creatorUrl).origin;

    function handleMessage(event: MessageEvent<ReadyPlayerMeEvent>) {
      if (event.origin !== expectedOrigin) {
        return;
      }

      const payload = event.data;

      if (
        typeof payload === "object" &&
        payload?.source === "readyplayerme" &&
        payload.eventName === "v1.frame.ready"
      ) {
        return;
      }

      const exportPayload = getAvatarExport(payload);

      if (exportPayload) {
        onAvatarExported(exportPayload.avatarUrl, exportPayload.avatarId);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [creatorUrl, onAvatarExported]);

  return (
    <div className="avatar-editor-shell">
      <iframe
        title="Ready Player Me avatar creator"
        src={creatorUrl}
        className="avatar-creator-frame"
        allow="camera *; microphone *"
      />
    </div>
  );
}
