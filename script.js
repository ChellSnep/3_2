const API = "/api/data"; 

const $ = id => document.getElementById(id);
const statusEl = $("status");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

function render(results) {
  const columns = Object.keys(results[0]);

  const headRow = document.createElement("tr");
  columns.forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    headRow.appendChild(th);
  });
  $("head").replaceChildren(headRow);

  const frag = document.createDocumentFragment();
  for (const item of results) {
    const tr = document.createElement("tr");
    columns.forEach(key => {
      const td = document.createElement("td");
      td.textContent = item[key] ?? "";
      tr.appendChild(td);
    });
    frag.appendChild(tr);
  }
  $("rows").replaceChildren(frag);
}

$("form").addEventListener("submit", async e => {
  e.preventDefault();

  const params = new URLSearchParams();
  ["datasetid", "locationid", "datatypeid", "startdate", "enddate", "limit"].forEach(name => {
    const value = $(name).value.trim();
    if (value) params.set(name, value);
  });

  $("load").disabled = true;
  $("head").replaceChildren();
  $("rows").replaceChildren();
  setStatus("Pobieranie danych…");

  try {
    const res = await fetch(`${API}?${params}`, {
      headers: { token: $("token").value.trim() }
    });
    if (res.status === 502) {
      throw new Error((await res.json()).error);
    }
    if (!res.ok) {
      throw new Error(res.status === 400
        ? "Błędne parametry zapytania lub token (zakres dat to maks. 1 rok)."
        : `Błąd serwera: ${res.status}`);
    }
    const data = await res.json();
    const results = data.results || [];
    if (!results.length) { setStatus("Brak wyników dla podanych parametrów."); return; }

    render(results);
    const total = data.metadata?.resultset?.count;
    setStatus(`Wczytano ${results.length}${total ? " z " + total : ""} rekordów.`);
  } catch (err) {
    setStatus(err.message || "Nie udało się pobrać danych.", true);
  } finally {
    $("load").disabled = false;
  }
});