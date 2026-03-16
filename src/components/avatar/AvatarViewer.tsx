import "@google/model-viewer";

type AvatarViewerProps = {
  avatarUrl: string | null;
  displayName: string;
};

export default function AvatarViewer({ avatarUrl, displayName }: AvatarViewerProps) {
  if (!avatarUrl) {
    return (
      <div className="avatar-viewer avatar-viewer-empty">
        <div>
          <p className="metric-value metric-value-small">No avatar yet</p>
          <p className="section-card-copy">
            Open the creator, export a Ready Player Me avatar, and it will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="avatar-viewer">
      <model-viewer
        src={avatarUrl}
        alt={`${displayName} avatar`}
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1"
        exposure="1"
        camera-orbit="0deg 75deg 2.4m"
        min-camera-orbit="auto 55deg 1.6m"
        max-camera-orbit="auto 95deg 3.2m"
        interaction-prompt="auto"
      />
    </div>
  );
}
