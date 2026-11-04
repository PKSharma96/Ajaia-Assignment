"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { User } from "./types";

/** Loads the logged-in user. If there is no session, the API client redirects to /login. */
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        // 401 is handled by the redirect in the API client; other errors show up on the page itself.
      });
  }, []);

  return user;
}
