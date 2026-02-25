import fs from 'fs';

function parseRtfToData(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace Unicode escape sequences \uNNNN followed by a character (usually space)
  // RTF unicode is \uNNNN<char>
  let text = content.replace(/\\u(-?\d+)[ ]?/g, (_, dec) => {
    let code = parseInt(dec, 10);
    if (code < 0) code += 65536; 
    return String.fromCharCode(code);
  });
  
  // Remove RTF headers/tags
  text = text.replace(/\\{1,2}[a-z0-9-]+[ ]?/gi, ' ');
  text = text.replace(/[\{\}]/g, '');
  
  // Header
  const header = "kanji kana meaning kun on example";
  const headerIdx = text.toLowerCase().indexOf(header);
  if (headerIdx !== -1) {
    text = text.slice(headerIdx + header.length);
  }
  
  // Let's try to split by multiple spaces or detect boundaries
  // But wait, the example ends with a translation in parens.
  // " (Translation)"
  // Maybe we can split by " ) " or something.
  
  // Actually, let's look for the example pattern: ". (English)"
  // The next kanji usually starts after that.
  
  return text.trim();
}

const n5 = parseRtfToData('n5_kanji.rtf');
console.log(JSON.stringify(n5.slice(0, 1000)));
