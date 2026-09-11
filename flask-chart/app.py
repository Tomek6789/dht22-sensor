from flask import Flask, render_template, jsonify
from pymongo import MongoClient
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# ===============================
# MongoDB clients
# ===============================

MONGO_URI = os.environ.get("MONGO_URI")
client = MongoClient(MONGO_URI)

# ===============================
# Databases & collections
# ===============================

dht_db = client["dht22_db"]
dht_collection = dht_db["sensor_readings"]

wind_db = client["weather"]
wind_collection = wind_db["wind"]

# ===============================
# ROUTE: HOME
# ===============================

@app.route("/")
def home():

    # ---------- DHT22 ----------
    today = datetime.now().strftime("%Y-%m-%d")

    readings = list(
        dht_collection.find(
            {"timestamp": {"$regex": f"^{today}"}}
        ).sort("timestamp", 1)
    )

    filtered = []
    for r in readings:
        ts = r.get("timestamp", "")
        if len(ts) >= 16 and ts[14:16] in ("00", "30"):
            filtered.append(r)

    labels = []
    for r in filtered:
        dt = datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S")
        labels.append(dt.strftime("%H:%M:%S"))

    temp = [r.get("temperature_c") for r in filtered]
    humidity = [r.get("humidity") for r in filtered]
    current_temp = readings[-1].get("temperature_c") if readings else None

    # ---------- WIATR ----------
    now = datetime.now()
    start = datetime(now.year, now.month, now.day)
    end = start + timedelta(days=1)

    wind_readings = list(
        wind_collection.find(
            {"timestamp": {"$gte": start, "$lt": end}}
        ).sort("timestamp", 1)
    )

    #wind_filtered = [
    #    r for r in wind_readings
    #    if r["timestamp"].minute in (0, 30)
    #]

    wind_speed = [r.get("speed") for r in list(wind_collection.find())]

    return render_template(
        "graph.html",
        labels=labels,
        temp=temp,
        humidity=humidity,
        wind=wind_speed,
        current_wind=wind_speed[-1] if wind_speed else None,
	current_temp=current_temp
    )

# ===============================
# API: DHT22
# ===============================

@app.route("/api/readings")
def api_readings():
    data = list(dht_collection.find({}, {"_id": 0}).sort("timestamp", 1))
    for r in data:
        ts = r.get("timestamp")
        if ts:
            r["time"] = ts.replace(" ", "T") + "Z"
            del r["timestamp"]
    return jsonify(data)

# ===============================
# API: WIATR
# ===============================

@app.route("/api/wind")
def api_wind():
    data = list(wind_collection.find({}, {"_id": 0}).sort("timestamp", 1))
    for r in data:
        if "timestamp" in r:
            r["time"] = r["timestamp"].isoformat()
            del r["timestamp"]
    return jsonify(data)

# =============================
# API: LATEST WIND
# ============================

@app.route("/api/wind/latest")
def latest_wind():
    reading = wind_collection.find_one(
        {},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )

    if not reading:
        return jsonify({})

    if "timestamp" in reading:
        reading["timestamp"] = reading["timestamp"].isoformat()

    return jsonify(reading)


# ===============================
# MAIN
# ===============================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
