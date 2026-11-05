import { Button, Container, Stack, Text, TextInput, Title } from '@mantine/core'
import { useState, type FormEvent } from 'react'

// Hackathon prototype: no registration or auth. The email is only used to say who is "logged in".
export function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onLogin(email.trim())
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
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              size="md"
            />
            <Button type="submit" size="md">
              Log in
            </Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
