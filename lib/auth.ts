import { getServerSession } from "next-auth"
import NextAuth from "next-auth"
import KakaoProvider from "next-auth/providers/kakao"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        if (credentials.email && credentials.password.length >= 6) {
          return {
            id: "1",
            email: credentials.email,
            name: credentials.email.split("@")[0],
            image: null,
          }
        }
        return null
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = (token.id as string) || ""
        session.user.name = (token.name as string) || ""
        session.user.email = (token.email as string) || ""
        session.user.image = (token.image as string) || null
      }
      return session
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image
        token.provider = account?.provider
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
}

export async function getSession() {
  return await getServerSession(authOptions)
}

