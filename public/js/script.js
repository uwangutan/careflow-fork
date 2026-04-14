let index = document.getElementById('indexFlow');
let patient = document.getElementById('patientFlow');

if (index) {

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  $$(".feature-list li").forEach(item => {
    item.addEventListener("click", () => {
      $$(".feature-list li").forEach(i => i.classList.remove("active-feature"));
      item.classList.add("active-feature");

      const page = item.dataset.page;

      $$(".page").forEach(p => p.classList.add("hidden"));
      $("#page-" + page).classList.remove("hidden");

      $("#page-title").textContent =
        page === "dashboard" ? "Queue Dashboard" : "Settings";
    });
  });

  const backdrop = $("#modal-backdrop");

  function openModal(id) {
    backdrop.classList.remove("hidden");
    $("#" + id).classList.remove("hidden");
  }

  function closeModal(id) {
    backdrop.classList.add("hidden");
    $("#" + id).classList.add("hidden");
  }

  $("#btn-add-patient-open").onclick = () => openModal("modal-add-patient");
  $("#btn-quick-add-open").onclick = () => openModal("modal-quick-add");
  $("#btn-emergency-open").onclick = () => openModal("modal-emergency");

  $$(".modal-close, [data-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.modal;
      closeModal(id);
    });
  });

  backdrop.onclick = () => {
    $$(".modal").forEach(m => m.classList.add("hidden"));
    backdrop.classList.add("hidden");
  };

  let selectedCategory = null;

  $$(".cat-btn").forEach(btn => {
    btn.onclick = () => {
      $$(".cat-btn").forEach(b => b.classList.remove("active-cat"));
      btn.classList.add("active-cat");

      selectedCategory = btn.dataset.prefix;

      $("#preview-code").textContent = selectedCategory + "001";
      $("#preview-sub").textContent = "Next available code";
    };
  });

  $$(".visit-btn").forEach(btn => {
    btn.onclick = () => {
      $$(".visit-btn").forEach(b => b.classList.remove("active-visit"));
      btn.classList.add("active-visit");
    };
  });

  $$(".mode-btn").forEach(btn => {
    btn.onclick = () => {
      $$(".mode-btn").forEach(b => b.classList.remove("active-mode"));
      btn.classList.add("active-mode");
    };
  });




  $("#filter-btn").onclick = () => {
    $("#filter-menu").classList.toggle("hidden");
  };

  $$(".filter-option").forEach(opt => {
    opt.onclick = () => {
      $$(".filter-option").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");

      $("#filter-btn").innerHTML = `
        <span class="material-symbols-outlined">filter_list</span>
        Filter: ${opt.textContent}
        <span class="material-symbols-outlined">arrow_drop_down</span>
      `;

      $("#filter-menu").classList.add("hidden");
    };
  });




  $("#queue-search").addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();

    $$("#queue-table tbody tr").forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(val) ? "" : "none";
    });
  });




  const status = $("#queue-status");

  status.querySelectorAll("div").forEach(btn => {
    btn.onclick = () => {
      status.dataset.status = btn.dataset.value;
    };
  });




  $("#btn-call-next").onclick = () => {
    const code = $("#current-queue").textContent;
    const name = $("#serving-name").textContent;

    showToast("toast-calling", `${code} — ${name}`);
  };




  function showToast(id, msg) {
    const toast = $("#" + id);
    if (msg) {
      const el = toast.querySelector(".toast-msg");
      if (el) el.textContent = msg;
    }

    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }




  let voidTarget = null;

  $$("[data-action='void']").forEach(btn => {
    btn.onclick = () => {
      voidTarget = btn.closest("tr");

      $("#void-patient-label").textContent = btn.dataset.name;
      openModal("modal-void");
    };
  });

  $("#btn-confirm-void").onclick = () => {
    if (voidTarget) {
      voidTarget.remove();
      voidTarget = null;
    }
    closeModal("modal-void");
  };




  $$(".banner-close").forEach(btn => {
    btn.onclick = () => {
      $("#" + btn.dataset.target).classList.add("hidden");
    };
  });




  $$(".counter-tab").forEach(tab => {
    tab.onclick = () => {
      $$(".counter-tab").forEach(t => t.classList.remove("active-tab"));
      tab.classList.add("active-tab");

      const counter = tab.dataset.counter;

      $$(".counter-card").forEach(card => {
        if (counter === "all" || card.dataset.counter === counter) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    };
  });

  let logout = document.getElementById('btn-logout');

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
  })
}

