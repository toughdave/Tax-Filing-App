import { type NextAuthOptions } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { availableProviders } from "@/lib/auth-policy";

const providerAvailability = availableProviders();

const providers = [
  ...(providerAvailability.google
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        })
      ]
    : []),
  ...(providerAvailability.azureAd
    ? [
        AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID ?? "",
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
          tenantId: process.env.AZURE_AD_TENANT_ID
        })
      ]
    : []),
  ...(providerAvailability.apple
    ? [
        AppleProvider({
          clientId: process.env.APPLE_ID ?? "",
          clientSecret: process.env.APPLE_SECRET ?? ""
        })
      ]
    : []),
  ...(providerAvailability.demoCredentials
    ? [
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
      ]
    : [])
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/sign-in"
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role ?? "TAXPAYER";
      }
      return session;
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      await prisma.auditEvent.create({
        data: {
          userId: user.id,
          action: "auth.sign_in",
          resource: "UserSession",
          metadata: {
            provider: account?.provider ?? "unknown",
            isNewUser
          }
        }
      });
    },
    async signOut({ token, session }) {
      await prisma.auditEvent.create({
        data: {
          userId: token?.sub ?? session?.user?.id,
          action: "auth.sign_out",
          resource: "UserSession",
          metadata: {
            signOutSource: token ? "jwt" : "session"
          }
        }
      });
    }
  }
};
