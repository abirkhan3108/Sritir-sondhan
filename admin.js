/* =========================================================
   স্মৃতি সংরক্ষণ — Admin Dashboard
   FIXED VERSION
   Edit + Delete + Search + Add
   ========================================================= */

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


/* ---------- Helper ---------- */

const $ = (id) => document.getElementById(id);

function escapeAdmin(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}


/* ---------- Elements ---------- */

const loginSection = $("loginSection");
const adminPanel = $("adminPanel");
const loginForm = $("loginForm");
const loginMsg = $("loginMsg");

const form = $("profileForm");
const adminMsg = $("adminMsg");

const photoFile = $("photoFile");

const profilesBox = $("adminProfiles");
const searchBox = $("adminSearch");
const searchBtn = $("adminSearchBtn");

const logoutBtn = $("logoutBtn");


/* ---------- Messages ---------- */

function setLoginMessage(text, error = false) {
  if (!loginMsg) return;

  loginMsg.textContent = text;
  loginMsg.className = error ? "error" : "";
}

function setAdminMessage(text, error = false) {
  if (!adminMsg) return;

  adminMsg.textContent = text;
  adminMsg.className = error ? "error" : "success";
}


/* ---------- Show / Hide ---------- */

function showAdmin() {
  loginSection?.classList.add("hidden");
  adminPanel?.classList.remove("hidden");
}

function showLogin() {
  loginSection?.classList.remove("hidden");
  adminPanel?.classList.add("hidden");
}


/* =========================================================
   AUTH
   ========================================================= */

async function refreshAuth() {

  if (!sb) {
    showLogin();
    setLoginMessage("❌ Supabase config ঠিক নেই।", true);
    return;
  }

  try {

    const { data, error } = await sb.auth.getSession();

    if (error) throw error;

    if (data?.session) {

      showAdmin();

      await loadProfiles(
        searchBox?.value.trim() || ""
      );

    } else {

      showLogin();

    }

  } catch (err) {

    console.error("Auth error:", err);

    showLogin();

    setLoginMessage(
      "❌ " + err.message,
      true
    );
  }
}


/* ---------- Login ---------- */

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!sb) {

      setLoginMessage(
        "❌ Supabase config.js সঠিক নেই।",
        true
      );

      return;
    }

    setLoginMessage("Login হচ্ছে...");

    try {

      const email =
        $("email")?.value.trim();

      const password =
        $("password")?.value;

      const { error } =
        await sb.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      setLoginMessage("✅ Login সফল");

      await refreshAuth();

    } catch (err) {

      console.error(err);

      setLoginMessage(
        "❌ " + err.message,
        true
      );
    }

  });

}


/* ---------- Logout ---------- */

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    try {

      if (sb) {
        await sb.auth.signOut();
      }

      showLogin();

    } catch (err) {

      alert(
        "❌ Logout করা যায়নি:\n" +
        err.message
      );

    }

  });

}


/* =========================================================
   PHOTO UPLOAD
   ========================================================= */

async function uploadPhoto(file) {

  if (!file || !sb) {
    return null;
  }

  if (file.size > 5 * 1024 * 1024) {

    throw new Error(
      "ছবির সাইজ ৫ MB-এর মধ্যে রাখুন"
    );

  }

  const ext =
    (file.name.split(".").pop() || "jpg")
      .toLowerCase();

  const path =
    `profiles/${crypto.randomUUID()}.${ext}`;

  const { error } =
    await sb.storage
      .from("profile-photos")
      .upload(
        path,
        file,
        {
          upsert: false,
          contentType:
            file.type || "image/jpeg"
        }
      );

  if (error) throw error;

  return sb.storage
    .from("profile-photos")
    .getPublicUrl(path)
    .data.publicUrl;
}


/* =========================================================
   ADD PROFILE
   ========================================================= */

if (form) {

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    setAdminMessage(
      "সংরক্ষণ করা হচ্ছে..."
    );

    try {

      const x =
        Object.fromEntries(
          new FormData(form).entries()
        );

      delete x.photoFile;

      x.name =
        String(x.name || "").trim();

      x.father =
        String(x.father || "").trim();

      x.village =
        String(x.village || "").trim();

      x.death_reason =
        String(x.death_reason || "").trim();

      x.age =
        String(x.age || "").trim() === ""
          ? null
          : Number(x.age);

      x.date =
        String(x.date || "").trim() || null;


      if (!x.name) {
        throw new Error("নাম দিতে হবে");
      }


      if (sb) {

        const file =
          photoFile?.files?.[0];

        if (file) {
          x.photo_url =
            await uploadPhoto(file);
        } else {
          x.photo_url = null;
        }


        const { error } =
          await sb
            .from("profiles")
            .insert(x);

        if (error) throw error;

      } else {

        const rows =
          JSON.parse(
            localStorage.getItem(
              "demoProfiles"
            ) || "[]"
          );

        rows.push({
          ...x,
          id: String(Date.now()),
          photo_url: null,
          created_at:
            new Date().toISOString()
        });

        localStorage.setItem(
          "demoProfiles",
          JSON.stringify(rows)
        );

      }


      form.reset();

      setAdminMessage(
        "✅ Profile সফলভাবে যোগ হয়েছে"
      );

      await loadProfiles(
        searchBox?.value.trim() || ""
      );

    } catch (err) {

      console.error(err);

      setAdminMessage(
        "❌ " + err.message,
        true
      );

    }

  });

}


