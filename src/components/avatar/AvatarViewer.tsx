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
            Create an Avataaars avatar and save it to your profile to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="avatar-viewer">
      <img
        src={avatarUrl}
        alt={`${displayName} avatar`}
        className="avatar-viewer-image"
      />
    </div>
  );
}
