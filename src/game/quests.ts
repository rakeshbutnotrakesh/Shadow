import { REALMS } from './realms';
import { AreaId, QuestState, WorldFlags } from './types';

export function buildAreaQuests(
  flags: WorldFlags,
  artifacts: string[],
  enemiesDefeatedInArea: Partial<Record<AreaId, number>>,
  completedQuestIds: string[]
): QuestState[] {
  return REALMS.map((realm) => {
    const kills = enemiesDefeatedInArea[realm.id] ?? 0;

    if (realm.id === 'forest') {
      const done =
        completedQuestIds.includes('q_forest') ||
        (artifacts.includes('rudraksha') && kills >= 3);
      return {
        id: 'q_forest',
        areaId: 'forest',
        title: 'Area 1 · Echoes in the Grove',
        description:
          'Cleanse the Forgotten Forest of shadow threats, loot Relic Chests for random weapons, and recover the Rudraksha.',
        xpReward: 120,
        completed: done,
        objectives: [
          {
            id: 'obj_rudraksha',
            label: 'Find the Rudraksha Artifact',
            completed: artifacts.includes('rudraksha'),
          },
          {
            id: 'obj_forest_foes',
            label: `Banish Forest Shadows (${Math.min(3, kills)}/3)`,
            completed: kills >= 3,
            progress: kills,
            target: 3,
          },
        ],
      };
    }

    if (realm.id === 'temple') {
      const done =
        completedQuestIds.includes('q_temple') ||
        (flags.bellRung &&
          flags.mandalaSolved &&
          artifacts.includes('trishul_fragment') &&
          kills >= 3);
      return {
        id: 'q_temple',
        areaId: 'temple',
        title: 'Area 2 · Pillars of Silence',
        description:
          'Awaken the Ancient Temple by ringing the bell, aligning the Mandala Altar, and claiming the Trishul Fragment.',
        xpReward: 180,
        completed: done,
        objectives: [
          { id: 'obj_bell', label: 'Ring the Courtyard Temple Bell', completed: flags.bellRung },
          { id: 'obj_mandala', label: 'Align the Sacred Mandala Altar', completed: flags.mandalaSolved },
          {
            id: 'obj_trishul',
            label: 'Claim the Trishul Fragment',
            completed: artifacts.includes('trishul_fragment'),
          },
          {
            id: 'obj_temple_foes',
            label: `Defeat Temple Threats (${Math.min(3, kills)}/3)`,
            completed: kills >= 3,
            progress: kills,
            target: 3,
          },
        ],
      };
    }

    if (realm.id === 'catacombs') {
      const done =
        completedQuestIds.includes('q_catacombs') ||
        (artifacts.includes('ancient_yantra') && kills >= 3);
      return {
        id: 'q_catacombs',
        areaId: 'catacombs',
        title: 'Area 3 · Beneath the Roots',
        description:
          'Navigate the subterranean tunnels and retrieve the Ancient Yantra to open the Sunken Stepwell.',
        xpReward: 240,
        completed: done,
        objectives: [
          {
            id: 'obj_yantra',
            label: 'Recover the Ancient Yantra',
            completed: artifacts.includes('ancient_yantra'),
          },
          {
            id: 'obj_catacomb_foes',
            label: `Clear Catacomb Threats (${Math.min(3, kills)}/3)`,
            completed: kills >= 3,
            progress: kills,
            target: 3,
          },
        ],
      };
    }

    if (realm.id === 'sanctum') {
      const done =
        completedQuestIds.includes('q_sanctum') ||
        (flags.purifiedMonoliths.length >= 3 && artifacts.includes('sacred_mantra'));
      return {
        id: 'q_sanctum',
        areaId: 'sanctum',
        title: 'Area 99 · The Fractured Vow',
        description:
          'Purify the three corrupted monoliths in the Cursed Sanctum and recover the Sacred Mantra.',
        xpReward: 950,
        completed: done,
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
      };
    }

    if (realm.id === 'final_chamber') {
      const done =
        completedQuestIds.includes('q_final') ||
        flags.defeatedBosses.includes('boss_kali');
      return {
        id: 'q_final',
        areaId: 'final_chamber',
        title: 'Area 100 · Sovereign of Kalyug',
        description:
          'Claim the Divine Amulet at the chamber threshold and banish Kali Purusha, Sovereign of Kalyug.',
        xpReward: 2000,
        completed: done,
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
      };
    }

    // Areas 4..98
    const target = realm.requiredKills || 3;
    const questId = `q_${realm.id}`;
    const done = completedQuestIds.includes(questId) || kills >= target;
    const xpReward = 220 + realm.index * 16;

    return {
      id: questId,
      areaId: realm.id,
      title: `Area ${realm.index} · ${realm.name}`,
      description: `Purge ${target} shadow threats in ${realm.name} (${realm.tier} Tier) and loot Relic Chests before entering the northern portal.`,
      xpReward,
      completed: done,
      objectives: [
        {
          id: `obj_${realm.id}_foes`,
          label: `Banish Realm Shadows (${Math.min(target, kills)}/${target})`,
          completed: kills >= target,
          progress: kills,
          target,
        },
      ],
    };
  });
}
