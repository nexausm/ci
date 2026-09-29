import net from "node:net";
import tls from "node:tls";
import dns from "node:dns/promises";

const PREFIX = "[db:preflight]";
const DEFAULT_PORT = 5432;
const TIMEOUT_MS = 10_000;
const PROTOCOL_3 = 196608;
const SSL_REQUEST = 80877103;

function fail(message) {
  const flat = message.replace(/\s+/g, " ").trim();
  console.error(`${PREFIX} FATAL: ${flat}`);
  console.error(
    `${PREFIX} The database could not be prepared, so every platform build ` +
      `would fail. No build was attempted.`,
  );
  console.error(
    `${PREFIX} Check that the DATABASE_URL secret points at a live database.`,
  );
  if (process.env.CI) {
    console.error(
      `::error title=DATABASE_URL unreachable::${flat
        .replace(/%/g, "%25")
        .replace(/\r/g, "%0D")
        .replace(/\n/g, "%0A")}`,
    );
  }
  process.exit(1);
}

function loadDatabaseUrl() {
  try {
    process.loadEnvFile();
  } catch {}

  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    fail(
      "DATABASE_URL is not set. Add a PostgreSQL connection string as a " +
        "build-time environment variable and redeploy.",
    );
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("DATABASE_URL is not a valid URL.");
  }

  if (!url.hostname) {
    fail("DATABASE_URL has no host.");
  }

  return {
    host: url.hostname,
    port: Number(url.port || DEFAULT_PORT),
    user: decodeURIComponent(url.username || "postgres"),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  };
}

function sslRequest() {
  const head = Buffer.alloc(8);
  head.writeInt32BE(8, 0);
  head.writeInt32BE(SSL_REQUEST, 4);
  return head;
}

function startupPacket(user, database) {
  const params = ["user", user];
  if (database) params.push("database", database);
  params.push("client_encoding", "UTF8", "application_name", "db-preflight");

  const body = Buffer.from(`${params.map((p) => `${p}\0`).join("")}\0`, "utf8");
  const head = Buffer.alloc(8);
  head.writeInt32BE(body.length + 8, 0);
  head.writeInt32BE(PROTOCOL_3, 4);
  return Buffer.concat([head, body]);
}

function errorFields(buffer) {
  const fields = {};
  let offset = 5;
  while (offset < buffer.length && buffer[offset] !== 0) {
    const end = buffer.indexOf(0, offset + 1);
    if (end === -1) break;
    fields[String.fromCharCode(buffer[offset])] = buffer.toString(
      "utf8",
      offset + 1,
      end,
    );
    offset = end + 1;
  }
  return fields;
}

function probe(address, port, user, database, host) {
  return new Promise((resolve) => {
    const started = Date.now();
    let settled = false;
    let phase = "negotiating ssl";
    let stream = null;
    let buffer = Buffer.alloc(0);

    const socket = net.connect({
      host: address.address,
      port,
      family: address.family,
    });

    const finish = (ok, detail) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      (stream || socket).destroy();
      resolve({ ok, detail, ms: Date.now() - started });
    };
    const timer = setTimeout(
      () => finish(false, `timed out after ${TIMEOUT_MS}ms`),
      TIMEOUT_MS,
    );

    function sendStartup() {
      phase = "startup";
      buffer = Buffer.alloc(0);
      stream.write(startupPacket(user, database));
    }

    function onData(chunk) {
      let data = chunk;

      if (phase === "negotiating ssl") {
        const answer = String.fromCharCode(data[0]);

        if (answer === "S") {
          socket.removeListener("data", onData);
          const secure = tls.connect(
            { socket, servername: host, rejectUnauthorized: false },
            () => {
              secure.on("data", onData);
              sendStartup();
            },
          );
          stream = secure;
          secure.on("error", (err) =>
            finish(false, `TLS ${err.code || "ERROR"}: ${err.message}`),
          );
          return;
        }

        if (answer === "E") return finish(false, errorFields(data));
        if (answer !== "N") {
          return finish(false, `unexpected SSLRequest reply '${answer}'`);
        }
        phase = "startup";
        data = data.subarray(1);
        stream.write(startupPacket(user, database));
      }

      buffer = Buffer.concat([buffer, data]);
      if (buffer.length < 5) return;
      const type = String.fromCharCode(buffer[0]);

      if (type === "R") {
        if (buffer.length < 9) return;
        return finish(true, "server requested authentication");
      }

      if (type === "E") {
        if (buffer.length < 1 + buffer.readInt32BE(1)) return;
        const { C: code, M: message } = errorFields(buffer);
        return finish(false, [code, message].filter(Boolean).join(" "));
      }

      finish(true, `server replied '${type}'`);
    }

    socket.setKeepAlive(true);
    socket.on("error", (err) =>
      finish(false, `${err.code || "ERROR"}: ${err.message}`),
    );
    socket.once("connect", () => {
      stream = socket;
      socket.write(sslRequest());
    });
    socket.on("data", onData);
  });
}

async function run() {
  const { host, port, user, database } = loadDatabaseUrl();

  let addresses;
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch (err) {
    fail(
      `DNS lookup for ${host} failed- ${err.code || "ERROR"}. ${err.message}. ` +
        `A deleted or renamed database project loses its DNS record, so check ` +
        `that the project reference in DATABASE_URL is still current.`,
    );
  }
  if (addresses.length === 0) {
    fail(`DNS lookup for ${host} returned no addresses.`);
  }

  const attempts = [];
  for (const address of addresses) {
    const result = await probe(address, port, user, database, host);
    if (result.ok) {
      const via = ` (IPv${address.family} ${address.address})`;
      console.log(
        `${PREFIX} OK: ${host}:${port}${via} answered in ${result.ms}ms. ` +
          `${result.detail}.`,
      );
      console.log(
        `${PREFIX} Database is reachable; the preview matrix can run.`,
      );
      return;
    }
    attempts.push(`IPv${address.family} ${address.address}- ${result.detail}`);
  }

  fail(
    `cannot reach ${host}:${port}. Tried ${attempts.length} address(es). ` +
      attempts.join("; "),
  );
}

run().catch((err) => {
  fail(`unexpected preflight error- ${err?.stack || err}`);
});
