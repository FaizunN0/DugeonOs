// Sheet — panel bawah gaya mobile untuk konfirmasi/aksi cepat. Bagian dari ui/kit.
export function openSheet({ title, html, actions = [] }) {
  const root = document.getElementById("phone") || document.body;
  const wrap = document.createElement("div");
  wrap.className = "sheet-backdrop";
  const btns = actions.map((a, i) =>
    `<button class="sheet-btn ${a.cls || ""}" data-i="${i}">${a.label}</button>`).join("");
  wrap.innerHTML = `
    <div class="sheet">
      <div class="sheet-grab"></div>
      <div class="sheet-title">${title}</div>
      <div class="sheet-body">${html}</div>
      <div class="sheet-actions">${btns}</div>
    </div>`;
  const close = () => { wrap.classList.add("closing"); setTimeout(() => wrap.remove(), 180); };
  wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
  wrap.querySelectorAll(".sheet-btn").forEach(b => b.addEventListener("click", () => {
    const a = actions[Number(b.dataset.i)];
    close();
    if (a && a.run) a.run();
  }));
  root.appendChild(wrap);
  return close;
}
