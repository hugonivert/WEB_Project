import { useEffect, useMemo, useState } from "react";
import {
  AVATAAARS_OPTIONS,
  buildAvataaarsDataUrl,
  DEFAULT_AVATAAARS_CONFIG,
  formatAvataaarsLabel,
  parseAvataaarsConfig,
  randomAvataaarsConfig,
  renderAvataaarsSvg,
  type AvataaarsConfig,
} from "./avataaars";

type AvataaarsCreatorProps = {
  initialAvatarUrl: string | null;
  isSaving: boolean;
  onAvatarSaved: (avatarUrl: string) => Promise<void>;
};

const CONTROL_GROUPS: Array<{
  title: string;
  fields: Array<keyof AvataaarsConfig>;
}> = [
  {
    title: "Shape",
    fields: ["style", "backgroundColor", "skinColor"],
  },
  {
    title: "Head",
    fields: ["top", "hairColor", "hatColor", "accessories", "accessoriesColor"],
  },
  {
    title: "Face",
    fields: ["eyes", "eyebrows", "mouth", "facialHair", "facialHairColor"],
  },
  {
    title: "Clothes",
    fields: ["clothing", "clothesColor", "clothingGraphic"],
  },
];

export default function AvataaarsCreator({
  initialAvatarUrl,
  isSaving,
  onAvatarSaved,
}: AvataaarsCreatorProps) {
  const [config, setConfig] = useState<AvataaarsConfig>(DEFAULT_AVATAAARS_CONFIG);

  useEffect(() => {
    const savedConfig = parseAvataaarsConfig(initialAvatarUrl);
    if (savedConfig) {
      setConfig(savedConfig);
      return;
    }

    if (!initialAvatarUrl) {
      setConfig(DEFAULT_AVATAAARS_CONFIG);
    }
  }, [initialAvatarUrl]);

  const previewUrl = useMemo(() => {
    const svg = renderAvataaarsSvg(config);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [config]);

  async function handleSave() {
    await onAvatarSaved(buildAvataaarsDataUrl(config));
  }

  function updateField<Key extends keyof AvataaarsConfig>(key: Key, value: AvataaarsConfig[Key]) {
    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="avatar-editor-shell avatar-editor-grid">
      <div className="avatar-editor-stage">
        <div className="avatar-editor-preview">
          <img src={previewUrl} alt="Avatar preview" className="avatar-editor-preview-image" />
        </div>

        <div className="action-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setConfig(DEFAULT_AVATAAARS_CONFIG)}
          >
            Reset
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setConfig(randomAvataaarsConfig())}
          >
            Randomize
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? "Saving avatar..." : "Save avatar"}
          </button>
        </div>
      </div>

      <div className="avatar-editor-panel avatar-editor-controls">
        <div className="stack-sm">
          <strong>Create your avatar directly here</strong>
          <p className="section-card-copy">
            Pick the style you want and save it. The avatar is generated directly inside your site
            and stored on your profile as an SVG image.
          </p>
        </div>

        {CONTROL_GROUPS.map((group) => (
          <div key={group.title} className="mini-panel stack-sm">
            <strong>{group.title}</strong>

            <div className="two-column-grid">
              {group.fields.map((field) => (
                <label key={field}>
                  <span className="field-label">{formatAvataaarsLabel(field)}</span>
                  <select
                    className="field-input"
                    value={config[field]}
                    onChange={(event) =>
                      updateField(field, event.target.value as AvataaarsConfig[typeof field])
                    }
                  >
                    {AVATAAARS_OPTIONS[field].map((option) => (
                      <option key={option} value={option}>
                        {formatAvataaarsLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
