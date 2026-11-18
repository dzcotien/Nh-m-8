document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("profile-form");
  if (!form) return;
  const msg = document.getElementById("form-message");
  try {
    const r = await fetch("../backend/api/profile.php");
    if (r.status === 401 || r.status === 403) {
      location.href = "login.html";
      return;
    }
    const j = await r.json();
    if (!r.ok) throw Error(j.thong_bao);
    for (const [k, v] of Object.entries(j.data || {})) {
      const input = form.elements.namedItem(k);
      if (input) input.value = v || "";
    }
  } catch (e) {
    msg.textContent = e.message;
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const r = await fetch("../backend/api/profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.thong_bao);
      msg.textContent = j.thong_bao;
      msg.style.color = "#246a42";
    } catch (e) {
      msg.textContent = e.message;
      msg.style.color = "#b32b2b";
    }
  });
});
