export type BlessingStatType =
  | 'damage'
  | 'health'
  | 'energy'
  | 'speed'
  | 'protection'
  | 'regen'
  | 'energyRegen'
  | 'wavePower';

export type BlessingTierBand = 'easy' | 'medium' | 'hard' | 'supreme' | 'final_mahamaya';

export interface GodBlessing {
  id: string;
  index: number; // 1..100
  name: string;
  deity: string;
  deityRank: string;
  tierBand: BlessingTierBand;
  weaponName: string;
  weaponPower: number;
  statType: BlessingStatType;
  value: number;
  description: string;
}

interface DomainSeed {
  deity: string;
  deityRank: string;
  tierBand: Exclude<BlessingTierBand, 'final_mahamaya'>;
  statType: BlessingStatType;
  value: number;
  weaponBasePower: number;
  entries: Array<{ title: string; weapon: string }>;
  flavor: string;
}

// 10 Easy Rishi / Easy God entries (Indices 1..10) -> Level 1 & Easy Tier (1..10)
const EASY_RISHI_AND_GODS: DomainSeed[] = [
  {
    deity: 'Rishi Agastya',
    deityRank: 'Easy Rishi · Saptarishi',
    tierBand: 'easy',
    statType: 'regen',
    value: 0.6,
    weaponBasePower: 3,
    entries: [
      { title: 'Siddha Pranayama', weapon: "Agastya's Kama-Danda Staff" },
      { title: 'Kumbha Vitality', weapon: "Agastya's Jal-Kalash Scepter" },
    ],
    flavor: 'Bestows ancient Rishi vitality and a consecrated hermit weapon.',
  },
  {
    deity: 'Rishi Vashistha',
    deityRank: 'Easy Rishi · Brahmarsi',
    tierBand: 'easy',
    statType: 'protection',
    value: 0.02,
    weaponBasePower: 3,
    entries: [
      { title: 'Brahmatejas Ward', weapon: "Vashistha's Brahma-Danda" },
      { title: 'Kamadhenu Grace', weapon: "Vashistha's Arundhati Bow" },
    ],
    flavor: 'Shields the seeker with Brahmarsi wisdom and deflects shadow strikes.',
  },
  {
    deity: 'Rishi Kashyapa',
    deityRank: 'Easy Rishi · Prajapati',
    tierBand: 'easy',
    statType: 'health',
    value: 16,
    weaponBasePower: 3,
    entries: [
      { title: 'Prakriti Endurance', weapon: "Kashyapa's Aranya Blade" },
    ],
    flavor: 'Strengthens physical resilience with forest-born ascetic vigor.',
  },
  {
    deity: 'Rishi Bharadwaja',
    deityRank: 'Easy Rishi · Sage of Astra',
    tierBand: 'easy',
    statType: 'damage',
    value: 0.04,
    weaponBasePower: 4,
    entries: [
      { title: 'Dhanurveda Spark', weapon: "Bharadwaja's Shara Kodanda" },
    ],
    flavor: 'Sharpens early weapon mastery learned in the hermitages.',
  },
  {
    deity: 'Ganesha',
    deityRank: 'Easy God · Vighnaharta',
    tierBand: 'easy',
    statType: 'protection',
    value: 0.02,
    weaponBasePower: 4,
    entries: [
      { title: 'Prarambha Grace', weapon: "Ganesha's Sacred Ankusha" },
      { title: 'Siddhi Anchor', weapon: "Ganesha's Parashu Hatchet" },
    ],
    flavor: 'Clears the opening path of Kalyug and grants steady protection.',
  },
  {
    deity: 'Saraswati',
    deityRank: 'Easy God · Goddess of Wisdom',
    tierBand: 'easy',
    statType: 'energyRegen',
    value: 0.06,
    weaponBasePower: 3,
    entries: [
      { title: 'Vak Clarity', weapon: "Saraswati's Veena-Astra" },
    ],
    flavor: 'Infuses sacred mantra clarity for rapid energy recovery.',
  },
  {
    deity: 'Chandra',
    deityRank: 'Easy God · Moon Sovereign',
    tierBand: 'easy',
    statType: 'speed',
    value: 0.03,
    weaponBasePower: 3,
    entries: [
      { title: 'Soma Coolness', weapon: "Chandra's Crescent Edge" },
    ],
    flavor: 'Quiets fear and quickens footwork beneath the forest canopy.',
  },
];

