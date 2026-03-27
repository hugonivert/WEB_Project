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
import type { AvatarProfileDto } from "../../api/avatar";

type AvataaarsCreatorProps = {
  initialAvatarUrl: string | null;
  avatarProfile: AvatarProfileDto | null;
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
  avatarProfile,
  isSaving,
  onAvatarSaved,
}: AvataaarsCreatorProps) {
  const [config, setConfig] = useState<AvataaarsConfig>(DEFAULT_AVATAAARS_CONFIG);

  const lockedFields = useMemo(
    () => new Set<keyof AvataaarsConfig>((avatarProfile?.unlockCatalog.lockedFields ?? []) as Array<keyof AvataaarsConfig>),
    [avatarProfile],
  );

  const availableFieldOptions = useMemo(
    () =>
      ({
        accessories:
          avatarProfile?.unlockCatalog.availableOptions.accessories ??
          [...AVATAAARS_OPTIONS.accessories],
        accessoriesColor:
          avatarProfile?.unlockCatalog.availableOptions.accessoriesColor === "all"
            ? [...AVATAAARS_OPTIONS.accessoriesColor]
            : [DEFAULT_AVATAAARS_CONFIG.accessoriesColor],
        clothing:
          avatarProfile?.unlockCatalog.availableOptions.clothing ?? [...AVATAAARS_OPTIONS.clothing],
        clothesColor:
          avatarProfile?.unlockCatalog.availableOptions.clothesColor === "all"
            ? [...AVATAAARS_OPTIONS.clothesColor]
            : [DEFAULT_AVATAAARS_CONFIG.clothesColor],
        clothingGraphic:
          avatarProfile?.unlockCatalog.availableOptions.clothingGraphic === "all"
            ? [...AVATAAARS_OPTIONS.clothingGraphic]
            : [DEFAULT_AVATAAARS_CONFIG.clothingGraphic],
      }) as Record<string, string[]>,
    [avatarProfile],
  );

  function getOptionsForField(field: keyof AvataaarsConfig) {
    return availableFieldOptions[field] ?? [...AVATAAARS_OPTIONS[field]];
  }

  function sanitizeConfig(nextConfig: AvataaarsConfig) {
    const sanitized = { ...nextConfig } as Record<string, string>;

    (Object.keys(availableFieldOptions) as Array<keyof AvataaarsConfig>).forEach((field) => {
      const options = getOptionsForField(field);
      const currentValue = sanitized[field] ?? "";
      if (!options.includes(currentValue)) {
        sanitized[field] = options[0] ?? DEFAULT_AVATAAARS_CONFIG[field];
      }
    });

    return sanitized as AvataaarsConfig;
  }

  useEffect(() => {
    const savedConfig = parseAvataaarsConfig(initialAvatarUrl);
    if (savedConfig) {
      setConfig(sanitizeConfig(savedConfig));
      return;
    }

    if (!initialAvatarUrl) {
      setConfig(sanitizeConfig(DEFAULT_AVATAAARS_CONFIG));
    }
  }, [initialAvatarUrl, availableFieldOptions]);

  useEffect(() => {
    setConfig((current) => sanitizeConfig(current));
  }, [availableFieldOptions]);

  const previewUrl = useMemo(() => {
    const svg = renderAvataaarsSvg(config);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [config]);

  async function handleSave() {
    await onAvatarSaved(buildAvataaarsDataUrl(config));
  }

  function updateField<Key extends keyof AvataaarsConfig>(key: Key, value: AvataaarsConfig[Key]) {
    if (lockedFields.has(key)) {
      return;
    }

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
            onClick={() => setConfig(sanitizeConfig(DEFAULT_AVATAAARS_CONFIG))}
          >
            Reset
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setConfig(sanitizeConfig(randomAvataaarsConfig()))}
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
          <p className="section-card-copy">
            Accessories and outfits unlock only after you accumulate enough running kilometers.
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
                    disabled={lockedFields.has(field)}
                    onChange={(event) =>
                      updateField(field, event.target.value as AvataaarsConfig[typeof field])
                    }
                  >
                    {getOptionsForField(field).map((option: string) => (
                      <option key={option} value={option}>
                        {formatAvataaarsLabel(option)}
                      </option>
                    ))}
                  </select>
                  {lockedFields.has(field) ? (
                    <span className="avatar-lock-hint">
                      Locked until you unlock more running rewards.
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
