import { ClassId } from './types';

export interface PlayerClassDefinition {
  id: ClassId;
  name: string;
  sanskritTitle: string;
  pathRole: string;
  specialActionLabel: string;
  weaponName: string;
  combatStyle: 'Melee' | 'Ranged Bow' | 'Support';
  description: string;
  bonusSummary: string;
  healthBonus: number;
  energyBonus: number;
  damageMultiplier: number;
  moveSpeedBonus: number;
  damageReductionBonus: number;
  healthRegenBonus: number;
  energyRegenBonus: number;
  shieldBonus: number;
  cooldownMultiplier: number;
  attackCooldown: number;
  meleeReach: number;
  knockback: number;
  isBowClass: boolean;
  accentHex: number;
}

export const PLAYER_CLASSES: Record<ClassId, PlayerClassDefinition> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    sanskritTitle: 'Kshatriya Yoddha',
    pathRole: 'Combat Fighter Path · Sword Battle',
    specialActionLabel: 'War Cleave [G]',
    weaponName: 'Khanda Astra Sword',
    combatStyle: 'Melee',
    description:
      'Pure frontline combat fighter wielding a consecrated Khanda sword with a 360° War Cleave shockwave.',
    bonusSummary: '+25 Max HP · +25% Sword Damage · War Cleave [G]',
    healthBonus: 25,
    energyBonus: 0,
    damageMultiplier: 1.25,
    moveSpeedBonus: 0.04,
    damageReductionBonus: 0.06,
    healthRegenBonus: 0,
    energyRegenBonus: 0,
    shieldBonus: 0,
    cooldownMultiplier: 1.0,
    attackCooldown: 0.4,
    meleeReach: 3.5,
    knockback: 7.0,
    isBowClass: false,
    accentHex: 0xd97706,
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    sanskritTitle: 'Dhanurdhar',
    pathRole: 'Combat Fighter Path · Bow & Arrows',
    specialActionLabel: 'Arrow Volley [G]',
    weaponName: 'Kodanda Sacred Bow',
    combatStyle: 'Ranged Bow',
    description:
      'Ranged combat marksman fighting by consecrated 3D bow, firing piercing golden arrows and 5-arrow volleys.',
    bonusSummary: 'Fights by Bow & Arrows · +12% Speed · 5-Arrow Volley [G]',
    healthBonus: 0,
    energyBonus: 15,
    damageMultiplier: 1.18,
    moveSpeedBonus: 0.12,
    damageReductionBonus: 0.02,
    healthRegenBonus: 0,
    energyRegenBonus: 0.15,
    shieldBonus: 0,
    cooldownMultiplier: 0.92,
    attackCooldown: 0.36,
    meleeReach: 2.8,
    knockback: 4.5,
    isBowClass: true,
    accentHex: 0x22c55e,
  },
  blacksmith: {
    id: 'blacksmith',
    name: 'Blacksmith',
    sanskritTitle: 'Vishwakarma Lohakar',
    pathRole: 'Weapon Maker Path · Forge & Craft',
    specialActionLabel: 'Forge Weapon [G]',
    weaponName: 'Agni Forge Hammer',
    combatStyle: 'Melee',
    description:
      'Master weapon maker who gathers Forge Shards from battle to craft ever-stronger sacred blades, hammers, and Astras.',
    bonusSummary: 'Crafts Stronger Weapons [G] · +35 HP · +35% Heavy Impact · +12% Armor',
    healthBonus: 35,
    energyBonus: 0,
    damageMultiplier: 1.35,
    moveSpeedBonus: -0.02,
    damageReductionBonus: 0.12,
    healthRegenBonus: 0.4,
    energyRegenBonus: 0,
    shieldBonus: 0.05,
    cooldownMultiplier: 1.0,
    attackCooldown: 0.5,
    meleeReach: 3.25,
    knockback: 10.5,
    isBowClass: false,
    accentHex: 0xef4444,
  },
  saint: {
    id: 'saint',
    name: 'Saint (Sent)',
    sanskritTitle: 'Tapasvi Sant',
    pathRole: 'Sacred Ritual Path · Yagga, Mantra & Puja',
    specialActionLabel: 'Yagga [G] · Mantra [H] · Puja [V]',
    weaponName: 'Rudra Brahma-Danda',
    combatStyle: 'Melee',
    description:
      'Sacred ascetic who commands Agni Yagga (fire ritual), Vedic Mantra shockwaves, and restorative Temple Puja.',
    bonusSummary: 'Performs Yagga [G], Mantra [H] & Puja [V] · +30% Energy Regen · +2 HP/s',
    healthBonus: 10,
    energyBonus: 25,
    damageMultiplier: 1.12,
    moveSpeedBonus: 0.05,
    damageReductionBonus: 0.05,
    healthRegenBonus: 2.0,
    energyRegenBonus: 0.3,
    shieldBonus: 0.05,
    cooldownMultiplier: 0.85,
    attackCooldown: 0.42,
    meleeReach: 3.4,
    knockback: 6.2,
    isBowClass: false,
    accentHex: 0xfbbf24,
  },
  supporter: {
    id: 'supporter',
    name: 'Supporter',
    sanskritTitle: 'Vaidya Rakshak',
    pathRole: 'Sanctuary Path · Healing & Kavach',
    specialActionLabel: 'Prana Pulse [G]',
    weaponName: 'Lotus Chakra Scepter',
    combatStyle: 'Support',
    description:
      'Radiant guardian whose sacred scepter sustains vitality, unleashes Prana healing pulses, and strengthens Kavach barriers.',
    bonusSummary: 'Prana Sanctuary [G] · +35 Energy · +3.0 HP/s · +15% Shield',
    healthBonus: 20,
    energyBonus: 35,
    damageMultiplier: 1.05,
    moveSpeedBonus: 0.1,
    damageReductionBonus: 0.08,
    healthRegenBonus: 3.0,
    energyRegenBonus: 0.25,
    shieldBonus: 0.15,
    cooldownMultiplier: 0.82,
    attackCooldown: 0.38,
    meleeReach: 3.15,
    knockback: 5.8,
    isBowClass: false,
    accentHex: 0x38bdf8,
  },
};

