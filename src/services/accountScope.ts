// No store imports: persistence and asynchronous work share this account boundary.
let owner: string | null = null;
let generation = 0;
const listeners = new Set<() => void>();
export const accountScope = () => ({ owner, generation });
export function isCurrentAccountScope(scope: ReturnType<typeof accountScope>): boolean {
  return scope.owner !== null && scope.owner === owner && scope.generation === generation;
}
export function onAccountScopeChange(listener: () => void): void {
  listeners.add(listener);
}
export function setAccountScope(next: string | null, force = false): void {
  if (next === owner && !force) return;
  owner = next;
  generation++;
  for (const listener of listeners) listener();
}
export function accountStorageKey(key: string): string | null {
  // These keys already contain their account ID. Appearance is device-wide.
  if (/^circle\.(profile|outbox)\./.test(key) || key === "settings.appearance.v1") return key;
  return owner ? `${accountStoragePrefix(owner)}${key}` : null;
}
export const accountStoragePrefix = (id: string) => `account.${encodeURIComponent(id).replace(/\./g, "%2E")}.`;
