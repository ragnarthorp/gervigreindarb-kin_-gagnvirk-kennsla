const fs = require('fs');
const existingData = JSON.parse(fs.readFileSync('public/book-content.json', 'utf8'));

// Map IDs to existing chapters
const chaptersMap = {};
existingData.chapters.forEach(ch => {
  chaptersMap[ch.id] = ch;
});

// Helper to create empty chapter
const emptyChapter = (id, title, summary = '') => ({
  id,
  title,
  summary: summary || `${title} - kafli sem bæta á við efni.`,
  elements: []
});

// Helper to create ID from title
const makeId = (title) => title.toLowerCase()
  .replace(/[áàâäãå]/g, 'a').replace(/[éèêë]/g, 'e')
  .replace(/[íìîï]/g, 'i').replace(/[óòôöõ]/g, 'o')
  .replace(/[úùûü]/g, 'u').replace(/[ý]/g, 'y')
  .replace(/[ç]/g, 'c').replace(/[ñ]/g, 'n')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// New chapters structure with parts
const chaptersConfig = [
  // HLUTI 1: HUGMYNDIR OG UPPHAF
  { title: 'Gjafir guðanna og vélmenni fornaldar', id: 'ancient-robots-and-pandora', part: 1 },
  { title: 'Vélar og hugsun', id: 'velar-og-hugsun', part: 1 },
  { title: 'Mynstur og vélar', id: 'mynstur-og-velar', part: 1 },
  { title: 'Tölva kemur til bjargar', id: 'tolva-kemur-til-bjargar', part: 1 },
  { title: 'Algrím', part: 1 },
  { title: 'Próf í mennsku', part: 1 },
  { title: 'Tölva nemur land', part: 1 },
  { title: 'Fæðing gervigreindar', part: 1 },
  { title: 'Sumur og vetur í sögu gervigreindar', part: 1 },
  { title: 'Tölvur reyna við Turing-próf', part: 1 },
  // HLUTI 2: INNVIÐIR OG UNDIRSTÖÐUR
  { title: 'Tvíundarkerfið, tungumál tölvunnar', part: 2 },
  { title: 'Ritað mál í tvíundarkerfi', part: 2 },
  { title: 'Hljóð og mynd í tvíundarkerfi', part: 2 },
  { title: 'Rökrétt hugsun', part: 2 },
  { title: 'Rök og algebra', part: 2 },
  { title: 'Bilið brúað frá stærðfræði til tölva', part: 2 },
  { title: 'Ílag og frálag', part: 2 },
  { title: 'Þegar rökhlið vinna saman', part: 2 },
  { title: 'Heili úr málmi og rafmagni', part: 2 },
  { title: 'Er hægt að flytja minnið?', part: 2 },
  { title: 'Skynjunarnet', part: 2 },
  { title: 'Veturinn nálgast', part: 2 },
  { title: 'XOR, þrautin sem felldi skynjunarnetið', id: 'xor-vandin', part: 2 },
  // HLUTI 3: ÞRÓUN, VITUND OG VANDI
  { title: 'Kalt stríð', part: 3 },
  { title: 'Deep Blue', part: 3 },
  { title: 'Lognið eftir storminn', part: 3 },
  { title: 'Internetið', part: 3 },
  { title: 'Vorið vaknar', part: 3 },
  { title: 'Fei-Fei Li og ImageNet', part: 3 },
  { title: 'AlexNet og endurkoma tauganeta', part: 3 },
  { title: 'Vélnám', part: 3 },
  { title: 'AlphaGo', part: 3 },
  { title: 'Tungumál, tókar og tauganet', part: 3 },
  { title: '„Athygli er allt sem þarf."', part: 3 },
  { title: 'OpenAI og ChatGPT', part: 3 },
  { title: 'Hvernig veit gervigreindin hvað á að segja?', id: 'hvernig-veit-hun', part: 3 },
  { title: 'Fordómafull tækni?', part: 3 },
  { title: 'Íslenskan í heimi gervigreindar', part: 3 },
  { title: 'Skuggahliðar tækninnar', part: 3 },
  { title: 'Almenn gervigreind og ofurgervigreind', part: 3 },
  { title: 'Að setja tækninni mörk', part: 3 },
  { title: 'Hin opna askja Pandóru', part: 3 },
  { title: 'Lúddítar', part: 3 },
  { title: 'Hætti framundan?', part: 3 },
  { title: 'Líf með gervigreind', part: 3 },
  { title: 'Lokaorð', part: 3 }
];

// Build new chapters array
const newChapters = [];
chaptersConfig.forEach(chapterDef => {
  const id = chapterDef.id || makeId(chapterDef.title);
  if (chaptersMap[id]) {
    const chapter = chaptersMap[id];
    chapter.part = chapterDef.part;
    newChapters.push(chapter);
  } else {
    const chapter = emptyChapter(id, chapterDef.title);
    chapter.part = chapterDef.part;
    newChapters.push(chapter);
  }
});

// Create new data object
const newData = {
  title: existingData.title,
  author: existingData.author,
  version: existingData.version,
  chapters: newChapters
};

// Write new file
fs.writeFileSync('public/book-content.json', JSON.stringify(newData, null, 2));
console.log(`Created new chapter structure with ${newChapters.length} chapters`);
newChapters.forEach((ch, i) => {
  const status = ch.elements.length > 0 ? '✓' : '○';
  console.log(`${status} ${i + 1}. ${ch.title}`);
});
