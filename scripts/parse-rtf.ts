import fs from 'fs';
import path from 'path';

function parseRtf(content: string) {
  // Very basic RTF \uNNNN parser
  let text = content.replace(/\u(\d+)/g, (_, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  // Remove RTF headers/tags
  text = text.replace(/\{[^}]+\}/g, '');
  text = text.replace(/\[a-z0-9-]+/g, ' ');
  text = text.trim();
  
  // Headers are kanji kana meaning kun on example
  const lines = text.split('
').filter(l => l.trim().length > 0);
  const header = lines[0].toLowerCase();
  
  // Actually, the example shows them on a single line with space separators
  // Let's re-examine the file structure.
  return text;
}

const files = ['n5_kanji.rtf', 'n4_kanji.rtf', 'n3_kanji.rtf'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    // console.log(`Parsing ${file}...`);
    // const parsed = parseRtf(content);
    // console.log(parsed);
  }
});
