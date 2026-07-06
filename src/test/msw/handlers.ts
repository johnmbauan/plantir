import { http, HttpResponse } from 'msw'

const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1'
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export const mockGeocodingResults = [
  {
    id: 1,
    name: 'Rome',
    latitude: 41.89,
    longitude: 12.49,
    country: 'Italy',
    admin1: 'Lazio',
  },
]

export const mockForecastResponse = {
  daily: {
    time: ['2026-07-06', '2026-07-07', '2026-07-08'],
    temperature_2m_max: [28.4, 30.1, 29.0],
    temperature_2m_min: [18.2, 19.5, 18.8],
    weather_code: [0, 2, 61],
  },
}

export const handlers = [
  http.get(`${GEOCODING_BASE}/search`, () => {
    return HttpResponse.json({ results: mockGeocodingResults })
  }),
  http.get(`${OPEN_METEO_BASE}/forecast`, () => {
    return HttpResponse.json(mockForecastResponse)
  }),
  http.get(`${NOMINATIM_BASE}/reverse`, () => {
    return HttpResponse.json({
      address: { city: 'Rome' },
    })
  }),
]
