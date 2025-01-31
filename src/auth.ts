import { prisma } from "@/db/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
import { sessionCartIdKey } from "./lib/constants";

export const config = {
  // 页面路由配置
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  // 会话配置
  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // 1 day
  },
  // 数据库适配
  adapter: PrismaAdapter(prisma),
  // 认证 provider 配置
  providers: [
    CredentialsProvider({
      // 使用账户密码认证方式，用 email 做账户名
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        // 授权验证逻辑
        if (credentials == null) return null;

        // 从数据库读取用户信息
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        // 校验用户密码
        if (user && user.password) {
          const isMatch = compareSync(credentials.password as string, user.password);

          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, user, trigger, token }: any) {
      // 从 token 提取字段，设入 session.user
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      // 用户信息更新同时刷新 session 中的 user name
      if (trigger === "update") {
        session.user.name = user.name;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }: any) {
      console.log("JWT token", token);
      if (user) {
        token.role = user.role;
        if (user.name === "NO_NAME") {
          token.name = user.email!.split("@");
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              name: token.name,
            },
          });
        }
      }
      return token;
    },
    authorized({ request, auth }: any) {
      // Check for session cart cookie
      if (!request.cookies.get(sessionCartIdKey)) {
        // Generate new session cart id cookie
        const sessionCartId = crypto.randomUUID();
        // Clone the request headers
        const newRequestHeaders = new Headers(request.headers);
        // Create new resposne with new headers
        const response = NextResponse.next({
          request: {
            headers: newRequestHeaders,
          },
        });
        // Set newly generated sessionCartId in response cookies
        response.cookies.set(sessionCartIdKey, sessionCartId);
        return response;
      } else {
        return true;
      }
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
