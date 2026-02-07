const sensor = require('node-dht-sensor');

module.exports.readDHT22 = () => {
  const res = sensor.read(22, 4); // Typ 22, GPIO4
  return {
    temperature: res.temperature.toFixed(1),
    humidity: res.humidity.toFixed(1),
    timestamp: new Date()
  };
};
