import { ArtifactDefinition, ArtifactId } from './types';

export const ARTIFACTS: Record<ArtifactId, ArtifactDefinition> = {
  rudraksha: {
    id: 'rudraksha',
    name: 'Rudraksha',
    sanskritSub: 'Seed of Stillness · Forgotten Forest',
    areaId: 'forest',
    lore: 'An ancient sacred bead found beneath the roots of the forest shrine. Legends say it anchors vitality amidst encroaching darkness.',
    gameplayEffect: '+20 Max Health & steady +1.5 HP/sec regeneration',
    color: '#d4823a',
  },
  trishul_fragment: {
    id: 'trishul_fragment',
    name: 'Trishul Fragment',
    sanskritSub: 'Ember of Resolve · Ancient Temple',
    areaId: 'temple',
    lore: 'A resonant bronze-gold shard recovered from the temple sanctum, humming with disciplined strength.',
    gameplayEffect: '+25% Attack Damage & unlocks Sacred Energy Attack [Q]',
    color: '#e5b95c',
  },
  ancient_yantra: {
    id: 'ancient_yantra',
    name: 'Ancient Yantra',
    sanskritSub: 'Geometric Compass · Underground Catacombs',
    areaId: 'catacombs',
    lore: 'An engraved copper geometric mandala plate that pierces illusions and reveals hidden paths.',
    gameplayEffect: 'Activates Shadow Detection & Ancient Vision +12% Speed',
    color: '#38bdf8',
  },
  sacred_mantra: {
    id: 'sacred_mantra',
    name: 'Sacred Mantra',
    sanskritSub: 'Inscribed Copper Scroll · Cursed Sanctum',
    areaId: 'sanctum',
    lore: 'Timeless phonetic verses etched onto beaten bronze, calming the spirit and accelerating Prana recovery.',
    gameplayEffect: '+25 Max Energy, +45% Energy Recovery & -30% Skill Cooldowns',
    color: '#f59e0b',
  },
  divine_amulet: {
    id: 'divine_amulet',
    name: 'Divine Amulet',
    sanskritSub: 'Kavach of Dawn · Final Chamber',
    areaId: 'final_chamber',
    lore: 'A radiant sun-lotus talisman forged by ancient temple guardians to withstand the Warden of the Eclipse.',
    gameplayEffect: '+22% Damage Reduction & unlocks Divine Shield [C]',
    color: '#fbbf24',
  },
};

export const ALL_ARTIFACT_IDS: ArtifactId[] = [
  'rudraksha',
  'trishul_fragment',
  'ancient_yantra',
  'sacred_mantra',
  'divine_amulet',
];
