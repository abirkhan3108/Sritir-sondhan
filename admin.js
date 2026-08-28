/* =========================================================
   স্মৃতি সংরক্ষণ — ADMIN JS
   EDIT + DELETE FIXED
   ========================================================= */

const SUPABASE_READY =
  window.supabase &&
  window.SUPABASE_URL &&
  window.SUPABASE_ANON_KEY &&
  window.SUPABASE_URL.includes("supabase.co") &&
  !window.SUPABASE_URL.includes("PASTE_");

const sb = SUPABASE_READY
  ? window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    )
  : null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const loginSection = document.getElementById("loginSection");
const adminPanel = document.getElementById("adminPanel");

const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");

const profileForm = document.getElementById("profileForm");
const adminMsg = document.getElementById("adminMsg");

const photoFile = document.getElementById("photoFile");

const adminProfiles = document.getElementById("adminProfiles");
const adminSearch = document.getElementById("adminSearch");
const adminSearchBtn = document.getElementById("adminSearchBtn");

const logoutBtn = document.getElementById("logoutBtn");


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showMessage(text, type = "") {
  if (!adminMsg) return;

  adminMsg.textContent = text;

  adminMsg.className = "message";

  if (type === "error") {
    adminMsg.classList.add("error");
  }

  if (type === "success") {
    adminMsg.classList.add("success");
  }
}


/* =========================================================
   AUTH
   ========================================================= */

async function refreshAuth() {

  if (!sb) {

    loginSection?.classList.add("hidden");
    adminPanel?.classList.remove("hidden");

    return;
  }

  try {

    const result = await sb.auth.getSession();

    const session = result?.data?.session;

    if (session) {

      loginSection?.classList.add("hidden");
      adminPanel?.classList.remove("hidden");

      await loadProfiles();

    } else {

      loginSection?.classList.remove("hidden");
      adminPanel?.classList.add("hidden");

    }

  } catch (error) {

    console.error(error);

    loginSection?.classList.remove("hidden");
    adminPanel?.classList.add("hidden");

  }
}


/* =========================================================
   LOGIN
   ========================================================= */

if (loginForm) {

  loginForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    if (!sb) {

      loginMsg.textContent =
        "❌ Supabase config.js সঠিকভাবে সেট করা নেই।";

      return;
    }

    loginMsg.textContent = "Login হচ্ছে...";

    const email =
      document.getElementById("email")?.value.trim();

    const password =
      document.getElementById("password")?.value;

    try {

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

      loginMsg.textContent = "✅ Login সফল";

      await refreshAuth();

    } catch (error) {

      loginMsg.textContent =
        "❌ " + error.message;

    }

  });

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutBtn) {

  logoutBtn.addEventListener("click", async function () {

    if (sb) {
      await sb.auth.signOut();
    }

    await refreshAuth();

  });

}


/* =========================================================
   PHOTO UPLOAD
   ========================================================= */

async function uploadPhoto(file) {

  if (!file) {
    return null;
  }

  if (!sb) {
    return null;
  }

  if (file.size > 5 * 1024 * 1024) {

    throw new Error(
      "ছবির সাইজ ৫ MB-এর মধ্যে রাখুন।"
    );

  }

  const extension =
    (file.name.split(".").pop() || "jpg")
      .toLowerCase();

  const path =
    "profiles/" +
    crypto.randomUUID() +
    "." +
    extension;

  const { error } =
    await sb.storage
      .from("profile-photos")
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

  const publicURL =
    sb.storage
      .from("profile-photos")
      .getPublicUrl(path);

  return publicURL?.data?.publicUrl || null;
}


/* =========================================================
   ADD PROFILE
   ========================================================= */

if (profileForm) {

  profileForm.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();

      showMessage("সংরক্ষণ করা হচ্ছে...");

      try {

        const formData =
          new FormData(profileForm);

        const name =
          String(formData.get("name") || "").trim();

        const father =
          String(formData.get("father") || "").trim();

        const village =
          String(formData.get("village") || "").trim();

        const ageValue =
          String(formData.get("age") || "").trim();

        const death_reason =
          String(
            formData.get("death_reason") || ""
          ).trim();

        const date =
          String(formData.get("date") || "").trim();

        if (!name) {

          showMessage(
            "❌ নাম দিতে হবে।",
            "error"
          );

          return;
        }

        const age =
          ageValue === ""
            ? null
            : Number(ageValue);

        let photo_url = null;

        if (
          photoFile &&
          photoFile.files &&
          photoFile.files[0]
        ) {

          photo_url =
            await uploadPhoto(
              photoFile.files[0]
            );

        }


        /* -----------------------------------------
           SUPABASE
           ----------------------------------------- */

        if (sb) {

          const { error } =
            await sb
              .from("profiles")
              .insert({

                name,
                father,
                village,
                age,
                death_reason,
                date: date || null,
                photo_url,
                created_at:
                  new Date().toISOString()

              });

          if (error) {
            throw error;
          }

        }


        /* -----------------------------------------
           DEMO MODE
           ----------------------------------------- */

        else {

          const oldData =
            JSON.parse(
              localStorage.getItem(
                "demoProfiles"
              ) || "[]"
            );

          oldData.push({

            id: crypto.randomUUID(),

            name,
            father,
            village,
            age,
            death_reason,
            date: date || null,
            photo_url: null,

            created_at:
              new Date().toISOString()

          });

          localStorage.setItem(
            "demoProfiles",
            JSON.stringify(oldData)
          );

        }


        profileForm.reset();

        showMessage(
          "✅ Profile সফলভাবে যোগ হয়েছে।",
          "success"
        );

        await loadProfiles();

      } catch (error) {

        console.error(error);

        showMessage(
          "❌ " + error.message,
          "error"
        );

      }

    }
  );

}