if (patient) {
  let departmentId;
  const addQueueForm = document.getElementById('add-queue-form');
  const completeFormPrompt = document.getElementById('completeFormLabel');
  const nowTicket = document.getElementById('now-ticket');
  const nowName = document.getElementById('now-name');
  const aheadStatus = document.getElementById('stat-in-queue');

  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  window.addEventListener('DOMContentLoaded', async () => {
    console.log('i am calling status');
    const res = await fetch('/api/queue/status');
    const data = await res.json();

    if (data.queued) {
      departmentId = data.department_id;
      show(data.code, data.ahead);
      startPolling();
    } else {
      form();
    }
  });

  function form() {

    addQueueForm.addEventListener('submit', async (e) => {

      e.preventDefault();
      const patientName = addQueueForm.name.value;
      const serviceType = addQueueForm.serviceType.value;
      const concern = addQueueForm.concern.value;

      try {
        const res = await fetch('/api/queue/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientName, serviceType, concern })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error);
          showToast(data.error || 'Failed');
          return;
        }
        showToast(`Queued: ${data.code}`);
        show(data.code, data.ahead);
        console.log(data.department_id);
        departmentId = data.department_id;
        startPolling();


      } catch (err) {
        showToast('Server error');
      }

      showToast('Successfully submitted');

    });
  }

  function show(data, ahead) {
    completeFormPrompt.classList.add('hidden');
    addQueueForm.classList.add('hidden');
    nowTicket.textContent = data;
    nowName.textContent = 'Joined';
    aheadStatus.textContent = ahead;
  }

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
      li.textContent = `${q.code}`;
      li.classList.add('queue-item');
      list.appendChild(li);
    });
  }

  async function loadQueue(departmentId) {
    if (!departmentId) return;
    const res = await fetch(`/api/queue/${departmentId}`);
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
    }, 3000);

  }


/* === START OF ADDED SCRIPT ===
Details:

*/

// ─── DATA ───
const departments = [
  { id:'genmed', name:'Gen Med / Internal Medicine', type:'patient-care', queue:18, color:'#e8f7f2' },
  { id:'birthing', name:'Birthing / OB-GYN', type:'patient-care', queue:7, color:'#fef3f2' },
  { id:'geriatrics', name:'Geriatrics', type:'patient-care',  queue:12, color:'#eff6ff' },
  { id:'radiology', name:'Radiology', type:'laboratory', queue:5, color:'#fefce8' },
  { id:'pathology', name:'Clinical Pathology', type:'laboratory',  color:'#f0fdf4' },
  { id:'pharmacy', name:'Pharmacy', type:'support', queue:3, color:'#faf5ff' },
  { id:'cardiology', name:'Cardiology', type:'patient-care', queue:14, color:'#fff1f2' },
  { id:'neurology', name:'Neurology', type:'patient-care', queue:6, color:'#f0f4ff' },
];
 
const counters = [
  { room:'Room 1', num:'042', doctor:'Dr. Ana Santos', spec:'General Medicine', avg:'8 min' },
  { room:'Room 2', num:'039', doctor:'Dr. Marco Ramos', spec:'Internal Medicine', avg:'11 min' },
  { room:'Room 3', num:'041', doctor:'Dr. Liza Torres', spec:'General Practice', avg:'7 min' },
];
 
