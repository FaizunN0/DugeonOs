// Data trap pertahanan + katalog commerce (APP RENEWAL v1.1 W2). Balancing = edit di sini.
// dmg = damage sekali picu; cd = jeda antar picu (ms); slow = faktor pelambat (opsional).
export const TRAPS = {
  bawang: { id: "bawang", name: "Trap Bawang",      emo: "🧅", price: 25,  dmg: 12, cd: 900,  invKey: "trap_bawang",
            desc: "Klasik. Hero menangis, harga bawang naik." },
  duri:   { id: "duri",   name: "Trap Duri",        emo: "⚔️", price: 55,  dmg: 26, cd: 1200, invKey: "trap_duri",
            desc: "Nyiksa pelan-pelan. Favorit departemen keuangan." },
  ilusi:  { id: "ilusi",  name: "Trap Ilusi",       emo: "🌀", price: 80,  dmg: 6,  cd: 1500, slow: true, invKey: "trap_ilusi",
            desc: "Hero muter mikir hidup. Langkah melambat." },
  naga:   { id: "naga",   name: "Napalm Naga Mini", emo: "🔥", price: 140, dmg: 60, cd: 2600, invKey: "trap_naga",
            desc: "Bisa diandalkan. Tidak bisa diajak kompromi." }
};
export const REFUND_RATE = 0.5;

// Review bintang palsu untuk katalog (semua 5 bintang, tentu saja).
export const SHOP_REVIEWS = {
  bawang: [
    { w: "Sir Rembes", t: "Trapnya bekerja. Korban: saya." },
    { w: "Panji P.",   t: "Menangis sejak masuk lorong. Bukan karena gagal, karena bawang." }
  ],
  duri: [
    { w: "Kaki Cepat", t: "Sudah tidak cepat lagi. Terima kasih sudah mendengarkan." },
    { w: "Departemen Keuangan", t: "ROI terbaik dalam sejarah penyiksaan legal." }
  ],
  ilusi: [
    { w: "Baja Tebal", t: "Saya berdiri di depannya selama 20 menit mempertanyakan karier." },
    { w: "Anonim",     t: "Lupa kenapa membeli. Pasti bagus." }
  ],
  naga: [
    { w: "Guild Hero", t: "Kami melarang anggota membawa item ini ke rapat damai." },
    { w: "Asuransi Dungeon", t: "Premi naik 12% sejak produk ini ada. Puji produk." }
  ]
};