/* =========================================================
   LOAD PROFILES
   ========================================================= */

async function loadProfiles(q = "") {

  if (!profilesBox) return;

  profilesBox.innerHTML =
    "<p>Profile লোড হচ্ছে...</p>";


  try {

    let rows = [];


    if (sb) {

      let query =
        sb
          .from("profiles")
          .select("*")
          .order(
            "created_at",
            { ascending: false }
          );


      if (q) {

        query =
          query.ilike(
            "name",
            `%${q}%`
          );

      }


      const {
        data,
        error
      } = await query;


      if (error) throw error;

      rows = data || [];


    } else {

      rows =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "[]"
        );

      if (q) {

        rows =
          rows.filter((p) =>
            String(p.name || "")
              .toLowerCase()
              .includes(
                q.toLowerCase()
              )
          );

      }

    }


    renderAdminProfiles(rows);

    updateDashboardStats(rows);


  } catch (err) {

    console.error(err);

    profilesBox.innerHTML =
      `<p class="error">
        ❌ ${escapeAdmin(err.message)}
      </p>`;

  }

}


/* =========================================================
   RENDER PROFILES
   IMPORTANT:
   No inline onclick
   ========================================================= */

function renderAdminProfiles(rows) {

  if (!profilesBox) return;


  if (!rows.length) {

    profilesBox.innerHTML =
      "<p>কোনো Profile পাওয়া যায়নি।</p>";

    return;

  }


  profilesBox.innerHTML =
    rows.map((p) => {

      const id =
        String(p.id ?? "");


      const age =
        p.age === null ||
        p.age === undefined ||
        p.age === ""
          ? ""
          : ` · ${escapeAdmin(p.age)} বছর`;


      return `
        <div
          class="profile-item"
          data-profile-id="${escapeAdmin(id)}"
        >

          <strong>
            ${escapeAdmin(p.name)}
          </strong>

          <small>
            ${escapeAdmin(p.village || "")}
            ${age}
          </small>

          <div
            style="
              display:flex;
              gap:8px;
              margin-top:10px;
            "
          >

            <button
              type="button"
              class="primary admin-edit-btn"
              data-id="${escapeAdmin(id)}"
            >
              ✏️ Edit
            </button>

            <button
              type="button"
              class="primary admin-delete-btn"
              data-id="${escapeAdmin(id)}"
              style="background:#d7263d"
            >
              🗑️ Delete
            </button>

          </div>

        </div>
      `;

    }).join("");

}


/* =========================================================
   EDIT / DELETE BUTTON
   Event Delegation
   ========================================================= */

if (profilesBox) {

  profilesBox.addEventListener(
    "click",
    async (e) => {

      const editBtn =
        e.target.closest(
          ".admin-edit-btn"
        );


      if (editBtn) {

        e.preventDefault();
        e.stopPropagation();

        const id =
          editBtn.getAttribute(
            "data-id"
          );

        await editProfile(id);

        return;
      }


      const deleteBtn =
        e.target.closest(
          ".admin-delete-btn"
        );


      if (deleteBtn) {

        e.preventDefault();
        e.stopPropagation();

        const id =
          deleteBtn.getAttribute(
            "data-id"
          );

        await deleteProfile(id);

        return;
      }

    }
  );

}


/* =========================================================
   GET PROFILE
   ========================================================= */

async function getProfileById(id) {

  if (!id) {
    throw new Error(
      "Profile ID পাওয়া যায়নি।"
    );
  }


  if (sb) {

    const {
      data,
      error
    } =
      await sb
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();


    if (error) throw error;

    return data;

  }


  const rows =
    JSON.parse(
      localStorage.getItem(
        "demoProfiles"
      ) || "[]"
    );


  return (
    rows.find(
      (p) =>
        String(p.id) === String(id)
    ) || null
  );

}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

