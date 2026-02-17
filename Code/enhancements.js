/* Enhancements layer (front-end only).
 Uses localStorage to simulate backend-managed data.
 Designed to be added WITHOUT modifying the original JS file. */

(function () {
 "use strict";

 // ---------------------------
 // Helpers
 // ---------------------------
 const LS = {
 get(key, fallback) {
 try {
 const raw = localStorage.getItem(key);
 return raw ? JSON.parse(raw) : fallback;
 } catch {
 return fallback;
 }
 },
 set(key, value) {
 localStorage.setItem(key, JSON.stringify(value));
 }
 };

 function $(id) { return document.getElementById(id); }

 function escapeHtml(s) {
 return String(s).replace(/[&<>"']/g, (c) => ({
 "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
 }[c]));
 }

 // Seed data (only if empty)
 function seed() {
 const inv = LS.get("aggiesource_inventory_v1", null);
 if (!inv) {
 LS.set("aggiesource_inventory_v1", [
 { name: "Rice (1 lb)", qty: 24, category: "Pantry" },
 { name: "Canned Beans", qty: 40, category: "Pantry" },
 { name: "Pasta", qty: 30, category: "Pantry" },
 { name: "Toothpaste", qty: 15, category: "Hygiene" },
 { name: "Shampoo", qty: 10, category: "Hygiene" }
 ]);
 }

 const slots = LS.get("aggiesource_pickup_slots_v1", null);
 if (!slots) {
 LS.set("aggiesource_pickup_slots_v1", [
 { date: "2026-02-02", time: "12:00 PM", capacity: 8 },
 { date: "2026-02-02", time: "2:00 PM", capacity: 8 },
 { date: "2026-02-03", time: "10:00 AM", capacity: 8 }
 ]);
 }

 const checklistTemplates = LS.get("aggiesource_checklists_v1", null);
 if (!checklistTemplates) {
 LS.set("aggiesource_checklists_v1", [
 { title: "Pantry Shift Checklist", items: ["Stock shelves", "Organize donations", "Wipe down surfaces", "Update inventory notes"] }
 ]);
 }

 const donations = LS.get("aggiesource_donations_v1", null);
 if (!donations) {
 LS.set("aggiesource_donations_v1", [
 { donor: "Campus Partner", item: "Canned goods", status: "Scheduled", date: "2026-02-01" }
 ]);
 }
 }

 seed();

 // ---------------------------
 // Signup email domain filters
 // (role-based, front-end enforcement)
 // ---------------------------
 document.addEventListener("DOMContentLoaded", () => {
 const btn = $("signup-button");
 const roleEl = $("signup-role");
 const emailEl = $("signup-email");

 // Capture phase so we can block the original click handler if invalid
 if (btn && roleEl && emailEl) {
 btn.addEventListener("click", (e) => {
 const role = roleEl.value;
 const email = (emailEl.value || "").trim().toLowerCase();

 // Student emails: aggies.ncat.edu (commonly used by NCAT accounts)
 // Admin emails: ncat.edu (school-administered domain)
 const isStudentOk = email.endsWith("@aggies.ncat.edu");
 const isAdminOk = email.endsWith("@ncat.edu");

 if (role === "student" && !isStudentOk) {
 e.preventDefault();
 e.stopImmediatePropagation();
 alert("Students must sign up with an @aggies.ncat.edu email address.");
 return;
 }
 if (role === "admin" && !isAdminOk) {
 e.preventDefault();
 e.stopImmediatePropagation();
 alert("Admins must sign up with an @ncat.edu email address.");
 return;
 }
 }, true);
 }
 });

 // ---------------------------
 // Admin: Inventory editor
 // ---------------------------
 function renderAdminInventory() {
 const mount = $("admin-inventory-mount");
 if (!mount) return;

 const inv = LS.get("aggiesource_inventory_v1", []);
 const rows = inv.map((it, idx) => `
 <tr>
 <td>${escapeHtml(it.category || "")}</td>
 <td>${escapeHtml(it.name || "")}</td>
 <td><input type="number" min="0" value="${Number(it.qty||0)}" data-idx="${idx}" class="qty-input" /></td>
 <td><button class="btn small danger" data-remove="${idx}">Remove</button></td>
 </tr>
 `).join("");

 mount.innerHTML = `
 <div class="card">
 <h3>Inventory Tracking (Admin)</h3>
 <p class="muted">Front-end edits are stored in your browser (localStorage).</p>
 <div class="table-wrap">
 <table class="data-table">
 <thead><tr><th>Category</th><th>Item</th><th>Qty</th><th></th></tr></thead>
 <tbody>${rows || `<tr><td colspan="4">No items yet.</td></tr>`}</tbody>
 </table>
 </div>

 <div class="form-row">
 <input id="inv-category" placeholder="Category (e.g., Pantry)" />
 <input id="inv-name" placeholder="Item name" />
 <input id="inv-qty" type="number" min="0" placeholder="Qty" />
 <button id="inv-add" class="btn">Add item</button>
 </div>
 </div>
 `;

 mount.querySelectorAll(".qty-input").forEach((inp) => {
 inp.addEventListener("change", () => {
 const i = Number(inp.dataset.idx);
 const inv2 = LS.get("aggiesource_inventory_v1", []);
 inv2[i].qty = Number(inp.value || 0);
 LS.set("aggiesource_inventory_v1", inv2);
 });
 });

 mount.querySelectorAll("[data-remove]").forEach((btn) => {
 btn.addEventListener("click", () => {
 const i = Number(btn.dataset.remove);
 const inv2 = LS.get("aggiesource_inventory_v1", []);
 inv2.splice(i, 1);
 LS.set("aggiesource_inventory_v1", inv2);
 renderAdminInventory();
 });
 });

 const addBtn = $("inv-add");
 if (addBtn) {
 addBtn.addEventListener("click", () => {
 const category = ($("inv-category").value || "").trim();
 const name = ($("inv-name").value || "").trim();
 const qty = Number(($("inv-qty").value || "0").trim());
 if (!category || !name) {
 alert("Please enter a category and item name.");
 return;
 }
 const inv2 = LS.get("aggiesource_inventory_v1", []);
 inv2.push({ category, name, qty: isNaN(qty) ? 0 : qty });
 LS.set("aggiesource_inventory_v1", inv2);
 $("inv-category").value = "";
 $("inv-name").value = "";
 $("inv-qty").value = "";
 renderAdminInventory();
 });
 }
 }

 // ---------------------------
 // Admin: Pickup slots management
 // ---------------------------
 function renderAdminSlots() {
 const mount = $("admin-slots-mount");
 if (!mount) return;

 const slots = LS.get("aggiesource_pickup_slots_v1", []);
 const rows = slots.map((s, idx) => `
 <tr>
 <td>${escapeHtml(s.date)}</td>
 <td>${escapeHtml(s.time)}</td>
 <td><input type="number" min="0" value="${Number(s.capacity||0)}" data-idx="${idx}" class="cap-input" /></td>
 <td><button class="btn small danger" data-remove="${idx}">Remove</button></td>
 </tr>
 `).join("");

 mount.innerHTML = `
 <div class="card">
 <h3>Pickup Slots (Admin)</h3>
 <p class="muted">Students can only request pickup times you list here.</p>

 <div class="table-wrap">
 <table class="data-table">
 <thead><tr><th>Date</th><th>Time</th><th>Capacity</th><th></th></tr></thead>
 <tbody>${rows || `<tr><td colspan="4">No slots yet.</td></tr>`}</tbody>
 </table>
 </div>

 <div class="form-row">
 <input id="slot-date" type="date" />
 <input id="slot-time" placeholder="Time (e.g., 1:30 PM)" />
 <input id="slot-cap" type="number" min="0" placeholder="Capacity" />
 <button id="slot-add" class="btn">Add slot</button>
 </div>
 </div>
 `;

 mount.querySelectorAll(".cap-input").forEach((inp) => {
 inp.addEventListener("change", () => {
 const i = Number(inp.dataset.idx);
 const s2 = LS.get("aggiesource_pickup_slots_v1", []);
 s2[i].capacity = Number(inp.value || 0);
 LS.set("aggiesource_pickup_slots_v1", s2);
 });
 });

 mount.querySelectorAll("[data-remove]").forEach((btn) => {
 btn.addEventListener("click", () => {
 const i = Number(btn.dataset.remove);
 const s2 = LS.get("aggiesource_pickup_slots_v1", []);
 s2.splice(i, 1);
 LS.set("aggiesource_pickup_slots_v1", s2);
 renderAdminSlots();
 });
 });

 const addBtn = $("slot-add");
 if (addBtn) {
 addBtn.addEventListener("click", () => {
 const date = ($("slot-date").value || "").trim();
 const time = ($("slot-time").value || "").trim();
 const cap = Number(($("slot-cap").value || "0").trim());
 if (!date || !time) {
 alert("Please enter a date and time.");
 return;
 }
 const s2 = LS.get("aggiesource_pickup_slots_v1", []);
 s2.push({ date, time, capacity: isNaN(cap) ? 0 : cap });
 LS.set("aggiesource_pickup_slots_v1", s2);
 $("slot-date").value = "";
 $("slot-time").value = "";
 $("slot-cap").value = "";
 renderAdminSlots();
 });
 }
 }

 // ---------------------------
 // Admin: Checklist builder
 // ---------------------------
 function renderAdminChecklists() {
 const mount = $("admin-checklists-mount");
 if (!mount) return;

 const lists = LS.get("aggiesource_checklists_v1", []);
 const cards = lists.map((cl, idx) => `
 <div class="card">
 <div class="card-head">
 <h4>${escapeHtml(cl.title)}</h4>
 <button class="btn small danger" data-del="${idx}">Delete</button>
 </div>
 <ul class="checklist">
 ${(cl.items||[]).map(i => `<li>${escapeHtml(i)}</li>`).join("")}
 </ul>
 </div>
 `).join("");

 mount.innerHTML = `
 <div class="card">
 <h3>Volunteer Checklists (Admin)</h3>
 <p class="muted">Create checklists that appear for volunteers after check-in.</p>
 <div class="form-row">
 <input id="cl-title" placeholder="Checklist title (e.g., Event Setup)" />
 <input id="cl-items" placeholder="Items (comma-separated)" />
 <button id="cl-add" class="btn">Create checklist</button>
 </div>
 </div>
 <div class="grid-2">${cards || `<p class="muted">No checklists yet.</p>`}</div>
 `;

 mount.querySelectorAll("[data-del]").forEach((b) => {
 b.addEventListener("click", () => {
 const i = Number(b.dataset.del);
 const lists2 = LS.get("aggiesource_checklists_v1", []);
 lists2.splice(i, 1);
 LS.set("aggiesource_checklists_v1", lists2);
 renderAdminChecklists();
 });
 });

 const addBtn = $("cl-add");
 if (addBtn) {
 addBtn.addEventListener("click", () => {
 const title = ($("cl-title").value || "").trim();
 const itemsRaw = ($("cl-items").value || "").trim();
 if (!title || !itemsRaw) {
 alert("Please enter a title and at least one checklist item.");
 return;
 }
 const items = itemsRaw.split(",").map(s => s.trim()).filter(Boolean);
 const lists2 = LS.get("aggiesource_checklists_v1", []);
 lists2.push({ title, items });
 LS.set("aggiesource_checklists_v1", lists2);
 $("cl-title").value = "";
 $("cl-items").value = "";
 renderAdminChecklists();
 });
 }
 }

 // ---------------------------
 // Donations page (separate)
 // ---------------------------
 function renderDonationsPage() {
 const mount = $("donations-mount");
 if (!mount) return;

 const donations = LS.get("aggiesource_donations_v1", []);
 const rows = donations.map((d, idx) => `
 <tr>
 <td>${escapeHtml(d.date || "")}</td>
 <td>${escapeHtml(d.donor || "")}</td>
 <td>${escapeHtml(d.item || "")}</td>
 <td>${escapeHtml(d.status || "")}</td>
 <td><button class="btn small danger" data-remove="${idx}">Remove</button></td>
 </tr>
 `).join("");

 mount.innerHTML = `
 <div class="card">
 <h2>Donation Tracking</h2>
 <p class="muted"> dashboard stored in localStorage.</p>

 <div class="table-wrap">
 <table class="data-table">
 <thead><tr><th>Date</th><th>Donor</th><th>Item</th><th>Status</th><th></th></tr></thead>
 <tbody>${rows || `<tr><td colspan="5">No donation entries yet.</td></tr>`}</tbody>
 </table>
 </div>

 <div class="form-row">
 <input id="don-date" type="date" />
 <input id="don-donor" placeholder="Donor / Organization" />
 <input id="don-item" placeholder="Donation item(s)" />
 <input id="don-status" placeholder="Status (Scheduled / Received / Needs Attention)" />
 <button id="don-add" class="btn">Add donation</button>
 </div>
 </div>
 `;

 mount.querySelectorAll("[data-remove]").forEach((b) => {
 b.addEventListener("click", () => {
 const i = Number(b.dataset.remove);
 const d2 = LS.get("aggiesource_donations_v1", []);
 d2.splice(i, 1);
 LS.set("aggiesource_donations_v1", d2);
 renderDonationsPage();
 });
 });

 const addBtn = $("don-add");
 if (addBtn) {
 addBtn.addEventListener("click", () => {
 const date = ($("don-date").value || "").trim();
 const donor = ($("don-donor").value || "").trim();
 const item = ($("don-item").value || "").trim();
 const status = ($("don-status").value || "").trim();
 if (!date || !donor || !item || !status) {
 alert("Please fill out all donation fields.");
 return;
 }
 const d2 = LS.get("aggiesource_donations_v1", []);
 d2.push({ date, donor, item, status });
 LS.set("aggiesource_donations_v1", d2);
 $("don-date").value = "";
 $("don-donor").value = "";
 $("don-item").value = "";
 $("don-status").value = "";
 renderDonationsPage();
 });
 }
 }

 // ---------------------------
 // Student: Inventory view + cart
 // ---------------------------
 function renderStudentInventory() {
 const mount = $("student-inventory-mount");
 if (!mount) return;

 const inv = LS.get("aggiesource_inventory_v1", []).filter(i => Number(i.qty||0) > 0);
 const cart = LS.get("aggiesource_cart_v1", []);

 const rows = inv.map((it, idx) => `
 <tr>
 <td>${escapeHtml(it.category||"")}</td>
 <td>${escapeHtml(it.name||"")}</td>
 <td>${Number(it.qty||0)}</td>
 <td><button class="btn small" data-add="${idx}">Add to cart</button></td>
 </tr>
 `).join("");

 const cartList = cart.map((c, i) => `<li>${escapeHtml(c)} <button class="link" data-cartdel="${i}">remove</button></li>`).join("");

 mount.innerHTML = `
 <div class="card">
 <h3>Inventory Transparency</h3>
 <p class="muted">Students see only items that are currently in stock.</p>
 <div class="table-wrap">
 <table class="data-table">
 <thead><tr><th>Category</th><th>Item</th><th>In Stock</th><th></th></tr></thead>
 <tbody>${rows || `<tr><td colspan="4">No items currently available.</td></tr>`}</tbody>
 </table>
 </div>
 </div>

 <div class="card">
 <h3>Your Request Cart</h3>
 <p class="muted">cart is stored in your browser. Volunteers/admin would fulfill this request later via backend.</p>
 <ul class="cart-list">${cartList || `<li class="muted">Cart is empty.</li>`}</ul>
 <button id="cart-clear" class="btn subtle">Clear cart</button>
 </div>
 `;

 mount.querySelectorAll("[data-add]").forEach((b) => {
 b.addEventListener("click", () => {
 const i = Number(b.dataset.add);
 const itemName = inv[i]?.name;
 if (!itemName) return;
 const cart2 = LS.get("aggiesource_cart_v1", []);
 cart2.push(itemName);
 LS.set("aggiesource_cart_v1", cart2);
 renderStudentInventory();
 });
 });

 mount.querySelectorAll("[data-cartdel]").forEach((b) => {
 b.addEventListener("click", () => {
 const i = Number(b.dataset.cartdel);
 const cart2 = LS.get("aggiesource_cart_v1", []);
 cart2.splice(i, 1);
 LS.set("aggiesource_cart_v1", cart2);
 renderStudentInventory();
 });
 });

 const clearBtn = $("cart-clear");
 if (clearBtn) {
 clearBtn.addEventListener("click", () => {
 LS.set("aggiesource_cart_v1", []);
 renderStudentInventory();
 });
 }
 }

 // Student: Pickup slots request
 function renderStudentPickup() {
 const mount = $("student-pickup-mount");
 if (!mount) return;

 const slots = LS.get("aggiesource_pickup_slots_v1", []);
 const requests = LS.get("aggiesource_pickup_requests_v1", []);
 const options = slots.map((s, idx) => `<option value="${idx}">${escapeHtml(s.date)} — ${escapeHtml(s.time)} (cap ${Number(s.capacity||0)})</option>`).join("");

 mount.innerHTML = `
 <div class="card">
 <h3>Schedule a Pickup</h3>
 <p class="muted">Only admin-confirmed slots are available.</p>
 <div class="form-row">
 <select id="pickup-slot">
 <option value="">Choose a slot</option>
 ${options}
 </select>
 <input id="pickup-notes" placeholder="Notes (optional)" />
 <button id="pickup-submit" class="btn">Request pickup</button>
 </div>
 <div class="muted" style="margin-top:0.75rem">Requests are saved locally for this.</div>
 </div>
 `;

 const submit = $("pickup-submit");
 if (submit) {
 submit.addEventListener("click", () => {
 const idx = $("pickup-slot").value;
 if (idx === "") {
 alert("Please choose a pickup slot.");
 return;
 }
 const chosen = slots[Number(idx)];
 if (!chosen) return;
 const notes = ($("pickup-notes").value || "").trim();
 const req2 = LS.get("aggiesource_pickup_requests_v1", []);
 req2.push({ slot: chosen, notes, createdAt: new Date().toISOString() });
 LS.set("aggiesource_pickup_requests_v1", req2);
 $("pickup-slot").value = "";
 $("pickup-notes").value = "";
 alert("Pickup requested! ( saved locally)");
 });
 }
 }

 // Admin: view pickup requests
 function renderAdminPickupRequests() {
 const mount = $("admin-pickup-requests-mount");
 if (!mount) return;

 const reqs = LS.get("aggiesource_pickup_requests_v1", []);
 const rows = reqs.map((r, idx) => `
 <tr>
 <td>${escapeHtml((r.slot?.date)||"")}</td>
 <td>${escapeHtml((r.slot?.time)||"")}</td>
 <td>${escapeHtml(r.notes||"")}</td>
 <td>${escapeHtml((r.createdAt||"").slice(0,19).replace("T"," "))}</td>
 <td><button class="btn small danger" data-remove="${idx}">Remove</button></td>
 </tr>
 `).join("");

 mount.innerHTML = `
 <div class="card">
 <h3>Pickup Requests (Admin)</h3>
 <p class="muted">Requests created from the Student view appear here.</p>
 <div class="table-wrap">
 <table class="data-table">
 <thead><tr><th>Date</th><th>Time</th><th>Notes</th><th>Created</th><th></th></tr></thead>
 <tbody>${rows || `<tr><td colspan="5">No pickup requests yet.</td></tr>`}</tbody>
 </table>
 </div>
 </div>
 `;

 mount.querySelectorAll("[data-remove]").forEach((b) => {
 b.addEventListener("click", () => {
 const i = Number(b.dataset.remove);
 const req2 = LS.get("aggiesource_pickup_requests_v1", []);
 req2.splice(i, 1);
 LS.set("aggiesource_pickup_requests_v1", req2);
 renderAdminPickupRequests();
 });
 });
 }

 // ---------------------------
 // Volunteer: check-in/out + checklist + hours
 // ---------------------------
 function renderVolunteerTools() {
 const mount = $("volunteer-tools-mount");
 if (!mount) return;

 const logs = LS.get("aggiesource_volunteer_logs_v1", []);
 const totalMinutes = logs.reduce((acc, l) => acc + Number(l.minutes||0), 0);
 const totalHours = Math.round((totalMinutes/60)*10)/10;

 const last = logs[logs.length - 1];

 mount.innerHTML = `
 <div class="card">
 <h3>Seamless Check-In / Check-Out</h3>
 <p class="muted">submits log time to localStorage (simulating backend).</p>

 <div class="form-row">
 <input id="vol-shift" placeholder="Shift (open-ended)" />
 <input id="vol-event" placeholder="Event (open-ended)" />
 <button id="vol-checkin" class="btn">Check In</button>
 <button id="vol-checkout" class="btn subtle">Check Out</button>
 </div>

 <div class="stats-row">
 <div class="stat">
 <div class="stat-number">${totalHours}</div>
 <div class="stat-label">Total hours </div>
 </div>
 <div class="stat">
 <div class="stat-number">${logs.length}</div>
 <div class="stat-label">Total check-ins</div>
 </div>
 </div>

 ${last ? `<div class="muted" style="margin-top:0.5rem">Most recent: ${escapeHtml(last.shift||"")} — ${escapeHtml(last.event||"")} (${escapeHtml(last.date||"")})</div>` : ""}
 </div>

 <div id="volunteer-checklist-mount"></div>
 <div id="volunteer-calendar-mount"></div>
 `;

 const checkinBtn = $("vol-checkin");
 const checkoutBtn = $("vol-checkout");

 function nowIso() { return new Date().toISOString(); }
 function today() { return new Date().toISOString().slice(0,10); }

 if (checkinBtn) {
 checkinBtn.addEventListener("click", () => {
 const shift = ($("vol-shift").value||"").trim();
 const event = ($("vol-event").value||"").trim();
 if (!shift || !event) {
 alert("Please enter both Shift and Event.");
 return;
 }
 const active = LS.get("aggiesource_active_shift_v1", null);
 if (active) {
 alert("You already have an active check-in. Please check out first.");
 return;
 }
 LS.set("aggiesource_active_shift_v1", { shift, event, start: nowIso(), date: today() });
 alert("Checked in! ");
 renderVolunteerTools();
 renderVolunteerChecklist(true);
 renderVolunteerCalendar();
 });
 }

 if (checkoutBtn) {
 checkoutBtn.addEventListener("click", () => {
 const active = LS.get("aggiesource_active_shift_v1", null);
 if (!active) {
 alert("No active check-in found.");
 return;
 }
 const start = new Date(active.start);
 const end = new Date();
 const minutes = Math.max(1, Math.round((end - start) / 60000));
 const logs2 = LS.get("aggiesource_volunteer_logs_v1", []);
 logs2.push({...active, end: nowIso(), minutes });
 LS.set("aggiesource_volunteer_logs_v1", logs2);
 LS.set("aggiesource_active_shift_v1", null);
 alert("Checked out! Logged " + minutes + " minutes. ");
 renderVolunteerTools();
 renderVolunteerCalendar();
 });
 }

 renderVolunteerChecklist(false);
 renderVolunteerCalendar();
 }

 function renderVolunteerChecklist(justCheckedIn) {
 const mount = $("volunteer-checklist-mount");
 if (!mount) return;

 const templates = LS.get("aggiesource_checklists_v1", []);
 const active = LS.get("aggiesource_active_shift_v1", null);

 if (!active) {
 mount.innerHTML = `
 <div class="card">
 <h3>Checklist</h3>
 <p class="muted">Check in to see your assigned checklist.</p>
 </div>
 `;
 return;
 }

 const template = templates[0] || { title: "Shift Checklist", items: [] };

 // Track checklist completion by date
 const key = `aggiesource_checklist_progress_${active.date}_v1`;
 const progress = LS.get(key, template.items.map(() => false));

 const completed = progress.filter(Boolean).length;
 const total = template.items.length || 1;
 const pct = Math.round((completed/total)*100);

 mount.innerHTML = `
 <div class="card">
 <h3>${escapeHtml(template.title)}</h3>
 <p class="muted">Based on admin input. Your progress updates as you check items off.</p>
 <progress value="${pct}" max="100" style="width:100%;height:16px"></progress>
 <div class="muted" style="margin-top:0.35rem">${pct}% complete</div>

 <ul class="checklist interactive">
 ${(template.items||[]).map((it, idx) => `
 <li>
 <label>
 <input type="checkbox" data-idx="${idx}" ${progress[idx] ? "checked" : ""} />
 <span>${escapeHtml(it)}</span>
 </label>
 </li>
 `).join("") || `<li class="muted">No checklist items yet.</li>`}
 </ul>
 </div>
 `;

 mount.querySelectorAll("input[type='checkbox'][data-idx]").forEach((cb) => {
 cb.addEventListener("change", () => {
 const idx = Number(cb.dataset.idx);
 const prog2 = LS.get(key, []);
 prog2[idx] = cb.checked;
 LS.set(key, prog2);
 renderVolunteerChecklist(false);
 });
 });

 if (justCheckedIn) {
 // Nice-to-have: scroll into view
 mount.scrollIntoView({ behavior: "smooth", block: "start" });
 }
 }

 function renderVolunteerCalendar() {
 const mount = $("volunteer-calendar-mount");
 if (!mount) return;

 const logs = LS.get("aggiesource_volunteer_logs_v1", []);
 const byMonth = {};
 for (const l of logs) {
 const month = (l.date||"").slice(0,7) || "unknown";
 byMonth[month] = byMonth[month] || { minutes: 0, days: new Set() };
 byMonth[month].minutes += Number(l.minutes||0);
 if (l.date) byMonth[month].days.add(l.date);
 }

 const months = Object.keys(byMonth).sort().reverse();
 const items = months.map(m => {
 const mins = byMonth[m].minutes;
 const hours = Math.round((mins/60)*10)/10;
 const days = Array.from(byMonth[m].days).sort();
 return `
 <div class="card">
 <div class="card-head">
 <h4>${escapeHtml(m)}</h4>
 <div class="muted">${hours} hours total</div>
 </div>
 <div class="pill-row">
 ${days.map(d => `<span class="pill">${escapeHtml(d)}</span>`).join("") || `<span class="muted">No shifts this month.</span>`}
 </div>
 </div>
 `;
 }).join("");

 mount.innerHTML = `
 <div class="card">
 <h3>Volunteer Calendar </h3>
 <p class="muted">Shows months with at least one volunteer shift. Months are scrollable by list for now (no external library).</p>
 </div>
 <div class="grid-2">
 ${items || `<p class="muted">No logged shifts yet.</p>`}
 </div>
 `;
 }

 // ---------------------------
 // Boot per-page mounts
 // ---------------------------
 document.addEventListener("DOMContentLoaded", () => {
 renderAdminInventory();
 renderAdminSlots();
 renderAdminChecklists();
 renderAdminPickupRequests();
 renderStudentInventory();
 renderStudentPickup();
 renderVolunteerTools();
 renderDonationsPage();
 });

})();