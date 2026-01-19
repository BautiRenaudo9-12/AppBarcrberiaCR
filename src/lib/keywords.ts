export const generateKeywords = (text: string): string[] => {
  if (!text) return [];
  const normalized = text.toLowerCase().trim();
  const keywords: string[] = [];

  // Generate all substrings (n-grams)
  // Loop through all start positions
  for (let i = 0; i < normalized.length; i++) {
    // Loop through all end positions
    for (let j = i + 1; j <= normalized.length; j++) {
        const substring = normalized.substring(i, j);
        // Optional: filter out very short substrings if noise is an issue, e.g. length < 2
        // But for "exact" substring match feel, keeping all is safer.
        if (substring.length >= 2) { // Filtering 1-char substrings to save space/noise
            keywords.push(substring);
        }
    }
  }

  // Add words split by space (for prefix matching logic consistency)
  const words = normalized.split(" ");
  if (words.length > 1) {
    words.forEach(word => {
       if (word && !keywords.includes(word)) keywords.push(word);
    });
  }

  return keywords;
};

export const createSearchKeywords = (name: string, email: string, phone?: string): string[] => {
    // Only generate keywords from name as requested
    const kName = generateKeywords(name || "");

    // Use Set to remove duplicates
    const allKeywords = new Set([...kName]);
    return Array.from(allKeywords);
};
