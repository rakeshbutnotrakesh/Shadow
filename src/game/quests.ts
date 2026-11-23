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
        'Cleanse the Forgotten Forest of shadow threats and recover the Rudraksha beneath the banyan shrine.',
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
        'Navigate the subterranean tunnels, survive the awakened beasts, and retrieve the Ancient Yantra.',
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
      id: 'q_sanctum',
      areaId: 'sanctum',
      title: 'IV. The Fractured Vow',
      description:
        'Purify the three corrupted monoliths in the Cursed Sanctum and recover the Sacred Mantra.',
      xpReward: 320,
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
      title: 'V. Sovereign of Kalyug',
      description:
        'Claim the Divine Amulet at the chamber threshold and banish Kali Purusha, Sovereign of Kalyug.',
      xpReward: 800,
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
