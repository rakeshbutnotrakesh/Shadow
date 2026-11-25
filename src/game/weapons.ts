import { AreaId } from './types';

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
  // RARE (Early Realms: Forest, Temple, Catacombs)
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

  // EPIC (Mid Realms: Stepwell, Ashram, Fortress)
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

  // MYTHIC (Deep Realms: Observatory, Serpent Caverns, Sanctum)
  {
    id: 'wpn_nandaka_blade',
    name: 'Nandaka Dawn Blade',
    rarity: 'Mythic',
    powerBonus: 86,
    accentHex: 0xfde047,
    accentColor: '#fde047',
    description: 'Pure golden relic weapon whose edge dissolves shadow illusions.',
  },
  {
    id: 'wpn_naga_fang',
    name: 'Vasuki Patala Fang',
    rarity: 'Mythic',
    powerBonus: 95,
    accentHex: 0x10b981,
    accentColor: '#10b981',
    description: 'Bioluminescent serpent-metal relic drawn from the deepest caverns.',
  },
  {
    id: 'wpn_kaumodaki',
    name: 'Kaumodaki Vajra-Mace',
    rarity: 'Mythic',
    powerBonus: 105,
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

  // DIVYA (High Level & Final Realms)
  {
    id: 'wpn_rudra_khadga',
    name: 'Rudra-Teja Mahakhadga',
    rarity: 'Divya',
    powerBonus: 142,
    accentHex: 0xf97316,
    accentColor: '#f97316',
    description: 'Blazing divine greatblade awakened in the shadow of the Eclipse Gate.',
  },
  {
    id: 'wpn_indra_vajra',
    name: 'Indra-Vajra Astra',
    rarity: 'Divya',
    powerBonus: 162,
    accentHex: 0x7dd3fc,
    accentColor: '#7dd3fc',
    description: 'Diamond-lightning weapon capable of cracking Kalyug boss armor.',
  },
  {
    id: 'wpn_adi_jyoti',
    name: 'Adi-Shakti Jyoti Astra',
    rarity: 'Divya',
    powerBonus: 185,
    accentHex: 0xfde047,
    accentColor: '#fde047',
    description: 'Supreme luminous weapon forged from primordial Dharma light.',
  },
];

export const AREA_ORDER: AreaId[] = [
  'forest',
  'temple',
  'catacombs',
  'sunken_stepwell',
  'ashram_ruins',
  'asura_fortress',
  'astral_observatory',
  'serpent_caverns',
  'sanctum',
  'final_chamber',
];

export const AREA_NAMES: Record<AreaId, string> = {
  forest: 'Forgotten Forest',
  temple: 'Ancient Temple',
  catacombs: 'Underground Catacombs',
  sunken_stepwell: 'Sunken Stepwell',
  ashram_ruins: 'Shattered Ashram',
  asura_fortress: 'Obsidian Fortress',
  astral_observatory: 'Astral Observatory',
  serpent_caverns: 'Naga Caverns',
  sanctum: 'Cursed Sanctum',
  final_chamber: 'Final Chamber',
};

export function rollRandomBoxWeapon(
  level: number,
  areaId: AreaId,
  ownedIds: string[]
): ChestWeaponDef {
  const areaIdx = Math.max(0, AREA_ORDER.indexOf(areaId));
  const tierScore = areaIdx * 10 + level;

  let allowedRarities: ChestWeaponRarity[];
  if (tierScore >= 110) {
    allowedRarities = ['Mythic', 'Divya'];
  } else if (tierScore >= 65) {
    allowedRarities = ['Epic', 'Mythic', 'Divya'];
  } else if (tierScore >= 28) {
    allowedRarities = ['Rare', 'Epic', 'Mythic'];
  } else {
    allowedRarities = ['Rare', 'Epic'];
  }

  const tierPool = CHEST_WEAPONS.filter((w) => allowedRarities.includes(w.rarity));
  const unownedPool = tierPool.filter((w) => !ownedIds.includes(w.id));
  const pool = unownedPool.length > 0 ? unownedPool : tierPool;

  return pool[Math.floor(Math.random() * pool.length)];
}
