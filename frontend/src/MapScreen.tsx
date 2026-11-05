import 'leaflet/dist/leaflet.css'
import { Button, Group, Text, Title } from '@mantine/core'
import { MapContainer, TileLayer } from 'react-leaflet'

// Roughly Israel, with a little sea to the west so the whole coast is visible
const ISRAEL_CENTER: [number, number] = [31.4, 34.9]
const ISRAEL_BOUNDS: [[number, number], [number, number]] = [
  [29.3, 33.8],
  [33.5, 36.0],
]

export function MapScreen({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <div className="map-screen">
      <Group justify="space-between" px="md" py="sm" wrap="nowrap" className="map-header">
        <Title order={2} size="h3">
          Surf Scheduler
        </Title>
        <Group gap="sm" wrap="nowrap">
          <Text size="sm" c="dimmed" truncate maw={220}>
            {email}
          </Text>
          <Button variant="subtle" size="xs" onClick={onLogout}>
            Log out
          </Button>
        </Group>
      </Group>

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
      </MapContainer>
    </div>
  )
}
