/**
 * Fair 1–6 dice.
 *
 * Uses `crypto.getRandomValues` with rejection sampling (unbiased) whenever it
 * is available — browsers and Node ≥ 20 both provide it — and falls back to
 * `Math.random` only when crypto is missing entirely.
 *
 * Online multiplayer always calls this server-side; the client never supplies
 * a result.
 */
export function rollDice(randomFn?: () => number): number {
  if (typeof randomFn === 'function') {
    return Math.floor(randomFn() * 6) + 1;
  }

  const cryptoObj: Crypto | undefined = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    let v = 0;
    // 4294967292 = 2^32 - (2^32 % 6): reject the biased tail.
    do {
      cryptoObj.getRandomValues(arr);
      v = arr[0] ?? 0;
    } while (v >= 4294967292);
    return (v % 6) + 1;
  }

  return Math.floor(Math.random() * 6) + 1;
}