async function editProfile(id) {

  try {

    const p =
      await getProfileById(id);


    if (!p) {

      alert(
        "❌ Profile পাওয়া যায়নি।"
      );

      return;

    }


    const name =
      prompt(
        "নাম:",
        p.name || ""
      );

    if (name === null) return;


    const father =
      prompt(
        "পিতা/স্বামীর নাম:",
        p.father || ""
      );

    if (father === null) return;


    const village =
      prompt(
        "গ্রাম:",
        p.village || ""
      );

    if (village === null) return;


    const age =
      prompt(
        "বয়স:",
        p.age ?? ""
      );

    if (age === null) return;


    const death_reason =
      prompt(
        "মৃত্যুর কারণ:",
        p.death_reason || ""
      );

    if (death_reason === null) return;


    const date =
      prompt(
        "তারিখ (YYYY-MM-DD):",
        p.date ||
        p.death_date ||
        ""
      );

    if (date === null) return;


    const updates = {

      name: name.trim(),

      father: father.trim(),

      village: village.trim(),

      age:
        age.trim() === ""
          ? null
          : Number(age),

      death_reason:
        death_reason.trim(),

      date:
        date.trim() || null

    };


    if (!updates.name) {

      alert(
        "❌ নাম খালি রাখা যাবে না।"
      );

      return;

    }


    /* ---------- Supabase ---------- */

    if (sb) {

      const {
        data,
        error
      } =
        await sb
          .from("profiles")
          .update(updates)
          .eq("id", id)
          .select("id");


      if (error) {

        throw new Error(
          "Edit ব্যর্থ: " +
          error.message
        );

      }


      if (!data || data.length === 0) {

        throw new Error(
          "Profile Edit হয়নি। " +
          "Supabase RLS UPDATE policy পরীক্ষা করুন।"
        );

      }


    } else {

      /* ---------- LocalStorage ---------- */

      let rows =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "[]"
        );


      rows =
        rows.map((row) =>

          String(row.id) === String(id)

            ? {
                ...row,
                ...updates
              }

            : row

        );


      localStorage.setItem(
        "demoProfiles",
        JSON.stringify(rows)
      );

    }


    alert(
      "✅ Profile সফলভাবে Edit হয়েছে।"
    );


    await loadProfiles(
      searchBox?.value.trim() || ""
    );


  } catch (err) {

    console.error(
      "EDIT ERROR:",
      err
    );


    alert(
      "❌ Edit করা যায়নি:\n\n" +
      err.message
    );

  }

}


/* =========================================================
   DELETE PROFILE
   ========================================================= */

async function deleteProfile(id) {

  if (!id) {

    alert(
      "❌ Profile ID পাওয়া যায়নি।"
    );

    return;

  }


  const ok =
    confirm(
      "এই Profile-টি স্থায়ীভাবে Delete করবেন?"
    );


  if (!ok) return;


  try {

    /* ---------- Supabase ---------- */

    if (sb) {

      const {
        data,
        error
      } =
        await sb
          .from("profiles")
          .delete()
          .eq("id", id)
          .select("id");


      if (error) {

        throw new Error(
          "Delete ব্যর্থ: " +
          error.message
        );

      }


      if (!data || data.length === 0) {

        throw new Error(
          "Profile Delete হয়নি। " +
          "Supabase RLS DELETE policy পরীক্ষা করুন।"
        );

      }


    } else {

      /* ---------- LocalStorage ---------- */

      let rows =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "[]"
        );


      const before =
        rows.length;


      rows =
        rows.filter(
          (row) =>
            String(row.id) !==
            String(id)
        );


      if (rows.length === before) {

        throw new Error(
          "Profile পাওয়া যায়নি।"
        );

      }


      localStorage.setItem(
        "demoProfiles",
        JSON.stringify(rows)
      );

    }


    alert(
      "✅ Profile Delete হয়েছে।"
    );


    await loadProfiles(
      searchBox?.value.trim() || ""
    );


  } catch (err) {

    console.error(
      "DELETE ERROR:",
      err
    );


    alert(
      "❌ Delete করা যায়নি:\n\n" +
      err.message
    );

  }

}


/* =========================================================
   SEARCH
   ========================================================= */

if (searchBtn) {

  searchBtn.type = "button";

  searchBtn.addEventListener(
    "click",
    (e) => {

      e.preventDefault();

      loadProfiles(
        searchBox?.value.trim() || ""
      );

    }
  );

}


if (searchBox) {

  searchBox.addEventListener(
    "keydown",
    (e) => {

      if (e.key === "Enter") {

        e.preventDefault();

        loadProfiles(
          searchBox.value.trim()
        );

      }

    }
  );

}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

function updateDashboardStats(rows) {

  const total =
    $("dashTotal");

  const monthly =
    $("dashMonthly");


  if (total) {

    total.textContent =
      rows.length;

  }


  if (monthly) {

    const now =
      new Date();


    const count =
      rows.filter((p) => {

        if (!p.created_at) {
          return false;
        }

        const d =
          new Date(
            p.created_at
          );


        return (
          d.getFullYear() ===
            now.getFullYear() &&

          d.getMonth() ===
            now.getMonth()
        );

      }).length;


    monthly.textContent =
      count;

  }

}


/* =========================================================
   START
   ========================================================= */

refreshAuth();
