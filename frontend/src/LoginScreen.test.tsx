import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { LoginScreen } from './LoginScreen.tsx'

test('logging in passes on the entered email', async () => {
  const onLogin = vi.fn()
  render(
    <MantineProvider>
      <LoginScreen onLogin={onLogin} />
    </MantineProvider>,
  )

  await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'surfer@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

  expect(onLogin).toHaveBeenCalledWith('surfer@example.com')
})
