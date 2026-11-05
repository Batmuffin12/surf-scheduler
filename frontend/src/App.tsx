import { Center, Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ApiRequestError, api as defaultApi, type Api, type User } from './api/index.ts'
import { LoginScreen } from './LoginScreen.tsx'
import { MapScreen } from './MapScreen.tsx'

// No session or token (#6, #9): the signed-in user's id is kept in localStorage.
// Storage can be unavailable (private mode); then you just sign in again after a reload.
const USER_ID_KEY = 'surf-scheduler:user-id'

function readUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY)
  } catch {
    return null
  }
}

function writeUserId(id: string | null) {
  try {
    if (id) localStorage.setItem(USER_ID_KEY, id)
    else localStorage.removeItem(USER_ID_KEY)
  } catch {
    // Not critical
  }
}

type Session = { kind: 'restoring' } | { kind: 'signedOut' } | { kind: 'signedIn'; user: User }

export default function App({ api = defaultApi }: { api?: Api }) {
  const [session, setSession] = useState<Session>(() => (readUserId() ? { kind: 'restoring' } : { kind: 'signedOut' }))

  // After a reload, load the remembered user
  useEffect(() => {
    const id = readUserId()
    if (!id) return
    let cancelled = false
    api.getUser(id).then(
      (user) => !cancelled && setSession({ kind: 'signedIn', user }),
      (error: unknown) => {
        // 404: the user is gone, so forget the id. Other errors (server down) keep it for next time.
        if (error instanceof ApiRequestError && error.status === 404) writeUserId(null)
        if (!cancelled) setSession({ kind: 'signedOut' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [api])

  async function signIn(email: string) {
    const user = await api.signIn(email)
    writeUserId(user.id)
    setSession({ kind: 'signedIn', user })
  }

  function signOut() {
    writeUserId(null)
    setSession({ kind: 'signedOut' })
  }

  switch (session.kind) {
    case 'restoring':
      return (
        <Center h="100dvh">
          <Loader aria-label="Loading your account…" />
        </Center>
      )
    case 'signedIn':
      return <MapScreen email={session.user.email} onLogout={signOut} />
    case 'signedOut':
      return <LoginScreen onSubmit={signIn} />
  }
}
