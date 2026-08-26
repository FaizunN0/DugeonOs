// Modal pilihan ringan (gimmick/event). Bagian dari ui/kit.
export function choiceModal(title, html, choices, after) {
  const root = document.getElementById("phone") || document.body;
  const m = document.createElement("div");
  m.className = "modal-pop";
  const btns = choices.map((c, i) => `<button class="modal-choice" data-i="${i}">${c.label}</button>`).join("");
  m.innerHTML = `<div class="modal-card"><div class="modal-title">${title}</div><div class="modal-body">${html}</div><div class="modal-choices">${btns}</div></div>`;
  m.addEventListener("click", e => { if (e.target === m) m.remove(); });
  m.querySelectorAll(".modal-choice").forEach(b => b.addEventListener("click", () => {
    const c = choices[Number(b.dataset.i)];
    m.remove();
    if (c && c.run) c.run();
    if (after) after();
  }));
  root.appendChild(m);
  return m;
}
