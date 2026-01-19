export const generateKeywords = (text: string): string[] => {
  if (!text) return [];
  const normalized = text.toLowerCase().trim();
  const keywords: string[] = [];

  // Generate suffixes
  for (let i = 0; i < normalized.length; i++) {
    keywords.push(normalized.substring(i));
  }

  // Also split by space and generate suffixes for each word (optional, but good for "Perez" in "Juan Perez")
  const words = normalized.split(" ");
  if (words.length > 1) {
    words.forEach(word => {
        for (let i = 0; i < word.length; i++) {
            const suffix = word.substring(i);
            if (!keywords.includes(suffix)) {
                keywords.push(suffix);
            }
        }
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
