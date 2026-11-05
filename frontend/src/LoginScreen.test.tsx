import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ApiRequestError } from './api/index.ts'
import { LoginScreen } from './LoginScreen.tsx'

function renderScreen(onSubmit: (email: string) => Promise<void>) {
  render(
    <MantineProvider>
      <LoginScreen onSubmit={onSubmit} />
    </MantineProvider>,
  )
}

async function submit(email: string) {
  await userEvent.type(screen.getByRole('textbox', { name: /email/i }), email)
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
}

test('continuing passes on the entered email', async () => {
  const onSubmit = vi.fn(async () => {})
  renderScreen(onSubmit)

  await submit('surfer@example.com')

  expect(onSubmit).toHaveBeenCalledWith('surfer@example.com')
})

test("a rejected email shows the server's message under the field", async () => {
  renderScreen(async () => {
    throw new ApiRequestError(400, 'Enter a valid email address, like you@example.com')
  })

  await submit('surfer@example')

  const field = screen.getByRole('textbox', { name: /email/i })
  expect(field).toHaveAccessibleDescription('Enter a valid email address, like you@example.com')
  // Focus moves back to the field so screen readers announce the error
  expect(field).toHaveFocus()
})

test('a server that cannot be reached shows a retry message', async () => {
  renderScreen(async () => {
    throw new TypeError('Failed to fetch')
  })

  await submit('surfer@example.com')

  expect(screen.getByRole('textbox', { name: /email/i })).toHaveAccessibleDescription(
    'Couldn’t reach the server. Try again in a moment.',
  )
})

test('the button is busy until the answer arrives, so the email is sent once', async () => {
  let answer = () => {}
  const onSubmit = vi.fn(() => new Promise<void>((resolve) => (answer = resolve)))
  renderScreen(onSubmit)

  await submit('surfer@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  expect(onSubmit).toHaveBeenCalledTimes(1)
  answer()
})
