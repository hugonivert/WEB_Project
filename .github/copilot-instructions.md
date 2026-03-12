# Instructions pour GitHub Copilot — WEB_Project

Ce projet est une **application sportive** développée par une équipe de 6 personnes en **React + TypeScript**.  
Tu dois **toujours** respecter les conventions définies ci-dessous avant de générer du code.

---

## Stack technique

- **React** avec **TypeScript strict** (`strict: true` dans `tsconfig.json`)
- **Vite** comme bundler
- **CSS Modules** pour les styles
- Gestion d'état : **Zustand**
- Appels API : **fetch** natif via des services typés

---

## Règles TypeScript — NON NÉGOCIABLES

- **Interdiction absolue d'utiliser `any`**. Toujours définir un type précis.
- Toujours typer explicitement les retours de fonction : `: string`, `: void`, `: JSX.Element`, etc.
- Toujours typer les `useState` : `useState<Player | null>(null)`, `useState<Match[]>([])`
- Utiliser des **interfaces** pour les objets et les props de composants.
- Utiliser des **types** (`type`) uniquement pour les unions et intersections.
- Les interfaces ne prennent **pas** de préfixe `I` (pas `IPlayer`, mais `Player`).

```ts
// ✅ Correct
interface Player {
  id: string;
  firstName: string;
  lastName: string;
  sport: Sport;
}

type Sport = "football" | "basketball" | "tennis" | "rugby";
type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";

// ❌ Interdit
const data: any = fetch(...);
```

---

## Conventions de nommage

| Élément                | Convention             | Exemple                |
| ---------------------- | ---------------------- | ---------------------- |
| Composant React        | `PascalCase`           | `PlayerCard.tsx`       |
| Hook personnalisé      | `camelCase` + `use`    | `useMatchData.ts`      |
| Fichier de types       | `PascalCase.types.ts`  | `Player.types.ts`      |
| Variable / fonction    | `camelCase`            | `fetchPlayerStats()`   |
| Constante globale      | `SCREAMING_SNAKE_CASE` | `MAX_PLAYERS_PER_TEAM` |
| Fichier de service API | `camelCase.service.ts` | `match.service.ts`     |

---

## Structure des composants React

Toujours utiliser des **arrow functions**. Jamais de `function` classique pour les composants.

```tsx
// ✅ Structure standard d'un composant
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
    </div>
  );
};

export default PlayerCard;
```

```ts
// ✅ Fichier de types associé (PlayerCard.types.ts)
import { Player } from "../../types";

export interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
```

- Chaque composant a **son propre dossier** : `ComponentName/ComponentName.tsx`, `ComponentName.types.ts`, `ComponentName.module.css`
- **Pas de logique métier** dans les composants UI → la déplacer dans un hook personnalisé

---

## Structure des hooks

```ts
// ✅ Structure standard d'un hook
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

## Structure des services API

```ts
// ✅ Structure standard d'un service (match.service.ts)
import { Match } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export const getMatches = async (): Promise<Match[]> => {
  const response = await fetch(`${API_BASE_URL}/matches`);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  return response.json() as Promise<Match[]>;
};
```

---

## Structure des dossiers

```
src/
├── components/      # Composants UI réutilisables
├── features/        # Fonctionnalités métier par domaine
│   ├── auth/
│   ├── matches/
│   ├── players/
│   └── leaderboard/
├── hooks/           # Hooks personnalisés
├── pages/           # Pages / routes
├── services/        # Appels API
├── store/           # État global (Zustand)
├── types/           # Types & interfaces globaux (index.ts)
└── utils/           # Fonctions utilitaires pures
```

- Les types utilisés par **plus d'une feature** vont dans `src/types/index.ts`
- Les types propres à une feature restent dans `features/<feature>/types.ts`

---

## Store Zustand

```ts
// ✅ Structure standard d'un store
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

## Ce que tu NE dois JAMAIS générer

- Du code avec `any`
- Des composants écrits avec `function` au lieu d'arrow functions
- Des `useState` non typés
- Des props sans interface dédiée
- Des imports sans chemin résolu (utiliser les alias `@components/`, `@features/`, etc.)
- Du code qui ne compilerait pas avec `strict: true`
