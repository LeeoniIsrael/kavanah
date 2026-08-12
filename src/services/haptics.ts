import * as Haptics from "expo-haptics";

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
