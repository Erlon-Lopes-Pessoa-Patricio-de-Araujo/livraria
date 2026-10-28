/**
 * 📚 Livraria — Frontend Application
 * Handles API communication, DOM rendering, and user interactions.
 */

const API = "/api";

// ── DOM References ──────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    sidebar: $("#sidebar"),
    menuToggle: $("#menu-toggle"),
    navButtons: $$(".nav-btn"),
    views: $$(".view"),
    pageTitle: $("#page-title"),
    searchWrapper: $("#search-wrapper"),
    searchInput: $("#search-input"),
    // Stats
    statTotalLivros: $("#stat-total-livros"),
    statTotalAutores: $("#stat-total-autores"),
    statTotalUnidades: $("#stat-total-unidades"),
    statValorTotal: $("#stat-valor-total"),
    // Tables
    dashboardBody: $("#dashboard-table-body"),
    livrosBody: $("#livros-table-body"),
    autoresBody: $("#autores-table-body"),
    // Modal
    modalOverlay: $("#modal-overlay"),
    modalTitle: $("#modal-title"),
    modalForm: $("#modal-form"),
    modalClose: $("#modal-close"),
    modalCancel: $("#modal-cancel"),
    modalSubmit: $("#modal-submit"),
    // Buttons
    btnAddLivro: $("#btn-add-livro"),
    btnAddAutor: $("#btn-add-autor"),
    // Toast
    toastContainer: $("#toast-container"),
};

// ── State ───────────────────────────────────────────────────────────────
let autoresCache = [];
let currentView = "dashboard";
let searchTimeout = null;

// ═══════════════════════════════════════════════════════════════════════════
//  API HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function apiFetch(endpoint, options = {}) {
    try {
        const res = await fetch(`${API}${endpoint}`, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        if (res.status === 204) return null;
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Erro ${res.status}`);
        }
        return res.json();
    } catch (e) {
        toast(e.message || "Erro de conexão", "error");
        throw e;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

function toast(message, type = "info") {
    const icons = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
    };
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span>${icons[type] || ""}</span><span>${message}</span>`;
    dom.toastContainer.appendChild(el);

    setTimeout(() => {
        el.classList.add("leaving");
        el.addEventListener("animationend", () => el.remove());
    }, 3500);
}

// ═══════════════════════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════

const viewTitles = {
    dashboard: "Dashboard",
    livros: "Catálogo de Livros",
    autores: "Autores",
};

function switchView(view) {
    currentView = view;
    dom.navButtons.forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    dom.views.forEach((v) => v.classList.toggle("active", v.id === `view-${view}`));
    dom.pageTitle.textContent = viewTitles[view] || "";
    dom.searchWrapper.style.display = view === "livros" ? "flex" : "none";

    // Close sidebar on mobile
    dom.sidebar.classList.remove("open");

    // Load data for the active view
    if (view === "dashboard") loadDashboard();
    else if (view === "livros") loadLivros();
    else if (view === "autores") loadAutores();
}

dom.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
});

dom.menuToggle.addEventListener("click", () => {
    dom.sidebar.classList.toggle("open");
});

// Close sidebar on outside click (mobile)
document.addEventListener("click", (e) => {
    if (
        dom.sidebar.classList.contains("open") &&
        !dom.sidebar.contains(e.target) &&
        e.target !== dom.menuToggle
    ) {
        dom.sidebar.classList.remove("open");
    }
});

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

async function loadDashboard() {
    const [stats, livros] = await Promise.all([
        apiFetch("/stats"),
        apiFetch("/livros"),
    ]);

    // Animate stat numbers
    animateValue(dom.statTotalLivros, stats.total_livros);
    animateValue(dom.statTotalAutores, stats.total_autores);
    animateValue(dom.statTotalUnidades, stats.total_unidades);
    dom.statValorTotal.textContent = formatCurrency(stats.valor_total_estoque);

    // Recent books (last 5)
    const recent = livros.slice(-5).reverse();
    dom.dashboardBody.innerHTML = recent.length
        ? recent
              .map(
                  (l) => `
        <tr>
            <td>${esc(l.titulo)}</td>
            <td>${esc(l.autor_nome)}</td>
            <td>${l.ano_publicacao || "—"}</td>
            <td>${formatCurrency(l.preco)}</td>
            <td><span class="stock-badge">${l.estoque}</span></td>
        </tr>`
              )
              .join("")
        : `<tr class="empty-row"><td colspan="5">Nenhum livro cadastrado ainda.</td></tr>`;
}

