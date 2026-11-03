"""Weather-driven pest & disease risk — RULE-BASED, not machine learning.

Each rule counts how many of the next 7 forecast days fall inside the weather
window that is commonly reported to favour the pest/disease (temperature,
humidity, rain). The count becomes a risk level:

    0-1 favourable days -> low, 2-3 -> moderate, 4+ -> high

The thresholds are simplified from general agronomy guidance and are meant as an
early-warning nudge to scout the field, not a diagnosis. No field observations
or trained model are involved.
"""
from typing import Any, Callable, Dict, List


def _mean_temp(r):
    if r["temp_max"] is None or r["temp_min"] is None:
        return None
    return (r["temp_max"] + r["temp_min"]) / 2


def _late_blight(r) -> bool:
    # Phytophthora infestans: mild (10-25 °C) and very humid or wet days
    t = _mean_temp(r)
    return t is not None and 10 <= t <= 25 and ((r["humidity_mean"] or 0) >= 85 or (r["rain_mm"] or 0) >= 2)


def _rice_blast(r) -> bool:
    # Magnaporthe oryzae: warm nights (20-28 °C min) with high humidity
    return r["temp_min"] is not None and 20 <= r["temp_min"] <= 28 and (r["humidity_mean"] or 0) >= 85


def _fall_armyworm(r) -> bool:
    # Spodoptera frugiperda: fast development at 22-32 °C; heavy rain knocks back larvae
    t = _mean_temp(r)
    return t is not None and 22 <= t <= 32 and (r["rain_mm"] or 0) < 15


def _aphids(r) -> bool:
    # Aphids build up in warm, dry spells (20-30 °C max, little rain, moderate humidity)
    return (
        r["temp_max"] is not None and 20 <= r["temp_max"] <= 30
        and (r["rain_mm"] or 0) < 1
        and (r["humidity_mean"] or 100) < 75
    )


RULES: List[Dict[str, Any]] = [
    {"pest_name": "Fall Armyworm", "crop": "Maize", "check": _fall_armyworm,
     "advice": "Scout whorls for window-pane feeding and frass; use pheromone traps."},
    {"pest_name": "Late Blight", "crop": "Tomato", "check": _late_blight,
     "advice": "Look for water-soaked leaf lesions; avoid overhead irrigation, consider a protective fungicide."},
    {"pest_name": "Rice Blast", "crop": "Rice", "check": _rice_blast,
     "advice": "Check leaves for spindle-shaped lesions; avoid excess nitrogen."},
    {"pest_name": "Aphids", "crop": "Vegetables", "check": _aphids,
     "advice": "Check undersides of young leaves; neem-based sprays help early."},
]


def _level(days: int) -> str:
    return "high" if days >= 4 else "moderate" if days >= 2 else "low"


def assess(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for rule in RULES:
        check: Callable = rule["check"]
        fav = [r["date"] for r in rows if check(r)]
        level = _level(len(fav))
        out.append({
            "pest_name": rule["pest_name"],
            "crop": rule["crop"],
            "risk_level": level,
            "favourable_days": len(fav),
            "forecast_days": len(rows),
            "description": (
                f"{len(fav)} of the next {len(rows)} days have weather that favours {rule['pest_name'].lower()}"
                + (f". {rule['advice']}" if level != "low" else ".")
            ),
            "method": "rule-based (weather thresholds)",
        })
    order = {"high": 0, "moderate": 1, "low": 2}
    return sorted(out, key=lambda a: (order[a["risk_level"]], -a["favourable_days"]))
