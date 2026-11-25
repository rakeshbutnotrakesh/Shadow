import { computeBlessingBonuses } from './blessings';
import { PLAYER_CLASSES } from './classes';
import {
  AbilityDefinition,
  AbilityId,
  ArtifactId,
  ClassId,
  DifficultyTier,
  PetId,
} from './types';

export const MAX_LEVEL = 100;

export function getDifficultyTier(level: number, isGod = false): DifficultyTier {
  if (isGod || level >= 100) return 'Ascended God';
  if (level >= 90) return 'Hardest';
  if (level >= 80) return 'Extreme Hard';
  if (level >= 50) return 'Hard';
  if (level >= 10) return 'Medium';
  return 'Easy';
}

export function getDifficultyMultipliers(level: number): {
  hpMult: number;
  dmgMult: number;
  speedMult: number;
  xpMult: number;
} {
  if (level <= 10) {
    // Easy (1-10)
    return {
      hpMult: 0.85 + level * 0.04,
      dmgMult: 0.8 + level * 0.03,
      speedMult: 0.92,
      xpMult: 1.0 + level * 0.08,
    };
  }
  if (level <= 50) {
    // Medium (10-50)
    const t = (level - 10) / 40;
    return {
      hpMult: 1.3 + t * 2.2,
      dmgMult: 1.15 + t * 1.1,
      speedMult: 1.0 + t * 0.16,
      xpMult: 1.9 + t * 2.6,
    };
  }
  if (level <= 80) {
    // Hard (50-80)
    const t = (level - 50) / 30;
    return {
      hpMult: 3.5 + t * 3.0,
      dmgMult: 2.25 + t * 1.35,
      speedMult: 1.16 + t * 0.14,
      xpMult: 4.5 + t * 2.8,
    };
  }
  if (level <= 90) {
    // Extreme Hard (80-90)
    const t = (level - 80) / 10;
    return {
      hpMult: 6.5 + t * 2.5,
      dmgMult: 3.6 + t * 1.1,
      speedMult: 1.3 + t * 0.1,
      xpMult: 7.3 + t * 1.8,
    };
  }
  // Hardest (90-100)
  const t = Math.min(1, (level - 90) / 10);
  return {
    hpMult: 9.0 + t * 3.5,
    dmgMult: 4.7 + t * 1.6,
    speedMult: 1.4 + t * 0.12,
    xpMult: 9.1 + t * 2.4,
  };
}

export const ABILITIES: Record<AbilityId, AbilityDefinition> = {
  divine_shield: {
    id: 'divine_shield',
    name: 'Divine Shield',
    description:
      'Channel a protective geometric Kavach barrier [C] that absorbs incoming strikes and reflects sacred light.',
    maxRank: 5,
    category: 'Active',
    effectPerRank: '+1.5s barrier duration & +8% damage absorption per rank',
  },
  sacred_energy_attack: {
    id: 'sacred_energy_attack',
    name: 'Sacred Energy Attack',
    description:
      'Unleash a piercing golden Chakra wave [Q] from your Astra Blade, damaging enemies at range.',
    maxRank: 5,
    category: 'Active',
    effectPerRank: '+22 wave damage & wider shock radius per rank',
  },
  ancient_vision: {
    id: 'ancient_vision',
    name: 'Ancient Vision',
    description:
      'Attunes your sight to sacred relics and hidden shrines, projecting tall golden light pillars through fog.',
    maxRank: 3,
    category: 'Perception',
    effectPerRank: 'Reveals hidden chests, shrines & artifacts from afar',
  },
  shadow_detection: {
    id: 'shadow_detection',
    name: 'Shadow Detection',
    description:
      'Senses corrupted entities lurking in darkness, outlining nearby threats and displaying threat count.',
    maxRank: 3,
    category: 'Perception',
    effectPerRank: '+14m detection range & brighter threat aura',
  },
  health_regen: {
    id: 'health_regen',
    name: 'Health Regeneration',
    description:
      'Harmonizes Prana flow to steadily mend wounds over time even amidst the curse.',
    maxRank: 5,
    category: 'Passive',
    effectPerRank: '+2.0 HP/sec regeneration per rank',
  },
  movement_speed: {
    id: 'movement_speed',
    name: 'Increased Movement Speed',
    description:
      'Enhances agility and stride across forest trails, stone stairs, and sanctum bridges.',
    maxRank: 5,
    category: 'Passive',
    effectPerRank: '+10% walk and sprint speed per rank',
  },
  attack_damage: {
    id: 'attack_damage',
    name: 'Increased Attack Damage',
    description:
      'Sharpens the spiritual edge of your Astra Blade against shadow constructs and guardians.',
    maxRank: 5,
    category: 'Passive',
    effectPerRank: '+22% melee and energy damage per rank',
  },
  divine_protection: {
    id: 'divine_protection',
    name: 'Divine Protection',
    description:
      'Fortifies spirit and armor against corruption, reducing all physical and shadow damage taken.',
    maxRank: 5,
    category: 'Passive',
    effectPerRank: '10% damage reduction & +20 Max HP per rank',
  },
  extended_flashlight: {
    id: 'extended_flashlight',
    name: 'Extended Flashlight',
    description:
      'Empowers your sacred lantern beam with wider angle, deeper range, and stronger shadow-piercing intensity.',
    maxRank: 5,
    category: 'Perception',
    effectPerRank: '+30% beam range, wider cone & brighter illumination',
  },
  energy_recovery: {
    id: 'energy_recovery',
    name: 'Energy Recovery',
    description:
      'Deepens breath control to replenish spiritual energy faster and reduce sprinting fatigue.',
    maxRank: 5,
    category: 'Passive',
    effectPerRank: '+30% energy regen & -16% sprint drain per rank',
  },
};

