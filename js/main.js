/*
 * Kiln & Crust — page behavior.
 * Renders the menu from data/menu.js, runs the mobile nav, scroll reveals,
 * and submits the reservation form to the Resend-backed endpoint.
 */

// Where reservation requests are POSTed. See api/reserve.js.
const RESERVE_ENDPOINT = "/api/reserve";
const RESTAURANT_PHONE = "(512) 555-0147"; // keep in sync with the tel: links in index.html

// Seating windows per weekday (0 = Sunday). [first seating, last seating] in 24h "HH:MM".
// Keep in sync with the hours table in index.html. null = closed.
const SEATING = {
  0: ["16:00", "20:00"],
  1: null,
  2: ["17:00", "21:00"],
  3: ["17:00", "21:00"],
  4: ["17:00", "21:00"],
  5: ["17:00", "22:00"],
  6: ["17:00", "22:00"],
};
const SLOT_MINUTES = 30;
const BOOKING_WINDOW_DAYS = 60;

document.documentElement.classList.add("js");

/* ---------- Menu ---------- */

function formatPrice(price) {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderMenu() {
  const root = document.querySelector("[data-menu]");
  const data = window.MENU;
  if (!root || !data || !Array.isArray(data.sections)) return;

  const tagLabels = data.tags || {};
  const fragment = document.createDocumentFragment();

  for (const section of data.sections) {
    const wrap = el("section", "menu-section reveal");
    wrap.setAttribute("aria-labelledby", `menu-${section.id}`);

    const head = el("div", "menu-section-head");
    const title = el("h3", "menu-section-title", section.title);
    title.id = `menu-${section.id}`;
    head.append(title);
    if (section.note) head.append(el("p", "menu-section-note", section.note));

    const list = el("ul", "menu-items");
    list.setAttribute("role", "list");

    for (const item of section.items) {
      const li = el("li", "menu-item");

      const top = el("div", "menu-item-top");
      top.append(
        el("h4", "menu-item-name", item.name),
        el("span", "menu-item-leader"),
        el("span", "menu-item-price", formatPrice(item.price)),
      );
      top.querySelector(".menu-item-leader").setAttribute("aria-hidden", "true");
      top.querySelector(".menu-item-price").setAttribute("aria-label", `$${formatPrice(item.price)}`);
      li.append(top);

      if (item.desc) li.append(el("p", "menu-item-desc", item.desc));

      if (item.tags && item.tags.length) {
        const tags = el("ul", "menu-tags");
        tags.setAttribute("role", "list");
        for (const tag of item.tags) {
          const t = el("li", "menu-tag", tagLabels[tag] || tag);
          t.dataset.tag = tag;
          tags.append(t);
        }
        li.append(tags);
      }

      list.append(li);
    }

    wrap.append(head, list);
    fragment.append(wrap);
  }

  root.replaceChildren(fragment);
}

/* ---------- Header + mobile nav ---------- */

function initHeader() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.getElementById("site-nav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/* ---------- Scroll reveal ---------- */

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((i) => i.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  items.forEach((i) => io.observe(i));
}

/* ---------- Reservations ---------- */

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes) {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

function initReserveLinks() {
  const panel = document.getElementById("reserve");
  const firstField = document.getElementById("r-name");
  let timer;

  document.querySelectorAll("[data-reserve]").forEach((link) => {
    link.addEventListener("click", () => {
      clearTimeout(timer);
      panel.classList.add("is-highlighted");
      // Let the smooth scroll finish before moving focus.
      timer = setTimeout(() => {
        firstField.focus({ preventScroll: true });
        setTimeout(() => panel.classList.remove("is-highlighted"), 1400);
      }, 700);
    });
  });
}

function initReserveForm() {
  const form = document.querySelector("[data-reserve-form]");
  if (!form) return;

  const dateInput = form.elements.date;
  const timeSelect = form.elements.time;
  const submit = form.querySelector("[data-submit]");
  const status = form.querySelector("[data-status]");

  const today = new Date();
  const max = new Date();
  max.setDate(max.getDate() + BOOKING_WINDOW_DAYS);
  dateInput.min = toISODate(today);
  dateInput.max = toISODate(max);

  const setStatus = (message, state = "") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  // Rebuild time slots for the chosen day so guests can only pick open times.
  const refreshTimes = () => {
    const previous = timeSelect.value;
    if (!dateInput.value) {
      timeSelect.replaceChildren(new Option("Pick a date first", ""));
      return;
    }
    timeSelect.replaceChildren(new Option("Choose a time", ""));
    const day = new Date(`${dateInput.value}T12:00:00`).getDay();
    const window_ = SEATING[day];

    if (!window_) {
      timeSelect.replaceChildren(new Option("Closed that day", ""));
      setStatus("We're closed on Mondays — the oven needs a rest. Pick another day?", "error");
      return;
    }
    if (status.dataset.state === "error") setStatus("");

    const isToday = dateInput.value === toISODate(new Date());
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    for (let t = toMinutes(window_[0]); t <= toMinutes(window_[1]); t += SLOT_MINUTES) {
      if (isToday && t <= nowMinutes + 30) continue;
      const label = formatTime(t);
      timeSelect.append(new Option(label, label, false, label === previous));
    }
    if (timeSelect.options.length === 1) {
      timeSelect.replaceChildren(new Option("No times left today", ""));
    }
  };

  dateInput.addEventListener("change", refreshTimes);
  refreshTimes();

  const validate = () => {
    let firstInvalid = null;
    for (const field of form.querySelectorAll("input, select, textarea")) {
      if (field.name === "company") continue;
      const ok = field.checkValidity();
      field.setAttribute("aria-invalid", String(!ok));
      if (!ok && !firstInvalid) firstInvalid = field;
    }
    return firstInvalid;
  };

  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true" && e.target.checkValidity()) {
      e.target.setAttribute("aria-invalid", "false");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const invalid = validate();
    if (invalid) {
      setStatus("Please fill in the highlighted fields.", "error");
      invalid.focus();
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.party = Number(payload.party);

    submit.disabled = true;
    submit.textContent = "Sending…";
    setStatus("");

    try {
      const res = await fetch(RESERVE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");

      form.reset();
      refreshTimes();
      form.querySelectorAll("[aria-invalid]").forEach((f) => f.removeAttribute("aria-invalid"));
      setStatus(`Got it, ${payload.name.split(" ")[0]}. We'll email you to confirm shortly.`, "success");
    } catch (err) {
      const reason = err instanceof TypeError ? "We couldn't reach our booking system." : err.message;
      setStatus(`${reason} Please call us at ${RESTAURANT_PHONE}.`, "error");
    } finally {
      submit.disabled = false;
      submit.textContent = "Request table";
    }
  });
}

/* ---------- Boot ---------- */

renderMenu();
initHeader();
initReveal();
initReserveLinks();
initReserveForm();

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();
