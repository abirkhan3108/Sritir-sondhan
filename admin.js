/* =========================================================
   স্মৃতি সংরক্ষণ - Admin Dashboard
   Edit / Delete / Add / Search
   Supabase profiles table
   ========================================================= */

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

let sb = null;

if (
  window.supabase &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.includes("supabase.co") &&
  !SUPABASE_URL.includes("PASTE_")
) {
  sb = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

const TABLE = "profiles";
const BUCKET = "profile-photos";

const loginSection = document.getElementById("loginSection");
const adminPanel = document.getElementById("adminPanel");

const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");

const profileForm = document.getElementById("profileForm");
const adminMsg = document.getElementById("adminMsg");

const photoFile = document.getElementById("photoFile");

const adminSearch = document.getElementById("adminSearch");
const adminSearchBtn = document.getElementById("adminSearchBtn");
const adminProfiles = document.getElementById("adminProfiles");

const logoutBtn = document.getElementById("logoutBtn");


/* =========================================================
   নিরাপদ HTML
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}


/* =========================================================
   ID নিরাপদভাবে HTML onclick-এ পাঠানো
   UUID হলেও কাজ করবে
   ========================================================= */

function safeId(id) {
  return JSON.stringify(String(id));
}


/* =========================================================
   Login Check
   ========================================================= */

async function refreshAuth() {

  if (!sb) {
    loginSection.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    await loadProfiles();
    return;
  }

  const { data, error } = await sb.auth.getSession();

  if (error) {
    console.error(error);
    loginSection.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    return;
  }

  if (data && data.session) {
    loginSection.classList.add("hidden");
    adminPanel.classList.remove("hidden");

    await loadProfiles();
    await updateDashboardStats();

  } else {
    loginSection.classList.remove("hidden");
    adminPanel.classList.add("hidden");
  }
}


/* =========================================================
   Login
   ========================================================= */

if (loginForm) {

  loginForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    loginMsg.textContent = "লগইন হচ্ছে...";

    if (!sb) {
      loginMsg.textContent =
        "❌ Supabase config পাওয়া যাচ্ছে না";
      return;
    }

    const email =
      document.getElementById("email").value.trim();

    const password =
      document.getElementById("password").value;

    const { error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      loginMsg.textContent =
        "❌ " + error.message;

      return;
    }

    loginMsg.textContent =
      "✅ Login সফল";

    await refreshAuth();
  });
}


/* =========================================================
   Logout
   ========================================================= */

if (logoutBtn) {

  logoutBtn.addEventListener("click", async function () {

    if (sb) {
      await sb.auth.signOut();
    }

    loginSection.classList.remove("hidden");
    adminPanel.classList.add("hidden");
  });
}


/* =========================================================
   Photo Upload
   ========================================================= */

async function uploadPhoto(file) {

  if (!file) return null;

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("ছবির সাইজ ৫ MB-এর মধ্যে রাখুন");
  }

  if (!sb) return null;

  const ext =
    (file.name.split(".").pop() || "jpg")
      .toLowerCase();

  const path =
    "profiles/" +
    crypto.randomUUID() +
    "." +
    ext;

  const { error } =
    await sb.storage
      .from(BUCKET)
      .upload(
        path,
        file,
        {
          upsert: false,
          contentType: file.type
        }
      );

  if (error) {
    throw error;
  }

  const result =
    sb.storage
      .from(BUCKET)
      .getPublicUrl(path);

  return result.data.publicUrl;
}


/* =========================================================
   নতুন Profile যোগ
   ========================================================= */