/* =========================================================
   LOAD PROFILES
   ========================================================= */

async function loadProfiles(searchText = "") {

  if (!adminProfiles) return;


  /* -----------------------------------------
     SUPABASE
     ----------------------------------------- */

  if (sb) {

    let query =
      sb
        .from("profiles")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


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

      console.error(error);

      adminProfiles.innerHTML =
        `<p class="error">
          ❌ ${escapeHTML(error.message)}
        </p>`;

      return;
    }


    renderProfiles(data || []);

    updateDashboardStats(
      data || []
    );

    return;

  }


  /* -----------------------------------------
     LOCAL STORAGE
     ----------------------------------------- */

  let rows =
    JSON.parse(
      localStorage.getItem(
        "demoProfiles"
      ) || "[]"
    );


  if (searchText) {

    rows =
      rows.filter(
        p =>
          String(
            p.name || ""
          )
            .toLowerCase()
            .includes(
              searchText.toLowerCase()
            )
      );

  }


  renderProfiles(rows);

  updateDashboardStats(rows);

}


/* =========================================================
   RENDER PROFILES
   ========================================================= */

function renderProfiles(rows) {

  if (!adminProfiles) return;


  if (!rows.length) {

    adminProfiles.innerHTML =
      "<p>কোনো Profile পাওয়া যায়নি।</p>";

    return;

  }


  adminProfiles.innerHTML =
    rows.map(function (p) {

      const id =
        String(p.id || "");


      return `

        <div
          class="profile-item"
          style="
            margin-bottom:16px;
            padding:16px;
            border-radius:14px;
          "
        >

          <div class="profile-name">
            ${escapeHTML(p.name || "নাম নেই")}
          </div>

          <div class="profile-info">

            ${escapeHTML(
              p.village || ""
            )}

            ${p.age !== null &&
              p.age !== undefined &&
              p.age !== ""
              ? " · " +
                escapeHTML(p.age) +
                " বছর"
              : ""}

          </div>


          <div
            class="profile-actions"
            style="
              display:flex;
              gap:12px;
              margin-top:14px;
            "
          >

            <button
              type="button"
              class="primary edit-profile-btn"
              data-id="${escapeHTML(id)}"
              style="
                min-width:120px;
                padding:14px 18px;
                touch-action:manipulation;
              "
            >
              ✏️ Edit
            </button>


            <button
              type="button"
              class="danger delete-profile-btn"
              data-id="${escapeHTML(id)}"
              style="
                min-width:120px;
                padding:14px 18px;
                touch-action:manipulation;
              "
            >
              🗑️ Delete
            </button>

          </div>

        </div>

      `;

    }).join("");

}


/* =========================================================
   BUTTON EVENT DELEGATION
   ========================================================= */

if (adminProfiles) {

  adminProfiles.addEventListener(
    "click",
    async function (e) {

      const editButton =
        e.target.closest(
          ".edit-profile-btn"
        );

      const deleteButton =
        e.target.closest(
          ".delete-profile-btn"
        );


      /* -----------------------------------------
         EDIT
         ----------------------------------------- */

      if (editButton) {

        e.preventDefault();
        e.stopPropagation();

        const id =
          editButton.dataset.id;

        if (!id) return;

        await editProfile(id);

        return;
      }


      /* -----------------------------------------
         DELETE
         ----------------------------------------- */

      if (deleteButton) {

        e.preventDefault();
        e.stopPropagation();

        const id =
          deleteButton.dataset.id;

        if (!id) return;

        await deleteProfile(id);

        return;
      }

    }
  );

}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

