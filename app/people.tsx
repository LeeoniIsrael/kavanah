import { Redirect, useLocalSearchParams } from "expo-router";
// Preserve account and invitation links while keeping one Circle destination.
export default function PeopleRedirect() {
  const { handle } = useLocalSearchParams<{ handle?: string }>();
  return (
    <Redirect
      href={{
        pathname: "/circle",
        params: { section: "friends", ...(handle ? { handle } : {}) },
      }}
    />
  );
}
