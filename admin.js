/* =========================================================
   স্মৃতি সংরক্ষণ — ADMIN JS
   Edit + Delete FIXED
   ========================================================= */

const sb =
  (window.supabase &&
   window.SUPABASE_URL &&
   window.SUPABASE_ANON_KEY &&
   window.SUPABASE_URL.includes("supabase.co") &&
   !window.SUPABASE_URL.includes("YOUR-"))
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

const form = document.getElementById("profileForm");
const msg = document.getElementById("adminMsg");

const photoFile = document.getElementById("photoFile");

const adminProfiles = document.getElementById("adminProfiles");
const adminSearch = document.getElementById("adminSearch");
const adminSearchBtn = document.getElementById("adminSearchBtn");

let currentProfiles = [];


/* =========================================================
   AUTH
   ========================================================= */

async function refreshAuth() {

  if (!sb) {
    if (loginSection) loginSection.classList.add("hidden");
    if (adminPanel) adminPanel.classList.remove("hidden");

    await loadProfiles();
    updateDashboardStats();
    return;
  }

  const { data, error } = await sb.auth.getSession();

  if (error) {
    console.error(error);

    if (loginSection) loginSection.classList.remove("hidden");
    if (adminPanel) adminPanel.classList.add("hidden");

    return;
  }

  if (data && data.session) {

    if (loginSection) loginSection.classList.add("hidden");
    if (adminPanel) adminPanel.classList.remove("hidden");

    await loadProfiles();
    updateDashboardStats();

  } else {

    if (loginSection) loginSection.classList.remove("hidden");
    if (adminPanel) adminPanel.classList.add("hidden");

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
        "❌ Supabase config পাওয়া যায়নি";
      return;
    }

    loginMsg.textContent = "লগইন হচ্ছে...";

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
   LOGOUT
   ========================================================= */

const logoutBtn =
  document.getElementById("logoutBtn");

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

  if (!file) return null;

  if (!sb) {
    throw new Error("Supabase সংযোগ নেই");
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
          contentType: file.type
        }
      );

  if (error) {
    throw error;
  }

  return sb.storage
    .from("profile-photos")
    .getPublicUrl(path)
    .data
    .publicUrl;
}


/* =========================================================
   ADD PROFILE
   ========================================================= */

if (form) {

  form.addEventListener("submit", async function (e) {

    e.preventDefault();

    if (msg) {
      msg.textContent =
        "সংরক্ষণ করা হচ্ছে...";
      msg.className = "message";
    }

    try {

      const fd =
        new FormData(form);

      const name =
        String(fd.get("name") || "").trim();

      const father =
        String(fd.get("father") || "").trim();

      const village =
        String(fd.get("village") || "").trim();

      const ageValue =
        String(fd.get("age") || "").trim();

      const deathReason =
        String(fd.get("death_reason") || "").trim();

      const date =
        String(fd.get("date") || "").trim();

      if (!name) {
        throw new Error("নাম লিখুন");
      }


      if (sb) {

        const photo =
          photoFile &&
          photoFile.files &&
          photoFile.files[0]
            ? await uploadPhoto(
                photoFile.files[0]
              )
            : null;


        /*
          আপনার profiles টেবিলের বিভিন্ন
          সম্ভাব্য column নাম অনুযায়ী data তৈরি করা হচ্ছে।
        */

        const insertData = {
          name: name,
          father_husband: father || null,
          address: village || null,
          age: ageValue
            ? Number(ageValue)
            : null,
          death_reason:
            deathReason || null,
          death_date:
            date || null,
          photo_url:
            photo || null
        };


        const { error } =
          await sb
            .from("profiles")
            .insert(insertData);

        if (error) {
          throw error;
        }

      } else {

        let arr =
          JSON.parse(
            localStorage.getItem(
              "demoProfiles"
            ) || "null"
          ) || [];

        arr.push({

          id: Date.now(),

          name,

          father_husband:
            father,

          address:
            village,

          age:
            ageValue
              ? Number(ageValue)
              : null,

          death_reason:
            deathReason,

          death_date:
            date,

          photo_url:
            null,

          created_at:
            new Date().toISOString()

        });

        localStorage.setItem(
          "demoProfiles",
          JSON.stringify(arr)
        );

      }


      form.reset();

      if (msg) {
        msg.textContent =
          "✅ Profile সফলভাবে যোগ হয়েছে";

        msg.className =
          "message success";
      }

      await loadProfiles(
        adminSearch
          ? adminSearch.value.trim()
          : ""
      );

      updateDashboardStats();


    } catch (err) {

      console.error(err);

      if (msg) {
        msg.textContent =
          "❌ " + (
            err.message ||
            "Profile যোগ করা যায়নি"
          );

        msg.className =
          "message error";
      }

    }

  });

}


/* =========================================================
   LOAD PROFILES
   ========================================================= */

