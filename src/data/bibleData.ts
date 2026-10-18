export interface BibleVerseEntry {
  reference: string;
  book: string;
  text: string;
  context: string;
}

export interface BibleDictionaryEntry {
  term: string;
  aliases: string[];
  definition: string;
  scriptureRef: string;
}

export const bibleVerses: BibleVerseEntry[] = [
  { reference: 'John 3:16', book: 'John', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', context: 'One of the most beloved verses in the Bible, summarizing the gospel message — God\'s love, the gift of Jesus, and the promise of eternal life through faith.' },
  { reference: 'Philippians 4:6-7', book: 'Philippians', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', context: 'Paul\'s encouragement to replace anxiety with prayer, promising God\'s peace as a result.' },
  { reference: 'Jeremiah 29:11', book: 'Jeremiah', text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.', context: 'God\'s promise of hope and a future, originally spoken to the Israelites in Babylonian exile.' },
  { reference: 'Romans 8:28', book: 'Romans', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', context: 'A reassurance that God sovereignly works through all circumstances for the benefit of those who love Him.' },
  { reference: 'Psalm 23:1', book: 'Psalm', text: 'The LORD is my shepherd, I lack nothing.', context: 'The opening of the most famous psalm, portraying God as a caring shepherd who provides for every need.' },
  { reference: 'Psalm 23:4', book: 'Psalm', text: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.', context: 'A declaration of trust in God\'s presence and protection even in life\'s darkest moments.' },
  { reference: 'Proverbs 3:5-6', book: 'Proverbs', text: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', context: 'Wisdom about relying on God\'s understanding rather than our own, with a promise of guidance.' },
  { reference: 'Isaiah 41:10', book: 'Isaiah', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', context: 'God\'s comforting promise of His presence, strength, and support in times of fear.' },
  { reference: 'Matthew 6:33', book: 'Matthew', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', context: 'Jesus\' teaching on prioritizing God\'s kingdom above worldly concerns, with a promise of provision.' },
  { reference: 'Matthew 28:19-20', book: 'Matthew', text: 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.', context: 'Known as the Great Commission — Jesus\' final instruction to His followers to spread the gospel worldwide.' },
  { reference: 'Matthew 11:28', book: 'Matthew', text: 'Come to me, all you who are weary and burdened, and I will give you rest.', context: 'Jesus\' invitation to find rest and peace in Him, especially for those who are overwhelmed.' },
  { reference: 'Joshua 1:9', book: 'Joshua', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.', context: 'God\'s charge to Joshua as he assumes leadership of Israel, emphasizing courage and God\'s constant presence.' },
  { reference: 'Genesis 1:1', book: 'Genesis', text: 'In the beginning God created the heavens and the earth.', context: 'The opening verse of the Bible, establishing God as the Creator of all things.' },
  { reference: 'Exodus 14:14', book: 'Exodus', text: 'The LORD will fight for you; you need only to be still.', context: 'Moses\' reassurance to the Israelites at the Red Sea, reminding them that God fights on their behalf.' },
  { reference: 'Psalm 46:1', book: 'Psalm', text: 'God is our refuge and strength, an ever-present help in trouble.', context: 'A psalm of confidence in God as a safe haven and source of strength during difficulties.' },
  { reference: 'Psalm 46:10', book: 'Psalm', text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.', context: 'A call to stillness and recognition of God\'s sovereignty over all the earth.' },
  { reference: 'Isaiah 40:31', book: 'Isaiah', text: 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', context: 'A promise that those who trust in God will receive renewed and enduring strength.' },
  { reference: 'Isaiah 53:5', book: 'Isaiah', text: 'But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed.', context: 'A prophetic description of the suffering servant (Jesus) and His sacrificial death for humanity\'s sins.' },
  { reference: 'Ecclesiastes 3:1', book: 'Ecclesiastes', text: 'There is a time for everything, and a season for every activity under the heavens.', context: 'A reflection on the seasons of life and God\'s sovereignty over the timing of all things.' },
  { reference: '1 Corinthians 13:4-5', book: '1 Corinthians', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.', context: 'Paul\'s famous description of agape love — the highest form of selfless, unconditional love.' },
  { reference: '1 Corinthians 13:7', book: '1 Corinthians', text: 'It always protects, always trusts, always hopes, always perseveres.', context: 'The continuation of Paul\'s description of love, emphasizing its enduring and resilient nature.' },
  { reference: '2 Corinthians 12:9', book: '2 Corinthians', text: 'But he said to me, My grace is sufficient for you, for my power is made perfect in weakness. Therefore I will boast all the more gladly about my weaknesses, so that Christ\'s power may rest on me.', context: 'Paul sharing God\'s response to his prayer, revealing that divine power works through human weakness.' },
  { reference: 'Galatians 5:22-23', book: 'Galatians', text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.', context: 'Paul listing the nine characteristics that the Holy Spirit produces in the life of a believer.' },
  { reference: 'Ephesians 2:8-9', book: 'Ephesians', text: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast.', context: 'A foundational statement on salvation by grace through faith, not by human effort.' },
  { reference: 'Philippians 4:13', book: 'Philippians', text: 'I can do all this through him who gives me strength.', context: 'Paul\'s declaration that his ability to endure all circumstances comes from Christ\'s strength.' },
  { reference: 'Philippians 4:8', book: 'Philippians', text: 'Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things.', context: 'Paul\'s guidance on focusing the mind on what is good and godly.' },
  { reference: 'Colossians 3:23', book: 'Colossians', text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.', context: 'An instruction to do all work as service to God, giving our best effort.' },
  { reference: '1 Thessalonians 5:16-18', book: '1 Thessalonians', text: 'Rejoice always, pray continually, give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.', context: 'Three brief but powerful commands — joy, prayer, and gratitude — as God\'s will for believers.' },
  { reference: '2 Timothy 1:7', book: '2 Timothy', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', context: 'Paul reminding Timothy that the Holy Spirit empowers believers with courage, love, and discipline.' },
  { reference: 'Hebrews 11:1', book: 'Hebrews', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.', context: 'The classic biblical definition of faith — trusting in what is unseen but hoped for.' },
  { reference: 'Hebrews 11:6', book: 'Hebrews', text: 'And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.', context: 'An explanation of why faith is essential to a relationship with God.' },
  { reference: 'James 1:5', book: 'James', text: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.', context: 'An encouragement to seek wisdom from God, who gives it freely and without judgment.' },
  { reference: '1 Peter 5:7', book: '1 Peter', text: 'Cast all your anxiety on him because he cares for you.', context: 'An invitation to surrender worries to God, motivated by His genuine care and love.' },
  { reference: '1 John 4:8', book: '1 John', text: 'Whoever does not love does not know God, because God is love.', context: 'A profound statement about God\'s nature — love is not just what God does, it is who He is.' },
  { reference: '1 John 4:19', book: '1 John', text: 'We love because he first loved us.', context: 'A reminder that our capacity to love others originates from God\'s love for us.' },
  { reference: 'Revelation 3:20', book: 'Revelation', text: 'Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with that person, and they with me.', context: 'Jesus\' invitation to fellowship, depicting Him patiently waiting for us to welcome Him in.' },
  { reference: 'Psalm 1:1-2', book: 'Psalm', text: 'Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers, but whose delight is in the law of the LORD, and who meditates on his law day and night.', context: 'The opening of Psalms, describing the blessed life as one that avoids evil and delights in God\'s Word.' },
  { reference: 'Psalm 19:1', book: 'Psalm', text: 'The heavens declare the glory of God; the skies proclaim the work of his hands.', context: 'A psalm celebrating how creation itself reveals God\'s majesty and glory.' },
  { reference: 'Psalm 34:18', book: 'Psalm', text: 'The LORD is close to the brokenhearted and saves those who are crushed in spirit.', context: 'A comforting reminder that God is especially near to those who are grieving and hurting.' },
  { reference: 'Psalm 91:1-2', book: 'Psalm', text: 'Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the LORD, He is my refuge and my fortress, my God, in whom I trust.', context: 'A psalm of protection, describing God as a secure dwelling place for those who trust in Him.' },
  { reference: 'Psalm 119:105', book: 'Psalm', text: 'Your word is a lamp for my feet, a light on my path.', context: 'A celebration of God\'s Word as guidance for life\'s journey.' },
  { reference: 'Psalm 139:14', book: 'Psalm', text: 'I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.', context: 'A psalm of wonder at how God has intricately and purposefully created each person.' },
  { reference: 'Matthew 5:3-12', book: 'Matthew', text: 'Blessed are the poor in spirit, for theirs is the kingdom of heaven. Blessed are those who mourn, for they will be comforted. Blessed are the meek, for they will inherit the earth. Blessed are those who hunger and thirst for righteousness, for they will be filled. Blessed are the merciful, for they will be shown mercy. Blessed are the pure in heart, for they will see God. Blessed are the peacemakers, for they will be called children of God. Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven.', context: 'The Beatitudes — Jesus\' opening teaching in the Sermon on the Mount, describing the values of God\'s kingdom.' },
  { reference: 'Matthew 6:9-13', book: 'Matthew', text: 'Our Father in heaven, hallowed be your name, your kingdom come, your will be done, on earth as it is in heaven. Give us today our daily bread. And forgive us our debts, as we also have forgiven our debtors. And lead us not into temptation, but deliver us from the evil one.', context: 'The Lord\'s Prayer — the model prayer Jesus taught His disciples, covering worship, provision, forgiveness, and protection.' },
  { reference: 'Matthew 7:7', book: 'Matthew', text: 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.', context: 'Jesus\' encouragement to persistently seek God, with a promise of response.' },
  { reference: 'Mark 11:24', book: 'Mark', text: 'Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours.', context: 'Jesus teaching on the power of faith-filled prayer.' },
  { reference: 'Luke 6:38', book: 'Luke', text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.', context: 'Jesus\' teaching on generosity — the way we give determines how we receive.' },
  { reference: 'John 1:1', book: 'John', text: 'In the beginning was the Word, and the Word was with God, and the Word was God.', context: 'The opening of John\'s Gospel, identifying Jesus as the eternal Word who is both with God and is God.' },
  { reference: 'John 8:32', book: 'John', text: 'Then you will know the truth, and the truth will set you free.', context: 'Jesus\' promise that knowing the truth (Him) brings genuine freedom.' },
  { reference: 'John 14:6', book: 'John', text: 'Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me.', context: 'Jesus\' exclusive claim to being the only path to God the Father.' },
  { reference: 'John 14:27', book: 'John', text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', context: 'Jesus\' farewell gift of peace to His disciples, distinct from worldly peace.' },
  { reference: 'John 15:13', book: 'John', text: 'Greater love has no one than this: to lay down one\'s life for one\'s friends.', context: 'Jesus defining the greatest expression of love as sacrificial, pointing to His own upcoming death.' },
  { reference: 'Acts 1:8', book: 'Acts', text: 'But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.', context: 'Jesus\' final promise before His ascension — the Holy Spirit\'s power for worldwide witness.' },
  { reference: 'Romans 5:8', book: 'Romans', text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.', context: 'Paul explaining that God\'s love is shown through Christ\'s sacrificial death, even for those who were undeserving.' },
  { reference: 'Romans 8:38-39', book: 'Romans', text: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.', context: 'Paul\'s triumphant declaration that nothing in all creation can sever the believer from God\'s love.' },
  { reference: 'Romans 12:2', book: 'Romans', text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is—his good, pleasing and perfect will.', context: 'Paul\'s call to mental and spiritual transformation as the key to discerning God\'s will.' },
  { reference: 'Romans 10:9', book: 'Romans', text: 'If you declare with your mouth, Jesus is Lord, and believe in your heart that God raised him from the dead, you will be saved.', context: 'A clear statement of the conditions for salvation — confession and belief.' },
  { reference: '1 Corinthians 10:13', book: '1 Corinthians', text: 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear. But when you are tempted, he will also provide a way out so that you can endure it.', context: 'A reassurance of God\'s faithfulness in temptation — He limits it and always provides an escape.' },
  { reference: '2 Corinthians 5:17', book: '2 Corinthians', text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!', context: 'A celebration of the transformative power of being united with Christ — becoming entirely new.' },
  { reference: 'Ephesians 6:11', book: 'Ephesians', text: 'Put on the full armor of God, so that you can take your stand against the devil\'s schemes.', context: 'An introduction to the spiritual armor metaphor — God\'s provision for spiritual warfare.' },
  { reference: 'Hebrews 13:8', book: 'Hebrews', text: 'Jesus Christ is the same yesterday and today and forever.', context: 'A declaration of Christ\'s unchanging nature across all time.' },
  { reference: 'James 1:2-3', book: 'James', text: 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.', context: 'An instruction to view trials as opportunities for spiritual growth and endurance.' },
  { reference: 'Revelation 21:4', book: 'Revelation', text: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.', context: 'A vision of the new heaven and new earth, where suffering and death are no more.' },
];

export const bibleDictionary: BibleDictionaryEntry[] = [
  { term: 'Grace', aliases: ['grace', 'unmerited favor'], definition: 'God\'s undeserved favor and love toward humanity. Grace is a gift that cannot be earned — it is God freely giving blessings, forgiveness, and salvation to those who do not deserve it. It is the foundation of the Christian faith.', scriptureRef: 'Ephesians 2:8-9' },
  { term: 'Faith', aliases: ['faith', 'belief', 'trust in god'], definition: 'Complete trust and confidence in God and His promises. Biblically, faith is described as the assurance of things hoped for and the conviction of things not seen. It is both a belief in God\'s existence and an active reliance on His character and Word.', scriptureRef: 'Hebrews 11:1' },
  { term: 'Repentance', aliases: ['repentance', 'repent', 'turn from sin'], definition: 'A genuine turning away from sin and turning toward God. It involves a change of mind, heart, and direction — not just feeling sorry for sin, but actively choosing to abandon it and follow God\'s ways.', scriptureRef: 'Acts 3:19' },
  { term: 'Salvation', aliases: ['salvation', 'saved', 'being saved', 'deliverance'], definition: 'God\'s deliverance of humanity from sin and its consequences. Salvation is accomplished through the death and resurrection of Jesus Christ and is received by grace through faith. It includes forgiveness, new life, and the promise of eternal life.', scriptureRef: 'Romans 10:9' },
  { term: 'Redemption', aliases: ['redemption', 'redeem', 'redeemed', 'ransom'], definition: 'The act of buying back or freeing someone from bondage. In the Bible, it refers to God freeing humanity from slavery to sin through the sacrificial death of Jesus, who paid the ransom with His own life.', scriptureRef: 'Ephesians 1:7' },
  { term: 'Justification', aliases: ['justification', 'justified', 'declare righteous'], definition: 'God\'s act of declaring a sinner righteous in His sight. This is not based on the person\'s good works but on faith in Jesus Christ. It is a legal term — God credits Christ\'s righteousness to the believer.', scriptureRef: 'Romans 5:1' },
  { term: 'Sanctification', aliases: ['sanctification', 'sanctify', 'holy', 'holiness'], definition: 'The lifelong process of being made holy — set apart for God\'s purposes. It begins at salvation and continues as the believer grows in Christlikeness through the work of the Holy Spirit, Scripture, and life experiences.', scriptureRef: '1 Thessalonians 4:3' },
  { term: 'Atonement', aliases: ['atonement', 'atone', 'reconciliation'], definition: 'The reconciliation between God and humanity accomplished through Jesus Christ\'s sacrificial death. The word means "at-one-ment" — making humanity and God one again by covering and removing sin.', scriptureRef: 'Romans 3:25' },
  { term: 'Covenant', aliases: ['covenant', 'promise', 'agreement'], definition: 'A solemn binding agreement between God and His people. The Bible describes several covenants — with Noah, Abraham, Moses, David, and the New Covenant established through Jesus\' blood. Each reveals God\'s commitment to His people.', scriptureRef: 'Hebrews 9:15' },
  { term: 'Holy Spirit', aliases: ['holy spirit', 'spirit of god', 'ghost', 'paraclete', 'comforter', 'helper'], definition: 'The third Person of the Trinity — God living within and among believers. The Holy Spirit convicts of sin, regenerates, indwells, empowers, teaches, guides, and transforms believers into Christ\'s likeness. He is the active presence of God in the world today.', scriptureRef: 'John 14:26' },
  { term: 'Trinity', aliases: ['trinity', 'triune', 'three persons', 'godhead'], definition: 'The Christian doctrine that God is one being existing eternally in three co-equal Persons: Father, Son (Jesus Christ), and Holy Spirit. They are distinct in person but unified in essence — one God in three Persons.', scriptureRef: 'Matthew 28:19' },
  { term: 'Sin', aliases: ['sin', 'transgression', 'iniquity', 'wrongdoing'], definition: 'Any thought, word, or action that falls short of God\'s perfect standard. Sin is rebellion against God\'s will and nature. The Bible teaches that all have sinned and that sin separates humanity from God, but Christ\'s death provides forgiveness.', scriptureRef: 'Romans 3:23' },
  { term: 'Kingdom of God', aliases: ['kingdom of god', 'kingdom of heaven', 'god\'s kingdom'], definition: 'God\'s sovereign rule and reign — both His present spiritual reign in the hearts of believers and the future full manifestation of His kingdom. Jesus preached extensively about the kingdom, describing it as both already here and yet to come in fullness.', scriptureRef: 'Matthew 6:33' },
  { term: 'Gospel', aliases: ['gospel', 'good news', 'evangel'], definition: 'The "good news" that God has provided salvation for humanity through the life, death, and resurrection of Jesus Christ. The gospel message is that all are sinners, Christ died and rose again for our sins, and salvation is available by grace through faith in Him.', scriptureRef: '1 Corinthians 15:1-4' },
  { term: 'Prayer', aliases: ['prayer', 'pray', 'intercession', 'petition'], definition: 'Communication with God — talking to Him and listening for His response. Prayer includes praise, thanksgiving, confession, petition, and intercession. Jesus taught His disciples to pray and modeled a life of constant communion with the Father.', scriptureRef: 'Philippians 4:6-7' },
  { term: 'Baptism', aliases: ['baptism', 'baptize', 'baptized'], definition: 'A Christian ordinance of water immersion (or pouring/sprinkling) symbolizing the believer\'s identification with Christ\'s death, burial, and resurrection. It represents the washing away of sin and the beginning of new life in Christ.', scriptureRef: 'Matthew 28:19' },
  { term: 'Communion', aliases: ['communion', 'lord\'s supper', 'eucharist', 'last supper', 'bread and wine'], definition: 'A Christian ordinance of sharing bread and wine (or juice) in remembrance of Christ\'s sacrificial death. The bread represents His body broken for us, and the cup represents His blood shed for the forgiveness of sins. Also called the Lord\'s Supper or Eucharist.', scriptureRef: '1 Corinthians 11:23-26' },
  { term: 'Prophecy', aliases: ['prophecy', 'prophet', 'prophetic', 'foretell'], definition: 'A message from God delivered through a human spokesperson. In the Bible, prophets were called by God to declare His will, warn of judgment, call for repentance, and foretell future events. Prophecy also includes speaking God\'s truth to edify, encourage, and comfort.', scriptureRef: '1 Corinthians 14:3' },
  { term: 'Mercy', aliases: ['mercy', 'compassion', 'pity'], definition: 'God\'s compassion and kindness toward those in distress, especially those who deserve punishment. Mercy is not getting what we deserve (judgment), while grace is getting what we don\'t deserve (blessing). God\'s mercy is everlasting and new every morning.', scriptureRef: 'Lamentations 3:22-23' },
  { term: 'Righteousness', aliases: ['righteousness', 'righteous', 'upright', 'just'], definition: 'The quality of being morally right and just in God\'s eyes. For humans, righteousness comes through faith in Christ, who is our righteousness. It involves both a right standing before God (imputed righteousness) and right living that reflects God\'s character.', scriptureRef: 'Romans 1:17' },
  { term: 'Fellowship', aliases: ['fellowship', 'communion with believers', 'koinonia', 'community'], definition: 'The shared spiritual life and mutual participation among believers in Christ. The Greek word koinonia means partnership, sharing, and participation. Fellowship involves worship, prayer, breaking bread, and supporting one another in love.', scriptureRef: 'Acts 2:42' },
  { term: 'Worship', aliases: ['worship', 'praise', 'adoration'], definition: 'The response of all that we are to all that God is. Worship is ascribing worth to God through praise, adoration, obedience, and a life surrendered to Him. It is both a personal and corporate activity — not just singing, but living for God\'s glory.', scriptureRef: 'John 4:24' },
  { term: 'Discipleship', aliases: ['discipleship', 'disciple', 'follow jesus', 'make disciples'], definition: 'The process of learning from and following Jesus Christ, becoming more like Him, and helping others do the same. A disciple is a learner and follower. Jesus commissioned His followers to make disciples of all nations.', scriptureRef: 'Matthew 28:19-20' },
  { term: 'Angel', aliases: ['angel', 'angels', 'angelic', 'guardian angel'], definition: 'A spiritual being created by God to serve Him and minister to His people. Angels deliver messages, execute judgment, protect, and worship God. The Bible describes various types including cherubim, seraphim, and archangels like Michael and Gabriel.', scriptureRef: 'Hebrews 1:14' },
  { term: 'Satan', aliases: ['satan', 'devil', 'adversary', 'lucifer', 'the enemy'], definition: 'The adversary of God and His people. Originally a created angel who rebelled against God, Satan tempts, accuses, deceives, and opposes God\'s purposes. He is a defeated foe — Christ\'s death and resurrection sealed his ultimate destruction.', scriptureRef: '1 Peter 5:8' },
  { term: 'Heaven', aliases: ['heaven', 'paradise', 'god\'s dwelling'], definition: 'The dwelling place of God and the eternal home of the redeemed. The Bible describes multiple heavens — the sky, the stars, and the spiritual realm where God dwells. Ultimately, heaven is where God\'s will is done perfectly and where believers will spend eternity with Him.', scriptureRef: 'Revelation 21:1-4' },
  { term: 'Hell', aliases: ['hell', 'lake of fire', 'gehenna', 'eternal punishment'], definition: 'The place of eternal separation from God for those who reject Him. The Bible describes it as a place of conscious torment, outer darkness, and the lake of fire. It is the final destination of Satan, his angels, and all who refuse God\'s offer of salvation.', scriptureRef: 'Matthew 25:46' },
  { term: 'Resurrection', aliases: ['resurrection', 'rose again', 'raised from the dead'], definition: 'The raising of the dead to new life. Christ\'s resurrection is the cornerstone of the Christian faith — His victory over death guarantees the future resurrection of all believers to eternal life. It demonstrates God\'s power and validates Jesus\' claims.', scriptureRef: '1 Corinthians 15:20-22' },
  { term: 'Second Coming', aliases: ['second coming', 'return of christ', 'parousia', 'christ returns'], definition: 'The future return of Jesus Christ to earth in power and glory. The Bible teaches He will return to judge the world, defeat evil, establish His kingdom, and gather His people. The exact time is unknown, so believers are called to be ready.', scriptureRef: '1 Thessalonians 4:16-17' },
  { term: 'Wisdom', aliases: ['wisdom', 'wise', 'understanding', 'discernment'], definition: 'The ability to see life from God\'s perspective and make godly choices. Biblical wisdom is not just intellectual knowledge but practical skill in living. It begins with the fear of the Lord and is a gift that God gives generously to those who ask.', scriptureRef: 'James 1:5' },
  { term: 'Peace', aliases: ['peace', 'shalom', 'tranquility', 'rest'], definition: 'The Hebrew word shalom means more than the absence of conflict — it means wholeness, completeness, and well-being. Biblical peace comes from being reconciled with God through Christ and is a fruit of the Holy Spirit in the believer\'s life.', scriptureRef: 'John 14:27' },
  { term: 'Joy', aliases: ['joy', 'rejoice', 'gladness'], definition: 'A deep, abiding gladness that is not dependent on circumstances. Unlike happiness, which is fleeting, biblical joy is rooted in God\'s presence and salvation. It is a fruit of the Spirit and can coexist with suffering.', scriptureRef: 'Nehemiah 8:10' },
  { term: 'Love', aliases: ['love', 'agape', 'charity'], definition: 'The highest virtue in the Christian faith. The Bible primarily uses the Greek word agape — a selfless, unconditional love that seeks the best for others. God is love, and His love is demonstrated supremely in Christ\'s sacrificial death.', scriptureRef: '1 John 4:8' },
  { term: 'Hope', aliases: ['hope', 'expectation', 'assurance'], definition: 'A confident expectation of God\'s promises being fulfilled. Biblical hope is not wishful thinking but a firm assurance grounded in God\'s character. It anchors the soul, especially in suffering, and looks forward to eternal glory.', scriptureRef: 'Romans 15:13' },
  { term: 'Temptation', aliases: ['temptation', 'tempted', 'tested', 'trial'], definition: 'An enticement to sin or a test of faith. Temptation itself is not sin — even Jesus was tempted. God allows tests to strengthen faith but never tempts anyone to evil. He promises to provide a way of escape for every temptation.', scriptureRef: '1 Corinthians 10:13' },
  { term: 'Forgiveness', aliases: ['forgiveness', 'forgive', 'pardon', 'absolution'], definition: 'The release of a debt or offense. God\'s forgiveness of sin is based on Christ\'s atoning death and is received by faith. Believers are called to forgive others as God has forgiven them — freely and completely.', scriptureRef: 'Ephesians 4:32' },
  { term: 'Eternal Life', aliases: ['eternal life', 'everlasting life', 'life eternal'], definition: 'Not just endless existence, but a quality of life — knowing God personally through Jesus Christ. Eternal life begins the moment one believes and continues forever. It is the gift of God, in contrast to the wages of sin which is death.', scriptureRef: 'John 17:3' },
  { term: 'Church', aliases: ['church', 'body of christ', 'congregation', 'assembly'], definition: 'The community of all believers in Jesus Christ. The Greek word ekklesia means "called-out assembly." The church is called the Body of Christ, with Jesus as the Head. It is both universal (all believers everywhere) and local (a specific gathering).', scriptureRef: 'Ephesians 1:22-23' },
  { term: 'Glory', aliases: ['glory', 'glorify', 'majesty', 'splendor'], definition: 'The visible manifestation of God\'s presence, power, and perfection. To glorify God is to reflect His character and ascribe to Him the honor He deserves. All creation declares God\'s glory, and believers are being transformed into His glorious image.', scriptureRef: 'Psalm 19:1' },
  { term: 'Blessing', aliases: ['blessing', 'bless', 'blessed', 'beatitudes'], definition: 'God\'s favor and goodness poured out on His people. A blessing can be material, spiritual, or relational. To be "blessed" in the biblical sense is to be in a state of divine favor and contentment, regardless of circumstances.', scriptureRef: 'Numbers 6:24-26' },
];

export function findBibleVerse(query: string): BibleVerseEntry | null {
  const lower = query.toLowerCase().trim();

  const normalized = lower
    .replace(/\s+/g, ' ')
    .replace(/^(what does|what is|show me|tell me about|can you tell me|give me|what's the meaning of|quote|read)\s+/g, '')
    .replace(/\bsay\??$/g, '')
    .replace(/\bsay about\)?$/g, '')
    .replace(/\bmean\??$/g, '')
    .trim();

  const exactMatch = bibleVerses.find((v) => v.reference.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;

  const partialMatch = bibleVerses.find(
    (v) =>
      normalized.includes(v.reference.toLowerCase()) ||
      v.reference.toLowerCase().includes(normalized),
  );
  if (partialMatch) return partialMatch;

  const bookChapterMatch = bibleVerses.find((v) => {
    const parts = v.reference.toLowerCase().split(/[:\s]+/);
    const bookName = parts.slice(0, -2).join(' ');
    return normalized.includes(bookName) && normalized.includes(parts[parts.length - 2]);
  });
  return bookChapterMatch ?? null;
}

export function findDictionaryEntry(query: string): BibleDictionaryEntry | null {
  const lower = query.toLowerCase().trim();

  const cleaned = lower
    .replace(/^(what is|what does|what's|define|meaning of|definition of|explain|tell me about)\s+/g, '')
    .replace(/\bmean\b/g, '')
    .replace(/\?/g, '')
    .trim();

  let bestMatch: BibleDictionaryEntry | null = null;
  let bestScore = 0;

  for (const entry of bibleDictionary) {
    if (lower.includes(entry.term.toLowerCase())) {
      const score = entry.term.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }
    for (const alias of entry.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        const score = alias.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }
    }
  }

  if (bestMatch) return bestMatch;

  for (const entry of bibleDictionary) {
    if (cleaned === entry.term.toLowerCase() || entry.aliases.some((a) => cleaned === a.toLowerCase())) {
      return entry;
    }
  }

  return null;
}
