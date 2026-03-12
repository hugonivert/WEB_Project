# 🏆 WEB_Project — Application Sportive

On est 6, on fait une appli sportive en **React + TypeScript**.  
Ce fichier explique comment on code tous **de la même façon**. À lire avant de commencer.

---

## 🗂️ Où je mets mes fichiers ?

Chaque dev a **son dossier** dans `features/`. Tu ne touches pas au dossier d'un autre.

```
src/
├── components/      → Composants réutilisables partout (bouton, carte...)
├── features/        → Une feature par dev, à définir ensemble
├── hooks/           → Hooks partagés
├── services/        → Tous les appels API
├── store/           → État global (Zustand)
├── types/           → Types partagés entre plusieurs features
└── utils/           → Petites fonctions utilitaires
```

---

## ✍️ Comment je nomme mes fichiers ?

| Ce que je crée        | Comment je l'appelle     | Exemple                |
| --------------------- | ------------------------ | ---------------------- |
| Un composant React    | `PascalCase`             | `PlayerCard.tsx`       |
| Un hook               | `use` + `camelCase`      | `useMatchData.ts`      |
| Un fichier de types   | `PascalCase.types.ts`    | `Player.types.ts`      |
| Une variable/fonction | `camelCase`              | `fetchPlayerStats()`   |
| Une constante         | `MAJUSCULES_UNDERSCORES` | `MAX_PLAYERS_PER_TEAM` |
| Un service API        | `camelCase.service.ts`   | `match.service.ts`     |

---

## 🔷 Les règles TypeScript (non négociables)

### ❌ Interdit

```ts
const data: any = fetch(...)          // ❌ any est INTERDIT
function MyComponent() { ... }        // ❌ pas de function classique
const [score, setScore] = useState()  // ❌ useState non typé
```

### ✅ Obligatoire

```ts
// Arrow function pour les composants, avec type de retour
const PlayerCard = ({ player }: PlayerCardProps): JSX.Element => { ... }

// useState toujours typé
const [score, setScore] = useState<number>(0)
const [player, setPlayer] = useState<Player | null>(null)

// Interface pour les props de chaque composant
interface PlayerCardProps {
  player: Player
  isSelected: boolean
  onSelect: (id: string) => void
}

// Interface pour les objets
interface Player {
  id: string
  firstName: string
  lastName: string
  sport: Sport
}

// type pour les listes de valeurs fixes
type Sport = "football" | "basketball" | "tennis" | "rugby"
```

> 💡 **Règle simple :** objet/props → `interface` | liste de choix → `type`

---

## ⚛️ Structure d'un composant

Chaque composant a **son propre dossier** avec 3 fichiers :

```
PlayerCard/
├── PlayerCard.tsx           → le composant
├── PlayerCard.types.ts      → ses props
└── PlayerCard.module.css    → son style
```

---

## 🔀 Git — comment on travaille

```bash
# Une branche par feature (jamais travailler sur main directement)
git checkout -b feature/monprenom/ce-que-je-fais

# Commits en anglais avec un préfixe
feat: add match list
fix: fix player stats bug
style: update card design
```

- 🚫 Jamais de push direct sur `main`
- ✅ Toujours passer par une **Pull Request**
- ✅ Au moins **1 autre** doit valider avant de merger

---

## ✅ Checklist avant de faire une PR

- [ ] Aucun `any` dans mon code
- [ ] Tous mes `useState` sont typés
- [ ] Toutes mes props ont une interface
- [ ] `npm run build` passe sans erreur

---

_Dernière mise à jour : Mars 2026_

---

## �️ Où je mets mes fichiers ?

Chaque dev a **son dossier** dans `features/`. Tu ne touches pas au dossier d'un autre.

```
src/
├── components/      → Composants réutilisables partout (bouton, carte...)
├── features/
│   ├── auth/        → Dev 1 — Connexion / inscription
│   ├── matches/     → Dev 2 — Matchs & résultats
│   ├── players/     → Dev 3 — Joueurs & profils
│   └── leaderboard/ → Dev 4 — Classements & stats
├── hooks/           → Hooks partagés (useXxx.ts)
├── pages/           → Les pages de l'appli
├── services/        → Tous les appels API
├── store/           → État global (Zustand)
├── types/           → Types partagés entre plusieurs features
└── utils/           → Petites fonctions utilitaires
```

