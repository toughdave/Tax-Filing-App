import NextAuth, { type NextAuthOptions } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";

const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasMicrosoft = Boolean(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);
const hasApple = Boolean(process.env.APPLE_ID && process.env.APPLE_SECRET);

const providers = [
  ...(hasGoogle
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        })
      ]
    : []),
  ...(hasMicrosoft
    ? [
        AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID ?? "",
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
          tenantId: process.env.AZURE_AD_TENANT_ID
        })
      ]
    : []),
  ...(hasApple
    ? [
        AppleProvider({
          clientId: process.env.APPLE_ID ?? "",
          clientSecret: process.env.APPLE_SECRET ?? ""
        })
      ]
    : []),
  CredentialsProvider({
    name: "Demo credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      passcode: { label: "Passcode", type: "password" }
    },
    authorize: async (credentials) => {
      const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const passcode = typeof credentials?.passcode === "string" ? credentials.passcode : "";

      const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase();
      const demoPasscode = process.env.DEMO_PASSCODE;

      if (!demoEmail || !demoPasscode || email !== demoEmail || passcode !== demoPasscode) {
        return null;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return existing;
      }

      return prisma.user.create({
        data: {
          email,
          name: "Demo filer",
          locale: "en"
        }
      });
    }
  })
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database"
  },
  pages: {
    signIn: "/sign-in"
  },
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }

      return session;
    }
  },
  events: {
    async signIn({ user }) {
      await prisma.auditEvent.create({
        data: {
          userId: user.id,
          action: "auth.sign_in",
          resource: "UserSession"
        }
      });
    },
    async signOut(message) {
      await prisma.auditEvent.create({
        data: {
          userId: message.session?.user?.id ?? message.token?.sub,
          action: "auth.sign_out",
          resource: "UserSession"
        }
      });
    }
  }
};

export default NextAuth(authOptions);