if (profileForm) {

  profileForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    adminMsg.textContent =
      "সংরক্ষণ করা হচ্ছে...";

    try {

      const formData =
        new FormData(profileForm);

      const name =
        String(formData.get("name") || "").trim();

      const father =
        String(formData.get("father") || "").trim();

      const village =
        String(formData.get("village") || "").trim();

      const ageText =
        String(formData.get("age") || "").trim();

      const death_reason =
        String(formData.get("death_reason") || "").trim();

      const date =
        String(formData.get("date") || "").trim();

      if (!name) {
        throw new Error("নাম দিতে হবে");
      }

      const age =
        ageText ? Number(ageText) : null;

      let photo_url = null;

      if (photoFile && photoFile.files[0]) {
        photo_url =
          await uploadPhoto(photoFile.files[0]);
      }

      const record = {
        name,
        father,
        village,
        age,
        death_reason,
        date,
        photo_url,
        created_at: new Date().toISOString()
      };

      if (sb) {

        const { error } =
          await sb
            .from(TABLE)
            .insert(record);

        if (error) {
          throw error;
        }

      } else {

        const old =
          JSON.parse(
            localStorage.getItem("demoProfiles") || "[]"
          );

        record.id =
          Date.now().toString();

        old.push(record);

        localStorage.setItem(
          "demoProfiles",
          JSON.stringify(old)
        );
      }

      profileForm.reset();

      adminMsg.textContent =
        "✅ Profile সফলভাবে যোগ হয়েছে";

      await loadProfiles();
      await updateDashboardStats();

    } catch (error) {

      console.error(error);

      adminMsg.textContent =
        "❌ " + (error.message || error);
    }
  });
}


/* =========================================================
   Profile Load
   ========================================================= */

async function loadProfiles(searchText = "") {

  try {

    if (!sb) {

      let rows =
        JSON.parse(
          localStorage.getItem("demoProfiles") || "[]"
        );

      if (searchText) {

        const q =
          searchText.toLocaleLowerCase("bn-BD");

        rows =
          rows.filter(function (p) {

            return String(p.name || "")
              .toLocaleLowerCase("bn-BD")
              .includes(q);
          });
      }

      renderProfiles(rows);
      return;
    }

    let query =
      sb
        .from(TABLE)
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (searchText) {

      query =
        query.ilike(
          "name",
          "%" + searchText + "%"
        );
    }

    const { data, error } =
      await query;

    if (error) {
      throw error;
    }

    renderProfiles(data || []);

  } catch (error) {

    console.error(error);

    adminProfiles.innerHTML =
      "<p>❌ " +
      escapeHTML(error.message) +
      "</p>";
  }
}


/* =========================================================
   Profile List Render
   ========================================================= */

