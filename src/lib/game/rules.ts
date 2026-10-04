import { BOARD_SIZE, LADDERS, CHUTES, boardEventAt, eventTarget } from './board.ts';

/**
 * Pure movement rules — the single source of truth used by local play, bots
 * and the authoritative online server.
 */

/** Move `current` forward by `roll`, honouring the finish rule. */
export function calculateNextPosition(current: number, roll: number, exactFinish: boolean): number {
  if (current >= BOARD_SIZE) return current;
  const target = current + roll;
  if (target <= BOARD_SIZE) return target;
  // Overshoot.
  if (exactFinish) return current; // stay put
  return BOARD_SIZE - (target - BOARD_SIZE); // bounce back from the top
}

export type BoardEventResult = {
  position: number;
  event: 'ladder' | 'chute' | null;
  target: number | null;
};

/** Apply a ladder/climb or chute/slide when landing on `position`. */
export function applyBoardEvent(position: number): BoardEventResult {
  const event = boardEventAt(position);
  if (!event) return { position, event: null, target: null };
  const target = eventTarget(position);
  if (target == null) return { position, event: null, target: null };
  return { position: target, event, target };
}

export function checkWinner(position: number): boolean {
  return position >= BOARD_SIZE;
}

export function getNextPlayerIndex(currentIndex: number, playerCount: number): number {
  if (playerCount <= 0) return 0;
  return (currentIndex + 1) % playerCount;
}

export type ExtraTurnOptions = {
  extraTurnOnSix: boolean;
  maxExtraRolls: number;
};

/** Rolling a 6 grants another roll when enabled and the cap is not hit yet. */
export function isExtraTurn(roll: number, consecutiveExtraRolls: number, options: ExtraTurnOptions): boolean {
  if (!options.extraTurnOnSix) return false;
  if (roll !== 6) return false;
  return consecutiveExtraRolls < options.maxExtraRolls;
}

/** True when the player at `position` would move if they rolled `roll`. */
export function canMove(position: number, roll: number, exactFinish: boolean): boolean {
  return calculateNextPosition(position, roll, exactFinish) !== position;
}

export { BOARD_SIZE, LADDERS, CHUTES };
