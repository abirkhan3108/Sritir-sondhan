/* স্মৃতি সংরক্ষণ — Public App
   Admin Dashboard button removed
*/

const supabaseLoaded = !!window.supabase;

const validConfig = !!(
  window.SUPABASE_URL &&
  window.SUPABASE_ANON_KEY &&
  window.SUPABASE_URL.includes("supabase.co") &&
  !window.SUPABASE_URL.includes("YOUR-") &&
  !window.SUPABASE_URL.includes("PASTE_")
);

const sb = supabaseLoaded && validConfig
  ? window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    )
  : null;

const $ = (id) => document.getElementById(id);


/* =========================
   নিরাপদ HTML
========================= */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}


/* =========================
   Toast
========================= */

function toast(message) {
  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}


/* =========================
   Demo Data
========================= */

function demoProfiles() {
  return [
    {
      id: 1,
      name: "উদাহরণ প্রোফাইল",
      father: "",
      village: "",
      age: "",
      death_reason: "",
      date: "",
      photo_url: "",
      created_at: new Date().toISOString()
    }
  ];
}


/* =========================
   Dashboard Stats
========================= */

async function loadStats() {
  try {
    let rows = [];

    if (sb) {
      const { data, error } = await sb
        .from("profiles")
        .select("id,created_at");

      if (error) throw error;

      rows = data || [];
    } else {
      rows = JSON.parse(
        localStorage.getItem("demoProfiles") || "null"
      ) || [];
    }

    const total = $("totalProfiles");

    if (total) {
      total.textContent = rows.length;
    }

    const now = new Date();

    const monthly = rows.filter((p) => {
      if (!p.created_at) return false;

      const d = new Date(p.created_at);

      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }).length;

    const monthlyEl = $("monthlyProfiles");

    if (monthlyEl) {
      monthlyEl.textContent = monthly;
    }

  } catch (error) {
    console.error("Stats error:", error);
  }
}


/* =========================
   Last Search
========================= */

function renderLast() {
  const last = $("lastSearch");
  const time = $("lastSearchTime");

  if (!last || !time) return;

  try {
    const data = JSON.parse(
      localStorage.getItem("lastSearch") || "null"
    );

    if (!data) {
      last.textContent = "—";
      time.textContent = "এখনও কোনো সার্চ নেই";
      return;
    }

    last.textContent = data.name || "—";

    if (data.time) {
      const d = new Date(data.time);

      time.textContent = d.toLocaleString("bn-BD");
    }

  } catch (error) {
    console.error("Last search error:", error);
  }
}


/* =========================
   Search
========================= */

async function search() {

  const input = $("searchInput");

  if (!input) return;

  const q = input.value.trim();

  if (!q) {
    toast("একটি নাম লিখুন");
    return;
  }

  let rows = [];

  try {

    if (sb) {

      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .ilike("name", `%${q}%`)
        .order("name");

      if (error) {
        console.error(error);
        toast("Database সংযোগ পরীক্ষা করুন");
        return;
      }

      rows = data || [];

    } else {

      rows =
        JSON.parse(
          localStorage.getItem("demoProfiles") || "null"
        ) || demoProfiles();

      rows = rows.filter((x) =>
        String(x.name || "")
          .toLowerCase()
          .includes(q.toLowerCase())
      );
    }

    localStorage.setItem(
      "lastSearch",
      JSON.stringify({
        name: rows[0]?.name || q,
        time: new Date().toISOString()
      })
    );

    renderResults(rows, q);
    renderLast();

  } catch (error) {

    console.error(error);

    toast("সার্চ করার সময় সমস্যা হয়েছে");
  }
}


/* =========================
   Search Results
========================= */

