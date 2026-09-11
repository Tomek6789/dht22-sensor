import mqtt from "mqtt";
import { MongoClient } from "mongodb";

const MQTT_URL = "mqtt://host.docker.internal:1883";
const MONGO_URL = "mongodb://mongo:27017";

const TOPIC = "weather/anemometer";

console.log("🔌 MQTT:", MQTT_URL);
console.log("🗄 Mongo:", MONGO_URL);

const mongo = new MongoClient(MONGO_URL);

try {
  console.log("Connecting to Mongo...");

  await mongo.connect();

  console.log("✅ Mongo connected");

  const db = mongo.db("weather");
  const wind = db.collection("wind");

  console.log("Connecting to MQTT...");

  const mqttClient = mqtt.connect(MQTT_URL);

  mqttClient.on("connect", () => {
    console.log("✅ MQTT connected");

    mqttClient.subscribe(TOPIC, (err) => {
      if (err) {
        console.error("❌ MQTT subscribe error:", err.message);
      } else {
        console.log("✅ Subscribed to:", TOPIC);
      }
    });
  });

  mqttClient.on("error", (err) => {
    console.error("❌ MQTT error:", err.message);
  });

  mqttClient.on("message", async (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());

      await wind.insertOne({
        speed: data.speed,
	speed_kmh:data.speed_kmh,
        vin: data.vin,
        source: "esp8266",
        timestamp: new Date()
      });

      console.log("📥 zapisano:", data);

    } catch (e) {
      console.error("❌ błąd:", e.message);
    }
  });

} catch (e) {
  console.error("❌ Mongo connection error:", e);
  process.exit(1);
}
