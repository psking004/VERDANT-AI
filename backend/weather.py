"""Live weather from Open-Meteo (https://open-meteo.com) — free, no API key.

Default farm location is Moranapalli, Hosur (Tamil Nadu), ~12.73 N, 77.78 E.
Override with FARM_LAT / FARM_LON / FARM_LOCATION_NAME.
"""
import os
import time
from typing import Any, Dict, Optional, Tuple

import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

DEFAULT_LAT = float(os.environ.get("FARM_LAT", "12.73"))
DEFAULT_LON = float(os.environ.get("FARM_LON", "77.78"))
DEFAULT_LOCATION_NAME = os.environ.get("FARM_LOCATION_NAME", "Moranapalli, Hosur, Tamil Nadu")

CACHE_TTL_SECONDS = int(os.environ.get("WEATHER_CACHE_SECONDS", "900"))  # 15 min
_cache: Dict[Tuple[float, float], Tuple[float, Dict[str, Any]]] = {}

# WMO weather interpretation codes (Open-Meteo docs)
WMO_CODES = {
    0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "fog", 48: "depositing rime fog",
    51: "light drizzle", 53: "moderate drizzle", 55: "dense drizzle",
    56: "light freezing drizzle", 57: "dense freezing drizzle",
    61: "slight rain", 63: "moderate rain", 65: "heavy rain",
    66: "light freezing rain", 67: "heavy freezing rain",
    71: "slight snow", 73: "moderate snow", 75: "heavy snow", 77: "snow grains",
    80: "slight rain showers", 81: "moderate rain showers", 82: "violent rain showers",
    85: "slight snow showers", 86: "heavy snow showers",
    95: "thunderstorm", 96: "thunderstorm with slight hail", 99: "thunderstorm with heavy hail",
}


class WeatherUnavailable(Exception):
    pass


def describe(code: Optional[int]) -> str:
    return WMO_CODES.get(code, "unknown") if code is not None else "unknown"


async def fetch_forecast(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> Dict[str, Any]:
    """Current conditions + 7-day daily forecast. Cached for CACHE_TTL_SECONDS."""
    key = (round(lat, 2), round(lon, 2))
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL_SECONDS:
        return hit[1]

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "daily": ",".join([
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "relative_humidity_2m_mean",
        ]),
        "timezone": "Asia/Kolkata",
        "forecast_days": 7,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
        data = resp.json()
    except Exception as exc:  # network error, bad JSON
        raise WeatherUnavailable(f"Open-Meteo request failed: {exc}") from exc
    if resp.status_code != 200 or data.get("error"):
        raise WeatherUnavailable(f"Open-Meteo error ({resp.status_code}): {data.get('reason', 'unknown')}")

    _cache[key] = (time.time(), data)
    return data


def daily_rows(data: Dict[str, Any]):
    """Turn Open-Meteo's column arrays into one dict per day."""
    d = data.get("daily", {})
    rows = []
    for i, day in enumerate(d.get("time", [])):
        def col(name):
            vals = d.get(name) or []
            return vals[i] if i < len(vals) else None
        rows.append({
            "date": day,
            "description": describe(col("weather_code")),
            "temp_max": col("temperature_2m_max"),
            "temp_min": col("temperature_2m_min"),
            "rain_mm": col("precipitation_sum"),
            "rain_probability": col("precipitation_probability_max"),
            "humidity_mean": col("relative_humidity_2m_mean"),
        })
    return rows


def weather_alert(rows) -> Optional[str]:
    """Plain threshold alerts from the forecast (not a prediction model)."""
    if not rows:
        return None
    heavy = [r for r in rows[:3] if (r["rain_mm"] or 0) >= 20 or (r["rain_probability"] or 0) >= 80]
    if heavy:
        return f"Heavy rain likely on {heavy[0]['date']} — delay spraying and fertiliser application"
    hot = [r for r in rows[:3] if (r["temp_max"] or 0) >= 38]
    if hot:
        return f"Heat stress risk on {hot[0]['date']} (max {hot[0]['temp_max']}°C) — irrigate early morning"
    dry = sum(1 for r in rows if (r["rain_mm"] or 0) < 1)
    if dry == len(rows) and len(rows) >= 7:
        return "No meaningful rain in the 7-day forecast — plan irrigation"
    return None
