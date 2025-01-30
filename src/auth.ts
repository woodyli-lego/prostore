import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";

export const config = {
  // 页面路由配置
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  // 会话配置
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // 数据库适配
  adapter: PrismaAdapter(prisma),
  // 认证 provider 配置
  providers: [
    CredentialsProvider({ // 使用账户密码认证方式，用 email 做账户名
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {  // 授权验证逻辑
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
      // 把 jwt 中的 sub 字段设置为 session 中的 user id
      session.user.id = token.sub;

      // 用户信息更新同时刷新 session 中的 user name
      if (trigger === "update") {
        session.user.name = user.name;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
