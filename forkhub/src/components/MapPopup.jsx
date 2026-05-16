import { useMemo } from 'react'
import DeliveryMap from './DeliveryMap'

function formatDistanceKm(distance) {
  if (distance == null) return '—'
  return `${distance.toFixed(1)} km`
}

function toRad(value) {
  return (value * Math.PI) / 180
}

function computeHaversineDistance(a, b) {
  if (!a || !b) return null
  const earthRadiusKm = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + sinDLng * sinDLng * Math.cos(lat1) * Math.cos(lat2)
  const distance = 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)))
  return distance
}

export default function MapPopup({ isOpen, onClose, branch, destination, mode }) {
  const distance = useMemo(() => {
    if (!destination) return null
    return computeHaversineDistance(branch, destination)
  }, [branch, destination])

  const title = mode === 'delivery' ? 'Delivery Route' : 'Branch Location'
  const description = mode === 'delivery'
    ? (destination ? `Route from ${branch.name} to your delivery location. Distance: ${formatDistanceKm(distance)}.` : `Branch ${branch.name} location. Set your delivery location first if you want to see the full route.`)
    : `Map view for the ${branch.name} branch.`

  if (!isOpen) return null

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
        <div className="profile-modal-header">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="profile-modal-body" style={{ padding: 0 }}>
          <div style={{ minHeight: 420, position: 'relative' }}>
            <DeliveryMap
              branch={branch}
              destination={destination}
              onDestinationChange={null}
              onAddressChange={null}
              onStatusChange={null}
            />
          </div>
          <div style={{ padding: 16 }}>
            {mode === 'delivery' && destination ? (
              <p className="muted" style={{ margin: 0 }}>
                Distance from {branch.name}: {formatDistanceKm(distance)}
              </p>
            ) : null}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="profile-modal-btn-cancel" type="button" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