let patients = [
  { q:'042', name:'Imong Nawng', gender:'F', age:72, priority:'high', status:'serving', counter:'Room 1 — Dr. Santos', wait:'Serving now' },
  { q:'043', name:'Imong Mama', gender:'M', age:58, priority:'medium', status:'waiting', counter:'Room 1 — Dr. Santos', wait:'~8 min' },
  { q:'044', name:'Imong Tae', gender:'F', age:41, priority:'low', status:'waiting', counter:'Room 2 — Dr. Ramos', wait:'~14 min' },
  { q:'039', name:'Imong Betlog', gender:'M', age:67, priority:'medium', status:'waiting', counter:'Room 3 — Dr. Torres', wait:'~19 min' },
  { q:'045', name:'Rain', gender:'F', age:34, priority:'low', status:'waiting', counter:'Room 2 — Dr. Ramos', wait:'~22 min' },
  { q:'046', name:'SK Girl', gender:'M', age:80, priority:'high', status:'waiting', counter:'Room 1 — Dr. Santos', wait:'~27 min' },
  { q:'047', name:'Shaken', gender:'F', age:65, priority:'high', status:'waiting', counter:'Room 3 — Dr. Torres', wait:'~31 min' },
  { q:'048', name:'AJ Nicole', gender:'M', age:52, priority:'low', status:'waiting', counter:'Room 2 — Dr. Ramos', wait:'~36 min' },
];
 
let activeDept = 'genmed';
let activeFilter = 'all';
let searchVal = '';
 
// ─── RENDER DEPARTMENTS ───
function renderDepts() {
  const grid = document.getElementById('dept-grid');
  const filtered = departments.filter(d => {
    const matchType = activeFilter === 'all' || d.type === activeFilter;
    const matchSearch = d.name.toLowerCase().includes(searchVal.toLowerCase());
    return matchType && matchSearch;
  });
  grid.innerHTML = filtered.map(d => `
    <div class="dept-card" onclick="openDept('${d.id}','${d.name}')">
      <div class="dept-img" style="background:${d.color}">
        <div class="dept-img-bg">${d.emoji}</div>
      </div>
      <div class="dept-info">
        <div class="dept-name">${d.name}</div>
        <div class="dept-meta">
          <span class="dept-type ${d.type === 'laboratory' ? 'lab' : d.type === 'support' ? 'support' : ''}">${d.type.replace('-',' ')}</span>
          <span class="dept-queue">Queue: <span>${d.queue}</span></span>
        </div>
      </div>
    </div>
  `).join('');
}
 
function filterDepts(val) { searchVal = val; renderDepts(); }
function setFilter(f, el) {
  activeFilter = f;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderDepts();
}
 
// ─── PAGES ───
function showPage(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  document.querySelectorAll('.side-btn').forEach((b,i) => {
    b.classList.remove('active');
    if ((p === 'dept' && i === 0) || (p === 'queue' && i === 1)) b.classList.add('active');
  });
}
 
function openDept(id, name) {
  activeDept = id;
  document.getElementById('active-dept-name').textContent = name;
  showPage('queue');
  renderCounters();
  renderNextList();
  renderTable();
  switchTab('main', document.querySelector('.tab-btn'));
}
 
// ─── TABS ───
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}
 
// ─── COUNTERS ───
function renderCounters() {
  const row = document.getElementById('counters-row');
  row.innerHTML = counters.map((c,i) => `
    <div class="counter-card ${i===0?'active-counter':''}" onclick="selectCounter(${i},this)">
      <div class="counter-room">${c.room}</div>
      <div class="counter-num">${c.num}</div>
      <div class="counter-doctor">${c.doctor}</div>
      <div class="counter-spec">${c.spec}</div>
      <div class="counter-avg">Avg ${c.avg}/patient</div>
    </div>
  `).join('');
}
 
function selectCounter(i, el) {
  document.querySelectorAll('.counter-card').forEach(c => c.classList.remove('active-counter'));
  el.classList.add('active-counter');
}
 
// ─── NEXT LIST ───
function renderNextList() {
  const waiting = patients.filter(p => p.status === 'waiting').slice(0, 4);
  document.getElementById('next-list').innerHTML = waiting.map(p => `
    <div class="next-item">
      <div class="next-num">${p.q}</div>
      <div>
        <div class="next-pname">${p.name}</div>
        <div class="next-psub">${p.gender}${p.age} · ${p.wait}</div>
      </div>
      <span class="priority-chip ${p.priority}" style="margin-left:auto;font-size:11px">${p.priority}</span>
    </div>
  `).join('');
}
 
