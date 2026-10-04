'use client';

import { useEffect, useRef, useState } from 'react';

import { hopPath } from '@/lib/game/board';
import type { GameState, RollAction } from '@/types/game';
import type { SoundName } from '@/lib/sound';

/**
 * Drives the visual layer of an authoritative match: dice tumble → hop-by-hop
 * movement → climb/slide glide → banner → done.
 *
 * Works for every mode because all of them feed it the same GameState:
 * local, bot and the realtime server all bump `version` + set `lastAction`.
 */

export const ROLL_FACE_MS = 600;
export const HOP_MS = 140;
export const GLIDE_MS = 750;
export const BANNER_HOLD_MS = 1300;

export type MatchBanner = {
  kind: 'ladder' | 'chute' | 'win';
  to: number;
  playerName: string;
} | null;

export type MatchAnimation = {
  positions: Record<string, number>;
  durations: Record<string, number>;
  rolling: boolean;
  banner: MatchBanner;
  animating: boolean;
};

type Options = {
  /** Master switch: when off, snap instantly (reduced motion). */
  animations: boolean;
  playSound?: (name: SoundName) => void;
};

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

function bannerFor(game: GameState, action: RollAction): MatchBanner {
  const playerName = game.players.find(p => p.id === action.playerId)?.name ?? 'A player';
  if (action.winner) return { kind: 'win', to: action.to, playerName };
  if (action.event === 'ladder') return { kind: 'ladder', to: action.to, playerName };
  return { kind: 'chute', to: action.to, playerName };
}

export function useMatchAnimation(game: GameState | null, options: Options): MatchAnimation {
  const { animations, playSound } = options;

  const [positions, setPositions] = useState<Record<string, number>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [rolling, setRolling] = useState(false);
  const [banner, setBanner] = useState<MatchBanner>(null);
  const [animating, setAnimating] = useState(false);

  const versionRef = useRef<number | null>(null);
  const soundRef = useRef(playSound);
  soundRef.current = playSound;

  useEffect(() => {
    if (!game) return;

    const previousVersion = versionRef.current;
    const fresh = previousVersion !== null && game.version !== previousVersion;
    versionRef.current = game.version;

    const base: Record<string, number> = {};
    for (const p of game.players) base[p.id] = p.position;

    const action = fresh ? game.lastAction : null;

    // No new action (first render, reconnect, external refresh): snap.
    if (!action) {
      setPositions(base);
      setDurations({});
      setRolling(false);
      setAnimating(false);
      setBanner(null);
      return;
    }

    if (!animations) {
      setPositions(base);
      setDurations({});
      setRolling(false);
      setAnimating(false);
      if (action.event || action.winner) {
        setBanner(bannerFor(game, action));
        soundRef.current?.(action.winner ? 'win' : action.event === 'ladder' ? 'ladder' : 'chute');
        const t = setTimeout(() => setBanner(null), BANNER_HOLD_MS);
        return () => clearTimeout(t);
      }
      return;
    }

    let cancelled = false;
    setAnimating(true);
    setPositions({ ...base, [action.playerId]: action.from });
    setDurations({ [action.playerId]: HOP_MS });
    setRolling(true);
    soundRef.current?.('roll');

    void (async () => {
      await sleep(ROLL_FACE_MS);
      if (cancelled) return;
      setRolling(false);

      if (!action.skipped) {
        const path = hopPath(action.from, action.landed);
        if (path.length > 0) soundRef.current?.('hop');
        for (const step of path) {
          await sleep(HOP_MS);
          if (cancelled) return;
          setPositions(prev => ({ ...prev, [action.playerId]: step }));
        }

        if (action.event && action.eventTarget != null) {
          await sleep(140);
          if (cancelled) return;
          setBanner(bannerFor(game, action));
          soundRef.current?.(action.event);
          // Apply the longer glide duration one frame before moving.
          setDurations({ [action.playerId]: GLIDE_MS });
          await sleep(70);
          if (cancelled) return;
          const target = action.eventTarget;
          setPositions(prev => ({ ...prev, [action.playerId]: target }));
          await sleep(GLIDE_MS);
          if (cancelled) return;
        }
      }

      setDurations({ [action.playerId]: HOP_MS });
      setPositions(prev => ({ ...prev, [action.playerId]: action.to }));

      if (action.winner) {
        setBanner(bannerFor(game, action));
        soundRef.current?.('win');
      }

      await sleep(action.event || action.winner ? BANNER_HOLD_MS : 90);
      if (cancelled) return;
      setBanner(null);
      setAnimating(false);
    })();

    return () => {
      cancelled = true;
    };
    // `game` identity changes exactly when state mutates; version guards staleness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, animations]);

  return { positions, durations, rolling, banner, animating };
}
