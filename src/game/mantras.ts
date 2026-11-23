export interface VedaMantra {
  id: string;
  veda: 'Rigveda' | 'Yajurveda' | 'Samaveda' | 'Atharvaveda';
  title: string;
  sanskrit: string;
  translit: string;
  meaning: string;
  swaraHz: number[];
}

export const GAYATRI_MANTRA_LINES = [
  {
    sanskrit: 'ॐ भूर्भुवः स्वः',
    translit: 'Om Bhur Bhuvah Svah',
    meaning: 'We meditate upon the sacred cosmic realms of earth, sky, and heaven.',
  },
  {
    sanskrit: 'तत्सवितुर्वरेण्यं',
    translit: 'Tat Savitur Varenyam',
    meaning: 'We adore the supreme effulgence of the radiant Solar Source (Savitr).',
  },
  {
    sanskrit: 'भर्गो देवस्य धीमहि',
    translit: 'Bhargo Devasya Dhimahi',
    meaning: 'May we contemplate that purifying divine radiance that dispels Kalyug darkness.',
  },
  {
    sanskrit: 'धियो यो नः प्रचोदयात् ॥',
    translit: 'Dhiyo Yo Nah Prachodayat',
    meaning: 'May that eternal light illumine our intellect and guide every step toward Dharma.',
  },
];

export const VEDA_MANTRAS: VedaMantra[] = [
  {
    id: 'rig_agni',
    veda: 'Rigveda',
    title: 'Agni Sukta (Rigveda 1.1.1)',
    sanskrit: 'अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम् । होतारं रत्नधातमम् ॥',
    translit: 'Agnim ile purohitam yajnasya devam rtvijam, hotaram ratnadhatamam.',
    meaning: 'I invoke Agni, the radiant sacred fire, guide of every noble offering and giver of inner strength.',
    swaraHz: [261.63, 293.66, 329.63, 293.66, 349.23, 329.63, 293.66, 261.63],
  },
  {
    id: 'yajur_shanti',
    veda: 'Yajurveda',
    title: 'Shanti Patha (Yajurveda 36.17)',
    sanskrit: 'द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिः ।',
    translit: 'Dyauh shantir antariksham shantih prithivi shantir apah shantih.',
    meaning: 'May peace pervade the heavens, the atmosphere, the earth, and the sacred waters.',
    swaraHz: [220.0, 246.94, 293.66, 261.63, 246.94, 220.0, 196.0, 220.0],
  },
  {
    id: 'rig_asato',
    veda: 'Yajurveda',
    title: 'Pavamana Jyoti Mantra',
    sanskrit: 'असतो मा सद्गमय । तमसो मा ज्योतिर्गमय । मृत्योर्मा अमृतं गमय ॥',
    translit: 'Asato ma sadgamaya, tamaso ma jyotirgamaya, mrityorma amritam gamaya.',
    meaning: 'Lead me from the unreal to truth, from darkness to light, from fear to immortality.',
    swaraHz: [261.63, 329.63, 392.0, 349.23, 329.63, 293.66, 261.63, 329.63],
  },
  {
    id: 'sama_soma',
    veda: 'Samaveda',
    title: 'Sama Swara Invocation',
    sanskrit: 'ओम् नमः पवमान सोमाय अमृतधाराय तेजोमयाय ॥',
    translit: 'Om namah pavamana somaya amritadharaya tejomayaya.',
    meaning: 'Salutations to the purifying Sama cadence that replenishes luminous spiritual energy.',
    swaraHz: [293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 261.63],
  },
  {
    id: 'atharva_bhumi',
    veda: 'Atharvaveda',
    title: 'Prithvi Sukta (Atharvaveda 12.1.12)',
    sanskrit: 'माता भूमिः पुत्रो अहं पृथिव्याः ॥',
    translit: 'Mata bhumih putro aham prithivyah.',
    meaning: 'The sacred Earth is our mother, and we are her steadfast protectors.',
    swaraHz: [196.0, 220.0, 261.63, 293.66, 261.63, 220.0, 196.0, 220.0],
  },
  {
    id: 'yajur_tryambakam',
    veda: 'Yajurveda',
    title: 'Mahamrityunjaya (Yajurveda 3.60)',
    sanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात् ॥',
    translit: 'Om tryambakam yajamahe sugandhim pushtivardhanam, urvarukamiva bandhanan mrityor mukshiya mamritat.',
    meaning: 'We revere the Three-Eyed Protector who nourishes all beings and frees us from every bond of shadow.',
    swaraHz: [220.0, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94, 220.0],
  },
  {
    id: 'rig_sangacchadhvam',
    veda: 'Rigveda',
    title: 'Samjnana Sukta (Rigveda 10.191.2)',
    sanskrit: 'सं गच्छध्वं सं वदध्वं सं वो मनांसि जानताम् ॥',
    translit: 'Sam gacchadhvam sam vadadhvam sam vo manamsi janatam.',
    meaning: 'Walk together in harmony, speak with clarity, and let your hearts unite in righteousness.',
    swaraHz: [246.94, 293.66, 329.63, 349.23, 329.63, 293.66, 261.63, 246.94],
  },
  {
    id: 'sama_jyoti',
    veda: 'Samaveda',
    title: 'Surya Jyoti Hymn (Samaveda)',
    sanskrit: 'उद्वयं तमसस्परि ज्योतिष्पश्यन्त उत्तरम् । देवं देवत्रा सूर्यमगन्म ज्योतिरुत्तमम् ॥',
    translit: 'Ud vayam tamasas pari jyotish pashyanta uttaram, devam devatra suryam aganma jyotir uttamam.',
    meaning: 'Rising above all darkness, gazing upon higher radiance, we attain the supreme solar light.',
    swaraHz: [261.63, 349.23, 392.0, 440.0, 392.0, 349.23, 329.63, 261.63],
  },
  {
    id: 'atharva_abhaya',
    veda: 'Atharvaveda',
    title: 'Abhaya Sukta (Atharvaveda 19.15.6)',
    sanskrit: 'अभयं मित्रादभयममित्रादभयं ज्ञातादभयं परोक्षात् ॥',
    translit: 'Abhayam mitrad abhayam amitrad abhayam jnatad abhayam parokshat.',
    meaning: 'Fearlessness from friend and foe alike, fearlessness in what is seen and unseen.',
    swaraHz: [220.0, 293.66, 329.63, 293.66, 261.63, 246.94, 220.0, 196.0],
  },
  {
    id: 'yajur_purnamadah',
    veda: 'Yajurveda',
    title: 'Purnam Mantra (Shukla Yajurveda)',
    sanskrit: 'ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते ॥',
    translit: 'Om purnamadah purnamidam purnat purnam udachyate.',
    meaning: 'That Supreme Reality is infinite wholeness; this creation is wholeness born of wholeness.',
    swaraHz: [261.63, 293.66, 392.0, 349.23, 329.63, 293.66, 261.63, 261.63],
  },
];

export function pickRandomVedaMantra(lastId?: string | null): VedaMantra {
  const pool = lastId ? VEDA_MANTRAS.filter((m) => m.id !== lastId) : VEDA_MANTRAS;
  return pool[Math.floor(Math.random() * pool.length)];
}
