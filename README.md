# @profullstack/text-type-detection

A lightweight, zero-dependency Node.js module for detecting text format types from strings. Accurately identifies plain text, markdown, ASCII art, code blocks, HTML, JSON, and XML.

## Features

- 🎯 **Accurate Detection**: Uses multiple heuristics to identify text formats
- 🚀 **Zero Dependencies**: Pure JavaScript implementation
- 📦 **ESM Support**: Modern ES Module syntax
- 🧪 **Well Tested**: Comprehensive test coverage with Mocha and Chai
- 🎨 **ASCII Art Detection**: Recognizes box drawing, Unicode art, ANSI sequences
- 📝 **Markdown Support**: Detects headings, lists, links, code blocks, and more
- 🔍 **Multiple Formats**: Supports plain, markdown, ascii, code, html, json, xml

## Installation

```bash
pnpm add @profullstack/text-type-detection
```

Or with npm:

```bash
npm install @profullstack/text-type-detection
```

## Usage

### Basic Example

```javascript
import { detectTextFormat } from '@profullstack/text-type-detection';

const text = '# Hello World\n\nThis is a markdown document.';
const result = detectTextFormat(text);

console.log(result);
// {
//   text_format: 'markdown',
//   asciiArt: 0.000,
//   markdown: 0.180,
//   reasons: {
//     ascii: [],
//     markdown: ['heading'],
//     codePenaltyApplied: false
//   },
//   stats: { lines: 3, mean: 20.67, std: 12.34, symD: 0.05, alpha: 0.75 }
// }
```

### Detecting Different Formats

#### Plain Text

```javascript
const plainText = 'This is just a simple sentence.';
const result = detectTextFormat(plainText);
console.log(result.text_format); // 'plain'
```

#### Markdown

```javascript
const markdown = `# Title

## Subtitle

- Item 1
- Item 2

[Link](https://example.com)`;

const result = detectTextFormat(markdown);
console.log(result.text_format); // 'markdown'
console.log(result.reasons.markdown); // ['heading', 'list', 'link']
```

#### ASCII Art

```javascript
const asciiArt = `┌─────────────┐
│   Hello     │
│   World     │
└─────────────┘`;

const result = detectTextFormat(asciiArt);
console.log(result.text_format); // 'ascii'
console.log(result.asciiArt); // 0.680 (high score)
```

#### Code Block

```javascript
const code = `\`\`\`javascript
function hello() {
  console.log("Hello");
}
\`\`\``;

const result = detectTextFormat(code);
console.log(result.text_format); // 'code'
```

#### HTML

```javascript
const html = '<div class="container"><p>Hello World</p></div>';
const result = detectTextFormat(html);
console.log(result.text_format); // 'html'
```

#### JSON

```javascript
const json = '{"name": "John", "age": 30}';
const result = detectTextFormat(json);
console.log(result.text_format); // 'json'
```

#### XML

```javascript
const xml = '<?xml version="1.0"?><root><item>test</item></root>';
const result = detectTextFormat(xml);
console.log(result.text_format); // 'xml'
```

## API

### `detectTextFormat(text: string): DetectionResult`

Analyzes the input text and returns a detection result object.

#### Parameters

- `text` (string): The text to analyze

#### Returns

An object with the following properties:

- `text_format` (string): The detected format type
  - `'plain'` - Plain text
  - `'markdown'` - Markdown formatted text
  - `'ascii'` - ASCII art or box drawing
  - `'code'` - Code block (fenced)
  - `'html'` - HTML markup
  - `'json'` - JSON data
  - `'xml'` - XML document

- `asciiArt` (number): ASCII art confidence score (0.000 - 1.000)

- `markdown` (number): Markdown confidence score (0.000 - 1.000)

- `reasons` (object): Detailed detection reasons
  - `ascii` (array): List of ASCII art indicators found
  - `markdown` (array): List of markdown features found
  - `codePenaltyApplied` (boolean): Whether code penalty was applied

- `stats` (object): Statistical analysis of the text
  - `lines` (number): Number of lines
  - `mean` (number): Mean line length
  - `std` (number): Standard deviation of line lengths
  - `symD` (number): Symbol density ratio
  - `alpha` (number): Alphanumeric character ratio

## Detection Heuristics

### ASCII Art Detection

The module detects ASCII art using multiple indicators:

- **Unicode Art Characters**: Box drawing (U+2500-U+257F), block elements (U+2580-U+259F), Braille patterns (U+2800-U+28FF), geometric shapes (U+25A0-U+25FF)
- **Border Lines**: Lines composed primarily of border characters (+, -, |, _, =, etc.)
- **Consistent Width**: Lines with similar lengths (low standard deviation)
- **Symbol Density**: High ratio of symbols to alphanumeric characters
- **Character Runs**: Repeated sequences of the same character
- **ANSI Sequences**: Terminal color codes and formatting
- **Trailing Spaces**: Intentional spacing for alignment

### Markdown Detection

Markdown features detected include:

- **Headings**: ATX-style (#) and Setext-style (underlined)
- **Lists**: Unordered (-/*/+) and ordered (1.)
- **Links**: `[text](url)` format
- **Images**: `![alt](url)` format
- **Code**: Inline backticks and fenced code blocks
- **Blockquotes**: Lines starting with >
- **Tables**: Pipe-separated columns
- **Emphasis**: Bold (**) and italic (*)
- **Horizontal Rules**: ---, ***, ___
- **Front Matter**: YAML metadata blocks

### Code Detection

Code blocks are identified by:

- Fenced code blocks (``` or ~~~)
- Indentation patterns
- Programming language keywords
- Syntax characters (semicolons, braces, brackets)

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/profullstack/text-type-detection.git
cd text-type-detection

# Install dependencies
pnpm install
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch
```

### Linting and Formatting

```bash
# Run ESLint
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code with Prettier
pnpm run format
```

## Requirements

- Node.js >= 20.0.0
- ESM support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

ProFullStack

## Repository

https://github.com/profullstack/text-type-detection