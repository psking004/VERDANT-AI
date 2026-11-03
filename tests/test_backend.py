"""Offline tests: weather parsing, rule-based pest risk, Stripe guards. Run: cd backend && pytest ../tests"""
import hashlib
import hmac
import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test"
os.environ.pop("STRIPE_API_KEY", None)

from fastapi.testclient import TestClient  # noqa: E402

import pest_risk  # noqa: E402
import server  # noqa: E402
import weather as wx  # noqa: E402

FAKE = {
    "latitude": 12.73, "longitude": 77.78,
    "current": {"time": "2026-11-03T19:00", "temperature_2m": 24.1, "relative_humidity_2m": 88,
                "weather_code": 61, "wind_speed_10m": 7.2},
    "daily": {
        "time": [f"2026-11-0{i}" for i in range(3, 10)],
        "weather_code": [61, 63, 3, 2, 80, 95, 1],
        "temperature_2m_max": [27, 26, 28, 29, 27, 26, 30],
        "temperature_2m_min": [20, 19, 20, 21, 20, 19, 21],
        "precipitation_sum": [4, 22, 0, 0, 6, 12, 0],
        "precipitation_probability_max": [70, 90, 10, 5, 60, 80, 10],
        "relative_humidity_2m_mean": [88, 92, 78, 70, 86, 90, 68],
    },
}

client = TestClient(server.app)


def setup_function():
    wx._cache[(round(wx.DEFAULT_LAT, 2), round(wx.DEFAULT_LON, 2))] = (time.time(), FAKE)


def test_weather_uses_open_meteo_payload():
    r = client.get("/api/weather")
    assert r.status_code == 200
    body = r.json()
    assert body["temperature"] == 24.1 and body["description"] == "slight rain"
    assert body["location"].startswith("Moranapalli")
    assert len(body["forecast"]) == 7
    assert "Heavy rain" in body["alert"]


def test_pest_risk_levels():
    alerts = pest_risk.assess(wx.daily_rows(FAKE))
    levels = {a["pest_name"]: a["risk_level"] for a in alerts}
    assert levels["Fall Armyworm"] == "high"
    assert all(a["method"].startswith("rule-based") for a in alerts)


def test_checkout_requires_stripe_key():
    r = client.post("/api/marketplace/checkout", json={"cart_id": "x", "origin_url": "http://localhost:3000"})
    assert r.status_code == 503


def test_webhook_signature_is_verified():
    payload = json.dumps({"id": "evt_1", "object": "event", "type": "payment_intent.created",
                          "data": {"object": {"id": "pi_1", "object": "payment_intent"}}})
    ts = int(time.time())
    sig = hmac.new(b"whsec_test", f"{ts}.{payload}".encode(), hashlib.sha256).hexdigest()
    ok = client.post("/api/webhook/stripe", content=payload, headers={"Stripe-Signature": f"t={ts},v1={sig}"})
    bad = client.post("/api/webhook/stripe", content=payload, headers={"Stripe-Signature": f"t={ts},v1=00"})
    assert ok.status_code == 200 and bad.status_code == 400
