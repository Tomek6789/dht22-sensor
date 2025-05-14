const { MongoClient } = require('mongodb');
const { readDHT22 } = require('./dht');

const mongoUrl = process.env.MONGO_URL;
const dbName = "weather";
const collectionName = "readings";

async function logSensorData() {
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection(collectionName);

    const reading = readDHT22();
    console.log("Saving reading:", reading);
    await col.insertOne(reading);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

setInterval(logSensorData, 5000); // Co 5 sekund
