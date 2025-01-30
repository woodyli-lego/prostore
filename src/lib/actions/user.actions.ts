"use server";

import { signInFormSchema } from "../validators";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

// 使用用户名密码登录
export async function signInwithCredentials(prevState: unknown, formData: FormData) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password')
    })

    await signIn('credentials', user);
    return {
      success: true,
      message: 'Signed in successfully'
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false,
      message: 'Invalid email or password'
    }
  }
}

// 登出
export async function signOutUser() {
  // kill session, cookie, etc.
  await signOut();
}
