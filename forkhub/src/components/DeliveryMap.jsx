import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const BACKUP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const BACKUP_TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO'
const USE_ROAD_ROUTE = true
const ROAD_ROUTE_TIMEOUT_MS = 4000
const ROAD_ROUTE_CACHE = new Map()
const MAX_OSM_TILE_ERRORS = 5

const STORE_ICON_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" aria-hidden="true">
    <path d="M20 2C10.1 2 3 9.1 3 18.7 3 30 20 46 20 46s17-16 17-27.3C37 9.1 29.9 2 20 2Z" fill="var(--color-secondary, #F4B400)" stroke="#fff" stroke-width="2"/>
    <path d="M11 18h18v14H11z" fill="#fff"/>
    <path d="m9 18 3-8h16l3 8H9Z" fill="var(--color-primary, #D62839)"/>
    <path d="M14 23h4v9h-4zm8-1h5v4h-5z" fill="var(--color-on-surface, #333)"/>
  </svg>
`

const DELIVERY_ICON_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" aria-hidden="true">
    <path d="M20 2C10.1 2 3 9.1 3 18.7 3 30 20 46 20 46s17-16 17-27.3C37 9.1 29.9 2 20 2Z" fill="var(--color-primary, #D62839)" stroke="#fff" stroke-width="2"/>
    <circle cx="20" cy="19" r="6" fill="#fff"/>
  </svg>
`

let leafletPromise = null

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise

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
        leafletPromise = null
        reject(new Error('Leaflet failed to load'))
      }
    }
    script.onerror = () => {
      leafletPromise = null
      reject(new Error('Failed to load Leaflet script'))
    }
    document.head.appendChild(script)
  })

  return leafletPromise
}

async function reverseGeocode(lat, lng, signal) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`, { signal })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function getCoordinateKey(branch, destination) {
  return [
    Number(branch.lat).toFixed(6),
    Number(branch.lng).toFixed(6),
    Number(destination.lat).toFixed(6),
    Number(destination.lng).toFixed(6),
  ].join(',')
}

function getRoadRoute(branch, destination, signal) {
  const key = getCoordinateKey(branch, destination)
  if (ROAD_ROUTE_CACHE.has(key)) return ROAD_ROUTE_CACHE.get(key)

  const url = `https://router.project-osrm.org/route/v1/driving/${branch.lng},${branch.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
  const request = fetch(url, { signal })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      const route = payload?.routes?.[0]
      const coordinates = route?.geometry?.coordinates
      if (!Array.isArray(coordinates) || coordinates.length < 2) return null

      return {
        coordinates: coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: Number(route.distance) / 1000,
        durationMinutes: Number(route.duration) / 60,
      }
    })
    .catch(() => null)

  ROAD_ROUTE_CACHE.set(key, request)
  return request
}

function getStraightLineDistanceKm(first, second) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const latDifference = radians(second.lat - first.lat)
  const lngDifference = radians(second.lng - first.lng)
  const firstLat = radians(first.lat)
  const secondLat = radians(second.lat)
  const haversine = (
    Math.sin(latDifference / 2) ** 2
    + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDifference / 2) ** 2
  )

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function fitMapToLocations(map, leaflet, branch, destination, mode) {
  if (mode === 'delivery' && destination) {
    const bounds = leaflet.latLngBounds(
      [branch.lat, branch.lng],
      [destination.lat, destination.lng],
    )
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 16,
      animate: true,
      duration: 0.5,
    })
    return
  }

  map.setView([branch.lat, branch.lng], 13, { animate: true, duration: 0.5 })
}