function animateValue(el, target) {
    const start = parseInt(el.textContent) || 0;
    const diff = target - start;
    const duration = 600;
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.round(start + diff * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIVROS
// ═══════════════════════════════════════════════════════════════════════════

async function loadLivros(busca = "") {
    const query = busca ? `?busca=${encodeURIComponent(busca)}` : "";
    const livros = await apiFetch(`/livros${query}`);
    renderLivros(livros);
}

function renderLivros(livros) {
    dom.livrosBody.innerHTML = livros.length
        ? livros
              .map(
                  (l) => `
        <tr>
            <td>${l.id}</td>
            <td><strong>${esc(l.titulo)}</strong></td>
            <td>${esc(l.autor_nome)}</td>
            <td>${l.ano_publicacao || "—"}</td>
            <td>${formatCurrency(l.preco)}</td>
            <td>${l.estoque}</td>
            <td>
                <div class="action-group">
                    <button class="btn-icon" title="Editar" onclick="editLivro(${l.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon--danger" title="Remover" onclick="deleteLivro(${l.id}, '${esc(l.titulo)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>`
              )
              .join("")
        : `<tr class="empty-row"><td colspan="7">Nenhum livro encontrado.</td></tr>`;
}

// Search
dom.searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadLivros(dom.searchInput.value.trim()), 350);
});

// ═══════════════════════════════════════════════════════════════════════════
//  AUTORES
// ═══════════════════════════════════════════════════════════════════════════

async function loadAutores() {
    autoresCache = await apiFetch("/autores");
    renderAutores(autoresCache);
}

