import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import App from './App.tsx'
import { createApi } from './api/index.ts'

// The real mock-mode API, without the fake delay: no server, no network
const api = createApi({ useMocks: true, mockDelayMs: 0 })

function renderApp() {
  return render(
    <MantineProvider>
      <App api={api} />
    </MantineProvider>,
  )
}

beforeEach(() => localStorage.clear())

async function signInAs(email: string) {
  await userEvent.type(await screen.findByRole('textbox', { name: /email/i }), email)
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await screen.findByRole('button', { name: 'Log out' })
}

test('continuing with an email lands on the map, signed in as that email', async () => {
  renderApp()

  await userEvent.type(await screen.findByRole('textbox', { name: /email/i }), 'surfer@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

  expect(await screen.findByRole('button', { name: 'Log out' })).toBeInTheDocument()
  expect(screen.getByText('surfer@example.com')).toBeInTheDocument()
})

test('after a page reload you are still signed in', async () => {
  const firstVisit = renderApp()
  await signInAs('surfer@example.com')
  firstVisit.unmount()

  renderApp()

  expect(await screen.findByRole('button', { name: 'Log out' })).toBeInTheDocument()
  expect(screen.getByText('surfer@example.com')).toBeInTheDocument()
})

test('a remembered user that no longer exists is forgotten, and you can sign in again', async () => {
  localStorage.setItem('surf-scheduler:user-id', '00000000-0000-4000-8000-000000000000')
  const firstVisit = renderApp()
  expect(await screen.findByRole('textbox', { name: /email/i })).toBeInTheDocument()
  firstVisit.unmount()

  renderApp()

  // Straight to the email screen: no attempt to load the forgotten user
  expect(screen.queryByLabelText('Loading your account…')).not.toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
})

test('logging out returns to the email screen, also after a reload', async () => {
  const firstVisit = renderApp()
  await signInAs('surfer@example.com')

  await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
  expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
  firstVisit.unmount()

  renderApp()
  expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
})
