import { Button, Container, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiRequestError } from './api/index.ts'

// No passwords: an email signs you in, or creates your account the first time.
export function LoginScreen({ onSubmit }: { onSubmit: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const emailField = useRef<HTMLInputElement>(null)

  // Move focus to the field when an error appears, so screen readers read it out
  useEffect(() => {
    if (error) emailField.current?.focus()
  }, [error])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSubmit(email.trim())
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
      } else {
        // Server down, or the endpoint isn't built yet: the details are for developers
        console.error(err)
        setError('Couldn’t reach the server. Try again in a moment.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container size={560} py={{ base: 48, sm: 96 }} px="md">
      <Stack gap="xl">
        <Title order={1} className="headline">
          Catch the right wave, not the wrong day.
        </Title>
        <Text size="lg" c="dimmed" maw={460}>
          Swell, wind and Shabbat times for Israeli beaches, in one schedule. Enter your email to start.
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap="sm" maw={420}>
            <TextInput
              ref={emailField}
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={error}
              size="md"
            />
            <Button type="submit" size="md" loading={busy}>
              Continue
            </Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
