import { Alert, Badge, Button, Group, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { useState } from 'react'
import { ApiRequestError, type Api, type Suggestion } from './api/index.ts'
import { formatWindow } from './formatWindow.ts'

const TYPE_LABEL = { SUP: 'SUP', WAVE: 'Waves' } as const

// Wording decided in #15
const LOADING = 'Finding your best sessions…'
const NOTHING_GOOD = 'No good sessions in the next 3 days.'
const FORECAST_DOWN = 'Forecast data is unavailable right now. Try again in a few minutes.'
const PROFILE_INCOMPLETE = 'Finish your profile to get suggestions.'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'loaded'; suggestions: Suggestion[]; message?: string }
  | { kind: 'failed'; message: string; canRetry: boolean }

function failure(error: unknown): State {
  if (error instanceof ApiRequestError && error.status === 503) return { kind: 'failed', message: FORECAST_DOWN, canRetry: true }
  // Linking to the profile form comes with #10
  if (error instanceof ApiRequestError && error.status === 422) return { kind: 'failed', message: PROFILE_INCOMPLETE, canRetry: false }
  const message = error instanceof Error && error.message ? error.message : 'Could not load suggestions.'
  return { kind: 'failed', message, canRetry: true }
}

export function SuggestionsPanel({
  api,
  userId,
  selected,
  onSelect,
}: {
  api: Api
  userId: string
  selected: Suggestion | null
  onSelect: (suggestion: Suggestion) => void
}) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function load() {
    setState({ kind: 'loading' })
    try {
      const { suggestions, message } = await api.getSuggestions(userId)
      setState({ kind: 'loaded', suggestions, message })
    } catch (error) {
      setState(failure(error))
    }
  }

  return (
    <Stack component="section" aria-labelledby="suggestions-title" gap="sm" p="md" className="suggestions">
      <Title id="suggestions-title" order={3} size="h4">
        Best sessions, next 3 days
      </Title>
      <Button onClick={load} loading={state.kind === 'loading'}>
        Get suggestions
      </Button>

      {/* Always rendered, so screen readers announce when loading starts */}
      <Text role="status" size="sm" c="dimmed">
        {state.kind === 'loading' ? LOADING : ''}
      </Text>

      {state.kind === 'failed' && (
        <Alert color="red" variant="light" title="No suggestions">
          <Stack gap="xs" align="flex-start">
            <Text size="sm">{state.message}</Text>
            {state.canRetry && (
              <Button size="xs" variant="white" color="red" onClick={load}>
                Try again
              </Button>
            )}
          </Stack>
        </Alert>
      )}

      {state.kind === 'loaded' && state.suggestions.length === 0 && <Text>{state.message ?? NOTHING_GOOD}</Text>}

      {state.kind === 'loaded' && state.suggestions.length > 0 && (
        <ol aria-label="Suggestions" className="suggestion-list">
          {state.suggestions.map((s) => (
            <li key={`${s.beach.id} ${s.start}`}>
              <UnstyledButton
                className="suggestion"
                aria-current={selected === s ? 'true' : undefined}
                onClick={() => onSelect(s)}
              >
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <div className="suggestion-place">
                    <Text fw={700} translate="no">
                      {s.beach.name}
                    </Text>
                    <Text size="sm" c="dimmed" className="tabular">
                      {formatWindow(s.start, s.end)}
                    </Text>
                  </div>
                  <Stack gap={4} align="flex-end">
                    <Text fw={800} className="grade tabular" data-grade={gradeBand(s.grade)}>
                      Grade {s.grade}/10
                    </Text>
                    <Badge variant="light" size="sm">
                      {TYPE_LABEL[s.type]}
                    </Badge>
                  </Stack>
                </Group>
              </UnstyledButton>
            </li>
          ))}
        </ol>
      )}
    </Stack>
  )
}

function gradeBand(grade: number): 'high' | 'mid' | 'low' {
  return grade >= 8 ? 'high' : grade >= 5 ? 'mid' : 'low'
}
