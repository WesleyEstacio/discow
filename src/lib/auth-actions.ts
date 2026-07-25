"use server"

import { signIn, signOut } from "@/auth"

export async function signInWithGoogle(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl")
  const redirectTo =
    typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/profile"

  await signIn("google", { redirectTo })
}

export async function signOutUser(redirectTo: string = "/") {
  await signOut({ redirectTo })
}