// ─── TABLE ───
function renderTable() {
  const sorted = [...patients].sort((a,b) => {
    const po = {high:0,medium:1,low:2};
    if (a.status === 'serving') return -1;
    if (b.status === 'serving') return 1;
    return po[a.priority] - po[b.priority];
  });
  document.getElementById('line-count').textContent = `(${patients.length} patients)`;
  document.getElementById('queue-tbody').innerHTML = sorted.map(p => `
    <tr>
      <td><span class="priority-chip ${p.priority}">${p.priority}</span></td>
      <td class="td-queue">${p.q}</td>
      <td style="font-weight:500">${p.name}</td>
      <td><span class="status-badge ${p.status}">${p.status}</span></td>
      <td style="font-size:13px;color:var(--text2)">${p.counter}</td>
      <td class="ai-wait"><strong>${p.wait}</strong></td>
      <td>
        <div class="action-btns">
          <button class="act-btn" onclick="callPatient('${p.q}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Call
          </button>
          <button class="act-btn del" onclick="deletePatient('${p.q}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Remove
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}
 
// ─── QUEUE ACTIONS ───
let qNum = 42;
function recallQueue() {
  showToast('Queue #0' + qNum + ' recalled — announcement sent');
}
function skipQueue() {
  qNum++;
  document.getElementById('q-number').textContent = '0' + qNum;
  const p = patients.find(p => parseInt(p.q) === qNum);
  if (p) {
    document.getElementById('q-name').textContent = p.name;
    document.getElementById('q-sub').textContent = p.gender + ' · ' + p.age + ' years';
    const pc = document.getElementById('q-priority');
    pc.className = 'priority-chip ' + p.priority;
    pc.textContent = p.priority.charAt(0).toUpperCase() + p.priority.slice(1);
  }
  showToast('Skipped to Queue #0' + qNum);
}
function callPatient(q) { showToast('Calling Queue #' + q + '…'); }
function deletePatient(q) {
  patients = patients.filter(p => p.q !== q);
  renderTable(); renderNextList();
  showToast('Patient #' + q + ' removed from queue');
}
 
// ─── AI ───
function toggleAI() {
  const panel = document.getElementById('ai-panel');
  panel.classList.toggle('open');
}
function acceptAI() {
  const idx = patients.findIndex(p => p.q === '047');
  if (idx > -1) {
    patients[idx].priority = 'high';
    const removed = patients.splice(idx, 1)[0];
    const firstWaiting = patients.findIndex(p => p.status === 'waiting');
    patients.splice(Math.max(firstWaiting, 0), 0, removed);
    renderTable(); renderNextList();
  }
  document.getElementById('ai-panel').classList.remove('open');
  document.getElementById('ai-ping').style.display = 'none';
  showToast('Q-052 Sealtiel promoted to top of queue');
}
 
// ─── MODAL ───
function openModal() { document.getElementById('modal-overlay').classList.add('open'); }
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
function closeModalOuter(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }
function addPatient() {
  const first = document.getElementById('f-first').value.trim();
  const last = document.getElementById('f-last').value.trim();
  if (!first || !last) { alert('Please enter patient name.'); return; }
  const gender = document.getElementById('f-gender').value;
  const age = document.getElementById('f-age').value || '—';
  const priority = document.getElementById('f-priority').value;
  const counter = document.getElementById('f-counter').value;
  const maxQ = Math.max(...patients.map(p => parseInt(p.q)));
  const newQ = String(maxQ + 1).padStart(3, '0');
  patients.push({ q: newQ, name: first + ' ' + last, gender, age: parseInt(age)||0, priority, status:'waiting', counter, wait:'~' + (patients.length * 5 + 5) + ' min' });
  renderTable(); renderNextList();
  closeModal();
  ['f-first','f-last','f-age','f-notes'].forEach(id => document.getElementById(id).value = '');
  showToast('Patient ' + first + ' ' + last + ' added as Queue #' + newQ);
}
 
// ─── NOTIFICATIONS ───
function toggleNotif() {
  document.getElementById('notif-panel').classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('#notif-btn') && !e.target.closest('#notif-panel')) {
    document.getElementById('notif-panel').classList.remove('open');
  }
});
 
// ─── TOAST ───
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;z-index:999;opacity:0;transition:opacity 0.2s;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.3)';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.style.opacity = '0', 2800);
}
 
// ─── INIT ───
renderDepts();
renderCounters();
renderNextList();
renderTable();

// === END OF ADDED SCRIPT === //


}
