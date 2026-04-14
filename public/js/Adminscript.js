let state = {
  queue: [],
  current: null,
  served: 0,
  skipped: 0,
  counters: { general: 1, support: 1, priority: 1, complaint: 1 },
  log: [],
  clinicOpen: true,
};

const AVG_SERVICE_MINS = 5;

const SERVICE_PREFIX = {
  general: "G",
  support: "S",
  priority: "P",
  complaint: "C",
};

function load() {
  const saved = localStorage.getItem("queueflow_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      if (!state.counters) {
        state.counters = { general: 1, support: 1, priority: 1, complaint: 1 };
      }
    } catch (e) { }
  }
  render();
}

function save() {
  localStorage.setItem("queueflow_state", JSON.stringify(state));
}

function addLog(type, message) {
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  state.log.unshift({ type, message, time });
  if (state.log.length > 30) state.log.pop();
}

function addToQueue() {
  if (!state.clinicOpen) {
    showToast("Clinic is closed — no new entries allowed");
    return;
  }
  const nameEl = document.getElementById("inp-name");
  const serviceEl = document.getElementById("inp-service");
  const name = nameEl.value.trim();
  if (!name) {
    showToast("Please enter a name");
    nameEl.focus();
    return;
  }

  const service = serviceEl.value;
  const prefix = SERVICE_PREFIX[service] || "T";
  const num = state.counters[service] || 1;
  const ticket = prefix + String(num).padStart(3, "0");
  state.counters[service] = num + 1;

  const entry = {
    id: Date.now(),
    ticket,
    name,
    service,
    addedAt: Date.now(),
  };
  state.queue.push(entry);
  addLog("added", `${entry.ticket} — ${name} added`);
  nameEl.value = "";
  save();
  render();
  showToast(`${entry.ticket} added to queue`);
}

function callNext() {
  if (state.current) {
    const ok = confirm(
      `Skip ${state.current.ticket} — ${state.current.name} and call the next person?`,
    );
    if (!ok) return;
    state.skipped++;
    addLog(
      "skipped",
      `${state.current.ticket} — ${state.current.name} skipped`,
    );
  }
  if (state.queue.length === 0) {
    state.current = null;
    save();
    render();
    showToast("Queue is empty");
    return;
  }
  state.current = state.queue.shift();
  addLog(
    "serving",
    `${state.current.ticket} — ${state.current.name} now serving`,
  );
  save();
  render();
  showToast(`Now serving ${state.current.ticket}`);
}

function markServed() {
  if (!state.current) return;
  addLog("served", `${state.current.ticket} — ${state.current.name} served`);
  state.served++;
  state.current = null;
  save();
  render();
  showToast("Marked as served");
}

function serveNow(id) {
  const idx = state.queue.findIndex((e) => e.id === id);
  if (idx === -1) return;

  if (state.current) {
    state.queue.unshift(state.current);
    addLog(
      "skipped",
      `${state.current.ticket} — ${state.current.name} returned to queue`,
    );
  }

  const entry = state.queue.splice(idx, 1)[0];
  state.current = entry;
  addLog("serving", `${entry.ticket} — ${entry.name} now serving`);
  save();
  render();
  showToast(`Now serving ${entry.ticket} — ${entry.name}`);
}

function removeFromQueue(id) {
  const idx = state.queue.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const entry = state.queue[idx];
  state.queue.splice(idx, 1);
  addLog("skipped", `${entry.ticket} — ${entry.name} removed`);
  save();
  render();
  showToast(`${entry.ticket} removed`);
}

function clearAll() {
  if (!confirm("Clear entire queue and reset counters?")) return;
  state.skipped += state.queue.length;
  state.queue.forEach((e) =>
    addLog("skipped", `${e.ticket} — ${e.name} removed`),
  );
  state.queue = [];
  state.current = null;
  state.served = 0;
  state.skipped = 0;
  state.counters = { general: 1, support: 1, priority: 1, complaint: 1 };
  save();
  render();
  showToast("Queue cleared and reset");
}

function toggleClinicStatus() {
  state.clinicOpen = !state.clinicOpen;
  const label = state.clinicOpen ? "open" : "closed";
  addLog(state.clinicOpen ? "added" : "skipped", `Clinic is now ${label}`);
  save();
  renderClinicStatus();
  showToast(`Clinic is now ${label}`);
}

function renderClinicStatus() {
  const dot = document.getElementById("clinic-status-dot");
  const text = document.getElementById("clinic-status-text");
  const btn = document.getElementById("status-toggle-btn");
  const addCard = document.querySelector(".add-card");

  if (state.clinicOpen) {
    dot.style.background = "var(--green)";
    text.textContent = "Open";
    btn.textContent = "Set to Closed";
    btn.className = "status-toggle-btn status-toggle--open";
    addCard.classList.remove("is-closed");
  } else {
    dot.style.background = "#b32626";
    text.textContent = "Closed";
    btn.textContent = "Set to Open";
    btn.className = "status-toggle-btn status-toggle--closed";
    addCard.classList.add("is-closed");
  }
}

function clearLog() {
  state.log = [];
  save();
  renderLog();
}

function render() {
  renderServing();
  renderQueue();
  renderLog();
  renderStats();
  renderClinicStatus();
  document.getElementById("session-date").textContent =
    new Date().toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
}

