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

// New chapters structure as provided
const chaptersConfig = [
  { title: 'Gjafir guðanna og vélmenni fornaldar', id: 'ancient-robots-and-pandora' },
  { title: 'Vélar og hugsun', id: 'velar-og-hugsun' },
  { title: 'Mynstur og vélar', id: 'mynstur-og-velar' },
  { title: 'Tölva kemur til bjargar', id: 'tolva-kemur-til-bjargar' },
  { title: 'Algrím' },
  { title: 'Próf í mennsku' },
  { title: 'Tölva nemur land' },
  { title: 'Fæðing gervigreindar' },
  { title: 'Sumur og vetur í sögu gervigreindar' },
  { title: 'Tölvur reyna við Turing-próf' },
  { title: 'Tvíundarkerfið, tungumál tölvunnar' },
  { title: 'Ritað mál í tvíundarkerfi' },
  { title: 'Hljóð og mynd í tvíundarkerfi' },
  { title: 'Rökrétt hugsun' },
  { title: 'Rök og algebra' },
  { title: 'Bilið brúað frá stærðfræði til tölva' },
  { title: 'Ílag og frálag' },
  { title: 'Þegar rökhlið vinna saman' },
  { title: 'Heili úr málmi og rafmagni' },
  { title: 'Er hægt að flytja minnið?' },
  { title: 'Skynjunarnet' },
  { title: 'Veturinn nálgast' },
  { title: 'XOR, þrautin sem felldi skynjunarnetið', id: 'xor-vandin' },
  { title: 'Kalt stríð' },
  { title: 'Deep Blue' },
  { title: 'Lognið eftir storminn' },
  { title: 'Internetið' },
  { title: 'Vorið vaknar' },
  { title: 'Fei-Fei Li og ImageNet' },
  { title: 'AlexNet og endurkoma tauganeta' },
  { title: 'Vélnám' },
  { title: 'AlphaGo' },
  { title: 'Tungumál, tókar og tauganet' },
  { title: '„Athygli er allt sem þarf."' },
  { title: 'OpenAI og ChatGPT' },
  { title: 'Hvernig veit gervigreindin hvað á að segja?', id: 'hvernig-veit-hun' },
  { title: 'Fordómafull tækni?' },
  { title: 'Íslenskan í heimi gervigreindar' },
  { title: 'Skuggahliðar tækninnar' },
  { title: 'Almenn gervigreind og ofurgervigreind' },
  { title: 'Að setja tækninni mörk' },
  { title: 'Hin opna askja Pandóru' },
  { title: 'Lúddítar' },
  { title: 'Hætti framundan?' },
  { title: 'Líf með gervigreind' },
  { title: 'Lokaorð' }
];

// Build new chapters array
const newChapters = [];
chaptersConfig.forEach(chapterDef => {
  const id = chapterDef.id || makeId(chapterDef.title);
  if (chaptersMap[id]) {
    newChapters.push(chaptersMap[id]);
  } else {
    newChapters.push(emptyChapter(id, chapterDef.title));
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