export const ALL_ABILITY_IDS = Object.keys(ABILITIES) as AbilityId[];

export function getXpToNext(level: number): number {
  if (level >= MAX_LEVEL) return 999999;
  if (level < 10) return 60 + level * 16; // Easy 1..10
  if (level < 50) return 150 + level * 9; // Medium 10..50
  if (level < 80) return 420 + (level - 50) * 14; // Hard 50..80
  return 850 + (level - 80) * 24; // Extreme Hard & Hardest 80..100
}

export function pickThreeRandomUpgrades(
  currentRanks: Partial<Record<AbilityId, number>>
): AbilityDefinition[] {
  const eligible = ALL_ABILITY_IDS.filter((id) => {
    const rank = currentRanks[id] ?? 0;
    return rank < ABILITIES[id].maxRank;
  });

  const pool = eligible.length >= 3 ? [...eligible] : [...ALL_ABILITY_IDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3).map((id) => ABILITIES[id]);
}

export interface ComputedPlayerStats {
  maxHealth: number;
  maxEnergy: number;
  moveSpeedMultiplier: number;
  damageMultiplier: number;
  weaponFlatBonus: number;
  damageReduction: number;
  healthRegenPerSec: number;
  energyRegenPerSec: number;
  sprintCostPerSec: number;
  flashlightRange: number;
  flashlightAngle: number;
  flashlightIntensity: number;
  hasSacredAttack: boolean;
  sacredAttackDamage: number;
  hasDivineShield: boolean;
  shieldDuration: number;
  shieldAbsorption: number;
  abilityCooldownMultiplier: number;
  ancientVisionRank: number;
  shadowDetectionRange: number;
  attackCooldown: number;
  meleeReach: number;
  knockback: number;
  isBowClass: boolean;
}