async function loadProfiles(q = "") {

  try {

    if (!sb) {

      const rows =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "null"
        ) || [];

      const filtered =
        q
          ? rows.filter(p =>
              String(p.name || "")
                .toLocaleLowerCase("bn-BD")
                .includes(
                  q.toLocaleLowerCase("bn-BD")
                )
            )
          : rows;

      currentProfiles =
        filtered;

      renderAdminProfiles(
        filtered
      );

      return;
    }


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


    if (error) {
      throw error;
    }


    currentProfiles =
      data || [];


    renderAdminProfiles(
      currentProfiles
    );


  } catch (err) {

    console.error(err);

    if (adminProfiles) {

      adminProfiles.innerHTML =
        `
        <div style="
          padding:15px;
          color:#d7263d;
          background:#fff0f2;
          border-radius:12px;
          line-height:1.7;
        ">
          ❌ Profile লোড করা যায়নি<br>
          ${escapeAdmin(
            err.message ||
            "Unknown error"
          )}
        </div>
        `;

    }

  }

}


/* =========================================================
   ESCAPE
   ========================================================= */

function escapeAdmin(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function (m) {

        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[m];

      }
    );

}


/* =========================================================
   GET FIELD
   ========================================================= */

function getField(obj, names) {

  for (const name of names) {

    if (
      Object.prototype.hasOwnProperty.call(
        obj,
        name
      )
    ) {
      return obj[name];
    }

  }

  return "";

}


/* =========================================================
   RENDER PROFILES
   ========================================================= */

