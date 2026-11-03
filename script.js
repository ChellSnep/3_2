const API = "https://www.ncei.noaa.gov/cdo-web/api/v2/stations";
const LIMIT = 1000;            
let offset = 1;                
let total = null;

const $ = id => document.getElementById(id);
const statusEl = $("status");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

function addRows(stations) {
  const frag = document.createDocumentFragment();
  for (const s of stations) {
    const tr = document.createElement("tr");
    const cells = [s.id, s.name, s.latitude, s.longitude];
    cells.forEach((value, i) => {
      const td = document.createElement("td");
      td.textContent = value ?? "";
      if (i >= 2) td.className = "num";
      tr.appendChild(td);
    });
    frag.appendChild(tr);
  }
  $("rows").appendChild(frag);
}

async function fetchPage() {
  const token = $("token").value.trim();
  if (!token) { setStatus("Wpisz token API.", true); return; }

  $("load").disabled = true;
  $("more").disabled = true;
  setStatus("Pobieranie danych…");

  try {
    const res = await fetch(`${API}?limit=${LIMIT}&offset=${offset}`, {
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

    addRows(results);
    offset += results.length;

    const loaded = offset - 1;
    setStatus(`Wczytano ${loaded}${total ? " z " + total : ""} stacji.`);
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
  $("rows").replaceChildren();
  fetchPage();
});
$("more").addEventListener("click", fetchPage);
$("token").addEventListener("keydown", e => { if (e.key === "Enter") $("load").click(); });