---

## ✍️ Comment je nomme mes fichiers ?

| Ce que je crée        | Comment je l'appelle     | Exemple                |
| --------------------- | ------------------------ | ---------------------- |
| Un composant React    | `PascalCase`             | `PlayerCard.tsx`       |
| Un hook               | `use` + `camelCase`      | `useMatchData.ts`      |
| Un fichier de types   | `PascalCase.types.ts`    | `Player.types.ts`      |
| Une variable/fonction | `camelCase`              | `fetchPlayerStats()`   |
| Une constante         | `MAJUSCULES_UNDERSCORES` | `MAX_PLAYERS_PER_TEAM` |
| Un service API        | `camelCase.service.ts`   | `match.service.ts`     |

---

## 🔷 Les règles TypeScript (non négociables)

### ❌ Interdit

```ts
const data: any = fetch(...)       // ❌ any est INTERDIT
function MyComponent() { ... }     // ❌ pas de function classique
const [score, setScore] = useState() // ❌ useState non typé
```

### ✅ Obligatoire

```ts
// 1. Arrow function pour les composants, avec type de retour
const PlayerCard = ({ player }: PlayerCardProps): JSX.Element => { ... }

// 2. useState toujours typé
const [score, setScore] = useState<number>(0)
const [player, setPlayer] = useState<Player | null>(null)

// 3. Interface pour les props de chaque composant
interface PlayerCardProps {
  player: Player
  isSelected: boolean
  onSelect: (id: string) => void
}

// 4. Interface pour les objets métier
interface Player {
  id: string
  firstName: string
  lastName: string
  sport: Sport
}

// 5. type pour les unions (liste de valeurs fixes)
type Sport = "football" | "basketball" | "tennis" | "rugby"
type MatchStatus = "scheduled" | "live" | "finished" | "cancelled"
```

> 💡 **Règle simple :** objet/props → `interface` | liste de choix → `type`

---

## ⚛️ Structure d'un composant

Chaque composant a **son propre dossier** avec 3 fichiers :

```
PlayerCard/
├── PlayerCard.tsx          → le composant
├── PlayerCard.types.ts     → ses props
└── PlayerCard.module.css   → son style
```

```tsx
// PlayerCard.tsx
import React from "react";
import { PlayerCardProps } from "./PlayerCard.types";
import styles from "./PlayerCard.module.css";

const PlayerCard = ({
  player,
  isSelected,
  onSelect,
}: PlayerCardProps): JSX.Element => {
  return (
    <div className={styles.card} onClick={() => onSelect(player.id)}>
      <h3>
        {player.firstName} {player.lastName}
      </h3>
    </div>
  );
};

export default PlayerCard;
```

```ts
// PlayerCard.types.ts
import { Player } from "../../types";

export interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
```

---

## 🌐 Structure d'un appel API

```ts
// src/services/match.service.ts
import { Match } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export const getMatches = async (): Promise<Match[]> => {
  const response = await fetch(`${API_BASE_URL}/matches`);
  if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  return response.json() as Promise<Match[]>;
};
```

---

## 🔀 Git — comment on travaille

```bash
# Je crée ma branche (jamais travailler directement sur main)
git checkout -b feature/monprenom/ce-que-je-fais
# Exemple :
git checkout -b feature/hugo/match-list

# Mes commits (en anglais, avec un préfixe)
feat: add match list page
fix: fix player stats bug
style: update card design
```

**Règles Git :**

- 🚫 Jamais de push direct sur `main`
- ✅ Toujours passer par une **Pull Request**
- ✅ Au moins **1 autre** doit valider avant de merger

---

## ✅ Checklist avant de faire une PR

- [ ] Aucun `any` dans mon code
- [ ] Tous mes `useState` sont typés
- [ ] Toutes mes props ont une interface
- [ ] `npm run build` passe sans erreur

---

_Dernière mise à jour : Mars 2026_

