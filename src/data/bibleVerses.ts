interface BibleVerse {
  reference: string;
  text: string;
}

export const encouragementVerses: BibleVerse[] = [
  { reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.' },
  { reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.' },
  { reference: 'Psalm 34:17', text: 'The righteous cry out, and the LORD hears them; he delivers them from all their troubles.' },
  { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
  { reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.' },
  { reference: 'Psalm 55:22', text: 'Cast your cares on the LORD and he will sustain you; he will never let the righteous be shaken.' },
  { reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.' },
  { reference: 'John 14:27', text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.' },
  { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.' },
  { reference: '2 Corinthians 12:9', text: 'But he said to me, My grace is sufficient for you, for my power is made perfect in weakness.' },
  { reference: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.' },
  { reference: 'Psalm 23:4', text: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.' },
  { reference: 'Hebrews 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
  { reference: 'Matthew 17:20', text: 'Truly I tell you, if you have faith as small as a mustard seed, you can say to this mountain, Move from here to there, and it will move. Nothing will be impossible for you.' },
  { reference: 'Psalm 121:1-2', text: 'I lift up my eyes to the mountains—where does my help come from? My help comes from the LORD, the Maker of heaven and earth.' },
  { reference: 'Proverbs 3:5-6', text: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
  { reference: 'Isaiah 40:31', text: 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
  { reference: 'Psalm 37:4', text: 'Take delight in the LORD, and he will give you the desires of your heart.' },
  { reference: 'Zephaniah 3:17', text: 'The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.' },
];

export const welcomeVerses: BibleVerse[] = [
  { reference: 'Romans 15:7', text: 'Therefore welcome one another as Christ has welcomed you, for the glory of God.' },
  { reference: 'Hebrews 13:2', text: 'Do not neglect to show hospitality to strangers, for thereby some have entertained angels unawares.' },
  { reference: 'Matthew 25:35', text: 'For I was hungry and you gave me food, I was thirsty and you gave me drink, I was a stranger and you welcomed me.' },
  { reference: 'Ephesians 2:19', text: 'So then you are no longer strangers and aliens, but you are fellow citizens with the saints and members of the household of God.' },
  { reference: '1 Peter 4:9', text: 'Show hospitality to one another without grumbling.' },
  { reference: '3 John 1:8', text: 'Therefore we ought to support people like these, that we may be fellow workers for the truth.' },
  { reference: 'Psalm 122:1', text: 'I was glad when they said to me, Let us go to the house of the LORD!' },
  { reference: 'Isaiah 56:7', text: 'These I will bring to my holy mountain, and give them joy in my house of prayer.' },
  { reference: 'Zephaniah 3:17', text: 'The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.' },
  { reference: 'Colossians 3:12', text: 'Put on then, as God\'s chosen ones, holy and beloved, compassionate hearts, kindness, humility, meekness, and patience.' },
];

export function getRandomVerse(): BibleVerse {
  return encouragementVerses[Math.floor(Math.random() * encouragementVerses.length)];
}

export function getRandomWelcomeVerse(): BibleVerse {
  return welcomeVerses[Math.floor(Math.random() * welcomeVerses.length)];
}
