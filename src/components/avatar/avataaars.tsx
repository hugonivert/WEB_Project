import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

export const AVATAAARS_OPTIONS = {
  style: ["default", "circle"],
  top: [
    "bigHair",
    "bob",
    "bun",
    "curly",
    "curvy",
    "dreads",
    "dreads01",
    "dreads02",
    "frida",
    "fro",
    "froBand",
    "frizzle",
    "hat",
    "hijab",
    "longButNotTooLong",
    "miaWallace",
    "shaggy",
    "shaggyMullet",
    "shavedSides",
    "shortCurly",
    "shortFlat",
    "shortRound",
    "shortWaved",
    "sides",
    "straight01",
    "straight02",
    "straightAndStrand",
    "theCaesar",
    "theCaesarAndSidePart",
    "turban",
    "winterHat1",
    "winterHat02",
    "winterHat03",
    "winterHat04",
  ],
  accessories: [
    "blank",
    "eyepatch",
    "kurt",
    "prescription01",
    "prescription02",
    "round",
    "sunglasses",
    "wayfarers",
  ],
  hairColor: ["a55728", "2c1b18", "b58143", "d6b370", "724133", "4a312c", "f59797", "ecdcbf", "c93305", "e8e1e1"],
  hatColor: ["262e33", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "3c4f5c", "b1e2ff", "a7ffc4", "ffdeb5", "ffafb9", "ffffb1", "ff488e", "ff5c5c", "ffffff"],
  accessoriesColor: ["262e33", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "3c4f5c", "b1e2ff", "a7ffc4", "ffdeb5", "ffafb9", "ffffb1", "ff488e", "ff5c5c", "ffffff"],
  facialHair: ["blank", "beardLight", "beardMajestic", "beardMedium", "moustacheFancy", "moustacheMagnum"],
  facialHairColor: ["a55728", "2c1b18", "b58143", "d6b370", "724133", "4a312c", "f59797", "ecdcbf", "c93305", "e8e1e1"],
  clothing: ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"],
  clothesColor: ["262e33", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "3c4f5c", "b1e2ff", "a7ffc4", "ffafb9", "ffffb1", "ff488e", "ff5c5c", "ffffff"],
  clothingGraphic: ["blank", "bat", "bear", "cumbia", "deer", "diamond", "hola", "pizza", "resist", "skull", "skullOutline"],
  eyes: ["closed", "cry", "default", "eyeRoll", "happy", "hearts", "side", "squint", "surprised", "wink", "winkWacky", "xDizzy"],
  eyebrows: ["angry", "angryNatural", "default", "defaultNatural", "flatNatural", "frownNatural", "raisedExcited", "raisedExcitedNatural", "sadConcerned", "sadConcernedNatural", "unibrowNatural", "upDown", "upDownNatural"],
  mouth: ["concerned", "default", "disbelief", "eating", "grimace", "sad", "screamOpen", "serious", "smile", "tongue", "twinkle", "vomit"],
  skinColor: ["614335", "d08b5b", "ae5d29", "edb98a", "ffdbb4", "fd9841", "f8d25c"],
  backgroundColor: ["transparent", "65c9ff", "5199e4", "25557c", "e6e6e6", "b1e2ff", "a7ffc4", "ffdeb5", "ffafb9", "ffffb1", "ff488e", "ffffff"],
} as const;

export type AvataaarsConfig = {
  style: (typeof AVATAAARS_OPTIONS.style)[number];
  top: (typeof AVATAAARS_OPTIONS.top)[number];
  accessories: (typeof AVATAAARS_OPTIONS.accessories)[number];
  hairColor: (typeof AVATAAARS_OPTIONS.hairColor)[number];
  hatColor: (typeof AVATAAARS_OPTIONS.hatColor)[number];
  accessoriesColor: (typeof AVATAAARS_OPTIONS.accessoriesColor)[number];
  facialHair: (typeof AVATAAARS_OPTIONS.facialHair)[number];
  facialHairColor: (typeof AVATAAARS_OPTIONS.facialHairColor)[number];
  clothing: (typeof AVATAAARS_OPTIONS.clothing)[number];
  clothesColor: (typeof AVATAAARS_OPTIONS.clothesColor)[number];
  clothingGraphic: (typeof AVATAAARS_OPTIONS.clothingGraphic)[number];
  eyes: (typeof AVATAAARS_OPTIONS.eyes)[number];
  eyebrows: (typeof AVATAAARS_OPTIONS.eyebrows)[number];
  mouth: (typeof AVATAAARS_OPTIONS.mouth)[number];
  skinColor: (typeof AVATAAARS_OPTIONS.skinColor)[number];
  backgroundColor: (typeof AVATAAARS_OPTIONS.backgroundColor)[number];
};