export function computePlayerStats(
  level: number,
  abilities: Partial<Record<AbilityId, number>>,
  artifacts: ArtifactId[],
  blessings: string[] = [],
  petId: PetId | null = null,
  shivaTandavaSeen = false,
  isGod = false,
  playerClass: ClassId = 'warrior',
  forgedWeaponBonus = 0,
  chestWeaponBonus = 0
): ComputedPlayerStats {
  const cls = PLAYER_CLASSES[playerClass] ?? PLAYER_CLASSES.warrior;
  const hasRudraksha = artifacts.includes('rudraksha');
  const hasTrishul = artifacts.includes('trishul_fragment');
  const hasYantra = artifacts.includes('ancient_yantra');
  const hasMantra = artifacts.includes('sacred_mantra');
  const hasAmulet = artifacts.includes('divine_amulet');

  const bless = computeBlessingBonuses(blessings);

  const protRank = abilities.divine_protection ?? 0;
  const speedRank = abilities.movement_speed ?? 0;
  const dmgRank = abilities.attack_damage ?? 0;
  const regenRank = abilities.health_regen ?? 0;
  const energyRank = abilities.energy_recovery ?? 0;
  const flashRank = abilities.extended_flashlight ?? 0;
  const waveRank = abilities.sacred_energy_attack ?? 0;
  const shieldRank = abilities.divine_shield ?? 0;
  const visionRank = abilities.ancient_vision ?? 0;
  const detectRank = abilities.shadow_detection ?? 0;

  const godHpBonus = isGod ? 500 : 0;
  const godEnergyBonus = isGod ? 200 : 0;
  const tandavaMult = shivaTandavaSeen ? 1.3 : 1.0;
  const godDamageMult = isGod ? 2.2 : 1.0;
  const petDmgBonus = petId === 'vayu_simha' ? 0.22 : 0;
  const petSpeedBonus = petId === 'garuda_shavaka' ? 0.15 : 0;
  const petProtBonus = petId === 'nandi_vahana' ? 0.15 : 0;

  const maxHealth = Math.round(
    100 +
      cls.healthBonus +
      (level - 1) * 14 +
      protRank * 20 +
      (hasRudraksha ? 25 : 0) +
      bless.maxHealthBonus +
      godHpBonus
  );

  const maxEnergy = Math.round(
    100 +
      cls.energyBonus +
      (level - 1) * 4 +
      (hasMantra ? 30 : 0) +
      bless.maxEnergyBonus +
      godEnergyBonus
  );

  const moveSpeedMultiplier =
    1 +
    cls.moveSpeedBonus +
    speedRank * 0.1 +
    (hasYantra ? 0.12 : 0) +
    Math.min(0.65, bless.speedBonus) +
    petSpeedBonus +
    (isGod ? 0.25 : 0);

  const damageMultiplier =
    cls.damageMultiplier *
    (1 +
      (level - 1) * 0.055 +
      dmgRank * 0.22 +
      (hasTrishul ? 0.25 : 0) +
      bless.damageBonus +
      petDmgBonus) *
    tandavaMult *
    godDamageMult;

  const damageReduction = Math.min(
    0.88,
    cls.damageReductionBonus +
      protRank * 0.1 +
      (hasAmulet ? 0.2 : 0) +
      bless.protectionBonus +
      petProtBonus +
      (isGod ? 0.2 : 0)
  );

  const healthRegenPerSec =
    cls.healthRegenBonus +
    regenRank * 2.0 +
    (hasRudraksha ? 1.8 : 0) +
    bless.regenBonus +
    (isGod ? 25 : 0);

  const energyRegenPerSec =
    9 *
    (1 +
      cls.energyRegenBonus +
      energyRank * 0.3 +
      (hasMantra ? 0.45 : 0) +
      bless.energyRegenBonus +
      (isGod ? 1.5 : 0));

  const sprintCostPerSec = Math.max(5, 18 * Math.pow(0.84, energyRank));

  const flashlightRange = 24 + flashRank * 8 + (isGod ? 18 : 0);
  const flashlightAngle = Math.PI / 5.5 + flashRank * 0.07;
  const flashlightIntensity = 4.2 + flashRank * 1.2 + (isGod ? 2.5 : 0);

  const hasSacredAttack = waveRank > 0 || hasTrishul || level >= 2 || isGod;
  const effectiveWaveRank = Math.max(1, waveRank + (hasTrishul ? 1 : 0));
  const saintWaveBonus = playerClass === 'saint' ? 1.2 : 1.0;
  const sacredAttackDamage =
    (38 + effectiveWaveRank * 22 + bless.weaponPowerBonus * 0.65) *
    damageMultiplier *
    saintWaveBonus *
    (1 + bless.wavePowerBonus);

  const hasDivineShield = shieldRank > 0 || hasAmulet || level >= 3 || isGod;
  const effectiveShieldRank = Math.max(1, shieldRank + (hasAmulet ? 1 : 0));
  const shieldDuration = 3.5 + effectiveShieldRank * 1.5 + (isGod ? 2.5 : 0);
  const shieldAbsorption = Math.min(0.95, 0.55 + effectiveShieldRank * 0.08 + cls.shieldBonus);

  const abilityCooldownMultiplier =
    cls.cooldownMultiplier * (hasMantra ? 0.7 : 1.0) * (isGod ? 0.55 : 1.0);

  return {
    maxHealth,
    maxEnergy,
    moveSpeedMultiplier,
    damageMultiplier,
    weaponFlatBonus: bless.weaponPowerBonus + forgedWeaponBonus + chestWeaponBonus,
    damageReduction,
    healthRegenPerSec,
    energyRegenPerSec,
    sprintCostPerSec,
    flashlightRange,
    flashlightAngle,
    flashlightIntensity,
    hasSacredAttack,
    sacredAttackDamage,
    hasDivineShield,
    shieldDuration,
    shieldAbsorption,
    abilityCooldownMultiplier,
    ancientVisionRank: Math.max(visionRank, hasYantra ? 1 : 0, isGod ? 2 : 0),
    shadowDetectionRange: Math.max(
      detectRank * 14,
      hasYantra ? 18 : 0,
      isGod ? 35 : 0
    ),
    attackCooldown: cls.attackCooldown,
    meleeReach: cls.meleeReach,
    knockback: cls.knockback,
    isBowClass: cls.isBowClass,
  };
}