```
src/
├── assets/          # Images, icônes, polices
├── components/      # Composants réutilisables (UI génériques)
│   └── Button/
│       ├── Button.tsx
│       ├── Button.types.ts
│       └── Button.test.tsx
├── features/        # Fonctionnalités métier (par domaine)
│   ├── auth/
│   ├── matches/
│   ├── players/
│   └── leaderboard/
├── hooks/           # Hooks personnalisés (useXxx.ts)
├── pages/           # Pages / routes principales
├── services/        # Appels API (axios, fetch)
├── store/           # État global (Redux / Zustand / Context)
├── types/           # Types & interfaces globaux partagés
│   └── index.ts
└── utils/           # Fonctions utilitaires pures
```

**Règle :** chaque développeur crée ses fichiers dans `features/<son-domaine>/`. On ne touche pas au dossier d'un autre sans en parler.

---

## ✍️ Conventions de nommage

| Élément                   | Convention                | Exemple                           |
| ------------------------- | ------------------------- | --------------------------------- |
| Composant React           | `PascalCase`              | `PlayerCard.tsx`                  |
| Hook personnalisé         | `camelCase` + `use`       | `useMatchData.ts`                 |
| Fichier de types          | `PascalCase.types.ts`     | `Player.types.ts`                 |
| Variable / fonction       | `camelCase`               | `fetchPlayerStats()`              |
| Constante globale         | `SCREAMING_SNAKE_CASE`    | `MAX_PLAYERS_PER_TEAM`            |
| Interface                 | `PascalCase` (pas de `I`) | `interface Player { ... }`        |
| Type union / intersection | `PascalCase` + `type`     | `type Sport = "foot" \| "basket"` |
| Fichier de service API    | `camelCase.service.ts`    | `match.service.ts`                |

---

## 🔷 TypeScript — Règles communes

### ✅ À faire

```ts
// 1. Toujours typer les props avec une interface
interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// 2. Typer explicitement les retours de fonction
const getPlayerFullName = (player: Player): string => {
  return `${player.firstName} ${player.lastName}`;
};

// 3. Utiliser des interfaces pour les objets métier
interface Player {
  id: string;
  firstName: string;
  lastName: string;
  sport: Sport;
  teamId: string;
  stats: PlayerStats;
}

interface PlayerStats {
  goals: number;
  assists: number;
  matchesPlayed: number;
}

// 4. Utiliser type pour les unions
type Sport = "football" | "basketball" | "tennis" | "rugby";
type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";

// 5. Typer les useState
const [player, setPlayer] = useState<Player | null>(null);
const [players, setPlayers] = useState<Player[]>([]);
```

### ❌ À éviter

```ts
// ❌ Ne JAMAIS utiliser any
const data: any = fetchData();

// ❌ Ne pas ignorer les erreurs TypeScript avec @ts-ignore
// @ts-ignore
const result = brokenFunction();

// ❌ Ne pas mélanger les styles de composant
function OldStyle() { return <div /> }          // ❌
const GoodStyle = (): JSX.Element => <div />;   // ✅

// ❌ Ne pas typer les props inline sans interface
const Card = ({ name, age }: { name: string; age: number }) => ...
// ✅ Préférer une interface séparée
```

### 📦 Types globaux partagés (`src/types/index.ts`)

Tous les types utilisés par **plus d'une feature** vont ici.  
Les types propres à une feature restent dans `features/<feature>/types.ts`.

---

## ⚛️ Composants React

### Structure standard d'un composant

```tsx
// src/components/PlayerCard/PlayerCard.tsx

import React from "react";
import { PlayerCardProps } from "./PlayerCard.types";
import styles from "./PlayerCard.module.css";

const PlayerCard = ({
  player,
  isSelected,
  onSelect,
}: PlayerCardProps): JSX.Element => {
  const handleClick = (): void => {
    onSelect(player.id);
  };

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={handleClick}
    >
      <h3>
        {player.firstName} {player.lastName}
      </h3>
      <p>{player.sport}</p>
    </div>
  );
};

export default PlayerCard;
```

### Structure du fichier de types associé

```ts
// src/components/PlayerCard/PlayerCard.types.ts

import { Player } from "../../types";

export interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
```

