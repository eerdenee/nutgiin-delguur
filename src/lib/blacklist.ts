export const BLACKLIST_KEYWORDS = [
    // Drugs
    'өвс', 'мөс', 'хар тамхи', 'ice', 'weed', 'cannabis', 'marijuana', 'meth',
    'шанаа', 'shanaa', 'гашиш', 'hashish', 'mim', 'мим',

    // Weapons
    'буу', 'зэвсэг', 'gun', 'weapon', 'pistol', 'rifle', 'хутга', 'knife',
    'сум', 'ammo', 'bullet', 'тэсрэх', 'explosive',

    // Adult / Illegal Services
    'секс', 'sex', 'бие үнэлэх', 'escort', 'санхүү', 'sanhuu', 'massaj', 'массаж',
    'охин', 'girl', 'дуудлагаар', 'call girl',

    // Other Illegal
    'хүний наймаа', 'human trafficking', 'паспорт', 'passport', 'виз', 'visa'
];

export function containsBlacklistedKeywords(text: string): { found: boolean; word?: string } {
    if (!text) return { found: false };
    const lowerText = text.toLowerCase();

    // Check for exact matches or matches surrounded by spaces/punctuation to avoid false positives
    // For simplicity, we'll do a basic includes check first, but ideally use regex for word boundaries
    for (const word of BLACKLIST_KEYWORDS) {
        if (lowerText.includes(word.toLowerCase())) {
            return { found: true, word };
        }
    }
    return { found: false };
}

export function validateContent(title: string, description: string) {
    const foundWords: string[] = [];

    const titleCheck = containsBlacklistedKeywords(title);
    if (titleCheck.found) foundWords.push(titleCheck.word!);

    const descCheck = containsBlacklistedKeywords(description);
    if (descCheck.found && !foundWords.includes(descCheck.word!)) foundWords.push(descCheck.word!);

    return {
        isValid: foundWords.length === 0,
        foundWords
    };
}
