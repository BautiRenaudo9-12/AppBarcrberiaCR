import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

try {
  let content = fs.readFileSync(envPath, 'utf8');
  
  // Regex to find FIREBASE_SERVICE_ACCOUNT and capture its potential value
  // We look for the key, and then try to capture everything until the next line starting with a capital letter or end of file
  // This is a bit heuristic because the file might be broken
  
  // Strategy: Find the start, extract the JSON-looking part.
  const key = 'FIREBASE_SERVICE_ACCOUNT=';
  const startIndex = content.indexOf(key);
  
  if (startIndex === -1) {
    console.log('FIREBASE_SERVICE_ACCOUNT not found in .env');
    process.exit(1);
  }

  // Find the start of the JSON object (first '{')
  const jsonStartIndex = content.indexOf('{', startIndex);
  if (jsonStartIndex === -1) {
      console.log('Could not find starting { for JSON value');
      process.exit(1);
  }

  // Find the end of the JSON object (last '}')
  // We scan backwards from the end of the file or look for the next variable?
  // Let's assume the JSON is valid-ish and ends with '}'
  // We can try to parse chunks? 
  
  // Simpler: Take the substring from jsonStartIndex to the last '}'
  const lastBraceIndex = content.lastIndexOf('}');
  if (lastBraceIndex < jsonStartIndex) {
      console.log('Could not find ending } for JSON value');
      process.exit(1);
  }

  const potentialJson = content.substring(jsonStartIndex, lastBraceIndex + 1);
  
  // Try to parse it to verify/cleanup
  // We might need to replace newlines or unescape quotes if it was weirdly formatted
  let cleanJsonString = potentialJson;
  
  // If it was wrapped in quotes in a weird way, stripping them might be needed.
  // But here we extracted from { to } so we ignored outer quotes.
  
  // Fix: The existing file has literal \n characters (escaped newlines) or real newlines?
  // Let's just try to parse it.
  
  let jsonObject;
  try {
      jsonObject = JSON.parse(cleanJsonString);
  } catch (e) {
      console.log('First parse attempt failed. Trying to cleanup...');
      // Common issue: newlines in the string breaking JSON.parse?
      // Or escaped quotes?
      try {
        // Replace unescaped newlines with spaces?
        cleanJsonString = cleanJsonString.replace(/\n/g, ' ');
        jsonObject = JSON.parse(cleanJsonString);
      } catch (e2) {
         console.error('Failed to parse JSON even after cleanup:', e2.message);
         console.log('Raw extract:', cleanJsonString.substring(0, 100) + '...');
         process.exit(1);
      }
  }

  console.log('Successfully parsed Service Account JSON.');
  
  // Minify it
  const minifiedJson = JSON.stringify(jsonObject);
  
  // Reconstruct .env
  // Remove the old definition.
  // We need to be careful not to delete other variables.
  // If the old definition spanned multiple lines...
  
  // Let's assume the .env was essentially KEY=VALUE. 
  // We will remove the text from startIndex to (end of file or start of next var?)
  // Actually, usually these keys are at the end or have newlines. 
  
  // Safer approach: Read all lines. Identify the line with the KEY.
  // If it was multiline, it's tricky.
  
  // New strategy: Regex replace.
  // Match `FIREBASE_SERVICE_ACCOUNT=` followed by any char until `}` (greedy)
  // This is risky if there are multiple vars.
  
  // Since we know exactly what we extracted (from jsonStartIndex to lastBraceIndex), 
  // we can replace that range + the key part.
  
  // Check what was before jsonStartIndex.
  // content.substring(startIndex, jsonStartIndex) should contain `FIREBASE_SERVICE_ACCOUNT="` or similar.
  
  const prefix = content.substring(0, startIndex);
  const suffix = content.substring(lastBraceIndex + 1); // everything after the last }
  
  // Inspect suffix. If it contains other env vars, we preserve them.
  // BUT: `lastBraceIndex` was `lastIndexOf('}')`. If there are other vars *after* this one, 
  // and they are NOT part of this JSON, we might have eaten them if they were inside the curly braces range?
  // JSON format { ... } shouldn't contain other vars unless they are inside the object.
  // A service account JSON is a single object. So lastIndexOf('}') should be the end of it 
  // (unless another env var has a } in it? unlikely for standard vars, but possible).
  
  // Let's assume FIREBASE_SERVICE_ACCOUNT is the last big thing or unique.
  
  const newContent = prefix + `FIREBASE_SERVICE_ACCOUNT='${minifiedJson}'` + suffix;
  
  fs.writeFileSync(envPath, newContent, 'utf8');
  console.log('.env file updated successfully!');

} catch (err) {
  console.error('Error:', err);
}