async function editProfile(id) {

  try {

    let profile = null;


    /* -----------------------------------------
       GET PROFILE
       ----------------------------------------- */

    if (sb) {

      const { data, error } =
        await sb
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();


      if (error) {
        throw error;
      }

      profile = data;

    } else {

      const rows =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "[]"
        );

      profile =
        rows.find(
          p =>
            String(p.id) ===
            String(id)
        );

    }


    if (!profile) {

      alert(
        "❌ Profile পাওয়া যায়নি।"
      );

      return;
    }


    /* -----------------------------------------
       EDIT FORM
       ----------------------------------------- */

    const name =
      prompt(
        "নাম:",
        profile.name || ""
      );

    if (name === null) return;


    const father =
      prompt(
        "পিতা/স্বামীর নাম:",
        profile.father || ""
      );

    if (father === null) return;


    const village =
      prompt(
        "গ্রাম:",
        profile.village || ""
      );

    if (village === null) return;


    const age =
      prompt(
        "বয়স:",
        profile.age ?? ""
      );

    if (age === null) return;


    const death_reason =
      prompt(
        "মৃত্যুর কারণ:",
        profile.death_reason || ""
      );

    if (death_reason === null) return;


    const date =
      prompt(
        "মৃত্যুর তারিখ (YYYY-MM-DD):",
        profile.date || ""
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
        date.trim() === ""
          ? null
          : date.trim()

    };


    if (!updates.name) {

      alert(
        "❌ নাম খালি রাখা যাবে না।"
      );

      return;
    }


    /* -----------------------------------------
       SUPABASE UPDATE
       ----------------------------------------- */

    if (sb) {

      const { data, error } =
        await sb
          .from("profiles")
          .update(updates)
          .eq("id", id)
          .select()
          .single();


      if (error) {
        throw error;
      }


      if (!data) {

        throw new Error(
          "Profile Update হয়নি। RLS policy পরীক্ষা করুন।"
        );

      }

    }


    /* -----------------------------------------
       LOCAL UPDATE
       ----------------------------------------- */

    else {

      const rows =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "[]"
        );


      const newRows =
        rows.map(function (p) {

          if (
            String(p.id) ===
            String(id)
          ) {

            return {
              ...p,
              ...updates
            };

          }

          return p;

        });


      localStorage.setItem(
        "demoProfiles",
        JSON.stringify(newRows)
      );

    }


    alert(
      "✅ Profile সফলভাবে Edit হয়েছে।"
    );


    await loadProfiles(
      adminSearch?.value.trim() || ""
    );


  } catch (error) {

    console.error(error);

    alert(
      "❌ Edit করা যায়নি:\n" +
      error.message
    );

  }

}


/* =========================================================
   DELETE PROFILE
   ========================================================= */

async function deleteProfile(id) {

  const ok =
    confirm(
      "⚠️ এই Profile-টি স্থায়ীভাবে Delete করবেন?"
    );

  if (!ok) {
    return;
  }


  try {


    /* -----------------------------------------
       SUPABASE
       ----------------------------------------- */

    if (sb) {

      const { data, error } =
        await sb
          .from("profiles")
          .delete()
          .eq("id", id)
          .select("id");


      if (error) {
        throw error;
      }


      if (!data || data.length === 0) {

        throw new Error(
          "Delete হয়নি। Supabase RLS policy অথবা Login session পরীক্ষা করুন।"
        );

      }

    }


    /* -----------------------------------------
       LOCAL STORAGE
       ----------------------------------------- */

    else {

      const rows =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "[]"
        );


      const newRows =
        rows.filter(
          p =>
            String(p.id) !==
            String(id)
        );


      localStorage.setItem(
        "demoProfiles",
        JSON.stringify(newRows)
      );

    }


    alert(
      "✅ Profile Delete হয়েছে।"
    );


    await loadProfiles(
      adminSearch?.value.trim() || ""
    );


  } catch (error) {

    console.error(error);

    alert(
      "❌ Delete করা যায়নি:\n" +
      error.message
    );

  }

}


/* =========================================================
   SEARCH
   ========================================================= */

if (adminSearchBtn) {

  adminSearchBtn.type = "button";

  adminSearchBtn.addEventListener(
    "click",
    function (e) {

      e.preventDefault();
      e.stopPropagation();

      loadProfiles(
        adminSearch?.value.trim() || ""
      );

    }
  );

}


if (adminSearch) {

  adminSearch.addEventListener(
    "keydown",
    function (e) {

      if (e.key === "Enter") {

        e.preventDefault();

        loadProfiles(
          adminSearch.value.trim()
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
    document.getElementById(
      "dashTotal"
    );

  const monthly =
    document.getElementById(
      "dashMonthly"
    );


  if (total) {

    total.textContent =
      rows.length;

  }


  if (monthly) {

    const now = new Date();

    const count =
      rows.filter(function (p) {

        if (!p.created_at) {
          return false;
        }

        const date =
          new Date(
            p.created_at
          );

        return (
          date.getFullYear() ===
            now.getFullYear() &&
          date.getMonth() ===
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