export const ALL_CLASS_IDS: ClassId[] = [
  'warrior',
  'archer',
  'blacksmith',
  'saint',
  'supporter',
];

export interface ForgeWeaponRecipe {
  id: string;
  name: string;
  shardCost: number;
  powerGain: number;
  description: string;
}

export const FORGE_RECIPES: ForgeWeaponRecipe[] = [
  {
    id: 'forge_agni_blade',
    name: 'Agni-Dhatu Blade',
    shardCost: 1,
    powerGain: 18,
    description: 'Tempered fire-iron weapon forged from shadow-cleansed embers.',
  },
  {
    id: 'forge_vajra_hammer',
    name: 'Vajra-Loha Hammer',
    shardCost: 2,
    powerGain: 34,
    description: 'Thunder-forged heavy maul tuned to crack Temple Guardian armor.',
  },
  {
    id: 'forge_surya_halberd',
    name: 'Surya-Teja Battleaxe',
    shardCost: 3,
    powerGain: 56,
    description: 'Sun-blessed Damascus alloy glowing with golden battle heat.',
  },
  {
    id: 'forge_rudra_mace',
    name: 'Rudra-Astra Gada',
    shardCost: 4,
    powerGain: 82,
    description: 'Ancient celestial mace capable of shattering Kalyug constructs.',
  },
  {
    id: 'forge_vishwakarma_astra',
    name: 'Vishwakarma Maha-Astra',
    shardCost: 6,
    powerGain: 120,
    description: 'Masterwork divine weapon crafted at the peak of the smithing path.',
  },
];