// 40 Medium Vedic & Guardian Deities (Indices 11..50)
const MEDIUM_DEITIES: DomainSeed[] = [
  {
    deity: 'Surya',
    deityRank: 'Vedic God · Solar Sovereign',
    tierBand: 'medium',
    statType: 'damage',
    value: 0.045,
    weaponBasePower: 6,
    entries: [
      { title: 'Aditya Flare', weapon: "Surya's Tejas Khadga" },
      { title: 'Arka Radiance', weapon: "Surya's Seven-Ray Spear" },
      { title: 'Bhaskara Edge', weapon: "Surya's Solar Kodanda" },
      { title: 'Savitr Dawn', weapon: "Surya's Dawn Hammer" },
      { title: 'Martanda Strike', weapon: "Surya's Corona Chakram" },
      { title: 'Ravi Zenith', weapon: "Surya's Zenith Lance" },
      { title: 'Tapana Fury', weapon: "Surya's Golden Halberd" },
    ],
    flavor: 'Burns shadow beasts with solar weapon fire.',
  },
  {
    deity: 'Hanuman',
    deityRank: 'Guardian God · Vayuputra',
    tierBand: 'medium',
    statType: 'health',
    value: 18,
    weaponBasePower: 6,
    entries: [
      { title: 'Bajrang Fortitude', weapon: "Hanuman's Suvarna Gada" },
      { title: 'Sanjeevani Might', weapon: "Hanuman's Vajra-Mace" },
      { title: 'Pavanaputra Leap', weapon: "Hanuman's Mountain Club" },
      { title: 'Sankatmochan Guard', weapon: "Hanuman's Kesar Iron Staff" },
      { title: 'Chiranjeevi Heart', weapon: "Hanuman's Eternal Mace" },
      { title: 'Rama-Bhakta Resolve', weapon: "Hanuman's Rudra Gada" },
    ],
    flavor: 'Grants unbreakable stamina and heavy mace power.',
  },
  {
    deity: 'Kartikeya',
    deityRank: 'Guardian God · Senapati',
    tierBand: 'medium',
    statType: 'damage',
    value: 0.05,
    weaponBasePower: 7,
    entries: [
      { title: 'Skanda Precision', weapon: "Kartikeya's Shakti Vel" },
      { title: 'Subrahmanya Thrust', weapon: "Kartikeya's Peacock Lance" },
      { title: 'Shanmukha Reflex', weapon: "Kartikeya's Six-Pointed Bow" },
      { title: 'Murugan Valor', weapon: "Kartikeya's Radiant Spear" },
      { title: 'Devasena Vanguard', weapon: "Kartikeya's War Khadga" },
      { title: 'Mayura Swiftness', weapon: "Kartikeya's Golden Javelin" },
    ],
    flavor: 'Hones battlefield precision with the invincible Vel.',
  },
  {
    deity: 'Vishwakarma',
    deityRank: 'Vedic Architect · Master Smith',
    tierBand: 'medium',
    statType: 'protection',
    value: 0.02,
    weaponBasePower: 7,
    entries: [
      { title: 'Celestial Tempering', weapon: "Vishwakarma's Star-Forge Hammer" },
      { title: 'Divya-Astra Craft', weapon: "Vishwakarma's Sudarshana Chisel" },
      { title: 'Vajra Blueprint', weapon: "Vishwakarma's Anvil Maul" },
      { title: 'Lanka-Gold Plating', weapon: "Vishwakarma's Golden Tong-Staff" },
      { title: 'Aegis Foundry', weapon: "Vishwakarma's Indestructible Shield" },
      { title: 'Pushpaka Balance', weapon: "Vishwakarma's Celestial Axe" },
    ],
    flavor: 'Reforges your held weapon and thickens divine armor.',
  },
  {
    deity: 'Vayu',
    deityRank: 'Vedic God · Wind Lord',
    tierBand: 'medium',
    statType: 'speed',
    value: 0.03,
    weaponBasePower: 5,
    entries: [
      { title: 'Marut Stride', weapon: "Vayu's Gale Whip" },
      { title: 'Pavana Swiftness', weapon: "Vayu's Whirlwind Bow" },
      { title: 'Anila Dash', weapon: "Vayu's Feather Talwar" },
      { title: 'Samirana Gale', weapon: "Vayu's Cyclone Chakram" },
      { title: 'Prana Current', weapon: "Vayu's Sky-Danda" },
    ],
    flavor: 'Surrounds your weapons with tempest speed.',
  },
  {
    deity: 'Agni',
    deityRank: 'Vedic God · Sacred Fire',
    tierBand: 'medium',
    statType: 'wavePower',
    value: 0.06,
    weaponBasePower: 6,
    entries: [
      { title: 'Hutashana Flame', weapon: "Agni's Seven-Tongued Spear" },
      { title: 'Pavaka Surge', weapon: "Agni's Ember Khadga" },
      { title: 'Vaishvanara Wave', weapon: "Agni's Sacred Torch-Mace" },
      { title: 'Jatavedas Arc', weapon: "Agni's Flame Kodanda" },
      { title: 'Tejas Ignition', weapon: "Agni's Yajna Blade" },
    ],
    flavor: 'Ignites Sacred Energy Waves and arrows with purifying fire.',
  },
  {
    deity: 'Rishi Vishwamitra',
    deityRank: 'Brahmarishi · Creator of Astras',
    tierBand: 'medium',
    statType: 'energy',
    value: 14,
    weaponBasePower: 6,
    entries: [
      { title: 'Gayatri Resonance', weapon: "Vishwamitra's Bala-Atibala Bow" },
      { title: 'Kaushika Discipline', weapon: "Vishwamitra's Astra-Kosh Staff" },
      { title: 'Siddhashrama Seal', weapon: "Vishwamitra's Mantra Blade" },
      { title: 'Brahmastra Focus', weapon: "Vishwamitra's Celestial Reed" },
      { title: 'Tapasya Reservoir', weapon: "Vishwamitra's Kumbha Scepter" },
    ],
    flavor: 'Unlocks secret Rishi weapon mantras and spiritual stamina.',
  },
];