export default function DeliveryMap({
  branch,
  destination,
  addressEditVersion = 0,
  isLocationInDeliveryArea,
  onDestinationChange,
  onAddressChange,
  onStatusChange,
  mode = 'delivery',
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const branchMarkerRef = useRef(null)
  const destinationMarkerRef = useRef(null)
  const routeRef = useRef(null)
  const osmTileLayerRef = useRef(null)
  const backupTileLayerRef = useRef(null)
  const reverseGeocodeControllerRef = useRef(null)
  const roadRouteControllerRef = useRef(null)
  const committedDestinationRef = useRef(null)
  const lastFittedCoordinatesRef = useRef(null)
  const lastModeRef = useRef(null)
  const tileErrorCountRef = useRef(0)
  const propsRef = useRef({
    branch,
    destination,
    addressEditVersion,
    isLocationInDeliveryArea,
    onDestinationChange,
    onAddressChange,
    onStatusChange,
    mode,
  })

  useLayoutEffect(() => {
    propsRef.current = {
      branch,
      destination,
      addressEditVersion,
      isLocationInDeliveryArea,
      onDestinationChange,
      onAddressChange,
      onStatusChange,
      mode,
    }
  }, [
    addressEditVersion,
    branch,
    destination,
    isLocationInDeliveryArea,
    mode,
    onAddressChange,
    onDestinationChange,
    onStatusChange,
  ])

  const [status, setStatus] = useState('')
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [isUsingBackupTiles, setIsUsingBackupTiles] = useState(false)
  const [roadRouteResult, setRoadRouteResult] = useState(null)
  const [mapReadyVersion, setMapReadyVersion] = useState(0)
  let distanceBadge = ''
  if (mode === 'delivery' && destination) {
    const destinationKey = getCoordinateKey(branch, destination)
    if (roadRouteResult?.key === destinationKey && roadRouteResult.route) {
      const { distanceKm, durationMinutes } = roadRouteResult.route
      distanceBadge = `≈ ${distanceKm.toFixed(1)} km · ${Math.max(1, Math.round(durationMinutes))} min by road`
    } else {
      const straightLineKm = getStraightLineDistanceKm(branch, destination)
      distanceBadge = `≈ ${straightLineKm.toFixed(1)} km straight-line`
    }
  }

  useEffect(() => {
    let disposed = false
    let map = null
    let resizeObserver = null
    let container = null
    let tileErrorHandler = null
    let osmLoadHandler = null
    let touchStartHandler = null
    let touchEndHandler = null
    let mouseOutHandler = null
    let focusInHandler = null
    let focusOutHandler = null
    let touchDragActive = false

    loadLeaflet().then((leaflet) => {
      if (disposed || !mapContainerRef.current || mapRef.current) return

      const currentProps = propsRef.current
      container = mapContainerRef.current
      const isTouchDevice = window.matchMedia?.('(pointer: coarse)').matches
        || 'ontouchstart' in window
      map = leaflet.map(container, {
        center: [currentProps.branch.lat, currentProps.branch.lng],
        zoom: 13,
        scrollWheelZoom: false,
        touchZoom: false,
        dragging: !isTouchDevice,
      })
      mapRef.current = map
      container.tabIndex = 0
      container.setAttribute('aria-label', 'Delivery map. Click to pin a location.')
      container.style.cursor = 'grab'
      container.style.touchAction = 'pan-y'

      const invalidateSize = () => {
        requestAnimationFrame(() => {
          if (!disposed && mapRef.current === map) {
            map.invalidateSize({ pan: false, debounceMoveend: true })
          }
        })
      }

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(invalidateSize)
        resizeObserver.observe(container)
      }
      invalidateSize()

      let fallbackAdded = false
      const osmTiles = leaflet.tileLayer(OSM_TILE_URL, {
        attribution: '&copy; OpenStreetMap contributors',
      })
      osmTileLayerRef.current = osmTiles

      osmLoadHandler = () => {
        if (!fallbackAdded) setIsMapLoading(false)
      }
      tileErrorHandler = () => {
        if (fallbackAdded) return
        tileErrorCountRef.current += 1
        if (tileErrorCountRef.current < MAX_OSM_TILE_ERRORS) return

        fallbackAdded = true
        setIsUsingBackupTiles(true)
        osmTiles.off('tileerror', tileErrorHandler)
        osmTiles.off('load', osmLoadHandler)
        if (map.hasLayer(osmTiles)) map.removeLayer(osmTiles)

        const backupTiles = leaflet.tileLayer(BACKUP_TILE_URL, {
          subdomains: 'abcd',
          attribution: BACKUP_TILE_ATTRIBUTION,
        })
        backupTileLayerRef.current = backupTiles
        backupTiles.once('load', () => setIsMapLoading(false))
        backupTiles.addTo(map)
      }
      osmTiles.on('tileerror', tileErrorHandler)
      osmTiles.once('load', osmLoadHandler)
      osmTiles.addTo(map)

      const enableWheelZoom = () => map.scrollWheelZoom.enable()
      const disableWheelZoom = () => map.scrollWheelZoom.disable()
      map.on('click', enableWheelZoom)
      mouseOutHandler = (event) => {
        if (!container.contains(event.relatedTarget)) disableWheelZoom()
      }
      focusInHandler = enableWheelZoom
      focusOutHandler = (event) => {
        if (!container.contains(event.relatedTarget)) disableWheelZoom()
      }
      container.addEventListener('mouseout', mouseOutHandler)
      container.addEventListener('focusin', focusInHandler)
      container.addEventListener('focusout', focusOutHandler)

      if (isTouchDevice) {
        map.dragging.disable()
        map.touchZoom.disable()
        touchStartHandler = (event) => {
          if (event.touches.length < 2) return
          touchDragActive = true
          map.dragging.enable()
          map.touchZoom.enable()
        }
        touchEndHandler = (event) => {
          if (event.touches.length >= 2 || !touchDragActive) return
          touchDragActive = false
          map.dragging.disable()
          map.touchZoom.disable()
        }
        container.addEventListener('touchstart', touchStartHandler, { capture: true, passive: true })
        container.addEventListener('touchend', touchEndHandler, { capture: true, passive: true })
        container.addEventListener('touchcancel', touchEndHandler, { capture: true, passive: true })
      }

      const pinMapLocation = async (lat, lng) => {
        const latestProps = propsRef.current
        const restorePosition = committedDestinationRef.current
        reverseGeocodeControllerRef.current?.abort()
        if (destinationMarkerRef.current && restorePosition) {
          destinationMarkerRef.current.setLatLng(restorePosition)
        }
        const controller = new AbortController()
        reverseGeocodeControllerRef.current = controller
        latestProps.onStatusChange?.('Finding address for pin...')
        const location = await reverseGeocode(lat, lng, controller.signal)
        if (controller.signal.aborted) {
          if (reverseGeocodeControllerRef.current === controller) {
            if (destinationMarkerRef.current && restorePosition) {
              destinationMarkerRef.current.setLatLng(restorePosition)
            }
            reverseGeocodeControllerRef.current = null
          }
          return
        }

        if (!location && latestProps.isLocationInDeliveryArea) {
          if (destinationMarkerRef.current && restorePosition) {
            destinationMarkerRef.current.setLatLng(restorePosition)
          }
          reverseGeocodeControllerRef.current = null
          latestProps.onStatusChange?.('Unable to verify this location. Please try again.')
          return
        }
        if (latestProps.isLocationInDeliveryArea && !latestProps.isLocationInDeliveryArea(location)) {
          if (destinationMarkerRef.current && restorePosition) {
            destinationMarkerRef.current.setLatLng(restorePosition)
          }
          reverseGeocodeControllerRef.current = null
          latestProps.onStatusChange?.('Delivery is available only within Cebu Province. Choose a location in Cebu.')
          return
        }

        const nextAddress = location?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        committedDestinationRef.current = { lat, lng }
        destinationMarkerRef.current?.setLatLng([lat, lng])
        latestProps.onDestinationChange?.({ lat, lng, name: nextAddress })
        latestProps.onAddressChange?.(nextAddress)
        reverseGeocodeControllerRef.current = null
        setStatus('')
        latestProps.onStatusChange?.('Delivery location pinned.')
      }

      const mapClickHandler = (event) => {
        const latestProps = propsRef.current
        if (latestProps.mode !== 'delivery' || !latestProps.onDestinationChange || !latestProps.onAddressChange) return
        pinMapLocation(event.latlng.lat, event.latlng.lng)
      }
      map.on('click', mapClickHandler)

      setMapReadyVersion((version) => version + 1)
    }).catch(() => {
      if (disposed) return
      setIsMapLoading(false)
      setStatus('Unable to load the map. Please check your internet connection.')
      propsRef.current.onStatusChange?.('Unable to load the map.')
    })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      if (container && mouseOutHandler) container.removeEventListener('mouseout', mouseOutHandler)
      if (container && focusInHandler) container.removeEventListener('focusin', focusInHandler)
      if (container && focusOutHandler) container.removeEventListener('focusout', focusOutHandler)
      if (container && touchStartHandler) container.removeEventListener('touchstart', touchStartHandler, true)
      if (container && touchEndHandler) {
        container.removeEventListener('touchend', touchEndHandler, true)
        container.removeEventListener('touchcancel', touchEndHandler, true)
      }
      reverseGeocodeControllerRef.current?.abort()
      roadRouteControllerRef.current?.abort()
      osmTileLayerRef.current?.off('tileerror', tileErrorHandler)
      osmTileLayerRef.current?.off('load', osmLoadHandler)
      if (map && mapRef.current === map) {
        map.remove()
        mapRef.current = null
      }
      branchMarkerRef.current = null
      destinationMarkerRef.current = null
      routeRef.current = null
      osmTileLayerRef.current = null
      backupTileLayerRef.current = null
      committedDestinationRef.current = null
      lastFittedCoordinatesRef.current = null
      lastModeRef.current = null
    }
  }, [])

  useEffect(() => {
    const controller = reverseGeocodeControllerRef.current
    if (controller) controller.abort()
  }, [addressEditVersion])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return

    const leaflet = window.L
    const currentProps = propsRef.current
    const currentBranch = currentProps.branch
    const currentDestination = currentProps.destination
    const currentMode = currentProps.mode
    if (!branchMarkerRef.current) {
      const storeIcon = leaflet.divIcon({
        className: 'delivery-map-store-icon',
        html: STORE_ICON_HTML,
        iconSize: [40, 48],
        iconAnchor: [20, 46],
      })
      branchMarkerRef.current = leaflet.marker(
        [currentBranch.lat, currentBranch.lng],
        { icon: storeIcon, bubblingMouseEvents: false },
      ).addTo(map)
      branchMarkerRef.current.bindTooltip(
        `Store Address: ${currentBranch.name}`,
        { permanent: true, direction: 'top', offset: [0, -10], className: 'leaflet-branch-tooltip' },
      )
    } else {
      branchMarkerRef.current.setLatLng([currentBranch.lat, currentBranch.lng])
      branchMarkerRef.current.setTooltipContent(`Store Address: ${currentBranch.name}`)
    }

    if (currentMode === 'pickup') {
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current)
        destinationMarkerRef.current = null
      }
      if (routeRef.current) {
        map.removeLayer(routeRef.current)
        routeRef.current = null
      }
      committedDestinationRef.current = null
      lastFittedCoordinatesRef.current = null
      if (lastModeRef.current !== 'pickup') {
        map.setView([currentBranch.lat, currentBranch.lng], 13, { animate: true, duration: 0.5 })
      }
      lastModeRef.current = 'pickup'
      return
    }

    if (!currentDestination) {
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current)
        destinationMarkerRef.current = null
      }
      if (routeRef.current) {
        map.removeLayer(routeRef.current)
        routeRef.current = null
      }
      committedDestinationRef.current = null
      if (lastFittedCoordinatesRef.current) {
        map.setView([currentBranch.lat, currentBranch.lng], 13, { animate: true, duration: 0.5 })
      }
      lastFittedCoordinatesRef.current = null
      lastModeRef.current = 'delivery'
      return
    }

    const destinationPosition = { lat: currentDestination.lat, lng: currentDestination.lng }
    committedDestinationRef.current = destinationPosition
    if (!destinationMarkerRef.current) {
      const deliveryIcon = leaflet.divIcon({
        className: 'delivery-map-pin-icon',
        html: DELIVERY_ICON_HTML,
        iconSize: [40, 48],
        iconAnchor: [20, 46],
      })
      destinationMarkerRef.current = leaflet.marker(
        [destinationPosition.lat, destinationPosition.lng],
        {
          icon: deliveryIcon,
          draggable: false,
          bubblingMouseEvents: false,
        },
      ).addTo(map)
      destinationMarkerRef.current.bindTooltip(
        'Delivery Address',
        { permanent: true, direction: 'top', offset: [0, -10], className: 'leaflet-branch-tooltip' },
      )
    } else {
      destinationMarkerRef.current.setLatLng([destinationPosition.lat, destinationPosition.lng])
      destinationMarkerRef.current.setTooltipContent('Delivery Address')
    }

    if (!routeRef.current) {
      routeRef.current = leaflet.polyline(
        [
          [currentBranch.lat, currentBranch.lng],
          [destinationPosition.lat, destinationPosition.lng],
        ],
        {
          color: 'var(--color-primary, #D62839)',
          weight: 5,
          opacity: 0.7,
          dashArray: '8, 8',
        },
      ).addTo(map)
    } else {
      routeRef.current.setLatLngs([
        [currentBranch.lat, currentBranch.lng],
        [destinationPosition.lat, destinationPosition.lng],
      ])
    }

    const previousCoordinates = lastFittedCoordinatesRef.current
    const coordinatesChanged = !previousCoordinates
      || previousCoordinates.lat !== destinationPosition.lat
      || previousCoordinates.lng !== destinationPosition.lng
    if (coordinatesChanged) {
      lastFittedCoordinatesRef.current = destinationPosition
      fitMapToLocations(map, leaflet, currentBranch, destinationPosition, 'delivery')
    }
    lastModeRef.current = 'delivery'
  }, [
    branch.lat,
    branch.lng,
    branch.name,
    destination?.lat,
    destination?.lng,
    mapReadyVersion,
    mode,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return undefined

    let disposed = false
    let timeoutId = null
    const currentProps = propsRef.current
    const currentBranch = currentProps.branch
    const currentDestination = currentProps.destination
    if (currentProps.mode !== 'delivery' || !currentDestination || !USE_ROAD_ROUTE) {
      roadRouteControllerRef.current?.abort()
      roadRouteControllerRef.current = null
      return undefined
    }

    roadRouteControllerRef.current?.abort()
    const controller = new AbortController()
    roadRouteControllerRef.current = controller
    timeoutId = setTimeout(() => controller.abort(), ROAD_ROUTE_TIMEOUT_MS)

    getRoadRoute(currentBranch, currentDestination, controller.signal).then((roadRoute) => {
      if (disposed || controller.signal.aborted || roadRouteControllerRef.current !== controller) return
      if (!roadRoute || !routeRef.current) return
      routeRef.current.setLatLngs(roadRoute.coordinates)
      setRoadRouteResult({
        key: getCoordinateKey(currentBranch, currentDestination),
        route: roadRoute,
      })
    }).finally(() => {
      clearTimeout(timeoutId)
      if (roadRouteControllerRef.current === controller) roadRouteControllerRef.current = null
    })

    return () => {
      disposed = true
      clearTimeout(timeoutId)
      controller.abort()
      if (roadRouteControllerRef.current === controller) roadRouteControllerRef.current = null
    }
  }, [
    branch.lat,
    branch.lng,
    destination?.lat,
    destination?.lng,
    mapReadyVersion,
    mode,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined

    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false, debounceMoveend: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [mapReadyVersion, mode])

  const handleRecenter = () => {
    const map = mapRef.current
    const leaflet = window.L
    if (!map || !leaflet) return
    const currentProps = propsRef.current
    fitMapToLocations(
      map,
      leaflet,
      currentProps.branch,
      currentProps.destination,
      currentProps.mode,
    )
  }

  const floatingControlStyle = {
    position: 'absolute',
    zIndex: 1100,
    border: '1px solid var(--color-outline-variant, #d6c9ac)',
    borderRadius: 8,
    background: 'var(--color-surface-container-lowest, #fffdf6)',
    color: 'var(--color-on-surface, #25231e)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
    font: 'inherit',
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            minHeight: 380,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--color-outline-variant)',
            background: 'var(--color-surface-container-low, #F9F3E5)',
          }}
        />
        {isMapLoading ? (
          <div
            role="status"
            style={{
              ...floatingControlStyle,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '8px 12px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Loading map…
          </div>
        ) : null}
        {isUsingBackupTiles ? (
          <div
            role="status"
            style={{
              ...floatingControlStyle,
              left: 10,
              bottom: 26,
              padding: '5px 8px',
              fontSize: 12,
              pointerEvents: 'none',
            }}
          >
            Using backup map tiles
          </div>
        ) : null}
        {distanceBadge && mode === 'delivery' && destination ? (
          <div
            aria-live="polite"
            style={{
              ...floatingControlStyle,
              left: 10,
              bottom: isUsingBackupTiles ? 60 : 26,
              padding: '5px 8px',
              fontSize: 12,
              pointerEvents: 'none',
            }}
          >
            {distanceBadge}
          </div>
        ) : null}
        <button
          type="button"
          aria-label="Recenter map to store and delivery location"
          onClick={handleRecenter}
          style={{
            ...floatingControlStyle,
            top: 10,
            right: 10,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          Recenter
        </button>
      </div>
      {status ? <p className="muted" style={{ marginTop: 10 }}>{status}</p> : null}
    </div>
  )
}
