import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function useCurrentDate(): Date {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;

    const scheduleMidnightRefresh = () => {
      clearTimeout(midnightTimer);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      midnightTimer = setTimeout(() => {
        setCurrentDate(new Date());
        scheduleMidnightRefresh();
      }, tomorrow.getTime() - now.getTime() + 100);
    };

    scheduleMidnightRefresh();
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setCurrentDate(new Date());
        scheduleMidnightRefresh();
      }
    });

    return () => {
      clearTimeout(midnightTimer);
      appStateSubscription.remove();
    };
  }, []);

  return currentDate;
}