// 39 Hard / Extreme Hard Fierce Deities (Indices 51..89)
const HARD_DEITIES: DomainSeed[] = [
  {
    deity: 'Indra',
    deityRank: 'Devaraja · King of Svarga',
    tierBand: 'hard',
    statType: 'damage',
    value: 0.055,
    weaponBasePower: 9,
    entries: [
      { title: 'Vajra Spark', weapon: "Indra's Adamantine Vajra" },
      { title: 'Shakra Thunder', weapon: "Indra's Rainbow Vijaya Bow" },
      { title: 'Purandara Might', weapon: "Indra's Storm Parashu" },
      { title: 'Vritrahas Blade', weapon: "Indra's Lightning Khadga" },
      { title: 'Devaraja Valor', weapon: "Indra's Thunderbolt Spear" },
      { title: 'Amaravati Fury', weapon: "Indra's Sky-Shatter Hammer" },
      { title: 'Sahasraksha Aim', weapon: "Indra's Hundred-Eye Bow" },
      { title: 'Vajrapani Impact', weapon: "Indra's Storm Chakram" },
    ],
    flavor: 'Strikes with bone-forged lightning from the Devaraja.',
  },
  {
    deity: 'Parashurama',
    deityRank: 'Chiranjeevi · Avatar of Martial Might',
    tierBand: 'hard',
    statType: 'damage',
    value: 0.06,
    weaponBasePower: 10,
    entries: [
      { title: 'Vidyudabhi Cleave', weapon: "Parashurama's Vidyudabhi Axe" },
      { title: 'Bhargava Precision', weapon: "Parashurama's Vijaya Bow" },
      { title: 'Mahendragiri Poise', weapon: "Parashurama's Iron Parashu" },
      { title: 'Renukaputra Edge', weapon: "Parashurama's Ashwamedha Blade" },
      { title: 'Sahasrabahu Bane', weapon: "Parashurama's Heavy War-Maul" },
      { title: 'Kshatriyantaka Strike', weapon: "Parashurama's Crescent Axe" },
      { title: 'Tapasvi Blade', weapon: "Parashurama's Rudra Kodanda" },
    ],
    flavor: 'Delivers unstoppable martial mastery forged through penance.',
  },
  {
    deity: 'Vishnu',
    deityRank: 'Mahadeva · Preserver of Dharma',
    tierBand: 'hard',
    statType: 'health',
    value: 24,
    weaponBasePower: 9,
    entries: [
      { title: 'Sudarshana Orbit', weapon: "Vishnu's Sudarshana Chakra" },
      { title: 'Kaumodaki Might', weapon: "Vishnu's Kaumodaki Gada" },
      { title: 'Sharnga Draw', weapon: "Vishnu's Sharnga Horn Bow" },
      { title: 'Nandaka Edge', weapon: "Vishnu's Nandaka Greatsword" },
      { title: 'Vaikuntha Heart', weapon: "Vishnu's Panchajanya Scepter" },
      { title: 'Narasimha Roar', weapon: "Vishnu's Vajra Claws" },
      { title: 'Varaha Pillar', weapon: "Vishnu's Earth-Lifting Mace" },
      { title: 'Trivikrama Reach', weapon: "Vishnu's Cosmic Lance" },
    ],
    flavor: 'Preserves life across the harshest trials with cosmic weapons.',
  },
  {
    deity: 'Durga',
    deityRank: 'Goddess of Invincible Shakti',
    tierBand: 'hard',
    statType: 'protection',
    value: 0.022,
    weaponBasePower: 9,
    entries: [
      { title: 'Abhaya Kavach', weapon: "Durga's Lion-Crested Trishul" },
      { title: 'Mahishasura Bane', weapon: "Durga's Chandrahasa Sword" },
      { title: 'Chandika Ward', weapon: "Durga's Golden Chakram" },
      { title: 'Katyayani Shield', weapon: "Durga's Sacred Gada" },
      { title: 'Simhavahini Guard', weapon: "Durga's Vajra Spear" },
      { title: 'Navadurga Seal', weapon: "Durga's Shakti Bow" },
      { title: 'Aparajita Stance', weapon: "Durga's Invincible Axe" },
      { title: 'Bhavani Resilience', weapon: "Durga's Radiant Shield-Staff" },
    ],
    flavor: 'Grants fearless divine armor and demon-banishing blades.',
  },
  {
    deity: 'Rishi Dadhichi',
    deityRank: 'Maharishi · Sacrifice of Vajra',
    tierBand: 'hard',
    statType: 'regen',
    value: 0.8,
    weaponBasePower: 8,
    entries: [
      { title: 'Asthi-Vajra Heart', weapon: "Dadhichi's Vajra-Spine Mace" },
      { title: 'Saraswati-Banks Balm', weapon: "Dadhichi's Immortal Danda" },
      { title: 'Prana Sacrifice', weapon: "Dadhichi's Bone-Gold Bow" },
      { title: 'Naimisha Grace', weapon: "Dadhichi's Radiant Khadga" },
    ],
    flavor: 'Channels indestructible ascetic endurance into every wound.',
  },
  {
    deity: 'Chamunda',
    deityRank: 'Fierce Shakti · Vanquisher of Shadow',
    tierBand: 'hard',
    statType: 'wavePower',
    value: 0.075,
    weaponBasePower: 9,
    entries: [
      { title: 'Raktabija Bane', weapon: "Chamunda's Khatvanga Staff" },
      { title: 'Shumbha-Buster', weapon: "Chamunda's Crescent Khadga" },
      { title: 'Nishumbha Strike', weapon: "Chamunda's Crimson Trishul" },
      { title: 'Asura-Purifier', weapon: "Chamunda's Shadow-Piercing Bow" },
    ],
    flavor: 'Amplifies Sacred Waves to tear through cursed illusions.',
  },
];

