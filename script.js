const BASE = "https://www.ncei.noaa.gov/cdo-web/api/v2/";
const LIMIT = 1000;
let offset = 1;
let total = null;

const FIELDS = { stations: ["id", "name", "latitude", "longitude"] };
const HEADERS = { stations: ["Station ID", "Name", "Latitude", "Longitude"] };
let columns = [];

const $ = id => document.getElementById(id);
const statusEl = $("status");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

function buildHead(endpoint, firstItem) {
  columns = FIELDS[endpoint] || Object.keys(firstItem);
  const labels = HEADERS[endpoint] || columns;
  const tr = document.createElement("tr");
  labels.forEach(label => {
    const th = document.createElement("th");
    th.textContent = label;
    tr.appendChild(th);
  });
  $("head").replaceChildren(tr);
}

function addRows(items) {
  const frag = document.createDocumentFragment();
  for (const item of items) {
    const tr = document.createElement("tr");
    columns.forEach(key => {
      const td = document.createElement("td");
      td.textContent = item[key] ?? "";
      tr.appendChild(td);
    });
    frag.appendChild(tr);
  }
  $("rows").appendChild(frag);
}

async function fetchPage() {
  const token = $("token").value.trim();
  if (!token) { setStatus("Wpisz token API.", true); return; }
  const endpoint = $("endpoint").value;

  $("load").disabled = true;
  $("more").disabled = true;
  setStatus("Pobieranie danych…");

  try {
    const res = await fetch(`${BASE}${endpoint}?limit=${LIMIT}&offset=${offset}`, {
      headers: { token }
    });
    if (!res.ok) {
      throw new Error(res.status === 400 || res.status === 401 || res.status === 403
        ? "Nieprawidłowy token API."
        : `Błąd serwera: ${res.status}`);
    }
    const data = await res.json();
    const results = data.results || [];
    total = data.metadata?.resultset?.count ?? total;

    if (offset === 1) {
      if (!results.length) { setStatus("Brak wyników."); return; }
      buildHead(endpoint, results[0]);
    }
    addRows(results);
    offset += results.length;

    const loaded = offset - 1;
    setStatus(`Wczytano ${loaded}${total ? " z " + total : ""} rekordów.`);
    $("more").disabled = !(results.length === LIMIT && (!total || loaded < total));
  } catch (err) {
    setStatus(err.message || "Nie udało się pobrać danych.", true);
    $("more").disabled = offset === 1;
  } finally {
    $("load").disabled = false;
  }
}

$("load").addEventListener("click", () => {
  offset = 1;
  total = null;
  $("head").replaceChildren();
  $("rows").replaceChildren();
  fetchPage();
});
$("more").addEventListener("click", fetchPage);
$("token").addEventListener("keydown", e => { if (e.key === "Enter") $("load").click(); });