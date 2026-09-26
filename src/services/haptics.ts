import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

let lastTypingHaptic = 0;

export function typingHaptic(previous: string, next: string): void {
  if (Platform.OS !== "ios" || Math.abs(next.length - previous.length) !== 1)
    return;
  const now = Date.now();
  if (now - lastTypingHaptic < 35) return;
  lastTypingHaptic = now;
  void Haptics.selectionAsync().catch(() => undefined);
}

export async function tapHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics are best-effort and unavailable in some simulator states.
  }
}

export async function softHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  } catch {
    // Haptics are best-effort and unavailable in some simulator states.
  }
}

export async function confirmHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics are best-effort and unavailable in some simulator states.
  }
}

export async function successHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics are best-effort and unavailable in some simulator states.
  }
}
