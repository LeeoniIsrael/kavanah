import { create } from "zustand";
import { readSocialData, writeSocialData } from "@/services/socialStorage";
type Command = { id: string; rpc: string; args: Record<string, unknown> };
let owner: string | null = null;
let commands: Command[] = [];
let flushing = false;
let generation = 0;
export const useCircleSync = create<{ pending: number; error: string | null }>(
  () => ({ pending: 0, error: null }),
);
const storageKey = (id: string) => `circle.outbox.${id}`;
function save() {
  if (owner) writeSocialData(storageKey(owner), commands);
  useCircleSync.setState({ pending: commands.length });
}
export function setOutboxOwner(id: string | null) {
  generation++;
  owner = id;
  commands = id
    ? (readSocialData(
        storageKey(id),
        (v): v is Command[] =>
          Array.isArray(v) &&
          v.every(
            (x) =>
              typeof x?.rpc === "string" &&
              typeof x?.id === "string" &&
              x.args &&
              typeof x.args === "object",
          ),
      ) ?? [])
    : [];
  useCircleSync.setState({ pending: commands.length, error: null });
}
export function queueCircle(
  rpc: string,
  args: Record<string, unknown>,
  id: string,
) {
  if (!owner) return;
  // Coalesce only adjacent preference changes; preserve consent order relative to completions.
  const last = commands[commands.length - 1];
  if (last?.id === id) commands[commands.length - 1] = { id, rpc, args };
  else commands.push({ id, rpc, args });
  save();
  void flushCircle();
}
export async function flushCircle() {
  if (flushing || !owner) return;
  flushing = true;
  const epoch = generation;
  const account = owner;
  try {
    while (commands.length && epoch === generation) {
      const command = commands[0]!;
      const { circleRpc } = await import("./client");
      if (epoch !== generation) break;
      await circleRpc(command.rpc, command.args, account);
      if (epoch !== generation) break;
      if (commands[0] === command) commands.shift();
      save();
    }
    if (epoch === generation) useCircleSync.setState({ error: null });
  } catch (error) {
    if (epoch === generation)
      useCircleSync.setState({
        error:
          error instanceof Error
            ? error.message
            : "Could not sync. Try again when connected.",
      });
  } finally {
    flushing = false;
  }
}
export function clearOutbox() {
  commands = [];
  save();
}

export function skipFailedCircleChange() {
  if (
    flushing ||
    !useCircleSync.getState().error ||
    commands[0]?.rpc === "circle_preferences"
  )
    return;
  commands.shift();
  save();
  useCircleSync.setState({ error: null });
  void flushCircle();
}
export function canSkipFailedCircleChange() {
  return commands[0]?.rpc !== "circle_preferences";
}

export function pendingCirclePreferences() {
  const command = commands.filter((c) => c.rpc === "circle_preferences").at(-1);
  if (!command) return null;
  return {
    prayers: command.args.prayer_mode as "off" | "first-ever" | "every",
    milestones: command.args.share_milestones as boolean,
  };
}
