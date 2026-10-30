const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const entries = document.querySelector("#entries");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty");
const cards = [...document.querySelectorAll(".category-card")];
let items = [];

async function loadCatalog() {
  try {
    const response = await fetch("data/assets.json");
    if (!response.ok) throw new Error("Não foi possível carregar o catálogo.");

    const data = await response.json();
    items = Array.isArray(data) ? data : (data.items || []);
    render();
  } catch (error) {
    count.textContent = "Catálogo indisponível";
    empty.classList.remove("hidden");
    empty.textContent = "Não foi possível carregar data/assets.json. Verifique os arquivos.";
  }
}

function render() {
  const term = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const category = categorySelect.value;

  const filtered = items.filter(item => {
    const text = `${item.name} ${item.category} ${item.description}`.toLocaleLowerCase("pt-BR");
    return (category === "all" || item.category === category) && text.includes(term);
  });

  entries.innerHTML = filtered.map(item => `
    <article class="entry">
      <div class="entry-visual">
        ${item.image
          ? `<img src="${safeUrl(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">`
          : escapeHtml(item.icon || "✧")}
      </div>
      <div class="entry-body">
        <span class="entry-meta">${escapeHtml(item.category || "Sem categoria")}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description || "Sem descrição cadastrada.")}</p>
        ${item.source_url ? `<a href="${safeUrl(item.source_url)}" target="_blank" rel="noopener">Consultar fonte ↗</a>` : ""}
      </div>
    </article>`).join("");

  count.textContent = `${filtered.length} ${filtered.length === 1 ? "entrada" : "entradas"}`;
  empty.classList.toggle("hidden", filtered.length !== 0);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}

function safeUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return ["https:", "http:"].includes(url.protocol) ? escapeHtml(url.href) : "#";
  } catch {
    return "#";
  }
}

searchInput.addEventListener("input", render);

categorySelect.addEventListener("change", () => {
  cards.forEach(card => card.classList.toggle("selected", card.dataset.filter === categorySelect.value));
  render();
});

cards.forEach(card => card.addEventListener("click", () => {
  categorySelect.value = card.dataset.filter;
  cards.forEach(other => other.classList.toggle("selected", other === card));
  render();
}));

loadCatalog();