export const DEFAULT_AVATAAARS_CONFIG: AvataaarsConfig = {
  style: "circle",
  top: "shortFlat",
  accessories: "blank",
  hairColor: "4a312c",
  hatColor: "5199e4",
  accessoriesColor: "262e33",
  facialHair: "blank",
  facialHairColor: "4a312c",
  clothing: "hoodie",
  clothesColor: "25557c",
  clothingGraphic: "blank",
  eyes: "happy",
  eyebrows: "default",
  mouth: "smile",
  skinColor: "ffdbb4",
  backgroundColor: "b1e2ff",
};

function normalizeConfig(config: Partial<AvataaarsConfig>): AvataaarsConfig {
  const nextConfig = { ...DEFAULT_AVATAAARS_CONFIG };

  (Object.keys(AVATAAARS_OPTIONS) as Array<keyof AvataaarsConfig>).forEach((key) => {
    const value = config[key] as string | undefined;
    const values = AVATAAARS_OPTIONS[key] as readonly string[];

    if (value && values.includes(value)) {
      (nextConfig as Record<string, string>)[key] = value;
    }
  });

  return nextConfig;
}

function encodeSvg(svg: string) {
  return encodeURIComponent(svg)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ")
    .replace(/%3D/g, "=")
    .replace(/%3A/g, ":")
    .replace(/%2F/g, "/");
}

export function renderAvataaarsSvg(config: AvataaarsConfig) {
  const result = createAvatar(avataaars, {
    size: 320,
    seed: "fitquest-avatar",
    style: [config.style],
    top: [config.top],
    accessories: config.accessories === "blank" ? [] : [config.accessories],
    accessoriesProbability: config.accessories === "blank" ? 0 : 100,
    hairColor: [config.hairColor],
    hatColor: [config.hatColor],
    accessoriesColor: [config.accessoriesColor],
    facialHair: config.facialHair === "blank" ? [] : [config.facialHair],
    facialHairProbability: config.facialHair === "blank" ? 0 : 100,
    facialHairColor: [config.facialHairColor],
    clothing: [config.clothing],
    clothesColor: [config.clothesColor],
    clothingGraphic: config.clothingGraphic === "blank" ? [] : [config.clothingGraphic],
    eyes: [config.eyes],
    eyebrows: [config.eyebrows],
    mouth: [config.mouth],
    skinColor: [config.skinColor],
    backgroundColor: [config.backgroundColor],
  });

  return result.toString();
}

export function buildAvataaarsDataUrl(config: AvataaarsConfig) {
  const serializedConfig = encodeURIComponent(JSON.stringify(config));
  const svg = renderAvataaarsSvg(config).replace(
    /<svg\b([^>]*)>/,
    `<svg$1><desc id="avatar-config">${serializedConfig}</desc>`,
  );

  return `data:image/svg+xml;charset=utf-8,${encodeSvg(svg)}`;
}

export function parseAvataaarsConfig(avatarUrl: string | null) {
  if (!avatarUrl?.startsWith("data:image/svg+xml")) {
    return null;
  }

  const payload = avatarUrl.slice(avatarUrl.indexOf(",") + 1);

  try {
    const svg = decodeURIComponent(payload);
    const match = svg.match(/<desc id="avatar-config">([^<]+)<\/desc>/);
    const serialized = match?.[1];
    if (!serialized) {
      return null;
    }

    return normalizeConfig(JSON.parse(decodeURIComponent(serialized)) as Partial<AvataaarsConfig>);
  } catch {
    return null;
  }
}

export function randomAvataaarsConfig() {
  const entries = Object.entries(AVATAAARS_OPTIONS).map(([key, values]) => [
    key,
    values[Math.floor(Math.random() * values.length)] ?? values[0],
  ]);

  return normalizeConfig(Object.fromEntries(entries) as Partial<AvataaarsConfig>);
}

const COLOR_LABELS: Record<string, string> = {
  "262e33": "Charcoal",
  "65c9ff": "Sky",
  "5199e4": "Blue",
  "25557c": "Navy",
  "e6e6e6": "Silver",
  "929598": "Gray",
  "3c4f5c": "Slate",
  "b1e2ff": "Ice",
  "a7ffc4": "Mint",
  "ffdeb5": "Peach",
  "ffafb9": "Rose",
  "ffffb1": "Lemon",
  "ff488e": "Pink",
  "ff5c5c": "Red",
  "ffffff": "White",
  transparent: "Transparent",
  "a55728": "Auburn",
  "2c1b18": "Black",
  "b58143": "Blonde",
  "d6b370": "Golden",
  "724133": "Brown",
  "4a312c": "Dark Brown",
  "f59797": "Pastel Pink",
  "ecdcbf": "Platinum",
  "c93305": "Copper",
  "e8e1e1": "Silver Gray",
  "614335": "Deep Brown",
  "d08b5b": "Tan",
  "ae5d29": "Warm Brown",
  "edb98a": "Light Tan",
  "ffdbb4": "Light",
  "fd9841": "Amber",
  "f8d25c": "Gold",
};

export function formatAvataaarsLabel(value: string) {
  if (COLOR_LABELS[value]) {
    return COLOR_LABELS[value];
  }

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1")
    .replace(/\s+/g, " ")
    .replace(/^x Dizzy$/i, "XDizzy")
    .trim();
}
