import type { AreaId } from './types';

export type BiomeThemeId =
  | 'sacred_grove'
  | 'stepwell_waters'
  | 'vedic_ashram'
  | 'himalayan_frost'
  | 'ash_cremation'
  | 'asura_citadel'
  | 'astral_yantra'
  | 'patala_caverns'
  | 'indra_swarga'
  | 'kalyug_abyss';

export type RealmDifficultyTier = 'Easy' | 'Medium' | 'Hard' | 'Extreme Hard' | 'Hardest';

export interface RealmDef {
  id: AreaId;
  index: number; // 1..100
  name: string;
  subtitle: string;
  tier: RealmDifficultyTier;
  recommendedLevel: number;
  requiredKills: number;
  biome: BiomeThemeId;
  isStoneGround: boolean;
  prevAreaId: AreaId | null;
  nextAreaId: AreaId | null;
  loreTitle: string;
  loreText: string;
  ragaScale: number[];
  droneHz: [number, number];
  filterHz: number;
  windHz: number;
  windGain: number;
}

export const TOTAL_AREAS = 100;

interface BiomeAudioPalette {
  ragaScale: number[];
  droneHz: [number, number];
  filterHz: number;
  windHz: number;
  windGain: number;
  isStoneGround: boolean;
}

const BIOME_AUDIO: Record<BiomeThemeId, BiomeAudioPalette> = {
  sacred_grove: {
    ragaScale: [196.0, 207.65, 246.94, 261.63, 293.66, 311.13, 392.0],
    droneHz: [65.4, 98.0],
    filterHz: 145,
    windHz: 420,
    windGain: 0.17,
    isStoneGround: false,
  },
  stepwell_waters: {
    ragaScale: [174.61, 196.0, 220.0, 261.63, 293.66, 349.23],
    droneHz: [69.3, 103.8],
    filterHz: 195,
    windHz: 250,
    windGain: 0.12,
    isStoneGround: true,
  },
  vedic_ashram: {
    ragaScale: [220.0, 246.94, 293.66, 329.63, 392.0, 440.0],
    droneHz: [77.8, 116.5],
    filterHz: 240,
    windHz: 370,
    windGain: 0.15,
    isStoneGround: true,
  },
  himalayan_frost: {
    ragaScale: [246.94, 277.18, 311.13, 369.99, 415.3, 493.88],
    droneHz: [82.4, 123.5],
    filterHz: 280,
    windHz: 560,
    windGain: 0.19,
    isStoneGround: false,
  },
  ash_cremation: {
    ragaScale: [146.83, 155.56, 196.0, 220.0, 233.08, 293.66],
    droneHz: [55.0, 82.4],
    filterHz: 210,
    windHz: 390,
    windGain: 0.16,
    isStoneGround: false,
  },
  asura_citadel: {
    ragaScale: [146.83, 164.81, 185.0, 220.0, 246.94, 293.66],
    droneHz: [51.9, 77.8],
    filterHz: 290,
    windHz: 480,
    windGain: 0.17,
    isStoneGround: true,
  },
  astral_yantra: {
    ragaScale: [246.94, 277.18, 329.63, 369.99, 440.0, 493.88],
    droneHz: [82.4, 123.5],
    filterHz: 310,
    windHz: 440,
    windGain: 0.14,
    isStoneGround: true,
  },
  patala_caverns: {
    ragaScale: [164.81, 185.0, 207.65, 246.94, 277.18, 329.63],
    droneHz: [58.2, 87.3],
    filterHz: 150,
    windHz: 190,
    windGain: 0.1,
    isStoneGround: true,
  },
  indra_swarga: {
    ragaScale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
    droneHz: [87.3, 130.8],
    filterHz: 330,
    windHz: 460,
    windGain: 0.13,
    isStoneGround: true,
  },
  kalyug_abyss: {
    ragaScale: [155.56, 174.61, 196.0, 233.08, 261.63, 311.13],
    droneHz: [58.2, 87.3],
    filterHz: 300,
    windHz: 510,
    windGain: 0.16,
    isStoneGround: true,
  },
};

