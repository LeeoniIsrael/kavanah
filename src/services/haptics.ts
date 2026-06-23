import * as Haptics from "expo-haptics";

export async function tapHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics are best-effort and unavailable in some simulator states.
  }
}

export async function confirmHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are best-effort and unavailable in some simulator states.
  }
}