function renderProfiles(rows) {

  if (!rows.length) {

    adminProfiles.innerHTML =
      "<p>কোনো Profile পাওয়া যায়নি।</p>";

    return;
  }

  adminProfiles.innerHTML =
    rows.map(function (p) {

      const id =
        safeId(p.id);

      return `
        <div class="profile-item">

          <strong>
            ${escapeHTML(p.name)}
          </strong>

          <small>
            ${escapeHTML(p.village || "")}
            ·
            ${escapeHTML(p.age || "")}
            বছর
          </small>

          <div
            style="
              display:flex;
              gap:8px;
              margin-top:10px;
              flex-wrap:wrap;
            "
          >

            <button
              class="primary"
              type="button"
              onclick='editProfile(${id})'
            >
              ✏️ Edit
            </button>

            <button
              class="primary"
              type="button"
              style="background:#d7263d"
              onclick='deleteProfile(${id})'
            >
              🗑️ Delete
            </button>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================================
   Edit Profile
   ========================================================= */

async function editProfile(id) {

  try {

    let p = null;

    if (sb) {

      const { data, error } =
        await sb
          .from(TABLE)
          .select("*")
          .eq("id", id)
          .maybeSingle();

      if (error) {
        throw error;
      }

      p = data;

    } else {

      const rows =
        JSON.parse(
          localStorage.getItem("demoProfiles") || "[]"
        );

      p =
        rows.find(function (x) {
          return String(x.id) === String(id);
        });
    }

    if (!p) {
      alert("Profile পাওয়া যায়নি");
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


    const ageText =
      prompt(
        "বয়স:",
        p.age ?? ""
      );

    if (ageText === null) return;


    const death_reason =
      prompt(
        "মৃত্যুর কারণ:",
        p.death_reason || ""
      );

    if (death_reason === null) return;


    const date =
      prompt(
        "তারিখ:",
        p.date || ""
      );

    if (date === null) return;


    const updates = {

      name: name.trim(),

      father: father.trim(),

      village: village.trim(),

      age:
        ageText.trim()
          ? Number(ageText)
          : null,

      death_reason:
        death_reason.trim(),

      date:
        date.trim()
    };


    if (sb) {

      const { error } =
        await sb
          .from(TABLE)
          .update(updates)
          .eq("id", id);

      if (error) {
        throw error;
      }

    } else {

      let rows =
        JSON.parse(
          localStorage.getItem("demoProfiles") || "[]"
        );

      rows =
        rows.map(function (x) {

          return String(x.id) === String(id)
            ? { ...x, ...updates }
            : x;

        });

      localStorage.setItem(
        "demoProfiles",
        JSON.stringify(rows)
      );
    }


    alert("✅ Profile আপডেট হয়েছে");

    await loadProfiles(
      adminSearch
        ? adminSearch.value.trim()
        : ""
    );

    await updateDashboardStats();

  } catch (error) {

    console.error(error);

    alert(
      "❌ Edit করা যায়নি:\n" +
      (error.message || error)
    );
  }
}


/* =========================================================
   Delete Profile
   ========================================================= */

async function deleteProfile(id) {

  const ok =
    confirm(
      "এই Profile-টি স্থায়ীভাবে Delete করবেন?"
    );

  if (!ok) return;


  try {

    if (sb) {

      const { error } =
        await sb
          .from(TABLE)
          .delete()
          .eq("id", id);

      if (error) {
        throw error;
      }

    } else {

      let rows =
        JSON.parse(
          localStorage.getItem("demoProfiles") || "[]"
        );

      rows =
        rows.filter(function (x) {

          return String(x.id) !== String(id);

        });

      localStorage.setItem(
        "demoProfiles",
        JSON.stringify(rows)
      );
    }


    alert("✅ Profile Delete হয়েছে");


    await loadProfiles(
      adminSearch
        ? adminSearch.value.trim()
        : ""
    );

    await updateDashboardStats();

  } catch (error) {

    console.error(error);

    alert(
      "❌ Delete করা যায়নি:\n" +
      (error.message || error)
    );
  }
}


/* =========================================================
   Search
   ========================================================= */

if (adminSearchBtn) {

  adminSearchBtn.addEventListener(
    "click",
    function () {

      loadProfiles(
        adminSearch.value.trim()
      );

    }
  );
}


if (adminSearch) {

  adminSearch.addEventListener(
    "keydown",
    function (e) {

      if (e.key === "Enter") {

        loadProfiles(
          adminSearch.value.trim()
        );
      }

    }
  );
}


/* =========================================================
   Dashboard Stats
   ========================================================= */

async function updateDashboardStats() {

  try {

    let rows = [];

    if (sb) {

      const { data, error } =
        await sb
          .from(TABLE)
          .select("created_at");

      if (!error) {
        rows = data || [];
      }

    } else {

      rows =
        JSON.parse(
          localStorage.getItem("demoProfiles") || "[]"
        );
    }


    const now =
      new Date();

    const monthly =
      rows.filter(function (x) {

        if (!x.created_at) return false;

        const d =
          new Date(x.created_at);

        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );

      }).length;


    const totalElement =
      document.getElementById("dashTotal");

    const monthlyElement =
      document.getElementById("dashMonthly");


    if (totalElement) {
      totalElement.textContent =
        rows.length;
    }

    if (monthlyElement) {
      monthlyElement.textContent =
        monthly;
    }

  } catch (error) {

    console.error(error);
  }
}


/* =========================================================
   Start
   ========================================================= */

refreshAuth();
