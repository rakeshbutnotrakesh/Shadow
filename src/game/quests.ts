import { AreaId, QuestState, WorldFlags } from './types';

export function buildAreaQuests(
  flags: WorldFlags,
  artifacts: string[],
  enemiesDefeatedInArea: Record<AreaId, number>,
  completedQuestIds: string[]
): QuestState[] {
  const forestEnemies = enemiesDefeatedInArea.forest ?? 0;
  const templeEnemies = enemiesDefeatedInArea.temple ?? 0;
  const catacombEnemies = enemiesDefeatedInArea.catacombs ?? 0;
  const stepwellEnemies = enemiesDefeatedInArea.sunken_stepwell ?? 0;
  const ashramEnemies = enemiesDefeatedInArea.ashram_ruins ?? 0;
  const fortressEnemies = enemiesDefeatedInArea.asura_fortress ?? 0;
  const observatoryEnemies = enemiesDefeatedInArea.astral_observatory ?? 0;
  const cavernsEnemies = enemiesDefeatedInArea.serpent_caverns ?? 0;

  const qForestDone =
    completedQuestIds.includes('q_forest') ||
    (artifacts.includes('rudraksha') && forestEnemies >= 3);

  const qTempleDone =
    completedQuestIds.includes('q_temple') ||
    (flags.bellRung &&
      flags.mandalaSolved &&
      artifacts.includes('trishul_fragment') &&
      templeEnemies >= 3);

  const qCatacombsDone =
    completedQuestIds.includes('q_catacombs') ||
    (artifacts.includes('ancient_yantra') && catacombEnemies >= 3);

  const qStepwellDone =
    completedQuestIds.includes('q_stepwell') || stepwellEnemies >= 3;

  const qAshramDone =
    completedQuestIds.includes('q_ashram') || ashramEnemies >= 3;

  const qFortressDone =
    completedQuestIds.includes('q_fortress') || fortressEnemies >= 3;

  const qObservatoryDone =
    completedQuestIds.includes('q_observatory') || observatoryEnemies >= 3;

  const qCavernsDone =
    completedQuestIds.includes('q_caverns') || cavernsEnemies >= 3;

  const qSanctumDone =
    completedQuestIds.includes('q_sanctum') ||
    (flags.purifiedMonoliths.length >= 3 && artifacts.includes('sacred_mantra'));

  const qFinalDone =
    completedQuestIds.includes('q_final') ||
    flags.defeatedBosses.includes('boss_kali');

  return [
    {
      id: 'q_forest',
      areaId: 'forest',
      title: 'I. Echoes in the Grove',
      description:
        'Cleanse the Forgotten Forest of shadow threats, loot the Relic Chests, and recover the Rudraksha beneath the banyan shrine.',
      xpReward: 120,
      completed: qForestDone,
      objectives: [
        {
          id: 'obj_rudraksha',
          label: 'Find the Rudraksha Artifact',
          completed: artifacts.includes('rudraksha'),
        },
        {
          id: 'obj_forest_foes',
          label: `Banish Forest Shadows (${Math.min(3, forestEnemies)}/3)`,
          completed: forestEnemies >= 3,
          progress: forestEnemies,
          target: 3,
        },
      ],
    },
    {
      id: 'q_temple',
      areaId: 'temple',
      title: 'II. Pillars of Silence',
      description:
        'Awaken the Ancient Temple by ringing the bronze bell, aligning the Mandala Altar, and claiming the Trishul Fragment.',
      xpReward: 180,
      completed: qTempleDone,
      objectives: [
        {
          id: 'obj_bell',
          label: 'Ring the Courtyard Temple Bell',
          completed: flags.bellRung,
        },
        {
          id: 'obj_mandala',
          label: 'Align the Sacred Mandala Altar',
          completed: flags.mandalaSolved,
        },
        {
          id: 'obj_trishul',
          label: 'Claim the Trishul Fragment',
          completed: artifacts.includes('trishul_fragment'),
        },
        {
          id: 'obj_temple_foes',
          label: `Defeat Temple Threats (${Math.min(3, templeEnemies)}/3)`,
          completed: templeEnemies >= 3,
          progress: templeEnemies,
          target: 3,
        },
      ],
    },
    {
      id: 'q_catacombs',
      areaId: 'catacombs',
      title: 'III. Beneath the Roots',
      description:
        'Navigate the subterranean tunnels, survive the awakened beasts, and retrieve the Ancient Yantra to open the Sunken Stepwell.',
      xpReward: 240,
      completed: qCatacombsDone,
      objectives: [
        {
          id: 'obj_yantra',
          label: 'Recover the Ancient Yantra',
          completed: artifacts.includes('ancient_yantra'),
        },
        {
          id: 'obj_catacomb_foes',
          label: `Clear Catacomb Threats (${Math.min(3, catacombEnemies)}/3)`,
          completed: catacombEnemies >= 3,
          progress: catacombEnemies,
          target: 3,
        },
      ],
    },
    {
      id: 'q_stepwell',
      areaId: 'sunken_stepwell',
      title: 'IV. Waters of Chand-Baori',
      description:
        'Purge shadow threats patrolling the Sunken Stepwell to unseal the northern passage to the Shattered Ashram.',
      xpReward: 280,
      completed: qStepwellDone,
      objectives: [
        {
          id: 'obj_stepwell_foes',
          label: `Banish Stepwell Shadows (${Math.min(3, stepwellEnemies)}/3)`,
          completed: stepwellEnemies >= 3,
          progress: stepwellEnemies,
          target: 3,
        },
      ],
    },
    {
      id: 'q_ashram',
      areaId: 'ashram_ruins',
      title: 'V. Hermitage of Eternal Fire',
      description:
        'Defend the Shattered Rishi Ashram, collect chest weapons, and open the gate toward the Obsidian Fortress.',
      xpReward: 320,
      completed: qAshramDone,
      objectives: [
        {
          id: 'obj_ashram_foes',
          label: `Clear Ashram Threats (${Math.min(3, ashramEnemies)}/3)`,
          completed: ashramEnemies >= 3,
          progress: ashramEnemies,
          target: 3,
        },
      ],
    },
    {
      id: 'q_fortress',
      areaId: 'asura_fortress',
      title: 'VI. Gate of the Asura Rampart',
      description:
        'Break the vanguard guarding the Obsidian Fortress to reach the celestial Yantra Observatory.',
      xpReward: 360,
      completed: qFortressDone,
      objectives: [
        {
          id: 'obj_fortress_foes',
          label: `Defeat Fortress Guardians (${Math.min(3, fortressEnemies)}/3)`,
          completed: fortressEnemies >= 3,
          progress: fortressEnemies,
          target: 3,
        },
      ],
    },
    {
      id: 'q_observatory',
      areaId: 'astral_observatory',
      title: 'VII. Alignment of Samrat Yantra',
      description:
        'Cleanse the Astral Observatory under rotating cosmic rings and open the descent into Naga Patala Caverns.',
      xpReward: 420,
      completed: qObservatoryDone,
      objectives: [
        {
          id: 'obj_observatory_foes',
          label: `Banish Observatory Shadows (${Math.min(3, observatoryEnemies)}/3)`,
          completed: observatoryEnemies >= 3,
          progress: observatoryEnemies,
          target: 3,
        },
      ],
    },
    {
      id: 'q_caverns',
      areaId: 'serpent_caverns',
      title: 'VIII. Vaults of Vasuki',
      description:
        'Traverse the bioluminescent Naga Caverns and clear its guardians to reach the Cursed Sanctum.',
      xpReward: 480,
      completed: qCavernsDone,
      objectives: [
        {
          id: 'obj_caverns_foes',
          label: `Clear Cavern Threats (${Math.min(3, cavernsEnemies)}/3)`,
          completed: cavernsEnemies >= 3,
          progress: cavernsEnemies,
          target: 3,
        },
      ],
    },
    {
      id: 'q_sanctum',
      areaId: 'sanctum',
      title: 'IX. The Fractured Vow',
      description:
        'Purify the three corrupted monoliths in the Cursed Sanctum and recover the Sacred Mantra.',
      xpReward: 560,
      completed: qSanctumDone,
      objectives: [
        {
          id: 'obj_monoliths',
          label: `Purify Corrupted Monoliths (${Math.min(3, flags.purifiedMonoliths.length)}/3)`,
          completed: flags.purifiedMonoliths.length >= 3,
          progress: flags.purifiedMonoliths.length,
          target: 3,
        },
        {
          id: 'obj_mantra',
          label: 'Retrieve the Sacred Mantra',
          completed: artifacts.includes('sacred_mantra'),
        },
      ],
    },
    {
      id: 'q_final',
      areaId: 'final_chamber',
      title: 'X. Sovereign of Kalyug',
      description:
        'Claim the Divine Amulet at the chamber threshold and banish Kali Purusha, Sovereign of Kalyug.',
      xpReward: 1000,
      completed: qFinalDone,
      objectives: [
        {
          id: 'obj_amulet',
          label: 'Claim the Divine Amulet',
          completed: artifacts.includes('divine_amulet'),
        },
        {
          id: 'obj_boss',
          label: 'Banish Kali Purusha, Sovereign of Kalyug',
          completed: flags.defeatedBosses.includes('boss_kali'),
        },
      ],
    },
  ];
}
