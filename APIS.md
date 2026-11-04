# APIs we may use

All free, no API key. Checked 2026-11-04.

| API                      | Gives us                                         | Endpoint                                                          |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------------- |
| Open-Meteo Marine        | Wave height, wave period, swell                  | `https://marine-api.open-meteo.com/v1/marine`                     |
| Open-Meteo Forecast      | Wind speed, direction, gusts; sunrise and sunset | `https://api.open-meteo.com/v1/forecast`                          |
| Hebcal                   | Israeli holidays; Shabbat start and end times    | `https://www.hebcal.com/hebcal`, `https://www.hebcal.com/shabbat` |
| Overpass (OpenStreetMap) | Beaches with coordinates                         | `https://overpass-api.de/api/interpreter`                         |

## Docs

- Open-Meteo Marine: https://open-meteo.com/en/docs/marine-weather-api
- Open-Meteo Forecast: https://open-meteo.com/en/docs
- Hebcal holidays: https://www.hebcal.com/home/195/jewish-calendar-rest-api
- Hebcal Shabbat times: https://www.hebcal.com/home/197/shabbat-times-rest-api
- Overpass: https://wiki.openstreetmap.org/wiki/Overpass_API (query language: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)

## Notes

- Open-Meteo: forecast up to 16 days (`forecast_days`); free for non-commercial use. Always pass `timezone=Asia/Jerusalem`.
- Overpass is often at capacity (502 when checked)
