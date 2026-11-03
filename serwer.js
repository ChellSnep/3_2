const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const NOAA = "https://www.ncei.noaa.gov/cdo-web/api/v2/";
const FILES = { "/": "index.html", "/index.html": "index.html", "/script.js": "script.js" };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const m = url.pathname.match(/^\/api\/(\w+)$/);

  if (m) {
    const target = NOAA + m[1] + url.search;
    console.log("→", target);
    try {
      const upstream = await fetch(target, { headers: { token: req.headers["token"] || "" } });
      res.writeHead(upstream.status, { "Content-Type": "application/json" });
      res.end(await upstream.text());
    } catch (err) {
      console.error("Błąd połączenia z NOAA:", err.cause?.code || err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Serwer nie może połączyć się z NOAA (" + (err.cause?.code || err.message) + ")" }));
    }
    return;
  }

  const file = FILES[url.pathname];
  if (!file) { res.writeHead(404); res.end("Not found"); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] });
  fs.createReadStream(path.join(__dirname, file)).pipe(res);
}).listen(PORT, () => console.log(`Działa: http://localhost:${PORT}`));