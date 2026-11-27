import { AREA_NAMES, AREA_ORDER } from './realms';
import { AreaId } from './types';

export { AREA_NAMES, AREA_ORDER };

export type ChestWeaponRarity = 'Rare' | 'Epic' | 'Mythic' | 'Divya';

export interface ChestWeaponDef {
  id: string;
  name: string;
  rarity: ChestWeaponRarity;
  powerBonus: number;
  accentHex: number;
  accentColor: string;
  description: string;
}

export const CHEST_WEAPONS: ChestWeaponDef[] = [
  // RARE (Early Realms 1..15)
  {
    id: 'wpn_chandrahasa',
    name: 'Chandrahasa Crescent',
    rarity: 'Rare',
    powerBonus: 24,
    accentHex: 0x38bdf8,
    accentColor: '#38bdf8',
    description: 'Moon-forged curved blade humming with cool silver-blue astral light.',
  },
  {
    id: 'wpn_vayu_bow',
    name: 'Vayu-Vega Warbow',
    rarity: 'Rare',
    powerBonus: 28,
    accentHex: 0x34d399,
    accentColor: '#34d399',
    description: 'Wind-blessed bamboo and horn frame that accelerates strikes and arrows.',
  },
  {
    id: 'wpn_loha_gada',
    name: 'Kala-Loha Gada',
    rarity: 'Rare',
    powerBonus: 32,
    accentHex: 0xf97316,
    accentColor: '#f97316',
    description: 'Heavy temple iron mace forged to shatter corrupted stone guardians.',
  },
  {
    id: 'wpn_agni_talwar',
    name: 'Agni-Shikha Talwar',
    rarity: 'Rare',
    powerBonus: 36,
    accentHex: 0xfb7185,
    accentColor: '#fb7185',
    description: 'Ember-edged scimitar leaving sparks of consecrated fire on impact.',
  },
  {
    id: 'wpn_garuda_talwar',
    name: 'Garuda-Paksha Talwar',
    rarity: 'Rare',
    powerBonus: 40,
    accentHex: 0xfacc15,
    accentColor: '#facc15',
    description: 'Swift golden-winged curved sword prized by sky-shrine sentinels.',
  },

  // EPIC (Mid Realms 16..50)
  {
    id: 'wpn_pinaka_edge',
    name: 'Pinaka Astral Edge',
    rarity: 'Epic',
    powerBonus: 48,
    accentHex: 0x60a5fa,
    accentColor: '#60a5fa',
    description: 'Resonant celestial weapon tempered inside ancient baori shrines.',
  },
  {
    id: 'wpn_surya_kiran',
    name: 'Surya-Kiran Spear',
    rarity: 'Epic',
    powerBonus: 54,
    accentHex: 0xfbbf24,
    accentColor: '#fbbf24',
    description: 'Sunbeam lance blessed by riverside Rishis to pierce Kalyug mist.',
  },
  {
    id: 'wpn_parashu_axe',
    name: 'Bhargava Parashu',
    rarity: 'Epic',
    powerBonus: 62,
    accentHex: 0xef4444,
    accentColor: '#ef4444',
    description: 'Obsidian-cutting battle axe radiating fearless Kshatriya vigor.',
  },
  {
    id: 'wpn_gandiva_arc',
    name: 'Gandiva Starlight Arc',
    rarity: 'Epic',
    powerBonus: 68,
    accentHex: 0xa78bfa,
    accentColor: '#a78bfa',
    description: 'Twilight relic weapon infused with Vedic star-constellation resonance.',
  },
  {
    id: 'wpn_sharanga_arc',
    name: 'Sharanga Celestial Bowblade',
    rarity: 'Epic',
    powerBonus: 74,
    accentHex: 0x38bdf8,
    accentColor: '#38bdf8',
    description: 'Horn-and-ivory relic weapon humming with thunderous string harmonics.',
  },
  {
    id: 'wpn_vishwakarma_maul',
    name: 'Vishwakarma Anvil Edge',
    rarity: 'Epic',
    powerBonus: 80,
    accentHex: 0xf97316,
    accentColor: '#f97316',
    description: 'Master-crafted war relic inscribed by the divine architect.',
  },

  // MYTHIC (Deep Realms 51..85)
  {
    id: 'wpn_nandaka_blade',
    name: 'Nandaka Dawn Blade',
    rarity: 'Mythic',
    powerBonus: 88,
    accentHex: 0xfde047,
    accentColor: '#fde047',
    description: 'Pure golden relic weapon whose edge dissolves shadow illusions.',
  },
  {
    id: 'wpn_naga_fang',
    name: 'Vasuki Patala Fang',
    rarity: 'Mythic',
    powerBonus: 96,
    accentHex: 0x10b981,
    accentColor: '#10b981',
    description: 'Bioluminescent serpent-metal relic drawn from the deepest caverns.',
  },
  {
    id: 'wpn_kaumodaki',
    name: 'Kaumodaki Vajra-Mace',
    rarity: 'Mythic',
    powerBonus: 106,
    accentHex: 0x38bdf8,
    accentColor: '#38bdf8',
    description: 'Thunder-forged sovereign relic humming with cosmic shockwaves.',
  },
  {
    id: 'wpn_jyotish_chakra',
    name: 'Jyotish Eclipse Chakra',
    rarity: 'Mythic',
    powerBonus: 116,
    accentHex: 0xc084fc,
    accentColor: '#c084fc',
    description: 'Celestial ring-weapon calibrated to the planetary alignments of the ancients.',
  },
  {
    id: 'wpn_brahma_danda',
    name: 'Brahmadanda Radiant Staff',
    rarity: 'Mythic',
    powerBonus: 124,
    accentHex: 0xfef08a,
    accentColor: '#fef08a',
    description: 'Luminous sage-rod capable of absorbing entire storms of dark Tamas.',
  },
  {
    id: 'wpn_trilochana_spear',
    name: 'Trilochana Agni Lance',
    rarity: 'Mythic',
    powerBonus: 132,
    accentHex: 0xfb7185,
    accentColor: '#fb7185',
    description: 'Three-eyed fire spear forged in Himalayan glacial sanctuaries.',
  },

  // DIVYA (High Level & Final Realms 86..100)
  {
    id: 'wpn_rudra_khadga',
    name: 'Rudra-Teja Mahakhadga',
    rarity: 'Divya',
    powerBonus: 146,
    accentHex: 0xf97316,
    accentColor: '#f97316',
    description: 'Blazing divine greatblade awakened in the shadow of the Eclipse Gate.',
  },
  {
    id: 'wpn_pashupata_blade',
    name: 'Pashupata Ash-Edge',
    rarity: 'Divya',
    powerBonus: 158,
    accentHex: 0xe2e8f0,
    accentColor: '#e2e8f0',
    description: 'Bhasma-tempered cosmic weapon that shatters immortal Asura armor.',
  },
  {
    id: 'wpn_indra_vajra',
    name: 'Indra-Vajra Astra',
    rarity: 'Divya',
    powerBonus: 168,
    accentHex: 0x7dd3fc,
    accentColor: '#7dd3fc',
    description: 'Diamond-lightning weapon capable of cracking Kalyug boss armor.',
  },
  {
    id: 'wpn_narayana_chakra',
    name: 'Sudarshana Teja Edge',
    rarity: 'Divya',
    powerBonus: 178,
    accentHex: 0xfbbf24,
    accentColor: '#fbbf24',
    description: 'Solar-disc relic spinning with unstoppable Dharma radiance.',
  },
  {
    id: 'wpn_kalpa_mace',
    name: 'Kalpa-Yuga Sovereign Gada',
    rarity: 'Divya',
    powerBonus: 188,
    accentHex: 0x34d399,
    accentColor: '#34d399',
    description: 'Primeval golden mace forged across a hundred cycles of creation.',
  },
  {
    id: 'wpn_adi_jyoti',
    name: 'Adi-Shakti Jyoti Astra',
    rarity: 'Divya',
    powerBonus: 205,
    accentHex: 0xfde047,
    accentColor: '#fde047',
    description: 'Supreme luminous weapon forged from primordial Dharma light.',
  },
];

export function rollRandomBoxWeapon(
  level: number,
  areaId: AreaId,
  ownedIds: string[]
): ChestWeaponDef {
  const areaIdx = Math.max(0, AREA_ORDER.indexOf(areaId));
  const realmPct = areaIdx / Math.max(1, AREA_ORDER.length - 1);
  const levelPct = Math.max(0, level - 1) / 99;
  const combinedScore = Math.round((realmPct * 0.58 + levelPct * 0.42) * 100);

  let allowedRarities: ChestWeaponRarity[];
  if (combinedScore >= 72) {
    allowedRarities = ['Mythic', 'Divya'];
  } else if (combinedScore >= 42) {
    allowedRarities = ['Epic', 'Mythic', 'Divya'];
  } else if (combinedScore >= 16) {
    allowedRarities = ['Rare', 'Epic', 'Mythic'];
  } else {
    allowedRarities = ['Rare', 'Epic'];
  }

  const tierPool = CHEST_WEAPONS.filter((w) => allowedRarities.includes(w.rarity));
  const unownedPool = tierPool.filter((w) => !ownedIds.includes(w.id));
  const pool = unownedPool.length > 0 ? unownedPool : tierPool;

  return pool[Math.floor(Math.random() * pool.length)];
}
