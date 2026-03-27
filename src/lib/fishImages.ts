/**
 * Fish species image URL mapping
 * All images hosted on CDN for production deployment
 */

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/117166162/gMtsz9xfzbMJD2GxerqqUC";

export const FISH_IMAGES: Record<string, string> = {
  // Tetras
  neon_tetra: `${CDN}/nSNeFFsAoGmT_6e1e8a3e.jpg`,
  cardinal_tetra: `${CDN}/LrMkuGeh8yme_cbc7b2f2.jpg`,
  rummy_nose_tetra: `${CDN}/rrFbCp6NqBgi_490a3b39.webp`,
  ember_tetra: `${CDN}/CsIMfpOSdiMs_9589b442.jpg`,
  black_skirt_tetra: `${CDN}/3vVqWNd1bM1p_118f51af.jpg`,
  congo_tetra: `${CDN}/8pKKraqYrXAw_3dd19184.jpg`,
  serpae_tetra: `${CDN}/ZkcoX2oQkF3H_25202305.jpg`,

  // Betta
  betta: `${CDN}/t5Ydnzy24nuc_2f1e7b6e.jpg`,

  // Livebearers
  guppy: `${CDN}/PQ5Bv72eur3o_a7e7e0b1.jpg`,
  endler_guppy: `${CDN}/tx3Wlwt6jRoK_a72a5d5a.jpg`,
  platy: `${CDN}/3eOp0ymBSWFO_98e12975.jpg`,
  molly: `${CDN}/mjZ2i9qMg77w_07476be1.jpg`,
  swordtail: `${CDN}/YJOxzKD2WApP_9deee321.jpg`,

  // Catfish & Plecos
  corydoras: `${CDN}/TCRMtJmyg22e_6f3e8f8e.jpg`,
  pygmy_corydoras: `${CDN}/5yKv1bN8PPWL_76ea0b7a.jpg`,
  glass_catfish: `${CDN}/b6mRr2BLoJfa_db2e5397.webp`,
  otocinclus: `${CDN}/PxMMJNwzOADx_65b7d8c6.jpg`,
  bristlenose_pleco: `${CDN}/uddn1N2TVA0g_1f2e8f8e.jpg`,
  common_pleco: `${CDN}/pw6u8FdP2bmk_c4424de1.jpg`,

  // Cichlids
  angelfish: `${CDN}/cuGaLL9vVyV7_e1e8f8e8.jpg`,
  german_blue_ram: `${CDN}/eeKbqoRBbRcw_0662903e.jpg`,
  oscar: `${CDN}/9xZCmuhlttW0_a1b2c3d4.png`,
  discus: `${CDN}/OW6gIPLoXNhV_c8d9e0f1.jpg`,
  electric_blue_acara: `${CDN}/X6C7PlrA2Ey5_8a3e31e3.jpg`,
  convict_cichlid: `${CDN}/V9gh5S62gN61_319a773e.jpg`,
  kribensis: `${CDN}/G3OCbBbtYHkf_723f5345.jpg`,
  apistogramma: `${CDN}/ft7rJNQdrcx1_aba65df9.jpg`,

  // Gouramis
  dwarf_gourami: `${CDN}/iJopoxtaxKX2_701aa7bb.jpg`,
  pearl_gourami: `${CDN}/iJopoxtaxKX2_701aa7bb.jpg`,
  honey_gourami: `${CDN}/jdq6n7oGXV29_bc8bb4af.jpg`,
  three_spot_gourami: `${CDN}/j4bxrUHEqEVe_05e0bfda.jpg`,
  sparkling_gourami: `${CDN}/8msuslBdjNlp_fa1cbd7d.jpg`,

  // Barbs
  cherry_barb: `${CDN}/Y6CpSjK7lkUo_8da7e4e4.jpg`,
  tiger_barb: `${CDN}/Hp4JdtcmV0Dk_c909cc37.png`,
  rosy_barb: `${CDN}/TJxToezBqwSc_a87dd719.jpg`,
  denison_barb: `${CDN}/zFmVWF6NfoKm_96ec3d81.webp`,
  gold_barb: `${CDN}/exDNw2UzWLUk_798bbf01.jpg`,

  // Danios & Rasboras
  zebra_danio: `${CDN}/pVKy2L4QNAot_779479b8.jpg`,
  celestial_pearl_danio: `${CDN}/LHlZy0VPovgW_1bfdcf71.jpg`,
  harlequin_rasbora: `${CDN}/Ns5OOhUOKtkS_ca358888.jpg`,

  // Loaches
  kuhli_loach: `${CDN}/hCgaBWntBR3h_148627bd.jpg`,
  clown_loach: `${CDN}/wGrr5RlWQO0s_1e039bcd.jpg`,
  yoyo_loach: `${CDN}/MS8mzNFA7NVg_0429a732.jpg`,
  dwarf_chain_loach: `${CDN}/MS8mzNFA7NVg_0429a732.jpg`,

  // Rainbowfish
  boesemani_rainbowfish: `${CDN}/H2siDdjlJ7zt_3b2ed82e.jpg`,
  celebes_rainbowfish: `${CDN}/KkOgRj5Wq3qW_06105946.jpg`,

  // Algae Eaters & Minnows
  siamese_algae_eater: `${CDN}/gOwccmItrrZo_4055f6dd.jpg`,
  white_cloud_minnow: `${CDN}/GPacBXYKh7eu_798ca676.jpg`,

  // Invertebrates
  amano_shrimp: `${CDN}/gGDZqOjbnKgf_07258f34.jpg`,
  cherry_shrimp: `${CDN}/Z2CiQBllfZhI_c0858922.jpg`,
};

export function getFishImage(id: string): string {
  return FISH_IMAGES[id] || "";
}
