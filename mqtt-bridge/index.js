import mqtt from "mqtt";
import { MongoClient } from "mongodb";

const MQTT_URL = "mqtt://host.docker.internal:1883";
const MONGO_URL = "mongodb://mongo:27017";

const TOPIC = "weather/anemometer";

console.log("🔌 MQTT:", MQTT_URL);
console.log("🗄 Mongo:", MONGO_URL);

const mongo = new MongoClient(MONGO_URL);
await mongo.connect();

const db = mongo.db("weather");
const wind = db.collection("wind");

const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on("connect", () => {
  console.log("✅ MQTT connected");
  mqttClient.subscribe(TOPIC);
});

mqttClient.on("message", async (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());

    await wind.insertOne({
      speed: data.speed,        // m/s
      vin: data.vin,            // napięcie z ADC
      source: "esp8266",
      timestamp: new Date()
    });

    console.log("📥 zapisano:", data);
  } catch (e) {
    console.error("❌ błąd:", e.message);
  }
});
