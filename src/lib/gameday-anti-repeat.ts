/**
 * Anti-repetition helpers for game day batting and fielding generation.
 *
 * After a Fisher-Yates shuffle, swap any player who would land in the same
 * batting slot or fielding position they had in the previous game.
 */

/**
 * For batting: ensure no player ends up at the same 1-indexed batting order
 * as they had in the previous game.
 *
 * @param shuffled  Array of players in their (randomized) new order
 * @param prevBatting  Map of playerId → previous game's battingOrder (1-indexed)
 * @returns The same array, mutated in place, with collisions resolved where possible
 */
export function deCollideBatting<T extends { id: string }>(
  shuffled: T[],
  prevBatting: Record<string, number>
): T[] {
  for (let i = 0; i < shuffled.length; i++) {
    const prevOrder = prevBatting[shuffled[i].id]; // 1-indexed
    if (prevOrder === i + 1) {
      for (let j = 0; j < shuffled.length; j++) {
        if (j === i) continue;
        const playerOk = prevOrder !== j + 1;
        const otherOk = prevBatting[shuffled[j].id] !== i + 1;
        if (playerOk && otherOk) {
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          break;
        }
      }
    }
  }
  return shuffled;
}

/**
 * For fielding: ensure no player ends up at the same field position they
 * had in the previous game's same inning.
 *
 * @param shuffled  Array of players in their (randomized) new order
 * @param fieldPositions  Ordered list of position values (e.g. [PITCHER, CATCHER, ...])
 * @param prevPositions  Map of playerId → previous game's position string
 * @returns The same array, mutated in place, with collisions resolved where possible
 */
export function deCollideFielding<T extends { id: string }>(
  shuffled: T[],
  fieldPositions: readonly { value: string }[],
  prevPositions: Record<string, string>
): T[] {
  const limit = Math.min(shuffled.length, fieldPositions.length);
  for (let i = 0; i < limit; i++) {
    const newPos = fieldPositions[i].value;
    if (prevPositions[shuffled[i].id] === newPos) {
      for (let j = 0; j < fieldPositions.length; j++) {
        if (j === i) continue;
        const newPosForJ = fieldPositions[j].value;
        const playerOk = prevPositions[shuffled[i].id] !== newPosForJ;
        const otherOk = prevPositions[shuffled[j].id] !== newPos;
        if (playerOk && otherOk) {
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          break;
        }
      }
    }
  }
  return shuffled;
}
