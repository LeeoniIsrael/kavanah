import { useEffect, type PropsWithChildren } from "react";

import { initializeNotifications } from "@/services/notifications";

export function AppProviders({ children }: PropsWithChildren): React.JSX.Element {
  useEffect(() => {
    void initializeNotifications();
  }, []);

  return <>{children}</>;
}