const LANDMARK_NAMES: Array<{
  id?: AreaId;
  name: string;
  subtitle: string;
  biome: BiomeThemeId;
  loreTitle: string;
  loreText: string;
}> = [
  // 1..8 (Hand-crafted opening chapters)
  {
    id: 'forest',
    name: 'Forgotten Forest',
    subtitle: 'Area 1 · Grove of Whispering Banyans',
    biome: 'sacred_grove',
    loreTitle: 'Waystone of Kalyug',
    loreText: 'When Tamas clouds the human heart, SHADOW.exe seeps from the broken seals beneath the valley.',
  },
  {
    id: 'temple',
    name: 'Ancient Temple',
    subtitle: 'Area 2 · Mandapa of Echoing Bells',
    biome: 'vedic_ashram',
    loreTitle: 'Mandapa Inscription',
    loreText: 'Three concentric rings govern time, stillness, and light. Align the Mandala Altar to break the seal.',
  },
  {
    id: 'catacombs',
    name: 'Underground Catacombs',
    subtitle: 'Area 3 · Vaults Beneath the Roots',
    biome: 'patala_caverns',
    loreTitle: 'Subterranean Seal',
    loreText: 'These tunnels sheltered seekers who first mapped the Shadow Curse.',
  },
  {
    id: 'sunken_stepwell',
    name: 'Sunken Stepwell',
    subtitle: 'Area 4 · Tiered Waters of Chand-Baori',
    biome: 'stepwell_waters',
    loreTitle: 'Chand-Baori Inscription',
    loreText: 'Waters of remembrance gather in the sunken stone tiers beneath the moonlight.',
  },
  {
    id: 'ashram_ruins',
    name: 'Shattered Ashram',
    subtitle: 'Area 5 · Hermitage of the Eternal Havan',
    biome: 'vedic_ashram',
    loreTitle: 'Rishi Hermitage Scroll',
    loreText: 'Here the Saptarishis chanted Rigveda hymns before Kalyug thickened.',
  },
  {
    id: 'asura_fortress',
    name: 'Obsidian Fortress',
    subtitle: 'Area 6 · Rampart of the Asura Vanguard',
    biome: 'asura_citadel',
    loreTitle: 'Iron Rampart Stele',
    loreText: 'Kalyug generals fortified this obsidian gate against ascending seekers.',
  },
  {
    id: 'astral_observatory',
    name: 'Astral Observatory',
    subtitle: 'Area 7 · Samrat Yantra of the Stars',
    biome: 'astral_yantra',
    loreTitle: 'Jyotish Yantra Codex',
    loreText: 'Aligned to the cosmic wheel of Yugas, these brass rings foretold the eclipse.',
  },
  {
    id: 'serpent_caverns',
    name: 'Naga Caverns',
    subtitle: 'Area 8 · Bioluminescent Patala Vaults',
    biome: 'patala_caverns',
    loreTitle: 'Naga Patala Seal',
    loreText: 'Serpent guardians forged Patala crystals to contain the lower shadow rifts.',
  },
  // 9..10 (Finish Easy Tier)
  {
    name: 'Kurukshetra Lotus Marsh',
    subtitle: 'Area 9 · Mist of the First Conch',
    biome: 'stepwell_waters',
    loreTitle: 'Conch-Shell Tablet',
    loreText: 'Echoes of Panchajanya still ripple across the lotus waters when Dharma is tested.',
  },
  {
    name: 'Torana of Dawn',
    subtitle: 'Area 10 · Threshold of the Hundred Realms',
    biome: 'indra_swarga',
    loreTitle: 'Dawn Archway Stele',
    loreText: 'Beyond this golden gateway stretch the ninety domains between earth, stars, and the Eclipse.',
  },
  // 11..20 (Medium Tier I)
  {
    name: 'Narmada Bamboo Vale',
    subtitle: 'Area 11 · Whispering River Canebrake',
    biome: 'sacred_grove',
    loreTitle: 'Riverbank Vow',
    loreText: 'Ancient bamboo stalks bend like bowstrings along the sacred Narmada banks.',
  },
  {
    name: 'Panchavati Banyan Grove',
    subtitle: 'Area 12 · Five-Trunked Sanctuary',
    biome: 'sacred_grove',
    loreTitle: 'Panchavati Bark Scroll',
    loreText: 'Five primordial banyans once sheltered exiles who defeated forest rakshasas.',
  },
  {
    name: 'Vaitarani Mist Ghat',
    subtitle: 'Area 13 · Ferry Steps of Memory',
    biome: 'stepwell_waters',
    loreTitle: 'Stone Ghat Marker',
    loreText: 'Oil diyas float beside sunken steps to guide travelers through the veil.',
  },
  {
    name: 'Saraswati Dry Bed',
    subtitle: 'Area 14 · Sunken Vedic Channel',
    biome: 'vedic_ashram',
    loreTitle: 'Lost River Pillar',
    loreText: 'Though hidden from mortal eyes, the Saraswati still sings beneath golden sands.',
  },
  {
    name: 'Dandaka Shadow Thicket',
    subtitle: 'Area 15 · Tangled Canopy of Trials',
    biome: 'sacred_grove',
    loreTitle: 'Dandaka Hunter Stone',
    loreText: 'Shadows gather thickly in Dandaka, testing every blade and bowstring.',
  },
  {
    name: 'Pushkar Lotus Tank',
    subtitle: 'Area 16 · Mirror of Brahma’s Bloom',
    biome: 'stepwell_waters',
    loreTitle: 'Padma Kund Plaque',
    loreText: 'A fallen lotus petal sanctified these waters against Kalyug frost.',
  },
  {
    name: 'Bharadwaja Gurukul',
    subtitle: 'Area 17 · Courtyard of Astra Lore',
    biome: 'vedic_ashram',
    loreTitle: 'Astra Practice Stele',
    loreText: 'Disciples once tempered bronze and spirit here before dawn.',
  },
  {
    name: 'Chitrakoot Cliff Shrine',
    subtitle: 'Area 18 · High Terrace of Bells',
    biome: 'indra_swarga',
    loreTitle: 'Hilltop Bell Inscription',
    loreText: 'From Chitrakoot’s terraces, seekers first sighted the smoke of distant Asura forts.',
  },
  {
    name: 'Kaveri Reed Basin',
    subtitle: 'Area 19 · Jade Channels of Dusk',
    biome: 'stepwell_waters',
    loreTitle: 'Basin Relic Stone',
    loreText: 'Sunken sluices hum with old mantras carved into river basalt.',
  },
  {
    name: 'Agastya Southern Hermitage',
    subtitle: 'Area 20 · Sanctum of the Sage Star',
    biome: 'vedic_ashram',
    loreTitle: 'Agastya Codex',
    loreText: 'Sage Agastya charted the southern constellations to keep Kalyug illusions at bay.',
  },
  // 21..30 (Medium Tier II)
  {
    name: 'Taksa-Shila Ruined Hall',
    subtitle: 'Area 21 · Pillars of Broken Scrolls',
    biome: 'vedic_ashram',
    loreTitle: 'Taksa-Shila Pillar',
    loreText: 'Great halls of philosophy turned to stone vigil when the shadow wave struck.',
  },
  {
    name: 'Naimisha Sacred Clearing',
    subtitle: 'Area 22 · Forest of the Eighteen Puranas',
    biome: 'sacred_grove',
    loreTitle: 'Naimisharanya Stele',
    loreText: 'Eighty-eight thousand sages once gathered in this quiet grove.',
  },
  {
    name: 'Mandakini Frost Brook',
    subtitle: 'Area 23 · First Snows of Himavat',
    biome: 'himalayan_frost',
    loreTitle: 'Glacial Boundary Stone',
    loreText: 'Cool mountain winds freeze the breath of wandering dark spirits.',
  },
  {
    name: 'Rudraprayag Confluence',
    subtitle: 'Area 24 · Twin Currents of Stone',
    biome: 'stepwell_waters',
    loreTitle: 'Confluence Inscription',
    loreText: 'Where two sacred streams meet, corrupted shadows lose their footing.',
  },
  {
    name: 'Kashi Smashana Outskirts',
    subtitle: 'Area 25 · Embers of Detachment',
    biome: 'ash_cremation',
    loreTitle: 'Bhairava Lantern',
    loreText: 'Eternal cremation embers remind warriors that fear is only an illusion.',
  },
  {
    name: 'Vindhya Iron Pass',
    subtitle: 'Area 26 · Red Sandstone Gorge',
    biome: 'asura_citadel',
    loreTitle: 'Vindhya Watchpost',
    loreText: 'Asura outriders built iron barricades across the northern mountain pass.',
  },
  {
    name: 'Ujjayini Sundial Court',
    subtitle: 'Area 27 · Meridian of Mahakala',
    biome: 'astral_yantra',
    loreTitle: 'Prime Meridian Marker',
    loreText: 'Ancient astronomers measured cosmic time from this sandstone gnomon.',
  },
  {
    name: 'Kishkindha Stone Hollow',
    subtitle: 'Area 28 · Monkey-King Caves',
    biome: 'patala_caverns',
    loreTitle: 'Vanara Oath',
    loreText: 'Swift echoes bounce through granite halls carved by vanished allies.',
  },
  {
    name: 'Rameshwaram Sea Causeway',
    subtitle: 'Area 29 · Floating Coral Stones',
    biome: 'stepwell_waters',
    loreTitle: 'Setu Bridge Marker',
    loreText: 'Inscribed boulders form an unbreakable bridge across dark tides.',
  },
  {
    name: 'Kanva Forest Sanctuary',
    subtitle: 'Area 30 · Deer-Trail Ashram',
    biome: 'sacred_grove',
    loreTitle: 'Hermitage Bell',
    loreText: 'Even beneath eclipse mist, sacred deer paths guide honest seekers.',
  },
  // 31..40 (Medium Tier III)
  {
    name: 'Kedara Snow Terrace',
    subtitle: 'Area 31 · Mist-Wreathed Peaks',
    biome: 'himalayan_frost',
    loreTitle: 'Himavat Cairn',
    loreText: 'Frost crystals chime like temple bells in the high Himalayan wind.',
  },
  {
    name: 'Alaka Moonlit Courtyard',
    subtitle: 'Area 32 · Yaksha Treasure Plaza',
    biome: 'indra_swarga',
    loreTitle: 'Kubera Ledger',
    loreText: 'Gilded chests of forgotten Yaksha smiths still slumber along these tiles.',
  },
  {
    name: 'Bhimbetka Painted Vault',
    subtitle: 'Area 33 · Primordial Ochre Caves',
    biome: 'patala_caverns',
    loreTitle: 'Ochre Mural',
    loreText: 'First-age hunters painted constellations and beasts across these cavern walls.',
  },
  {
    name: 'Modhera Sun Stepwell',
    subtitle: 'Area 34 · Hundred-Shrine Baori',
    biome: 'stepwell_waters',
    loreTitle: 'Surya Kund Plaque',
    loreText: 'A hundred miniature shrines flank the waters waiting for Surya’s dawn.',
  },
  {
    name: 'Mahabalipuram Shore Mandapa',
    subtitle: 'Area 35 · Monolith Ratha Stones',
    biome: 'vedic_ashram',
    loreTitle: 'Granite Chariot Stone',
    loreText: 'Carved from single boulders, these shore temples withstand every storm.',
  },
  {
    name: 'Konark Broken Chariot',
    subtitle: 'Area 36 · Twelve Wheels of Surya',
    biome: 'astral_yantra',
    loreTitle: 'Sun-Wheel Axle',
    loreText: 'Each carved wheel measures the pulse of daylight against encroaching night.',
  },
  {
    name: 'Avantika Ash Altar',
    subtitle: 'Area 37 · Sacred Bhasma Ground',
    biome: 'ash_cremation',
    loreTitle: 'Bhasma Stele',
    loreText: 'Purified ash shields those who stand steady before fearsome specters.',
  },
  {
    name: 'Pragjyotisha Black Gate',
    subtitle: 'Area 38 · Eastern Citadel Wall',
    biome: 'asura_citadel',
    loreTitle: 'Eastern Bastion Seal',
    loreText: 'Dark metal spikes guard the approaches to the deeper Asura strongholds.',
  },
  {
    name: 'Badari Glacial Basin',
    subtitle: 'Area 39 · Hot Springs in Ice',
    biome: 'himalayan_frost',
    loreTitle: 'Tapt Kund Marker',
    loreText: 'Thermal mist rises through frozen shrines where ascetics meditate.',
  },
  {
    name: 'Nalanda Ember Library',
    subtitle: 'Area 40 · Sunken Archive Cloister',
    biome: 'vedic_ashram',
    loreTitle: 'Ash-Saved Folio',
    loreText: 'Though smoke scarred these galleries, wisdom endures in bronze tablets.',
  },
  // 41..50 (Medium -> Hard Threshold)
  {
    name: 'Lanka Outer Sea Bastion',
    subtitle: 'Area 41 · Golden-Rimmed Ramparts',
    biome: 'asura_citadel',
    loreTitle: 'Rampart Tablet',
    loreText: 'Obsidian walls inlaid with brass warn intruders away from the citadel.',
  },
  {
    name: 'Ashoka-Vatika Twilight Grove',
    subtitle: 'Area 42 · Crimson-Blossom Garden',
    biome: 'sacred_grove',
    loreTitle: 'Garden Stone',
    loreText: 'Beneath red blossoms, resilience blooms even inside enemy territory.',
  },
  {
    name: 'Patala Sluice Chamber',
    subtitle: 'Area 43 · Flooded Cavern Lock',
    biome: 'patala_caverns',
    loreTitle: 'Cavern Gate Rune',
    loreText: 'Emerald crystals light the subterranean channels far below the sea.',
  },
  {
    name: 'Nakshatra Terrace of Rohini',
    subtitle: 'Area 44 · Lunar Pillar Ring',
    biome: 'astral_yantra',
    loreTitle: 'Rohini Star Dial',
    loreText: 'Moonlight aligns with twenty-seven celestial columns in silent symmetry.',
  },
  {
    name: 'Ellora Monolith Trench',
    subtitle: 'Area 45 · Rock-Cut Basalt Hall',
    biome: 'vedic_ashram',
    loreTitle: 'Kailasa Chisel Mark',
    loreText: 'Artisans carved entire sanctuaries downward from living basalt cliffs.',
  },
  {
    name: 'Jvalamukhi Flame Field',
    subtitle: 'Area 46 · Blue-Fire Fissures',
    biome: 'ash_cremation',
    loreTitle: 'Eternal Flame Stone',
    loreText: 'Natural fires dance out of cracked earth without wood or oil.',
  },
  {
    name: 'Gangotri Ice Arch',
    subtitle: 'Area 47 · Crystal Glacier Vault',
    biome: 'himalayan_frost',
    loreTitle: 'Gaumukh Tablet',
    loreText: 'Pure glacial waters shatter illusions forged by shadow sorcery.',
  },
  {
    name: 'Amaravati Stupa Ring',
    subtitle: 'Area 48 · White Marble Railings',
    biome: 'indra_swarga',
    loreTitle: 'Dharma Chakra Rail',
    loreText: 'Carved lotus medallions encircle a peaceful sanctuary amidst storm clouds.',
  },
  {
    name: 'Bhairava Crimson Crossing',
    subtitle: 'Area 49 · Crossroads of Eight Guards',
    biome: 'kalyug_abyss',
    loreTitle: 'Ashtabhairava Marker',
    loreText: 'Only seekers ready for Hard Tier trials cross this crimson threshold.',
  },
  {
    name: 'Vahana Awakening Court',
    subtitle: 'Area 50 · Halfway Gate of Companions',
    biome: 'indra_swarga',
    loreTitle: 'Celestial Steed Seal',
    loreText: 'At the fiftieth realm, sacred Vahanas answer the call of steadfast warriors.',
  },
  // 51..60 (Hard Tier I)
  {
    name: 'Tripura Iron Ring',
    subtitle: 'Area 51 · First Flying Citadel Shard',
    biome: 'asura_citadel',
    loreTitle: 'Loha-Pura Tablet',
    loreText: 'Black iron battlements groan with ancient Asura siege engines.',
  },
  {
    name: 'Tripura Silver Ring',
    subtitle: 'Area 52 · Frost-Plated Bastion',
    biome: 'himalayan_frost',
    loreTitle: 'Rajata-Pura Stele',
    loreText: 'Silver-frosted pillars reflect every blade swing in blinding arcs.',
  },
  {
    name: 'Tripura Gold Ring',
    subtitle: 'Area 53 · Sun-Forged Rampart',
    biome: 'indra_swarga',
    loreTitle: 'Suvarna-Pura Codex',
    loreText: 'Even golden towers fall when arrogance eclipses Dharma.',
  },
  {
    name: 'Rasatala Serpent Abyss',
    subtitle: 'Area 54 · Emerald Coil Tunnels',
    biome: 'patala_caverns',
    loreTitle: 'Vasuki Scale Tablet',
    loreText: 'Bioluminescent fangs sprout from cavern floors like sleeping spears.',
  },
  {
    name: 'Mahatala Echoing Well',
    subtitle: 'Area 55 · Deep Baori of Shadows',
    biome: 'stepwell_waters',
    loreTitle: 'Submerged Step Stone',
    loreText: 'A thousand wet steps wind downward beneath dark mirror pools.',
  },
  {
    name: 'Dhumavati Ash Plain',
    subtitle: 'Area 56 · Gray Smoke Wasteland',
    biome: 'ash_cremation',
    loreTitle: 'Smoke-Veiled Altar',
    loreText: 'Cinders drift like fireflies across scorched stone altars.',
  },
  {
    name: 'Saptarishi Sky Observatory',
    subtitle: 'Area 57 · Seven-Star Yantra',
    biome: 'astral_yantra',
    loreTitle: 'Great Bear Dial',
    loreText: 'Seven towering pillars mirror the northern sages across night skies.',
  },
  {
    name: 'Kalpavriksha Root Forest',
    subtitle: 'Area 58 · Wish-Tree Canopy',
    biome: 'sacred_grove',
    loreTitle: 'Bark of Wishes',
    loreText: 'Luminous roots glow beneath ancient trunks older than Kalyug.',
  },
  {
    name: 'Yama Southern Causeway',
    subtitle: 'Area 59 · Obsidian Hall of Scales',
    biome: 'kalyug_abyss',
    loreTitle: 'Dharmaraja Ledger',
    loreText: 'Every deed weighs true upon the obsidian scales of the southern court.',
  },
  {
    name: 'Kailash Outer Parikrama',
    subtitle: 'Area 60 · Frozen Pilgrim Ring',
    biome: 'himalayan_frost',
    loreTitle: 'Snow-Crowned Stambha',
    loreText: 'Sixty realms conquered; icy winds sharpen the resolve of true seekers.',
  },
  // 61..70 (Hard Tier II)
  {
    name: 'Mahisha Battle Courtyard',
    subtitle: 'Area 61 · Shattered Horn Arena',
    biome: 'asura_citadel',
    loreTitle: 'Shakti Victory Stone',
    loreText: 'Trident marks still scar the obsidian floor where arrogance was felled.',
  },
  {
    name: 'Kshir-Sagara Mist Shore',
    subtitle: 'Area 62 · Milky Ocean Tidal Steps',
    biome: 'stepwell_waters',
    loreTitle: 'Churning Rod Pillar',
    loreText: 'Luminous waves lap against coral mandapas at the edge of memory.',
  },
  {
    name: 'Mandara Churning Plaza',
    subtitle: 'Area 63 · Spiral Serpent Columns',
    biome: 'indra_swarga',
    loreTitle: 'Amrita Seal',
    loreText: 'Out of fierce churning came both poison and the nectar of immortality.',
  },
  {
    name: 'Shumbha Storm Bastion',
    subtitle: 'Area 64 · Thunder-Struck Keep',
    biome: 'asura_citadel',
    loreTitle: 'Lightning Bastion Rune',
    loreText: 'Storm-blackened spires crackle with restless Tamas energy.',
  },
  {
    name: 'Narakasura Pit Vault',
    subtitle: 'Area 65 · Sunken Obsidian Crypt',
    biome: 'patala_caverns',
    loreTitle: 'Deep Vault Marker',
    loreText: 'Lantern crystals cast eerie teal shadows across ancient prison walls.',
  },
  {
    name: 'Surya-Siddhanta Dial',
    subtitle: 'Area 66 · Golden Astrolabe Court',
    biome: 'astral_yantra',
    loreTitle: 'Ecliptic Ring',
    loreText: 'Brass armillaries whirl tirelessly above the carved mandala deck.',
  },
  {
    name: 'Kapalika Ember Circle',
    subtitle: 'Area 67 · Ring of Nine Hearths',
    biome: 'ash_cremation',
    loreTitle: 'Nine-Hearth Tablet',
    loreText: 'Sacred fire purges corruption when fear threatens to overwhelm the mind.',
  },
  {
    name: 'Chanda-Munda Crag',
    subtitle: 'Area 68 · Twin Demon Pillars',
    biome: 'kalyug_abyss',
    loreTitle: 'Twin Spire Warning',
    loreText: 'Two jagged obsidian towers frame the descent into deeper illusions.',
  },
  {
    name: 'Siddha-Ashrama High Peak',
    subtitle: 'Area 69 · Cloud-Top Gurukul',
    biome: 'vedic_ashram',
    loreTitle: 'Cloud Hermitage Scroll',
    loreText: 'Above the storms, immortal masters still keep the sacred lamps lit.',
  },
  {
    name: 'Gandharva Harmonic Hall',
    subtitle: 'Area 70 · Singing Stone Pillars',
    biome: 'indra_swarga',
    loreTitle: 'Swara Pillar',
    loreText: 'Every stone column hums a different note of the primordial raga.',
  },
  // 71..80 (Hard Tier III)
  {
    name: 'Hiranyaksha Deep Trench',
    subtitle: 'Area 71 · Sunken Abyssal Ruins',
    biome: 'patala_caverns',
    loreTitle: 'Varaha Tusk Stele',
    loreText: 'Ancient earth-pillars rise out of deep emerald cavern waters.',
  },
  {
    name: 'Vritra Storm Reservoir',
    subtitle: 'Area 72 · Captured Rain Baori',
    biome: 'stepwell_waters',
    loreTitle: 'Vajra Watergate',
    loreText: 'Thunder once split these dams to free the captive rivers.',
  },
  {
    name: 'Shani Obsidian Horizon',
    subtitle: 'Area 73 · Ringed Saturn Altar',
    biome: 'astral_yantra',
    loreTitle: 'Shani-Graha Stone',
    loreText: 'Slow, inexorable justice turns beneath iron and gold rings.',
  },
  {
    name: 'Raktabija Blood Courtyard',
    subtitle: 'Area 74 · Crimson Reflection Floor',
    biome: 'kalyug_abyss',
    loreTitle: 'Crimson Mirror Seal',
    loreText: 'Defeat shadow clones swiftly before their darkness multiplies.',
  },
  {
    name: 'Manasarovar Frozen Mirror',
    subtitle: 'Area 75 · Swan-Lake Glacier',
    biome: 'himalayan_frost',
    loreTitle: 'Hamsa Frost Plaque',
    loreText: 'Pure ice mirrors the starry vault three-quarters through the journey.',
  },
  {
    name: 'Kumbhakarna Slumber Gate',
    subtitle: 'Area 76 · Colossal Iron Arches',
    biome: 'asura_citadel',
    loreTitle: 'Giant Gate Marker',
    loreText: 'Massive obsidian columns shake with the footsteps of ancient beasts.',
  },
  {
    name: 'Bhrigu-Tirtha Flame Court',
    subtitle: 'Area 77 · Havan of Nine Sparks',
    biome: 'ash_cremation',
    loreTitle: 'Bhrigu Spark Tablet',
    loreText: 'Unquenchable embers guard the wisdom of the ancient fire-sages.',
  },
  {
    name: 'Devaloka Lotus Causeway',
    subtitle: 'Area 78 · Gilded Sky Plaza',
    biome: 'indra_swarga',
    loreTitle: 'Amaravati Pillar',
    loreText: 'Golden bridges gleam softly above Kalyug’s rising storm.',
  },
  {
    name: 'Parijata Starlight Grove',
    subtitle: 'Area 79 · Night-Blooming Sanctuary',
    biome: 'sacred_grove',
    loreTitle: 'Parijata Trunk',
    loreText: 'Fragrant celestial blossoms fall like sparks across dark moss.',
  },
  {
    name: 'Maya-Sabha Hall of Mirrors',
    subtitle: 'Area 80 · Threshold of Extreme Trials',
    biome: 'astral_yantra',
    loreTitle: 'Illusion Stone',
    loreText: 'Eighty realms lie behind you; beyond here begin the Extreme Hard trials.',
  },
  // 81..90 (Extreme Hard Tier)
  {
    name: 'Rahu Shadow Eclipse',
    subtitle: 'Area 81 · Crescent of the Dark Node',
    biome: 'kalyug_abyss',
    loreTitle: 'Rahu Node Stele',
    loreText: 'An eerie umbra dims the sky as Rahu’s gate opens.',
  },
  {
    name: 'Ketu Tail Sanctuary',
    subtitle: 'Area 82 · Comet-Ash Observatory',
    biome: 'astral_yantra',
    loreTitle: 'Ketu Star Codex',
    loreText: 'Fierce ascetic clarity cuts through cosmic illusion.',
  },
  {
    name: 'Rudra Maha-Smasana',
    subtitle: 'Area 83 · Field of Dissolution',
    biome: 'ash_cremation',
    loreTitle: 'Mahakala Stone',
    loreText: 'Only the fearless survive the ash winds of the Great Dissolution.',
  },
  {
    name: 'Andhaka Blind Vault',
    subtitle: 'Area 84 · Pitch-Black Patala',
    biome: 'patala_caverns',
    loreTitle: 'Lantern Crystal',
    loreText: 'Keep your sacred flame bright inside the darkest cavern depths.',
  },
  {
    name: 'Shukracharya Citadel',
    subtitle: 'Area 85 · Tower of Sanjivani',
    biome: 'asura_citadel',
    loreTitle: 'Asura Preceptor Seal',
    loreText: 'Arcane ramparts pulse with forbidden revival runes.',
  },
  {
    name: 'Himavat Razor Ridge',
    subtitle: 'Area 86 · Frostbound Summit Shrine',
    biome: 'himalayan_frost',
    loreTitle: 'Summit Stambha',
    loreText: 'Blinding snow-mist conceals relentless guardians on the ridge.',
  },
  {
    name: 'Vaitarani Boiling Ford',
    subtitle: 'Area 87 · Crimson Stepwell Crossing',
    biome: 'stepwell_waters',
    loreTitle: 'Crossing Marker',
    loreText: 'Steadfast devotion turns even treacherous waters into firm stone.',
  },
  {
    name: 'Meru Golden Footsteps',
    subtitle: 'Area 88 · Ascent of the World Axis',
    biome: 'indra_swarga',
    loreTitle: 'Sumeru Plinth',
    loreText: 'Golden colonnades circle the cosmic axis linking earth and heaven.',
  },
  {
    name: 'Tamas-Kanda Outer Keep',
    subtitle: 'Area 89 · Fortress of Prime Darkness',
    biome: 'kalyug_abyss',
    loreTitle: 'Kanda Gate',
    loreText: 'One final hurdle stands before the Tandava awakening at Level 90.',
  },
  {
    name: 'Nataraja Tandava Court',
    subtitle: 'Area 90 · Ring of Cosmic Fire',
    biome: 'ash_cremation',
    loreTitle: 'Damaru Courtyard',
    loreText: 'Ninety realms behind you. Here the cosmic Damaru heralds the Hardest Tier!',
  },
  // 91..100 (Hardest Tier -> Cursed Sanctum -> Final Chamber)
  {
    name: 'Kalaratri Threshold',
    subtitle: 'Area 91 · Night of Fierce Awakening',
    biome: 'kalyug_abyss',
    loreTitle: 'Seventh Night Stele',
    loreText: 'Darkness itself trembles when Shakti’s seventh form enters the fray.',
  },
  {
    name: 'Prakriti Shattered Seal',
    subtitle: 'Area 92 · Fractured Horizon',
    biome: 'astral_yantra',
    loreTitle: 'Axis Ring',
    loreText: 'Star-rings spin wildly above the fractured foundations of Kalyug.',
  },
  {
    name: 'Asura Crown Bastion',
    subtitle: 'Area 93 · Inner Obsidian Keep',
    biome: 'asura_citadel',
    loreTitle: 'Inner Citadel Tablet',
    loreText: 'Kali Purusha’s elite vanguard guards every inch of the inner keep.',
  },
  {
    name: 'Shesha Abyssal Coil',
    subtitle: 'Area 94 · Bedrock of the Worlds',
    biome: 'patala_caverns',
    loreTitle: 'Ananta Coil Marker',
    loreText: 'At the bedrock of creation, emerald fire steadies the trembling earth.',
  },
  {
    name: 'Ganga Celestial Descent',
    subtitle: 'Area 95 · Frozen Sky Cataract',
    biome: 'himalayan_frost',
    loreTitle: 'Bhagiratha Plaque',
    loreText: 'Radiant mist washes away centuries of accumulated shadow.',
  },
  {
    name: 'Agni-Kunda Horizon',
    subtitle: 'Area 96 · Sea of Sacred Havan',
    biome: 'vedic_ashram',
    loreTitle: 'Purnahuti Stone',
    loreText: 'The final offering burns bright before the eclipse gates.',
  },
  {
    name: 'Adi-Shakti Forecourt',
    subtitle: 'Area 97 · Golden Pillars of Maha Maya',
    biome: 'indra_swarga',
    loreTitle: 'Devi Pillar',
    loreText: 'Supreme Maha Maya watches silently as the seeker nears Area 100.',
  },
  {
    name: 'Eclipse Antechamber',
    subtitle: 'Area 98 · Bridge to the Cursed Sanctum',
    biome: 'kalyug_abyss',
    loreTitle: 'Sanctum Threshold',
    loreText: 'Ahead lies the Cursed Sanctum, where three corrupted monoliths await purification.',
  },
  {
    id: 'sanctum',
    name: 'Cursed Sanctum',
    subtitle: 'Area 99 · Bridges Above the Abyss',
    biome: 'kalyug_abyss',
    loreTitle: 'Sanctum Vigil',
    loreText: 'Three corrupted monoliths tether Kali Purusha’s eclipse seal.',
  },
  {
    id: 'final_chamber',
    name: 'Final Chamber',
    subtitle: 'Area 100 · Sanctum of the Eclipse',
    biome: 'kalyug_abyss',
    loreTitle: 'Sovereign of Kalyug',
    loreText: 'Claim the Divine Amulet and banish Kali Purusha to restore Satya Yuga.',
  },
];

