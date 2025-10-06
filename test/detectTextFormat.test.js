import { expect } from 'chai';
import { detectTextFormat } from '../src/index.js';

describe('detectTextFormat', () => {
  describe('empty and invalid inputs', () => {
    it('should return plain format for empty string', () => {
      const result = detectTextFormat('');
      expect(result.text_format).to.equal('plain');
      expect(result.asciiArt).to.equal(0);
      expect(result.markdown).to.equal(0);
    });

    it('should return plain format for whitespace-only string', () => {
      const result = detectTextFormat('   \n\t  ');
      expect(result.text_format).to.equal('plain');
    });

    it('should handle non-string input gracefully', () => {
      const result = detectTextFormat(null);
      expect(result.text_format).to.equal('plain');
    });
  });

  describe('plain text detection', () => {
    it('should detect simple plain text', () => {
      const text = 'This is just a simple sentence.';
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('plain');
    });

    it('should detect plain text paragraph', () => {
      const text = `This is a paragraph of plain text.
It has multiple lines but no special formatting.
Just regular sentences with normal punctuation.`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('plain');
    });
  });

  describe('markdown detection', () => {
    it('should detect markdown with headings', () => {
      const text = `# Main Title
## Subtitle
Some content here`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('markdown');
      expect(result.markdown).to.be.greaterThan(0.08);
      expect(result.reasons.markdown).to.include('heading');
    });

    it('should detect markdown with lists', () => {
      const text = `- Item one
- Item two
- Item three`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('markdown');
      expect(result.reasons.markdown).to.include('list');
    });

    it('should detect markdown with links', () => {
      const text = 'Check out [this link](https://example.com) for more info.';
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('markdown');
      expect(result.reasons.markdown).to.include('link');
    });

    it('should detect markdown with code blocks', () => {
      const text = `Here is some code:
\`\`\`javascript
const x = 42;
\`\`\``;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('code');
      expect(result.reasons.markdown).to.include('fenced');
    });

    it('should detect markdown with blockquotes', () => {
      const text = `> This is a quote
> from someone`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('markdown');
      expect(result.reasons.markdown).to.include('blockquote');
    });

    it('should detect markdown with inline code', () => {
      const text = 'Use the `console.log()` function to debug.';
      const result = detectTextFormat(text);
      expect(result.markdown).to.be.greaterThan(0);
      expect(result.reasons.markdown).to.include('inlineCode');
    });

    it('should detect markdown with emphasis', () => {
      const text = 'This is *important* and **very important**.';
      const result = detectTextFormat(text);
      expect(result.markdown).to.be.greaterThan(0);
      expect(result.reasons.markdown).to.include('emphasis');
    });

    it('should detect markdown with tables', () => {
      const text = `| Header 1 | Header 2 |
| Cell 1   | Cell 2   |`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('markdown');
      expect(result.reasons.markdown).to.include('tableRow');
    });

    it('should detect markdown with horizontal rules', () => {
      const text = `Section 1
---
Section 2`;
      const result = detectTextFormat(text);
      expect(result.markdown).to.be.greaterThan(0);
    });

    it('should detect markdown with front matter', () => {
      const text = `---
title: My Post
date: 2024-01-01
---
# Content`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('markdown');
      expect(result.reasons.markdown).to.include('frontMatter');
    });
  });

  describe('ascii art detection', () => {
    it('should detect simple box drawing', () => {
      const text = `┌─────────────┐
│   Hello     │
│   World     │
└─────────────┘`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
      expect(result.asciiArt).to.be.greaterThan(0.4);
      expect(result.reasons.ascii).to.include('unicode_art_chars');
    });

    it('should detect ASCII art with borders', () => {
      const text = `+-------------+
|   Title     |
+-------------+
|   Content   |
+-------------+`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
      expect(result.asciiArt).to.be.greaterThan(0.4);
      expect(result.reasons.ascii).to.include('border_like_lines');
    });

    it('should detect ASCII art with consistent width', () => {
      const text = `***********************
*   Welcome Banner    *
*   Version 1.0       *
***********************`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
      expect(result.reasons.ascii).to.include('consistent_width');
    });

    it('should detect ASCII art with repeated characters', () => {
      const text = `========================================
          IMPORTANT NOTICE
========================================`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
      expect(result.reasons.ascii).to.include('long_same_char_runs');
    });

    it('should detect ASCII art with ANSI sequences', () => {
      const text = `\x1B[31m╔════════════════════════════╗\x1B[0m
\x1B[31m║   Application Started      ║\x1B[0m
\x1B[31m║   Port: 3000              ║\x1B[0m
\x1B[31m╚════════════════════════════╝\x1B[0m`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
      expect(result.reasons.ascii).to.include('ansi_sequences');
    });

    it('should detect block elements', () => {
      const text = `▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄
█████████████████████████████
▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄
█████████████████████████████
▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
      expect(result.reasons.ascii).to.include('unicode_art_chars');
    });

    it('should detect braille patterns', () => {
      const text = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
      expect(result.reasons.ascii).to.include('unicode_art_chars');
    });

    it('should not detect plain text as ASCII art', () => {
      const text = `This is just regular text.
It has multiple lines.
But no special formatting or art.`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('plain');
      expect(result.asciiArt).to.be.lessThan(0.4);
    });
  });

  describe('code detection', () => {
    it('should detect fenced code blocks', () => {
      const text = `\`\`\`javascript
function hello() {
  console.log("Hello");
}
\`\`\``;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('code');
    });

    it('should detect tilde fenced code blocks', () => {
      const text = `~~~python
def hello():
    print("Hello")
~~~`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('code');
    });

    it('should apply code penalty to reduce false ASCII art detection', () => {
      const text = `function test() {
  const x = 1;
  const y = 2;
  return x + y;
}`;
      const result = detectTextFormat(text);
      expect(result.reasons.codePenaltyApplied).to.be.true;
    });
  });

  describe('HTML detection', () => {
    it('should detect HTML tags', () => {
      const text = '<div class="container"><p>Hello World</p></div>';
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('html');
    });

    it('should detect HTML with attributes', () => {
      const text = '<img src="image.jpg" alt="Description" />';
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('html');
    });

    it('should detect HTML document structure', () => {
      const text = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello</h1></body>
</html>`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('html');
    });
  });

  describe('JSON detection', () => {
    it('should detect JSON object', () => {
      const text = '{"name": "John", "age": 30}';
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('json');
    });

    it('should detect JSON array', () => {
      const text = '[1, 2, 3, 4, 5]';
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('json');
    });

    it('should detect formatted JSON', () => {
      const text = `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('json');
    });
  });

  describe('XML detection', () => {
    it('should detect XML declaration', () => {
      const text =
        '<?xml version="1.0" encoding="UTF-8"?><root><item>test</item></root>';
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('xml');
    });

    it('should detect XML with whitespace', () => {
      const text = `  <?xml version="1.0"?>
<root>
  <item>test</item>
</root>`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('xml');
    });
  });

  describe('edge cases and mixed content', () => {
    it('should prioritize ASCII art over markdown when ASCII score is higher', () => {
      const text = `┌────────────────┐
│ # Not Markdown │
│ - Just ASCII   │
└────────────────┘`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
    });

    it('should handle very short text', () => {
      const text = 'Hi';
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('plain');
    });

    it('should handle text with mixed line endings', () => {
      const text = 'Line 1\r\nLine 2\nLine 3\rLine 4';
      const result = detectTextFormat(text);
      expect(result).to.have.property('text_format');
    });

    it('should return stats object', () => {
      const text = `# Title
Some content here
More content`;
      const result = detectTextFormat(text);
      expect(result).to.have.property('stats');
      expect(result.stats).to.have.property('lines');
      expect(result.stats).to.have.property('mean');
      expect(result.stats).to.have.property('std');
    });

    it('should return reasons object', () => {
      const text = '# Markdown Title';
      const result = detectTextFormat(text);
      expect(result).to.have.property('reasons');
      expect(result.reasons).to.have.property('ascii');
      expect(result.reasons).to.have.property('markdown');
    });

    it('should return numeric scores', () => {
      const text = 'Some text';
      const result = detectTextFormat(text);
      expect(result.asciiArt).to.be.a('number');
      expect(result.markdown).to.be.a('number');
      expect(result.asciiArt).to.be.at.least(0);
      expect(result.asciiArt).to.be.at.most(1);
      expect(result.markdown).to.be.at.least(0);
      expect(result.markdown).to.be.at.most(1);
    });
  });

  describe('real-world examples', () => {
    it('should detect README.md content', () => {
      const text = `# Project Name

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

- Step 1
- Step 2

[Documentation](https://example.com)`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('code');
    });

    it('should detect log output with borders', () => {
      const text = `╔════════════════════════════╗
║   Application Started      ║
║   Port: 3000              ║
╚════════════════════════════╝`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('ascii');
    });

    it('should detect package.json content', () => {
      const text = `{
  "name": "my-package",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  }
}`;
      const result = detectTextFormat(text);
      expect(result.text_format).to.equal('json');
    });
  });
});
