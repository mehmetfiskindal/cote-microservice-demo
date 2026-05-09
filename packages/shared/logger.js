function log(serviceName, message, meta = {}) {
  console.log(JSON.stringify({
    service: serviceName,
    message,
    ...meta,
    timestamp: new Date().toISOString()
  }));
}

function error(serviceName, message, meta = {}) {
  console.error(JSON.stringify({
    service: serviceName,
    level: "error",
    message,
    ...meta,
    timestamp: new Date().toISOString()
  }));
}

module.exports = {
  log,
  error
};