function renderServing() {
  const ticketEl = document.getElementById("now-ticket");
  const nameEl = document.getElementById("now-name");
  const serviceEl = document.getElementById("now-service");
  const nextBtn = document.getElementById("btn-next");
  const servedBtn = document.getElementById("btn-served");

  const labelEl = document.querySelector(".serving-label");

  ticketEl.classList.remove("general", "support", "priority", "complaint");

  if (state.current) {
    ticketEl.textContent = state.current.ticket;
    ticketEl.classList.remove("empty");
    ticketEl.classList.add(state.current.service);
    nameEl.textContent = state.current.name;
    nameEl.style.opacity = "1";
    serviceEl.textContent = capitalize(state.current.service);
    if (labelEl) labelEl.textContent = "Now serving";
    if (servedBtn) servedBtn.disabled = false;
  } else {
    ticketEl.textContent = "---";
    ticketEl.classList.add("empty");
    nameEl.textContent = "Not yet joined";
    nameEl.style.opacity = "0.3";
    serviceEl.textContent = "";
    if (labelEl) labelEl.textContent = "Complete the form to join";
    if (servedBtn) servedBtn.disabled = true;
  }

  if (nextBtn) {
    nextBtn.disabled = state.queue.length === 0 && !state.current;
    nextBtn.textContent = state.current ? "Skip — Call Next" : "Call Next";
  }
}

function renderQueue() {
  const list = document.getElementById("queue-list");
  list.innerHTML = "";

  if (state.queue.length === 0) {
    list.innerHTML = `
      <li class="empty-state" id="empty-state">
        <div class="empty-icon">◻</div>
        <p>Queue is empty. Add someone above.</p>
      </li>`;
    return;
  }

  state.queue.forEach((entry, i) => {
    const li = document.createElement("li");
    li.className = "queue-item";
    const waited = Math.floor((Date.now() - entry.addedAt) / 60000);
    li.innerHTML = `
        <div class="ticket-badge">${entry.ticket}</div>
        <div class="item-info">
          <div class="item-name">${escHtml(entry.name)}</div>
          <div class="item-meta">Position ${i + 1} &middot; Waited ${waited}m</div>
        </div>
        <span class="service-pill ${entry.service}">${capitalize(entry.service)}</span>
        <button class="btn-serve-now" title="Serve now" onclick="serveNow(${entry.id})">Serve Now</button>
        <button class="btn-remove" title="Remove" onclick="removeFromQueue(${entry.id})">&#x2715;</button>
      `;
    list.appendChild(li);
  });
}

function renderLog() {
  const list = document.getElementById("log-list");
  if (!list) return;
  if (state.log.length === 0) {
    list.innerHTML =
      '<li class="log-item"><span class="log-dot" style="background:var(--border)"></span>No activity yet</li>';
    return;
  }
  list.innerHTML = state.log
    .map((l) => {
      const dotClass =
        l.type === "served"
          ? "served"
          : l.type === "skipped"
            ? "skipped"
            : "added";
      return `<li class="log-item"><span class="log-dot ${dotClass}"></span>${escHtml(l.message)}<span class="log-time">${l.time}</span></li>`;
    })
    .join("");
}

function renderStats() {
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setEl("stat-waiting", state.queue.length);
  setEl("stat-served", state.served);
  setEl("stat-skipped", state.skipped);
  setEl("stat-in-queue", state.queue.length);
  const mins = state.queue.length * AVG_SERVICE_MINS;
  setEl(
    "stat-est-wait",
    mins >= 60 ? Math.floor(mins / 60) + "h " + (mins % 60) + "m" : mins + "m",
  );
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

setInterval(() => {
  renderQueue();
  renderStats();
}, 30000);

load();


//this is my change.
let logout = document.getElementById('btn-logout');


window.addEventListener('DOMContentLoaded', async () => {
  console.log('i am calling status');
  const res = await fetch('/api/admin/status');
  const data = await res.json();

  if (data.queued) {
    departmentId = data.department_id;
    show(data.code, data.ahead);
    startPolling();
  }
});

logout.addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    await fetch('/logout', {
      method: 'POST',
      credentials: 'include'
    });

    window.location.href = '/login.html';
  } catch (err) {
    console.error('Logout failed', err);
  }
});

function renderQueueList(data) {
  const list = document.getElementById('queue-list');
  list.innerHTML = '';

  if (data.length == 0) {
    list.innerHTML = '<li class="empty-state">No patients waiting</li>';
    return;
  }

  console.log(data);

  data.forEach(q => {
    const li = document.createElement('li');
    li.textContent = `${q.code} - ${q.full_name}`;
    li.classList.add('queue-item');
    list.appendChild(li);
  });
}

async function loadQueue(departmentId) {
  if (!departmentId) return;
  const res = await fetch(`/api/admin/${departmentId}`);
  const data = await res.json();

  if (!res.ok) return;

  renderQueueList(data);
}

let poller = null;
function startPolling() {

  if (!departmentId) return;

  loadQueue(departmentId);

  if (poller) clearInterval(poller);

  poller = setInterval(() => {
    loadQueue(departmentId);
  }, 30000);

}
