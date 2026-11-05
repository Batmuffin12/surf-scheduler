# APIs we may use

All free, no API key. Checked 2026-11-04.

| API                      | Gives us                                         | Endpoint                                                          |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------------- |
| Open-Meteo Marine        | Wave height, wave period, swell                  | `https://marine-api.open-meteo.com/v1/marine`                     |
| Open-Meteo Forecast      | Wind speed, direction, gusts; sunrise and sunset | `https://api.open-meteo.com/v1/forecast`                          |
| Hebcal                   | Israeli holidays; Shabbat start and end times    | `https://www.hebcal.com/hebcal`, `https://www.hebcal.com/shabbat` |
| Overpass (OpenStreetMap) | Beaches with coordinates                         | `https://overpass-api.de/api/interpreter`                         |

## Optional

Free, no API key.

| API                | Gives us                                                                    | Endpoint                                            |
| ------------------ | --------------------------------------------------------------------------- | --------------------------------------------------- |
| Open-Meteo Geocode | City name text to lat/lon, timezone; Hebrew and English (`language=he\|en`) | `https://geocoding-api.open-meteo.com/v1/search`    |

## Later

Needed later, not yet. These need an API key and a Google Cloud billing account, so unlike the APIs above they are not free by default.

| API                    | Gives us                                      | Endpoint                                          |
| ---------------------- | --------------------------------------------- | ------------------------------------------------- |
| Google Maps Platform   | Maps display, geocoding, places (to be chosen) | `https://maps.googleapis.com/maps/api/` (per API) |

## Docs

- Open-Meteo Marine: https://open-meteo.com/en/docs/marine-weather-api
- Open-Meteo Forecast: https://open-meteo.com/en/docs
- Hebcal holidays: https://www.hebcal.com/home/195/jewish-calendar-rest-api
- Hebcal Shabbat times: https://www.hebcal.com/home/197/shabbat-times-rest-api
- Overpass: https://wiki.openstreetmap.org/wiki/Overpass_API (query language: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)
- Open-Meteo Geocoding: https://open-meteo.com/en/docs/geocoding-api
- Google Maps Platform: https://developers.google.com/maps/documentation

## Notes

- Open-Meteo: forecast up to 16 days (`forecast_days`); free for non-commercial use. Always pass `timezone=Asia/Jerusalem`.
- Overpass is often at capacity (502 when checked)
- Open-Meteo Geocode (checked 2026-11-05): no `results` key when nothing matches. Also returns neighbourhoods and attractions; pass `countryCode=IL` and prefer `feature_code` starting with `PPL`. Non-commercial use only, like the other Open-Meteo APIs.
- Google Maps: which exact API (Maps JavaScript, Geocoding, Places) is still undecided. Restrict the key by HTTP referrer or IP and never commit it.
