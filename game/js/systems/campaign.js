// Campaign runner (Fase 3): tampilkan babak di milestone hari operasional.
import { getState, mutate } from "../state.js";
import { toast } from "../ui/toast.js";
import { on } from "../core/eventBus.js";
import { CHAPTERS } from "../content/chapters.js";
import { choiceModal } from "../ui/kit/modal.js";
import { emit } from "../core/eventBus.js";

let showing = false;

function present(ch) {
  showing = true;
  const body = `<div>${ch.paras.map(p => `<p>${p}</p>`).join("")}</div><p class="modal-satir">Keputusanmu mengubah aturan simulasi. Tidak ada undo di birokrasi.</p>`;
  const choices = ch.choices.map(c => ({
    label: c.label,
    run: () => {
      mutate(st => c.apply(st));
      emit("social", { kind: "chapter", text: `${ch.title} — keputusan: ${c.label}` });
      if (c.satir) toast(c.satir, { ico: "feed", cls: "toast-ok" });
    }
  }));
  choiceModal(ch.title, body, choices, () => { showing = false; });
}

function maybeChapter({ day }) {
  if (showing) return;
  const st = getState();
  const done = st.campaign.done || [];
  const next = CHAPTERS.find(c => c.at <= day && !done.includes(c.id));
  if (!next) return;
  mutate(s2 => { s2.campaign.done.push(next.id); });
  setTimeout(() => present(next), 400);
}

let bound = false;
export function initCampaign() {
  if (bound) return;
  bound = true;
  on("sim:newDay", maybeChapter);
}
