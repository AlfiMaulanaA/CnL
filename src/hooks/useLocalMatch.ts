'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { botDelayMs } from '@/lib/game/bot';
import { rollDice } from '@/lib/game/dice';
import { createGame, dispatch, getCurrentPlayer, rematchGame, type GamePlayerInit } from '@/lib/game/engine';
import type { GameSettings, GameState } from '@/types/game';

export type LocalMatchMode = 'local' | 'bot';

type Options = {
  mode: LocalMatchMode;
  players: GamePlayerInit[];
  rules: Partial<GameSettings>;
  /** Hold bot turns while the previous move is still animating. */
  paused?: boolean;
  /** Resume a saved match. */
  initialGame?: GameState | null;
  /** Create the game immediately instead of waiting for start(). */
  autoStart?: boolean;
};

/**
 * Offline match state machine shared by /local and /bot.
 *
 * The dice are generated client-side with crypto (TASK §15) and dispatched
 * through the same pure engine the online server uses. A version guard makes
 * double clicks harmless: only the first roll for the current state lands.
 */
export function useLocalMatch({ mode, players, rules, paused = false, initialGame = null, autoStart = false }: Options) {
  const [game, setGame] = useState<GameState | null>(
    () => initialGame ?? (autoStart && players.length >= 2 ? createGame(players, rules) : null)
  );

  const gameRef = useRef<GameState | null>(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const roll = useCallback(() => {
    const current = gameRef.current;
    if (!current || current.status !== 'playing') return;
    const cur = getCurrentPlayer(current);
    // Humans roll here; bots are driven by the timer effect below.
    if (!cur || cur.type === 'bot') return;

    const expected = current.version;
    const value = rollDice();
    setGame(prev => {
      if (!prev || prev.version !== expected || prev.status !== 'playing') return prev;
      const next = structuredClone(prev);
      const result = dispatch(next, { roll: value });
      return result.ok ? next : prev;
    });
  }, []);

  // Bot turns: wait a light delay, then roll with the same authoritative path.
  useEffect(() => {
    if (!game || game.status !== 'playing' || paused) return;
    const current = game.players[game.currentPlayerIndex];
    if (!current || current.type !== 'bot') return;

    const timer = window.setTimeout(() => {
      const value = rollDice();
      setGame(prev => {
        if (!prev || prev.status !== 'playing') return prev;
        const active = prev.players[prev.currentPlayerIndex];
        if (!active || active.type !== 'bot') return prev;
        const next = structuredClone(prev);
        const result = dispatch(next, { roll: value });
        return result.ok ? next : prev;
      });
    }, botDelayMs(current.botDifficulty));

    return () => window.clearTimeout(timer);
  }, [game, paused]);

  const start = useCallback(() => {
    if (players.length < 2) return;
    setGame(createGame(players, rules));
  }, [players, rules]);

  const resume = useCallback((saved: GameState) => {
    setGame(saved);
  }, []);

  const rematch = useCallback(() => {
    setGame(prev => (prev ? rematchGame(prev) : prev));
  }, []);

  const restart = useCallback(
    (nextPlayers?: GamePlayerInit[], nextRules?: Partial<GameSettings>) => {
      const list = nextPlayers ?? players;
      if (list.length < 2) return;
      setGame(createGame(list, nextRules ?? rules));
    },
    [players, rules]
  );

  const stop = useCallback(() => setGame(null), []);

  return { game, roll, start, resume, rematch, restart, stop, mode };
}