// 10 Supreme Hardest Deities (Indices 90..99)
const SUPREME_DEITIES: DomainSeed[] = [
  {
    deity: 'Shiva',
    deityRank: 'Mahadeva · Destroyer of Darkness',
    tierBand: 'supreme',
    statType: 'damage',
    value: 0.08,
    weaponBasePower: 14,
    entries: [
      { title: 'Pinaka Resonance', weapon: "Shiva's Celestial Pinaka Bow" },
      { title: 'Trishul Awakening', weapon: "Shiva's Tri-Cosmic Trishul" },
      { title: 'Pashupata Focus', weapon: "Shiva's Pashupatastra Spear" },
      { title: 'Nataraja Rhythm', weapon: "Shiva's Damaru-Crested Danda" },
      { title: 'Mahakala Gaze', weapon: "Shiva's Chandrahasa Blade" },
    ],
    flavor: 'Bestows Mahadeva weapons forged to shatter the age of Kalyug.',
  },
  {
    deity: 'Mahavishnu',
    deityRank: 'Supreme Preserver · Narayana',
    tierBand: 'supreme',
    statType: 'health',
    value: 35,
    weaponBasePower: 14,
    entries: [
      { title: 'Vishvaroopa Aegis', weapon: "Mahavishnu's Cosmic Sudarshana" },
      { title: 'Narayanastra Volley', weapon: "Mahavishnu's Eternal Sharnga Bow" },
      { title: 'Ananta Permanence', weapon: "Mahavishnu's Shesha-Scepter" },
    ],
    flavor: 'Infuses infinite cosmic preservation and divine weapon supremacy.',
  },
  {
    deity: 'Adi Shakti',
    deityRank: 'Supreme Mother · Jagadamba',
    tierBand: 'supreme',
    statType: 'protection',
    value: 0.03,
    weaponBasePower: 15,
    entries: [
      { title: 'Shakti-Peetha Crown', weapon: "Adi Shakti's Golden Trishul" },
      { title: 'Tripurasundari Bow', weapon: "Adi Shakti's Ikshu-Kodanda Bow" },
    ],
    flavor: 'Prepares the seeker to receive the final blessing of Maha Maya.',
  },
];

