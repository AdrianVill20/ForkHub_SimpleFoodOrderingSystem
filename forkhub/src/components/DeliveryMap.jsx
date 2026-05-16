import { useEffect, useRef, useState } from 'react'

const LEAFLET_CSS = 'https://unpkg.com/leaflet/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet/dist/leaflet.js'

let leafletPromise = null
function loadLeaflet() {
  if (window.L) {
    return Promise.resolve(window.L)
  }

  if (leafletPromise) {
    return leafletPromise
  }

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const css = document.createElement('link')
      css.rel = 'stylesheet'
      css.href = LEAFLET_CSS
      document.head.appendChild(css)
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.async = true
    script.onload = () => {
      if (window.L) {
        resolve(window.L)
      } else {
        reject(new Error('Leaflet failed to load'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load Leaflet script'))
    document.head.appendChild(script)
  })

  return leafletPromise
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.display_name || null
  } catch {
    return null
  }
}

export default function DeliveryMap({ branch, address, destination, onDestinationChange, onAddressChange, onStatusChange, mode = 'delivery' }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const branchMarkerRef = useRef(null)
  const destinationMarkerRef = useRef(null)
  const branchIconRef = useRef(null)
  const destinationIconRef = useRef(null)
  const routeRef = useRef(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    let mounted = true

    loadLeaflet().then((L) => {
      if (!mounted || !mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [branch.lat, branch.lng],
        zoom: 13,
        scrollWheelZoom: true,
      })

      const iconBase = 'https://unpkg.com/leaflet@1.9.4/dist/images'
      const defaultIconOptions = {
        iconRetinaUrl: `${iconBase}/marker-icon-2x.png`,
        iconUrl: `${iconBase}/marker-icon.png`,
        shadowUrl: `${iconBase}/marker-shadow.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }

      branchIconRef.current = L.icon({
        ...defaultIconOptions,
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
        iconRetinaUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
      })
      destinationIconRef.current = L.icon({
        ...defaultIconOptions,
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
        iconRetinaUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-blue.png',
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const allowClick = mode === 'delivery' && typeof onDestinationChange === 'function' && typeof onAddressChange === 'function'
      if (allowClick) {
        map.on('click', async (event) => {
          const { lat, lng } = event.latlng
          onStatusChange?.('Finding address for pin...')
          const displayName = await reverseGeocode(lat, lng)
          const nextAddress = displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          onDestinationChange({ lat, lng, name: nextAddress })
          onAddressChange(nextAddress)
          setStatus('')
          onStatusChange?.('Delivery location pinned.')
        })
      }

      mapRef.current = map
    }).catch(() => {
      setStatus('Unable to load the map. Please check your internet connection.')
      onStatusChange?.('Unable to load the map.')
    })

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [branch, onAddressChange, onDestinationChange, onStatusChange])

  useEffect(() => {
    if (!mapRef.current || !window.L) return
    const L = window.L
    const map = mapRef.current

    if (!branchMarkerRef.current) {
      branchMarkerRef.current = L.marker([branch.lat, branch.lng], { icon: branchIconRef.current }).addTo(map)
      branchMarkerRef.current.bindTooltip(`${branch.name}`, { permanent: true, direction: 'top', offset: [0, -10], className: 'leaflet-branch-tooltip' })
    } else {
      branchMarkerRef.current.setLatLng([branch.lat, branch.lng])
      branchMarkerRef.current.setTooltipContent(`${branch.name}`)
    }

    if (mode === 'pickup') {
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current)
        destinationMarkerRef.current = null
      }
      if (routeRef.current) {
        map.removeLayer(routeRef.current)
        routeRef.current = null
      }
      map.setView([branch.lat, branch.lng], 13)
      return
    }

    if (destination) {
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = L.marker([destination.lat, destination.lng], {
          draggable: false,
          icon: destinationIconRef.current,
        }).addTo(map)
        destinationMarkerRef.current.bindPopup('Delivery location').openPopup()
      } else {
        destinationMarkerRef.current.setLatLng([destination.lat, destination.lng])
      }

      if (!routeRef.current) {
        routeRef.current = L.polyline([
          [branch.lat, branch.lng],
          [destination.lat, destination.lng],
        ], { color: '#b000b0', weight: 5, opacity: 0.7, dashArray: '8, 8' }).addTo(map)
      } else {
        routeRef.current.setLatLngs([
          [branch.lat, branch.lng],
          [destination.lat, destination.lng],
        ])
      }

      const padding = [50, 50]
      const bounds = L.latLngBounds([branch.lat, branch.lng], [destination.lat, destination.lng])
      map.fitBounds(bounds, { padding })
    } else {
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current)
        destinationMarkerRef.current = null
      }
      if (routeRef.current) {
        map.removeLayer(routeRef.current)
        routeRef.current = null
      }
      map.setView([branch.lat, branch.lng], 13)
    }
  }, [branch, destination])

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: '100%', minHeight: 380, borderRadius: 12, overflow: 'hidden', border: '1px solid #ddd' }} />
      {status ? <p className="muted" style={{ marginTop: 10 }}>{status}</p> : null}
    </div>
  )
}