function getRealmTier(index: number): RealmDifficultyTier {
  if (index <= 10) return 'Easy';
  if (index <= 50) return 'Medium';
  if (index <= 80) return 'Hard';
  if (index <= 90) return 'Extreme Hard';
  return 'Hardest';
}

export const REALMS: RealmDef[] = LANDMARK_NAMES.map((entry, idx) => {
  const index = idx + 1;
  const id: AreaId = entry.id ?? `realm_${index}`;
  const audio = BIOME_AUDIO[entry.biome];
  return {
    id,
    index,
    name: entry.name,
    subtitle: entry.subtitle,
    tier: getRealmTier(index),
    recommendedLevel: index,
    requiredKills: index <= 3 ? 0 : index <= 50 ? 2 : 3,
    biome: entry.biome,
    isStoneGround: audio.isStoneGround,
    prevAreaId: null,
    nextAreaId: null,
    loreTitle: entry.loreTitle,
    loreText: entry.loreText,
    ragaScale: audio.ragaScale,
    droneHz: audio.droneHz,
    filterHz: audio.filterHz,
    windHz: audio.windHz,
    windGain: audio.windGain,
  };
});

for (let i = 0; i < REALMS.length; i++) {
  REALMS[i].prevAreaId = i > 0 ? REALMS[i - 1].id : null;
  REALMS[i].nextAreaId = i < REALMS.length - 1 ? REALMS[i + 1].id : null;
}

export const AREA_ORDER: AreaId[] = REALMS.map((r) => r.id);

export const REALMS_BY_ID: Record<string, RealmDef> = Object.fromEntries(
  REALMS.map((r) => [r.id, r])
);

export const AREA_NAMES: Record<string, string> = Object.fromEntries(
  REALMS.map((r) => [r.id, r.name])
);

export function getRealm(areaId: AreaId): RealmDef {
  return REALMS_BY_ID[areaId] ?? REALMS[0];
}