// Index 100: Final Level Blessing from Strongest Goddess Maha Maya
export const MAHA_MAYA_BLESSING: GodBlessing = {
  id: 'blessing_100',
  index: 100,
  name: "Maha Maya's Adi-Parashakti Sovereignty",
  deity: 'Maha Maya',
  deityRank: 'Strongest Goddess · Supreme Adi Parashakti',
  tierBand: 'final_mahamaya',
  weaponName: "Maha Maya's Vishva-Mohini Cosmic Astra",
  weaponPower: 55,
  statType: 'damage',
  value: 0.45,
  description:
    'Final Level 100 Blessing of the Strongest Goddess Maha Maya. Grants her supreme cosmic weapon (+55 Weapon Power, +45% Attack Damage) and awakens Devatva Godhood.',
};

// Assemble exact 100 Blessings (1..10 Easy Rishis/Gods, 11..50 Medium, 51..89 Hard, 90..99 Supreme, 100 Maha Maya)
export const GOD_BLESSINGS: GodBlessing[] = (() => {
  const list: GodBlessing[] = [];
  const pushDomain = (seeds: DomainSeed[]) => {
    for (const seed of seeds) {
      for (const entry of seed.entries) {
        const idx = list.length + 1;
        list.push({
          id: `blessing_${idx}`,
          index: idx,
          name: `${seed.deity}'s ${entry.title}`,
          deity: seed.deity,
          deityRank: seed.deityRank,
          tierBand: seed.tierBand,
          weaponName: entry.weapon,
          weaponPower: seed.weaponBasePower,
          statType: seed.statType,
          value: seed.value,
          description: `${seed.flavor} Grants sacred weapon: ${entry.weapon} (+${seed.weaponBasePower} Weapon Power).`,
        });
      }
    }
  };

  pushDomain(EASY_RISHI_AND_GODS); // 10 blessings (1..10)
  pushDomain(MEDIUM_DEITIES); // 40 blessings (11..50)
  pushDomain(HARD_DEITIES); // 39 blessings (51..89)
  pushDomain(SUPREME_DEITIES); // 10 blessings (90..99)
  list.push(MAHA_MAYA_BLESSING); // 100th blessing: Maha Maya

  return list;
})();

