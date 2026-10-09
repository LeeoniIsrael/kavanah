import type { Session } from "@supabase/supabase-js";

// This controls local navigation. Cloud operations still enforce access on the server.
export function isAccountSession(session: Session | null): session is Session {
  return Boolean(session?.user.id && session.user.is_anonymous !== true);
}