function renderAdminProfiles(rows) {

  if (!adminProfiles) return;


  if (!rows.length) {

    adminProfiles.innerHTML =
      `
      <div class="profile-item">
        <p>
          কোনো Profile পাওয়া যায়নি।
        </p>
      </div>
      `;

    return;
  }


  adminProfiles.innerHTML =
    rows.map(function (p) {

      const father =
        getField(
          p,
          [
            "father_husband",
            "father",
            "spouse"
          ]
        );

      const address =
        getField(
          p,
          [
            "address",
            "village"
          ]
        );

      const age =
        getField(
          p,
          ["age"]
        );


      /*
        IMPORTANT:
        এখানে আর onclick="editProfile(...)"
        বা onclick="deleteProfile(...)"
        ব্যবহার করা হচ্ছে না।

        UUID থাকলেও data-id নিরাপদে কাজ করবে।
      */

      return `
        <div
          class="profile-item"
          data-profile-id="${escapeAdmin(p.id)}"
          style="
            margin-bottom:14px;
            padding:16px;
            border:1px solid #e1e5ea;
            border-radius:14px;
            background:#fff;
          "
        >

          <div
            style="
              font-size:19px;
              font-weight:800;
              margin-bottom:5px;
            "
          >
            ${escapeAdmin(p.name || "নাম নেই")}
          </div>


          <div
            style="
              color:#666;
              line-height:1.7;
              margin-bottom:12px;
            "
          >
            ${escapeAdmin(address || "")}
            ${age !== "" ? " · " + escapeAdmin(age) + " বছর" : ""}
          </div>


          <div
            style="
              display:flex;
              gap:12px;
              width:100%;
            "
          >

            <button
              type="button"
              class="edit-profile-btn"
              data-id="${escapeAdmin(p.id)}"
              style="
                flex:1;
                min-height:52px;
                border:0;
                border-radius:12px;
                background:#1261d6;
                color:white;
                font-size:17px;
                font-weight:700;
                cursor:pointer;
                touch-action:manipulation;
              "
            >
              ✏️ Edit
            </button>


            <button
              type="button"
              class="delete-profile-btn"
              data-id="${escapeAdmin(p.id)}"
              style="
                flex:1;
                min-height:52px;
                border:0;
                border-radius:12px;
                background:#d7263d;
                color:white;
                font-size:17px;
                font-weight:700;
                cursor:pointer;
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
   BUTTON EVENT — EDIT
   ========================================================= */

if (adminProfiles) {

  adminProfiles.addEventListener(
    "click",
    async function (e) {

      const editButton =
        e.target.closest(
          ".edit-profile-btn"
        );


      if (editButton) {

        e.preventDefault();
        e.stopPropagation();

        const id =
          editButton.dataset.id;

        await editProfile(id);

        return;
      }


      const deleteButton =
        e.target.closest(
          ".delete-profile-btn"
        );


      if (deleteButton) {

        e.preventDefault();
        e.stopPropagation();

        const id =
          deleteButton.dataset.id;

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

    if (!id) {
      alert("Profile ID পাওয়া যায়নি");
      return;
    }


    let p = null;


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


      if (error) {
        alert(
          "Profile পাওয়া যায়নি:\n" +
          error.message
        );
        return;
      }


      p = data;

    } else {

      const arr =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "null"
        ) || [];


      p =
        arr.find(
          x =>
            String(x.id) ===
            String(id)
        );

    }


    if (!p) {

      alert(
        "এই Profile আর পাওয়া যাচ্ছে না।"
      );

      return;
    }


    const oldName =
      getField(
        p,
        ["name"]
      );


    const oldFather =
      getField(
        p,
        [
          "father_husband",
          "father",
          "spouse"
        ]
      );


    const oldAddress =
      getField(
        p,
        [
          "address",
          "village"
        ]
      );


    const oldAge =
      getField(
        p,
        ["age"]
      );


    const oldReason =
      getField(
        p,
        [
          "death_reason",
          "death_cause"
        ]
      );


    const oldDate =
      getField(
        p,
        [
          "death_date",
          "date"
        ]
      );


    const name =
      prompt(
        "নাম:",
        oldName || ""
      );

    if (name === null) return;


    const father =
      prompt(
        "পিতা / স্বামীর নাম:",
        oldFather || ""
      );

    if (father === null) return;


    const address =
      prompt(
        "গ্রাম / ঠিকানা:",
        oldAddress || ""
      );

    if (address === null) return;


    const age =
      prompt(
        "বয়স:",
        oldAge ?? ""
      );

    if (age === null) return;


    const reason =
      prompt(
        "মৃত্যুর কারণ:",
        oldReason || ""
      );

    if (reason === null) return;


    const date =
      prompt(
        "মৃত্যুর তারিখ (YYYY-MM-DD):",
        oldDate || ""
      );

    if (date === null) return;


    /*
      শুধুমাত্র যে column সত্যিই
      profiles row-তে আছে সেটাই update করা হবে।
    */

    const updates = {};


    if (
      Object.prototype.hasOwnProperty.call(
        p,
        "name"
      )
    ) {
      updates.name =
        name.trim();
    }


    if (
      Object.prototype.hasOwnProperty.call(
        p,
        "father_husband"
      )
    ) {
      updates.father_husband =
        father.trim() || null;

    } else if (
      Object.prototype.hasOwnProperty.call(
        p,
        "father"
      )
    ) {
      updates.father =
        father.trim() || null;

    } else if (
      Object.prototype.hasOwnProperty.call(
        p,
        "spouse"
      )
    ) {
      updates.spouse =
        father.trim() || null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        p,
        "address"
      )
    ) {
      updates.address =
        address.trim() || null;

    } else if (
      Object.prototype.hasOwnProperty.call(
        p,
        "village"
      )
    ) {
      updates.village =
        address.trim() || null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        p,
        "age"
      )
    ) {
      updates.age =
        age.trim()
          ? Number(age)
          : null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        p,
        "death_reason"
      )
    ) {
      updates.death_reason =
        reason.trim() || null;

    } else if (
      Object.prototype.hasOwnProperty.call(
        p,
        "death_cause"
      )
    ) {
      updates.death_cause =
        reason.trim() || null;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        p,
        "death_date"
      )
    ) {
      updates.death_date =
        date.trim() || null;

    } else if (
      Object.prototype.hasOwnProperty.call(
        p,
        "date"
      )
    ) {
      updates.date =
        date.trim() || null;
    }


    if (sb) {

      const {
        error
      } =
        await sb
          .from("profiles")
          .update(updates)
          .eq("id", id);


      if (error) {

        alert(
          "❌ Edit করা যায়নি:\n\n" +
          error.message
        );

        return;
      }


      alert(
        "✅ Profile সফলভাবে Edit হয়েছে"
      );


    } else {

      let arr =
        JSON.parse(
          localStorage.getItem(
            "demoProfiles"
          ) || "null"
        ) || [];


      arr =
        arr.map(
          x =>
            String(x.id) ===
            String(id)
              ? {
                  ...x,
                  ...updates
                }
              : x
        );


      localStorage.setItem(
        "demoProfiles",
        JSON.stringify(arr)
      );


      alert(
        "✅ Profile সফলভাবে Edit হয়েছে"
      );

    }


    await loadProfiles(
      adminSearch
        ? adminSearch.value.trim()
        : ""
    );

    updateDashboardStats();


  } catch (err) {

    console.error(err);

    alert(
      "❌ Edit করতে সমস্যা হয়েছে:\n\n" +
      (
        err.message ||
        "Unknown error"
      )
    );

  }

}


/* =========================================================
   DELETE PROFILE
   ========================================================= */

async function deleteProfile(id) {

  try {

    if (!id) {

      alert(
        "Profile ID পাওয়া যায়নি"
      );

      return;
    }


    const ok =
      confirm(
        "এই Profile-টি স্থায়ীভাবে Delete করবেন?"
      );


    if (!ok) return;


    if (sb) {

      const {
        error
      } =
        await sb
          .from("profiles")
          .delete()
          .eq("id", id);


      if (error) {

        alert(
          "❌ Delete করা যায়নি:\n\n" +
          error.message
        );

        return;
      }


      alert(
        "✅ Profile Delete হয়েছে"
      );


    
