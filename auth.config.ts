import type { NextAuthConfig } from "next-auth";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export const authConfig = {
  providers: [],
  pages: { signIn: "/login" },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
