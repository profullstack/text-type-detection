import { detectTextFormat } from '../src/index.js';

console.log('=== Text Type Detection Examples ===\n');

// Example 1: Plain Text
console.log('1. Plain Text:');
const plainText = 'This is just a simple sentence with no special formatting.';
console.log('Input:', plainText);
console.log('Result:', detectTextFormat(plainText));
console.log();

// Example 2: Markdown
console.log('2. Markdown:');
const markdown = `# Hello World

This is a **markdown** document with:
- Lists
- [Links](https://example.com)
- And more!`;
console.log('Input:', markdown);
console.log('Result:', detectTextFormat(markdown));
console.log();

// Example 3: ASCII Art
console.log('3. ASCII Art:');
const asciiArt = `┌─────────────────┐
│  Welcome Box    │
│  Version 1.0    │
└─────────────────┘`;
console.log('Input:', asciiArt);
console.log('Result:', detectTextFormat(asciiArt));
console.log();

// Example 4: Code Block
console.log('4. Code Block:');
const codeBlock = `\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\``;
console.log('Input:', codeBlock);
console.log('Result:', detectTextFormat(codeBlock));
console.log();

// Example 5: HTML
console.log('5. HTML:');
const html = '<div class="container"><h1>Title</h1><p>Content</p></div>';
console.log('Input:', html);
console.log('Result:', detectTextFormat(html));
console.log();

// Example 6: JSON
console.log('6. JSON:');
const json = `{
  "name": "John Doe",
  "age": 30,
  "city": "New York"
}`;
console.log('Input:', json);
console.log('Result:', detectTextFormat(json));
console.log();

// Example 7: XML
console.log('7. XML:');
const xml = '<?xml version="1.0" encoding="UTF-8"?><root><item>test</item></root>';
console.log('Input:', xml);
console.log('Result:', detectTextFormat(xml));
console.log();

// Example 8: Border ASCII Art
console.log('8. Border ASCII Art:');
const borderArt = `+-------------------+
|   Status: OK      |
|   Code: 200       |
+-------------------+`;
console.log('Input:', borderArt);
console.log('Result:', detectTextFormat(borderArt));
console.log();

// Example 9: Complex Markdown
console.log('9. Complex Markdown with Table:');
const complexMarkdown = `# Project Status

| Feature | Status | Priority |
|---------|--------|----------|
| Auth    | Done   | High     |
| API     | WIP    | High     |
| UI      | Todo   | Medium   |

> Note: All features are on track.`;
console.log('Input:', complexMarkdown);
console.log('Result:', detectTextFormat(complexMarkdown));
console.log();

// Example 10: ANSI Colored Text
console.log('10. ANSI Colored Text:');
const ansiText = '\x1B[31mError:\x1B[0m Something went wrong\n\x1B[32mSuccess:\x1B[0m Operation completed';
console.log('Input:', ansiText);
console.log('Result:', detectTextFormat(ansiText));