export const BLESSINGS_BY_ID: Record<string, GodBlessing> = Object.fromEntries(
  GOD_BLESSINGS.map((b) => [b.id, b])
);

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickOneEasyStarterBlessing(): GodBlessing {
  const easyPool = GOD_BLESSINGS.filter((b) => b.tierBand === 'easy');
  return easyPool[Math.floor(Math.random() * easyPool.length)];
}

export function pickThreeRandomBlessings(
  ownedIds: string[],
  targetLevel = 2
): GodBlessing[] {
  const ownedSet = new Set(ownedIds);

  // Final Level 100 Blessing comes strictly from Strongest Goddess Maha Maya
  if (targetLevel >= 100 && !ownedSet.has(MAHA_MAYA_BLESSING.id)) {
    return [MAHA_MAYA_BLESSING];
  }

  // Reserve Maha Maya (#100) exclusively for Level 100
  const unownedStandard = GOD_BLESSINGS.filter(
    (b) => b.id !== MAHA_MAYA_BLESSING.id && !ownedSet.has(b.id)
  );

  let tierMatches: GodBlessing[] = [];
  if (targetLevel <= 10) {
    tierMatches = unownedStandard.filter((b) => b.tierBand === 'easy');
  } else if (targetLevel <= 50) {
    tierMatches = unownedStandard.filter((b) => b.tierBand === 'medium');
  } else if (targetLevel <= 89) {
    tierMatches = unownedStandard.filter((b) => b.tierBand === 'hard');
  } else {
    tierMatches = unownedStandard.filter((b) => b.tierBand === 'supreme');
  }

  // Fallback across other unowned bands if tier pool is depleted
  const primary = shuffle(tierMatches);
  const secondary = shuffle(
    unownedStandard.filter((b) => !tierMatches.includes(b))
  );
  const combined = [...primary, ...secondary];

  if (combined.length > 0 && combined.length <= 3) {
    return combined;
  }
  if (combined.length > 3) {
    return combined.slice(0, 3);
  }
  return shuffle(GOD_BLESSINGS.filter((b) => b.id !== MAHA_MAYA_BLESSING.id)).slice(0, 3);
}

export interface BlessingAggregateBonus {
  damageBonus: number;
  maxHealthBonus: number;
  maxEnergyBonus: number;
  speedBonus: number;
  protectionBonus: number;
  regenBonus: number;
  energyRegenBonus: number;
  wavePowerBonus: number;
  weaponPowerBonus: number;
}

export function computeBlessingBonuses(ownedIds: string[]): BlessingAggregateBonus {
  const agg: BlessingAggregateBonus = {
    damageBonus: 0,
    maxHealthBonus: 0,
    maxEnergyBonus: 0,
    speedBonus: 0,
    protectionBonus: 0,
    regenBonus: 0,
    energyRegenBonus: 0,
    wavePowerBonus: 0,
    weaponPowerBonus: 0,
  };

  for (const id of ownedIds) {
    const b = BLESSINGS_BY_ID[id];
    if (!b) continue;
    agg.weaponPowerBonus += b.weaponPower;
    switch (b.statType) {
      case 'damage':
        agg.damageBonus += b.value;
        break;
      case 'health':
        agg.maxHealthBonus += b.value;
        break;
      case 'energy':
        agg.maxEnergyBonus += b.value;
        break;
      case 'speed':
        agg.speedBonus += b.value;
        break;
      case 'protection':
        agg.protectionBonus += b.value;
        break;
      case 'regen':
        agg.regenBonus += b.value;
        break;
      case 'energyRegen':
        agg.energyRegenBonus += b.value;
        break;
      case 'wavePower':
        agg.wavePowerBonus += b.value;
        break;
    }
  }
  return agg;
}
