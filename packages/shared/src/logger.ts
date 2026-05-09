type LogMeta = Record<string, unknown>;

function write(level: "info" | "error", service: string, message: string, meta: LogMeta = {}) {
  const line = {
    service,
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString()
  };

  const output = JSON.stringify(line);

  if (level === "error") {
    console.error(output);
    return;
  }

  console.log(output);
}

export function log(service: string, message: string, meta: LogMeta = {}) {
  write("info", service, message, meta);
}

export function logError(service: string, message: string, meta: LogMeta = {}) {
  write("error", service, message, meta);
}
