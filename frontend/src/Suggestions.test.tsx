import { MantineProvider } from '@mantine/core'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { ApiRequestError, createApi, type Suggestion, type SuggestionList } from './api/index.ts'

const hilton = { id: 'hilton', name: 'Hilton Beach, Tel Aviv', lat: 32.0898, lon: 34.7695 }
const ashdod = { id: 'ashdod', name: 'Ashdod Lido', lat: 31.8045, lon: 34.6418 }

// Times are Israel winter time (UTC+2)
const suggestions: Suggestion[] = [
  { beach: hilton, start: '2026-11-06T05:00:00Z', end: '2026-11-06T07:00:00Z', type: 'SUP', grade: 9 },
  { beach: ashdod, start: '2026-11-07T10:00:00Z', end: '2026-11-07T12:00:00Z', type: 'WAVE', grade: 6 },
]

/** The mock-mode API with no delay, except that suggestions come from `getSuggestions` */
function renderApp(getSuggestions: () => Promise<SuggestionList>) {
  const api = { ...createApi({ useMocks: true, mockDelayMs: 0 }), getSuggestions: vi.fn(getSuggestions) }
  render(
    <MantineProvider>
      <App api={api} />
    </MantineProvider>,
  )
  return api
}

async function signInAndAskForSuggestions() {
  await userEvent.type(await screen.findByRole('textbox', { name: /email/i }), 'surfer@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Get suggestions' }))
}

beforeEach(() => localStorage.clear())

test('Get suggestions shows beach, date, time window, type and grade, in the order the server sent', async () => {
  renderApp(async () => ({ suggestions }))

  await signInAndAskForSuggestions()

  const list = await screen.findByRole('list', { name: 'Suggestions' })
  const items = within(list).getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('Hilton Beach, Tel Aviv')
  expect(items[0]).toHaveTextContent('Fri 6 Nov · 07:00–09:00')
  expect(items[0]).toHaveTextContent('SUP')
  expect(items[0]).toHaveTextContent('Grade 9/10')
  expect(items[1]).toHaveTextContent('Ashdod Lido')
  expect(items[1]).toHaveTextContent('Sat 7 Nov · 12:00–14:00')
  expect(items[1]).toHaveTextContent('Waves')
  expect(items[1]).toHaveTextContent('Grade 6/10')
})

test('while loading, a status says so and the button cannot send a second request', async () => {
  let answer: (list: SuggestionList) => void = () => {}
  const api = renderApp(() => new Promise((resolve) => (answer = resolve)))

  await signInAndAskForSuggestions()

  expect(screen.getByRole('status')).toHaveTextContent('Finding your best sessions…')
  await userEvent.click(screen.getByRole('button', { name: /Get suggestions/ }))
  expect(api.getSuggestions).toHaveBeenCalledTimes(1)

  answer({ suggestions })
  expect(await screen.findByRole('list', { name: 'Suggestions' })).toBeInTheDocument()
})

test("an empty list shows the server's message", async () => {
  renderApp(async () => ({ suggestions: [], message: 'Nothing graded 5 or better in the next 3 days.' }))

  await signInAndAskForSuggestions()

  expect(await screen.findByText('Nothing graded 5 or better in the next 3 days.')).toBeInTheDocument()
  expect(screen.queryByRole('list', { name: 'Suggestions' })).not.toBeInTheDocument()
})

test('an empty list without a message says there are no good sessions', async () => {
  renderApp(async () => ({ suggestions: [] }))

  await signInAndAskForSuggestions()

  expect(await screen.findByText('No good sessions in the next 3 days.')).toBeInTheDocument()
})

test('when forecast data is unavailable (503) you can try again', async () => {
  let calls = 0
  renderApp(async () => {
    if (++calls === 1) throw new ApiRequestError(503, 'Forecast provider timed out')
    return { suggestions }
  })

  await signInAndAskForSuggestions()

  expect(await screen.findByRole('alert')).toHaveTextContent('Forecast data is unavailable right now. Try again in a few minutes.')
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('list', { name: 'Suggestions' })).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('an incomplete profile (422) asks you to finish it', async () => {
  renderApp(async () => {
    throw new ApiRequestError(422, 'Profile is missing a work schedule')
  })

  await signInAndAskForSuggestions()

  expect(await screen.findByRole('alert')).toHaveTextContent('Finish your profile to get suggestions.')
})

test("any other failure shows the error's message and lets you try again", async () => {
  renderApp(async () => {
    throw new ApiRequestError(500, 'Something broke on the server')
  })

  await signInAndAskForSuggestions()

  expect(await screen.findByRole('alert')).toHaveTextContent('Something broke on the server')
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
})
