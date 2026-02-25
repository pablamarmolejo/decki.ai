import fs from 'fs';
import path from 'path';

function parseRtf(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  let text = content.replace(/\\u(-?\d+)[ ]?/g, (_, dec) => {
    let code = parseInt(dec, 10);
    if (code < 0) code += 65536; 
    return String.fromCharCode(code);
  });
  
  text = text.replace(/\\[a-z0-9-]+[ ]?/gi, ' ');
  text = text.replace(/[\{\}]/g, '');
  text = text.replace(/\\/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  
  // Detect separator
  let separator = ' ';
  if (text.includes('kanji|kana|meaning|kun|on|example')) {
    separator = '|';
  }
  
  const header = separator === '|' ? 'kanji|kana|meaning|kun|on|example' : 'kanji kana meaning kun on example';
  const headerIdx = text.toLowerCase().indexOf(header);
  if (headerIdx !== -1) {
    text = text.slice(headerIdx + header.length).trim();
  }
  
  if (separator === '|') {
    // Pipe separated is much easier
    const entriesRaw = text.split(' ');
    const results: any[] = [];
    
    // Actually, text has spaces between entries or within?
    // Let's re-examine: "政|せい|politics...|せい, しょう|例。 治|じ|..."
    // Wait, the space might be between the example and the next kanji.
    
    // It's probably better to join back and split by pipe, then group by 6.
    const allParts = text.split('|');
    // The first part is Kanji, last part of an entry is Example + Next Kanji
    // Wait, if it's K|K|M|K|O|E K|K|M|K|O|E
    // Then allParts will be: [K1, K1, M1, K1, O1, E1+K2, K2, M2, K2, O2, E2+K3, ...]
    
    // Actually, let's just use a regex to split by pipe and handle the "E+K" part.
    const entries: any[] = [];
    for (let i = 0; i < allParts.length; i += 5) {
      if (i + 5 >= allParts.length) break;
      const kanji = allParts[i].trim().split(' ').pop() || '';
      const kana = allParts[i+1].trim();
      const meaning = allParts[i+2].trim();
      const kun = allParts[i+3].trim();
      const on = allParts[i+4].trim();
      
      // Example is in i+5, but it also contains the NEXT kanji.
      const exampleFull = allParts[i+5].trim();
      const exampleParts = exampleFull.split(' ');
      const nextKanji = exampleParts.pop() || '';
      const example = exampleParts.join(' ');
      
      entries.push({ kanji, kana, meaning, kun, on, example });
      
      // Put the next kanji into the next slot if possible
      allParts[i+5] = nextKanji;
    }
    return entries;
  } else {
    // Space separated heuristic
    const entriesRaw = text.split(/(?<=\)) (?=[\u4E00-\u9FAF])/);
    return entriesRaw.map(entry => {
      const parts = entry.trim().split(' ');
      if (parts.length < 2) return null;
      const kanji = parts[0];
      let i = 1;
      while (i < parts.length && /^[\u3040-\u309F\u30A0-\u30FF/]+$/.test(parts[i])) i++;
      const kana = parts.slice(1, i).join(' ');
      let j = i;
      while (j < parts.length && !/^[\u3040-\u309Fー-]+$/.test(parts[j])) j++;
      const meaning = parts.slice(i, j).join(' ');
      let k = j;
      while (k < parts.length && /^[\u3040-\u309Fー,-]+$/.test(parts[k])) k++;
      const kun = parts.slice(j, k).join(' ');
      let l = k;
      while (l < parts.length && /^[\u30A0-\u30FFー,]+$/.test(parts[l])) l++;
      const on = parts.slice(k, l).join(' ');
      const example = parts.slice(l).join(' ');
      return { kanji, kana, meaning, kun, on, example };
    }).filter(Boolean);
  }
}

const n5Data = parseRtf('n5_kanji.rtf');
fs.writeFileSync('src/data/n5_kanji.json', JSON.stringify(n5Data, null, 2));

const n4Data = parseRtf('n4_kanji.rtf');
fs.writeFileSync('src/data/n4_kanji.json', JSON.stringify(n4Data, null, 2));

const n3Data = parseRtf('n3_kanji.rtf');
console.log('N3 count:', n3Data.length);
fs.writeFileSync('src/data/n3_kanji.json', JSON.stringify(n3Data, null, 2));
