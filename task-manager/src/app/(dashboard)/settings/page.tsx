'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session?.user) {
    return null
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="max-w-md space-y-6">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Profile</h2>
          <p className="text-sm text-gray-500">Name: {session.user.name}</p>
          <p className="text-sm text-gray-500">Email: {session.user.email}</p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">API Documentation</h2>
          <p className="text-sm text-gray-500">
            View the{' '}
            <a href="/api/docs" className="text-blue-600 underline">
              API documentation
            </a>{' '}
            for agent integration.
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
