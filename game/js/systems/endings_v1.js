// Ending v1.0 berbasis kondisi simulasi (Fase 3).
// Prioritas: bankrut > republik minion > rahasia MKM.
import { getState, setEnding } from "../state.js";
import { on } from "../core/eventBus.js";
import { V1_ENDINGS } from "../content/endings.js";

function check() {
  const st = getState();
  if (!st || !st.economy || !st.minionsCorp || !st.sim) return;

  // 1. Bankrut: gagal gaji 3 hari beruntun.
  if ((st.economy.unpaidStreak || 0) >= 3) {
    setEnding(V1_ENDINGS.bankrut);
    return;
  }
  // 2. Republik: semua pegawai mogok serempak (minimal ada 2 pegawai).
  const hired = st.minionsCorp.hired || [];
  if (hired.length >= 2 && hired.every(m => m.mogok)) {
    setEnding(V1_ENDINGS.republik);
    return;
  }
  // 3. Rahasia MKM: dua hari operasional setelah legenda resmi jadi karyawan.
  if (st.flags.mkmHired) {
    if (st.flags.mkmDay == null) {
      st.flags.mkmDay = st.sim.day;
    } else if (st.sim.day - st.flags.mkmDay >= 2) {
      setEnding(V1_ENDINGS.mkm);
    }
  }
}

let bound = false;
export function initEndingsV1() {
  if (bound) return;
  bound = true;
  on("sim:newDay", check);
}
