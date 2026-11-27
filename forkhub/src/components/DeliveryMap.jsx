import { useEffect, useRef, useState } from 'react'

const LEAFLET_CSS = 'https://unpkg.com/leaflet/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet/dist/leaflet.js'
const CENTER_LOCATOR_ICON = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png'

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

async function reverseGeocode(lat, lng, signal) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`, { signal })
    if (!response.ok) return null
    const data = await response.json()
    return data
  } catch {
    return null
  }
}

export default function DeliveryMap({ branch, destination, addressEditVersion = 0, isLocationInDeliveryArea, onDestinationChange, onAddressChange, onStatusChange, mode = 'delivery' }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const branchMarkerRef = useRef(null)
  const destinationMarkerRef = useRef(null)
  const branchIconRef = useRef(null)
  const destinationIconRef = useRef(null)
  const routeRef = useRef(null)
  const reverseGeocodeControllerRef = useRef(null)
  const pinMapLocationRef = useRef(null)
  const destinationDragStartRef = useRef(null)
  const committedDestinationRef = useRef(null)
  const [status, setStatus] = useState('')
  const [mapReadyVersion, setMapReadyVersion] = useState(0)
  const [isLocatingMapCenter, setIsLocatingMapCenter] = useState(false)

  useEffect(() => {
    let mounted = true
    let resizeObserver = null

    loadLeaflet().then((L) => {
      if (!mounted || !mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [branch.lat, branch.lng],
        zoom: 13,
        scrollWheelZoom: true,
      })

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize({ pan: false, debounceMoveend: true })
        })
        resizeObserver.observe(mapContainerRef.current)
        requestAnimationFrame(() => {
          if (mounted) {
            map.invalidateSize({ pan: false, debounceMoveend: true })
          }
        })
      }

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
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-yellow.png',
        iconRetinaUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-yellow.png',
      })
      destinationIconRef.current = L.icon({
        ...defaultIconOptions,
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
        iconRetinaUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const allowClick = mode === 'delivery' && typeof onDestinationChange === 'function' && typeof onAddressChange === 'function'
      if (allowClick) {
        const container = map.getContainer()
        container.style.cursor = 'grab'

        const pinMapLocation = async (lat, lng, showCenterLocator, previousPosition = null) => {
          const restorePosition = previousPosition || committedDestinationRef.current
          reverseGeocodeControllerRef.current?.abort()
          if (!previousPosition && destinationMarkerRef.current && restorePosition) {
            destinationMarkerRef.current.setLatLng(restorePosition)
          }
          const controller = new AbortController()
          reverseGeocodeControllerRef.current = controller
          setIsLocatingMapCenter(showCenterLocator)
          onStatusChange?.('Finding address for pin...')
          const location = await reverseGeocode(lat, lng, controller.signal)
          if (controller.signal.aborted) {
            if (reverseGeocodeControllerRef.current === controller) {
              if (destinationMarkerRef.current && restorePosition) {
                destinationMarkerRef.current.setLatLng(restorePosition)
              }
              reverseGeocodeControllerRef.current = null
              setIsLocatingMapCenter(false)
            }
            return
          }
          if (isLocationInDeliveryArea && !location) {
            if (destinationMarkerRef.current && restorePosition) {
              destinationMarkerRef.current.setLatLng(restorePosition)
            }
            reverseGeocodeControllerRef.current = null
            setIsLocatingMapCenter(false)
            onStatusChange?.('Unable to verify this location. Please try again.')
            return
          }
          if (isLocationInDeliveryArea && !isLocationInDeliveryArea(location)) {
            if (destinationMarkerRef.current && restorePosition) {
              destinationMarkerRef.current.setLatLng(restorePosition)
            }
            reverseGeocodeControllerRef.current = null
            setIsLocatingMapCenter(false)
            onStatusChange?.('Delivery is available only within Cebu Province. Choose a location in Cebu.')
            return
          }
          const nextAddress = location?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          committedDestinationRef.current = { lat, lng }
          destinationMarkerRef.current?.setLatLng([lat, lng])
          onDestinationChange({ lat, lng, name: nextAddress })
          onAddressChange(nextAddress)
          reverseGeocodeControllerRef.current = null
          setIsLocatingMapCenter(false)
          setStatus('')
          onStatusChange?.('Delivery location pinned.')
        }
        pinMapLocationRef.current = pinMapLocation

        map.on('click', (event) => {
          const { lat, lng } = event.latlng
          pinMapLocation(lat, lng, false)
        })
        map.on('dragstart', () => {
          container.style.cursor = 'grabbing'
          setIsLocatingMapCenter(true)
        })
        map.on('dragend', () => {
          container.style.cursor = 'grab'
          const center = map.getCenter()
          pinMapLocation(center.lat, center.lng, true)
        })
      }

      mapRef.current = map
      setMapReadyVersion((version) => version + 1)
    }).catch(() => {
      setStatus('Unable to load the map. Please check your internet connection.')
      onStatusChange?.('Unable to load the map.')
    })

    return () => {
      mounted = false
      resizeObserver?.disconnect()
      reverseGeocodeControllerRef.current?.abort()
      reverseGeocodeControllerRef.current = null
      pinMapLocationRef.current = null
      destinationDragStartRef.current = null
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [branch, isLocationInDeliveryArea, mode, onAddressChange, onDestinationChange, onStatusChange])

  useEffect(() => {
    reverseGeocodeControllerRef.current?.abort()
  }, [addressEditVersion])

  useEffect(() => {
    if (!mapRef.current || !window.L) return
    const L = window.L
    const map = mapRef.current

    if (!branchMarkerRef.current) {
      branchMarkerRef.current = L.marker([branch.lat, branch.lng], { icon: branchIconRef.current }).addTo(map)
      branchMarkerRef.current.bindTooltip(`Store Address: ${branch.name}`, { permanent: true, direction: 'top', offset: [0, -10], className: 'leaflet-branch-tooltip' })
    } else {
      branchMarkerRef.current.setLatLng([branch.lat, branch.lng])
      branchMarkerRef.current.setTooltipContent(`Store Address: ${branch.name}`)
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
      committedDestinationRef.current = { lat: destination.lat, lng: destination.lng }
      const deliveryLabel = 'Delivery Address'
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = L.marker([destination.lat, destination.lng], {
          draggable: true,
          icon: destinationIconRef.current,
        }).addTo(map)
        destinationMarkerRef.current.bindTooltip(deliveryLabel, { permanent: true, direction: 'top', offset: [0, -10], className: 'leaflet-branch-tooltip' })
        destinationMarkerRef.current.on('dragstart', () => {
          destinationDragStartRef.current = committedDestinationRef.current || destinationMarkerRef.current.getLatLng()
        })
        destinationMarkerRef.current.on('dragend', (event) => {
          const { lat, lng } = event.target.getLatLng()
          const previousPosition = destinationDragStartRef.current
          destinationDragStartRef.current = null
          pinMapLocationRef.current?.(lat, lng, false, previousPosition)
        })
      } else {
        destinationMarkerRef.current.setLatLng([destination.lat, destination.lng])
        destinationMarkerRef.current.setTooltipContent(deliveryLabel)
      }

      if (!routeRef.current) {
        routeRef.current = L.polyline([
          [branch.lat, branch.lng],
          [destination.lat, destination.lng],
        ], { color: 'var(--color-primary)', weight: 5, opacity: 0.7, dashArray: '8, 8' }).addTo(map)
      } else {
        routeRef.current.setLatLngs([
          [branch.lat, branch.lng],
          [destination.lat, destination.lng],
        ])
      }

      const padding = [50, 50]
      const bounds = L.latLngBounds([branch.lat, branch.lng], [destination.lat, destination.lng])
      map.fitBounds(bounds, { padding, animate: false })
    } else {
      committedDestinationRef.current = null
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
  }, [branch, destination, mapReadyVersion, mode])

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', minHeight: 380, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-outline-variant)' }} />
        {isLocatingMapCenter && mode === 'delivery' ? (
          <img
            src={CENTER_LOCATOR_ICON}
            alt=""
            aria-hidden="true"
            draggable="false"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 25,
              height: 41,
              transform: 'translate(-50%, -100%)',
              zIndex: 1000,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.4))',
            }}
          />
        ) : null}
      </div>
      {status ? <p className="muted" style={{ marginTop: 10 }}>{status}</p> : null}
    </div>
  )
}