function renderAutores(autores) {
    dom.autoresBody.innerHTML = autores.length
        ? autores
              .map(
                  (a) => `
        <tr>
            <td>${a.id}</td>
            <td><strong>${esc(a.nome)}</strong></td>
            <td>${esc(a.nacionalidade || "—")}</td>
            <td>
                <div class="action-group">
                    <button class="btn-icon" title="Editar" onclick="editAutor(${a.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon--danger" title="Remover" onclick="deleteAutor(${a.id}, '${esc(a.nome)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>`
              )
              .join("")
        : `<tr class="empty-row"><td colspan="4">Nenhum autor cadastrado.</td></tr>`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════════════════════════

function openModal(title, formHTML, onSubmit) {
    dom.modalTitle.textContent = title;
    dom.modalForm.innerHTML = formHTML;
    dom.modalOverlay.classList.add("open");
    dom.modalSubmit.onclick = async () => {
        try {
            await onSubmit();
            closeModal();
        } catch (_) {
            /* toast already shown */
        }
    };
    // Focus first input
    setTimeout(() => {
        const firstInput = dom.modalForm.querySelector("input, select");
        if (firstInput) firstInput.focus();
    }, 100);
}

function closeModal() {
    dom.modalOverlay.classList.remove("open");
}

dom.modalClose.addEventListener("click", closeModal);
dom.modalCancel.addEventListener("click", closeModal);
dom.modalOverlay.addEventListener("click", (e) => {
    if (e.target === dom.modalOverlay) closeModal();
});

// Close modal on Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

// ═══════════════════════════════════════════════════════════════════════════
//  LIVRO CRUD MODALS
// ═══════════════════════════════════════════════════════════════════════════

function getAutorOptions(selectedId = null) {
    return autoresCache
        .map(
            (a) =>
                `<option value="${a.id}" ${a.id === selectedId ? "selected" : ""}>${esc(a.nome)}</option>`
        )
        .join("");
}

dom.btnAddLivro.addEventListener("click", async () => {
    // Ensure we have autores loaded
    if (!autoresCache.length) autoresCache = await apiFetch("/autores");
    if (!autoresCache.length) {
        toast("Cadastre um autor antes de adicionar livros.", "error");
        return;
    }

    openModal(
        "Novo Livro",
        `
        <div class="form-group"><label for="f-titulo">Título</label><input id="f-titulo" placeholder="Ex: Dom Casmurro" required></div>
        <div class="form-group"><label for="f-autor">Autor</label><select id="f-autor">${getAutorOptions()}</select></div>
        <div class="form-group"><label for="f-ano">Ano de Publicação</label><input id="f-ano" type="number" placeholder="1899"></div>
        <div class="form-group"><label for="f-preco">Preço (R$)</label><input id="f-preco" type="number" step="0.01" min="0" placeholder="39.90" required></div>
        <div class="form-group"><label for="f-estoque">Estoque</label><input id="f-estoque" type="number" min="0" value="0"></div>
    `,
        async () => {
            const titulo = $("#f-titulo").value.trim();
            const autor_id = parseInt($("#f-autor").value);
            const ano = $("#f-ano").value ? parseInt($("#f-ano").value) : null;
            const preco = parseFloat($("#f-preco").value);
            const estoque = parseInt($("#f-estoque").value) || 0;

            if (!titulo) { toast("Título é obrigatório.", "error"); throw new Error(); }
            if (isNaN(preco) || preco < 0) { toast("Preço inválido.", "error"); throw new Error(); }

            await apiFetch("/livros", {
                method: "POST",
                body: JSON.stringify({ titulo, autor_id, ano_publicacao: ano, preco, estoque }),
            });
            toast("Livro cadastrado com sucesso!", "success");
            loadLivros();
        }
    );
});

window.editLivro = async (id) => {
    const livro = await apiFetch(`/livros/${id}`);
    if (!autoresCache.length) autoresCache = await apiFetch("/autores");

    openModal(
        "Editar Livro",
        `
        <div class="form-group"><label for="f-titulo">Título</label><input id="f-titulo" value="${esc(livro.titulo)}"></div>
        <div class="form-group"><label for="f-autor">Autor</label><select id="f-autor">${getAutorOptions(livro.autor_id)}</select></div>
        <div class="form-group"><label for="f-ano">Ano de Publicação</label><input id="f-ano" type="number" value="${livro.ano_publicacao || ""}"></div>
        <div class="form-group"><label for="f-preco">Preço (R$)</label><input id="f-preco" type="number" step="0.01" min="0" value="${livro.preco}"></div>
        <div class="form-group"><label for="f-estoque">Estoque</label><input id="f-estoque" type="number" min="0" value="${livro.estoque}"></div>
    `,
        async () => {
            const body = {};
            const titulo = $("#f-titulo").value.trim();
            const autor_id = parseInt($("#f-autor").value);
            const ano = $("#f-ano").value ? parseInt($("#f-ano").value) : null;
            const preco = parseFloat($("#f-preco").value);
            const estoque = parseInt($("#f-estoque").value);

            if (titulo !== livro.titulo) body.titulo = titulo;
            if (autor_id !== livro.autor_id) body.autor_id = autor_id;
            if (ano !== livro.ano_publicacao) body.ano_publicacao = ano;
            if (preco !== livro.preco) body.preco = preco;
            if (estoque !== livro.estoque) body.estoque = estoque;

            if (!Object.keys(body).length) { toast("Nenhuma alteração.", "info"); return; }

            await apiFetch(`/livros/${id}`, { method: "PUT", body: JSON.stringify(body) });
            toast("Livro atualizado!", "success");
            loadLivros();
        }
    );
};

window.deleteLivro = async (id, titulo) => {
    if (!confirm(`Remover "${titulo}"?`)) return;
    await apiFetch(`/livros/${id}`, { method: "DELETE" });
    toast("Livro removido.", "success");
    loadLivros();
};

// ═══════════════════════════════════════════════════════════════════════════
//  AUTOR CRUD MODALS
// ═══════════════════════════════════════════════════════════════════════════

dom.btnAddAutor.addEventListener("click", () => {
    openModal(
        "Novo Autor",
        `
        <div class="form-group"><label for="f-nome">Nome</label><input id="f-nome" placeholder="Ex: Machado de Assis" required></div>
        <div class="form-group"><label for="f-nacionalidade">Nacionalidade</label><input id="f-nacionalidade" placeholder="Ex: Brasileiro"></div>
    `,
        async () => {
            const nome = $("#f-nome").value.trim();
            const nacionalidade = $("#f-nacionalidade").value.trim() || null;
            if (!nome) { toast("Nome é obrigatório.", "error"); throw new Error(); }

            await apiFetch("/autores", {
                method: "POST",
                body: JSON.stringify({ nome, nacionalidade }),
            });
            toast("Autor cadastrado!", "success");
            loadAutores();
        }
    );
});

window.editAutor = async (id) => {
    const autor = await apiFetch(`/autores/${id}`);
    openModal(
        "Editar Autor",
        `
        <div class="form-group"><label for="f-nome">Nome</label><input id="f-nome" value="${esc(autor.nome)}"></div>
        <div class="form-group"><label for="f-nacionalidade">Nacionalidade</label><input id="f-nacionalidade" value="${esc(autor.nacionalidade || "")}"></div>
    `,
        async () => {
            const body = {};
            const nome = $("#f-nome").value.trim();
            const nac = $("#f-nacionalidade").value.trim() || null;

            if (nome !== autor.nome) body.nome = nome;
            if (nac !== autor.nacionalidade) body.nacionalidade = nac;

            if (!Object.keys(body).length) { toast("Nenhuma alteração.", "info"); return; }

            await apiFetch(`/autores/${id}`, { method: "PUT", body: JSON.stringify(body) });
            toast("Autor atualizado!", "success");
            loadAutores();
        }
    );
};

window.deleteAutor = async (id, nome) => {
    if (!confirm(`Remover o autor "${nome}"? Isso só funciona se ele não possuir livros vinculados.`)) return;
    await apiFetch(`/autores/${id}`, { method: "DELETE" });
    toast("Autor removido.", "success");
    loadAutores();
};

// ═══════════════════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function esc(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

// ═══════════════════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════════════════

(async () => {
    // Pre-load autores cache
    try {
        autoresCache = await apiFetch("/autores");
    } catch (_) {}
    loadDashboard();
})();