### Règles composants

- **Un composant = un dossier** avec ses propres fichiers (`.tsx`, `.types.ts`, `.module.css`)
- Toujours utiliser des **arrow functions**
- Toujours expliciter le type de retour `: JSX.Element` ou `: React.ReactNode`
- **Pas de logique métier** dans les composants UI → la mettre dans les hooks

---

## 🔄 Gestion des états

### Local state

```ts
// Toujours typer useState
const [score, setScore] = useState<number>(0);
const [match, setMatch] = useState<Match | null>(null);
```

### État global (exemple avec Zustand recommandé)

```ts
// src/store/matchStore.ts
import { create } from "zustand";
import { Match } from "../types";

interface MatchStore {
  matches: Match[];
  selectedMatch: Match | null;
  setMatches: (matches: Match[]) => void;
  selectMatch: (match: Match) => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  matches: [],
  selectedMatch: null,
  setMatches: (matches) => set({ matches }),
  selectMatch: (match) => set({ selectedMatch: match }),
}));
```

---

## 🌐 Appels API & données sportives

### Structure d'un service

```ts
// src/services/match.service.ts

import { Match } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export const getMatches = async (): Promise<Match[]> => {
  const response = await fetch(`${API_BASE_URL}/matches`);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  return response.json() as Promise<Match[]>;
};

export const getMatchById = async (id: string): Promise<Match> => {
  const response = await fetch(`${API_BASE_URL}/matches/${id}`);
  if (!response.ok) {
    throw new Error(`Match introuvable: ${id}`);
  }
  return response.json() as Promise<Match>;
};
```

### Hook personnalisé pour les appels API

```ts
// src/hooks/useMatches.ts

import { useState, useEffect } from "react";
import { Match } from "../types";
import { getMatches } from "../services/match.service";

interface UseMatchesReturn {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
}

const useMatches = (): UseMatchesReturn => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async (): Promise<void> => {
      try {
        const data = await getMatches();
        setMatches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return { matches, isLoading, error };
};

export default useMatches;
```

---

## 👥 Découpage des tâches (6 développeurs)

| #   | Développeur | Domaine            | Dossier principal       |
| --- | ----------- | ------------------ | ----------------------- |
| 1   | Dev 1       | Authentification   | `features/auth/`        |
| 2   | Dev 2       | Matchs & résultats | `features/matches/`     |
| 3   | Dev 3       | Joueurs & profils  | `features/players/`     |
| 4   | Dev 4       | Classement / stats | `features/leaderboard/` |
| 5   | Dev 5       | UI / Design system | `components/`           |
| 6   | Dev 6       | API & Store global | `services/` + `store/`  |

> 📌 Adaptez ce tableau à votre équipe réelle. Chaque dev est **responsable** de son domaine.

---

## 🔀 Workflow Git

```bash
# Branche par feature
git checkout -b feature/<nom-dev>/<description-courte>
# Exemple :
git checkout -b feature/dev2/match-list

# Commits en anglais, préfixés
feat: add match list component
fix: correct player stats calculation
refactor: extract useMatches hook
style: update PlayerCard CSS
```

### Règles

- **Jamais de push direct sur `main`**
- Toujours créer une **Pull Request** pour merger
- Au moins **1 reviewer** avant de merger
- Résoudre les **conflits TypeScript** avant de soumettre la PR
- `npm run build` doit passer sans erreur avant toute PR

---

## 🛠️ Configuration TypeScript recommandée (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@features/*": ["src/features/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src"]
}
```

---

## ✅ Checklist avant chaque Pull Request

- [ ] Aucun `any` dans le code
- [ ] Toutes les props ont une interface typée
- [ ] Les `useState` sont typés
- [ ] Les retours de fonctions sont explicitement typés
- [ ] `npm run build` passe sans erreur
- [ ] `npm run lint` passe sans warning
- [ ] Le code est dans le bon dossier (`features/<domaine>/`)
- [ ] Les types partagés sont dans `src/types/`
- [ ] La PR a un reviewer assigné

---

_Document maintenu par l'équipe — Dernière mise à jour : Mars 2026_