function renderResults(rows, q) {

  const el = $("results");

  if (!el) return;

  el.classList.remove("hidden");

  if (!rows.length) {

    el.innerHTML = `
      <h3>সার্চ ফলাফল</h3>
      <p>
        “${escapeHtml(q)}” নামে কোনো প্রোফাইল পাওয়া যায়নি।
      </p>
    `;

    return;
  }

  window._rows = rows;

  el.innerHTML = `
    <h3>সার্চ ফলাফল (${rows.length})</h3>

    <div class="profile-list">

      ${rows.map((p, i) => `

        <div
          class="profile-item"
          onclick="showProfile(${i})"
        >

          <strong>
            ${escapeHtml(p.name || "নাম নেই")}
          </strong>

          <small>
            ${escapeHtml(
              p.address ||
              p.village ||
              "ঠিকানা দেওয়া নেই"
            )}
          </small>

        </div>

      `).join("")}

    </div>
  `;
}


/* =========================
   Profile Details
========================= */

function showProfile(i) {

  const rows = window._rows || [];

  const p = rows[i];

  const el = $("results");

  if (!p || !el) return;

  const fields = [
    [
      "পিতা/স্বামীর নাম",
      p.father || p.spouse
    ],
    [
      "গ্রাম",
      p.village
    ],
    [
      "বয়স",
      p.age
    ],
    [
      "মৃত্যুর কারণ",
      p.death_reason
    ],
    [
      "তারিখ",
      p.date || p.death_date
    ]
  ];

  const photo = p.photo_url || "";

  el.innerHTML = `

    <button
      onclick="search()"
      class="primary"
      style="height:42px;margin-bottom:15px"
    >
      ← ফলাফলে ফিরুন
    </button>

    <div class="profile-header">

      <div class="profile-info">

        <h3>
          👤 ${escapeHtml(p.name || "")}
        </h3>

        <div class="detail">

          ${fields.map(([label, value]) => `

            <div>
              <b>${escapeHtml(label)}</b>
              ${escapeHtml(value || "—")}
            </div>

          `).join("")}

        </div>

      </div>


      <div class="profile-photo">

        ${
          photo
            ? `
              <img
                src="${escapeHtml(photo)}"
                alt="Profile Photo"
              >
            `
            : `
              <span>
                📷<br>
                ফটো
              </span>
            `
        }

      </div>

    </div>
  `;
}


/* =========================
   Search Button
========================= */

const searchBtn = $("searchBtn");

if (searchBtn) {

  searchBtn.type = "button";

  searchBtn.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      search();
    }
  );
}


/* =========================
   Search Enter
========================= */

const searchInput = $("searchInput");

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    (e) => {

      if (e.key === "Enter") {

        e.preventDefault();

        search();
      }

    }
  );
}


/* =========================
   History Button
========================= */

const historyBtn = $("historyBtn");

if (historyBtn) {

  historyBtn.addEventListener(
    "click",
    () => {

      const data = JSON.parse(
        localStorage.getItem("lastSearch") || "null"
      );

      if (!data) {
        toast("এখনও কোনো সার্চ হিস্টরি নেই");
        return;
      }

      const el = $("results");

      if (!el) return;

      el.classList.remove("hidden");

      el.innerHTML = `

        <h3>◷ সার্চ হিস্টরি</h3>

        <div class="profile-item">

          <strong>
            ${escapeHtml(data.name)}
          </strong>

          <small>
            ${
              data.time
                ? new Date(data.time).toLocaleString("bn-BD")
                : ""
            }
          </small>

        </div>

      `;
    }
  );
}


/* =========================
   Info Button
========================= */

const infoBtn = $("infoBtn");

if (infoBtn) {

  infoBtn.addEventListener(
    "click",
    () => {

      const el = $("results");

      if (!el) return;

      el.classList.remove("hidden");

      el.innerHTML = `

        <h3>ⓘ স্মৃতি সংরক্ষণ</h3>

        <div class="profile-item">

          <p>
            এই অ্যাপের মাধ্যমে সংরক্ষিত
            Profile-এর তথ্য নাম দিয়ে
            সহজে খুঁজে দেখা যায়।
          </p>

        </div>

      `;
    }
  );
}


/* =========================
   Menu Button
========================= */

const menuBtn = $("menuBtn");

if (menuBtn) {

  menuBtn.addEventListener(
    "click",
    () => {
      toast("মেনু");
    }
  );
}


/* =========================
   Start
========================= */

loadStats();
renderLast();
