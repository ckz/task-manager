"use client"

import { signIn } from "next-auth/react"

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Sign In</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
