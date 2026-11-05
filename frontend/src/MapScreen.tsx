import 'leaflet/dist/leaflet.css'
import { Button, Group, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Api, Suggestion, User } from './api/index.ts'
import { formatWindow } from './formatWindow.ts'
import { SuggestionsPanel } from './SuggestionsPanel.tsx'

// Roughly Israel, with a little sea to the west so the whole coast is visible
const ISRAEL_CENTER: [number, number] = [31.4, 34.9]
const ISRAEL_BOUNDS: [[number, number], [number, number]] = [
  [29.3, 33.8],
  [33.5, 36.0],
]

/** Flies the map to the chosen suggestion's beach. Moving the timeline to its start time comes with #16. */
function FocusOn({ suggestion }: { suggestion: Suggestion }) {
  const map = useMap()
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.flyTo([suggestion.beach.lat, suggestion.beach.lon], 12, { animate: !reduceMotion, duration: 0.8 })
  }, [map, suggestion])
  return null
}

export function MapScreen({ api, user, onLogout }: { api: Api; user: User; onLogout: () => void }) {
  const [selected, setSelected] = useState<Suggestion | null>(null)

  return (
    <div className="map-screen">
      <Group justify="space-between" px="md" py="sm" wrap="nowrap" className="map-header">
        <Title order={2} size="h3">
          Surf Scheduler
        </Title>
        <Group gap="sm" wrap="nowrap">
          <Text size="sm" c="dimmed" truncate maw={220}>
            {user.email}
          </Text>
          <Button variant="subtle" size="xs" onClick={onLogout}>
            Log out
          </Button>
        </Group>
      </Group>

      <div className="map-body">
        <MapContainer
          className="map"
          center={ISRAEL_CENTER}
          zoom={8}
          minZoom={7}
          maxBounds={ISRAEL_BOUNDS}
          maxBoundsViscosity={0.8}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selected && (
            <>
              <FocusOn suggestion={selected} />
              <CircleMarker
                key={`${selected.beach.id} ${selected.start}`}
                center={[selected.beach.lat, selected.beach.lon]}
                radius={10}
                pathOptions={{ color: '#0e4c6e', fillColor: '#2a86b0', fillOpacity: 0.9, weight: 3 }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  {selected.beach.name} · Grade {selected.grade}/10
                  <br />
                  {formatWindow(selected.start, selected.end)}
                </Tooltip>
              </CircleMarker>
            </>
          )}
        </MapContainer>

        <SuggestionsPanel api={api} userId={user.id} selected={selected} onSelect={setSelected} />
      </div>
    </div>
  )
}
