// Regular expressions for Unicode character detection
const BOX_DRAWING_RE = /[\u2500-\u257F]/;
const BLOCK_ELEMS_RE = /[\u2580-\u259F]/;
const BRAILLE_RE = /[\u2800-\u28FF]/;
const GEOM_RE = /[\u25A0-\u25FF]/;
const ANSI_RE = /\x1B\[[0-9;]*m/;

// Binary format magic bytes (as strings, checked via charCodeAt)
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];      // %PDF
const JPEG_MAGIC = [0xff, 0xd8, 0xff];            // \xFF\xD8\xFF
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]; // \x89PNG\r\n\x1a\n

/**
 * Detect binary file format from magic bytes.
 * @param {string} text - The text/buffer to analyze
 * @returns {string|null} Binary format name or null
 */
function detectBinaryFormat(text) {
  if (text.length < 3) return null;

  const codes = [];
  for (let i = 0; i < Math.min(8, text.length); i++) {
    codes.push(text.charCodeAt(i));
  }

  // PDF: %PDF
  if (
    codes[0] === PDF_MAGIC[0] &&
    codes[1] === PDF_MAGIC[1] &&
    codes[2] === PDF_MAGIC[2] &&
    codes[3] === PDF_MAGIC[3]
  ) {
    return 'pdf';
  }

  // JPEG: \xFF\xD8\xFF
  if (
    codes.length >= 3 &&
    codes[0] === JPEG_MAGIC[0] &&
    codes[1] === JPEG_MAGIC[1] &&
    codes[2] === JPEG_MAGIC[2]
  ) {
    return 'jpeg';
  }

  // PNG: \x89PNG\r\n\x1a\n
  if (
    codes.length >= 8 &&
    codes[0] === PNG_MAGIC[0] &&
    codes[1] === PNG_MAGIC[1] &&
    codes[2] === PNG_MAGIC[2] &&
    codes[3] === PNG_MAGIC[3] &&
    codes[4] === PNG_MAGIC[4] &&
    codes[5] === PNG_MAGIC[5] &&
    codes[6] === PNG_MAGIC[6] &&
    codes[7] === PNG_MAGIC[7]
  ) {
    return 'png';
  }

  return null;
}

/**
 * Detect SVG format from XML/HTML content.
 * @param {string} text - The text to analyze
 * @returns {boolean} Whether the content is SVG
 */
function detectSvg(text) {
  const raw = text.replace(/\r\n?/g, '\n').trim();

  // Check if it starts with XML declaration or HTML, and contains <svg
  if (/^\s*(?:<\?xml|<svg)/i.test(raw) && /<svg[\s>]/i.test(raw)) {
    return true;
  }

  // Check if it starts with <!DOCTYPE and contains <svg
  if (/^\s*<!DOCTYPE/i.test(raw) && /<svg[\s>]/i.test(raw)) {
    return true;
  }

  // Check for bare <svg tag at start
  if (/^\s*<svg[\s>]/i.test(raw)) {
    return true;
  }

  return false;
}

/**
 * Detect CSV format based on structural patterns.
 * @param {string} text - The text to analyze
 * @returns {boolean} Whether the content appears to be CSV
 */
function detectCsv(text) {
  const raw = text.replace(/\r\n?/g, '\n');
  const lines = raw.split('\n');

  // Need at least 2 non-empty lines with commas
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  if (nonEmptyLines.length < 2) return false;

  // Check if lines have consistent comma count (at least 1 comma per line)
  const commaCounts = nonEmptyLines.map((l) => (l.match(/,/g) || []).length);
  const linesWithCommas = commaCounts.filter((c) => c >= 1).length;

  // At least 80% of lines should have commas
  if (linesWithCommas / nonEmptyLines.length < 0.8) return false;

  // Check consistency of column count (first 5 lines)
  const sampleCounts = commaCounts.slice(0, Math.min(5, commaCounts.length));
  const uniqueCounts = new Set(sampleCounts).size;

  // If there's only one unique column count (consistent), it's likely CSV
  if (uniqueCounts === 1 && sampleCounts[0] >= 1) return true;

  // If there are 2 consistent counts (e.g., quoted vs unquoted), still CSV
  if (uniqueCounts <= 2 && sampleCounts[0] >= 1) return true;

  return false;
}

// Character sets for ASCII art detection
const BORDER_CHARS = new Set(Array.from('+|-_=/#\\*<>'));
const LINE_SYMBOL_CHARS = new Set(
  Array.from('`~!@#$%^&*()-_=+[]{}|\\;:\'",.<>/?')
);

/** Heuristic markdown patterns */
const MD = {
  heading: /^(#{1,6})\s+\S+/m,
  setext: /^(.+)\n(=+|-+)\s*$/m,
  list: /^(?:\s{0,3}[-*+]\s+|\s{0,3}\d+\.\s+)/m,
  blockquote: /^>\s+/m,
  fenced: /```[\s\S]*?```|~~~[\s\S]*?~~~/m,
  inlineCode: /(^|[^`])`[^`]+`/m,
  link: /\[[^\]]+\]\([^)]+\)/m,
  image: /!\[[^\]]*\]\([^)]+\)/m,
  tableRow: /^\|?[^|\n]+\|[^|\n]+/m,
  hr: /^(?:-\s?){3,}$|^(?:\*\s?){3,}$|^(?:_\s?){3,}$/m,
  emphasis: /(^|[^\w*])\*{1,2}[^*\n]+\*{1,2}(?!\*)/m,
  html: /<\/?(?:div|span|br|img|a|p|h[1-6]|ul|ol|li|code|pre)[^>]*>/i,
  frontMatter: /^---\n[\s\S]*?\n---\n/m,
};

/**
 * Calculate ASCII art score based on various heuristics
 * @param {string} text - The text to analyze
 * @returns {Object} Score and reasons for the score
 */
function asciiArtScore(text) {
  const raw = text.replace(/\r\n?/g, '\n');
  const lines = raw.split('\n');

  if (lines.length < 3) {
    return { score: 0, reasons: ['too_few_lines'] };
  }

  const lengths = lines.map((l) => l.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length || 0;
  const std =
    Math.sqrt(
      lengths.reduce((a, l) => a + Math.pow(l - mean, 2), 0) /
        (lengths.length || 1)
    ) || 0;

  let total = 0,
    alnum = 0,
    sym = 0,
    borders = 0,
    runs = 0,
    trailing = 0,
    wide = 0;

  for (const line of lines) {
    total += line.length;
    if (line.length >= 20) wide++;

    for (const ch of line) {
      if (/[A-Za-z0-9]/.test(ch)) alnum++;
      if (LINE_SYMBOL_CHARS.has(ch)) sym++;
    }

    const t = line.trim();
    if (t.length >= 3) {
      const allSame = t.split('').every((c) => c === t[0]);
      const mostlyBorder =
        t.split('').filter((c) => BORDER_CHARS.has(c)).length / t.length >= 0.8;

      if (
        BORDER_CHARS.has(t[0]) &&
        BORDER_CHARS.has(t.at(-1)) &&
        (mostlyBorder || allSame)
      ) {
        borders++;
      }
    }

    if (/(.)\1{4,}/.test(line)) runs++;
    if (/\s+$/.test(line) && t.length) trailing++;
  }

  const symD = total ? sym / total : 0;
  const alpha = total ? alnum / total : 0;

  const hasUnicodeArt =
    BOX_DRAWING_RE.test(raw) ||
    BLOCK_ELEMS_RE.test(raw) ||
    BRAILLE_RE.test(raw) ||
    GEOM_RE.test(raw);
  const hasAnsi = ANSI_RE.test(raw);

  let score = 0;
  const reasons = [];

  if (wide / lines.length >= 0.7) {
    score += 0.15;
    reasons.push('many_wide_lines');
  }
  if (mean >= 20 && std / Math.max(1, mean) <= 0.22) {
    score += 0.2;
    reasons.push('consistent_width');
  }
  if (symD >= 0.18 && alpha <= 0.55) {
    score += 0.2;
    reasons.push('symbol_heavy_low_alpha');
  }
  if (runs >= Math.max(2, Math.floor(lines.length * 0.05))) {
    score += 0.15;
    reasons.push('long_same_char_runs');
  }
  if (borders / lines.length >= 0.08) {
    score += 0.1;
    reasons.push('border_like_lines');
  }
  if (trailing / lines.length >= 0.1) {
    score += 0.07;
    reasons.push('trailing_spaces');
  }
  if (hasAnsi) {
    score += 0.12;
    reasons.push('ansi_sequences');
  }
  if (hasUnicodeArt) {
    score += 0.28;
    reasons.push('unicode_art_chars');
  }
  if (alpha > 0.75) {
    score -= 0.1;
    reasons.push('very_text_heavy');
  }

  score = Math.max(0, Math.min(1, score));

  return {
    score,
    reasons,
    stats: { lines: lines.length, mean, std, symD, alpha },
  };
}

/**
 * Calculate markdown score based on markdown patterns
 * @param {string} text - The text to analyze
 * @returns {Object} Score and reasons for the score
 */
function markdownScore(text) {
  const raw = text.replace(/\r\n?/g, '\n');
  const features = Object.entries(MD);
  const hits = [];
  let score = 0;

  for (const [name, re] of features) {
    if (re.test(raw)) {
      hits.push(name);

      if (
        name === 'fenced' ||
        name === 'heading' ||
        name === 'list' ||
        name === 'link' ||
        name === 'tableRow'
      ) {
        score += 0.18;
      } else if (
        name === 'image' ||
        name === 'blockquote' ||
        name === 'setext' ||
        name === 'frontMatter'
      ) {
        score += 0.12;
      } else if (
        name === 'inlineCode' ||
        name === 'hr' ||
        name === 'emphasis'
      ) {
        score += 0.08;
      } else if (name === 'html') {
        score += 0.05;
      }
    }
  }

  const longLines = raw.split('\n').filter((l) => l.length > 140).length;
  if (longLines >= 2) score -= 0.1;

  if (
    BOX_DRAWING_RE.test(raw) ||
    BLOCK_ELEMS_RE.test(raw) ||
    BRAILLE_RE.test(raw)
  ) {
    score -= 0.12;
  }

  score = Math.max(0, Math.min(1, score));

  return { score, reasons: hits };
}

/**
 * Calculate YAML score based on YAML-specific patterns
 * @param {string} text - The text to analyze
 * @returns {Object} Score and reasons for the score
 */
function yamlScore(text) {
  const raw = text.replace(/\r\n?/g, '\n');
  const lines = raw.split('\n');

  if (lines.length < 2) {
    return { score: 0, reasons: ['too_few_lines'] };
  }

  let score = 0;
  const reasons = [];

  // YAML document separator at start
  if (/^---\s*$/m.test(raw)) {
    score += 0.2;
    reasons.push('doc_separator');
  }

  // YAML document end marker
  if (/^\.\.\.\s*$/m.test(raw)) {
    score += 0.1;
    reasons.push('doc_end');
  }

  // YAML key-value pairs (key: value or key:)
  const yamlKeyLines = lines.filter((l) => {
    const trimmed = l.trim();
    if (!trimmed || trimmed.startsWith('#')) return false;
    if (/^---\s*$/.test(trimmed) || /^\.\.\.\s*$/.test(trimmed)) return false;
    return /^\s*[\w-]+:\s*(?:.*)?$/i.test(l);
  });
  if (yamlKeyLines.length >= 5) {
    score += 0.35;
    reasons.push('key_value_pairs_many');
  } else if (yamlKeyLines.length >= 3) {
    score += 0.25;
    reasons.push('key_value_pairs');
  } else if (yamlKeyLines.length >= 1) {
    score += 0.1;
    reasons.push('has_key_value');
  }

  // YAML nested lists (indented `- ` items after a key)
  const nestedListLines = lines.filter(
    (l) => /^\s{2,}-\s+/.test(l) || /^\s{2,}\*\s+/.test(l)
  );
  if (nestedListLines.length >= 2) {
    score += 0.15;
    reasons.push('nested_lists');
  }

  // YAML multiline scalars (| block or > folded at end of line)
  if (/:\s*[|>][+-]?/.test(raw)) {
    score += 0.1;
    reasons.push('multiline_scalar');
  }

  // YAML comments
  const commentLines = lines.filter((l) => l.trim().startsWith('#'));
  const commentRatio = lines.length > 0 ? commentLines.length / lines.length : 0;
  if (commentRatio >= 0.05 && yamlKeyLines.length >= 2) {
    score += 0.15;
    reasons.push('has_comments');
  }

  // Penalize if looks like JSON
  if (/^\s*[{[]/.test(raw)) {
    score -= 0.3;
    reasons.push('looks_json');
  }

  // Penalize markdown headings only when few YAML key-value pairs
  if (yamlKeyLines.length < 2) {
    if (MD.heading.test(raw) || MD.setext.test(raw)) {
      score -= 0.2;
      reasons.push('looks_markdown');
    }
  }

  score = Math.max(0, Math.min(1, score));

  return { score, reasons };
}

/**
 * Calculate penalty for code-like content
 * @param {string} text - The text to analyze
 * @returns {number} Penalty value
 */
function codeLikePenalty(text) {
  let penalty = 0;
  const lines = text.split(/\r?\n/);

  const codeHints = [
    /^(?:\s{2,}|\t)/,
    /;\s*$/,
    /\b(function|class|import|export|const|let|var|def|if|for|while)\b/,
    /[{}`]/,
    /\bException:|\bat\s+[\w.]+ \([\w/.:-]+\)/,
  ];

  const hits = lines.reduce(
    (acc, l) => acc + codeHints.some((re) => re.test(l)),
    0
  );

  if (hits >= Math.max(3, Math.floor(lines.length * 0.08))) {
    penalty = 0.15;
  }

  return penalty;
}

/**
 * Detect the format type of the given text
 * @param {string} text - The text to analyze
 * @returns {Object} Detection result with format type, scores, and reasons
 */
export function detectTextFormat(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      text_format: 'plain',
      asciiArt: 0,
      markdown: 0,
      yaml: 0,
      binary_format: null,
      reasons: { ascii: ['empty'], markdown: [], yaml: [] },
    };
  }

  const a = asciiArtScore(text);
  const m = markdownScore(text);
  const codePenalty = codeLikePenalty(text);
  const y = yamlScore(text);

  const asciiFinal = Math.max(0, a.score - codePenalty);
  const mdFinal = m.score;

  const ASCII_TH = 0.35;
  const MD_TH = 0.08;
  const YAML_TH = 0.35;

  let text_format = 'plain'; // default
  let binary_format = null;

  // Check for binary formats first (magic bytes)
  binary_format = detectBinaryFormat(text);
  if (binary_format) {
    text_format = binary_format;
  } else if (/```[\s\S]*?```|~~~[\s\S]*?~~~/m.test(text)) {
    text_format = 'code';
  } else if (detectSvg(text)) {
    text_format = 'svg';
  } else if (/^\s*<\?xml/i.test(text)) {
    text_format = 'xml';
  } else if (/^\s*<[^>]+>/.test(text)) {
    text_format = 'html';
  } else if (/^\s*[{[][\s\S]*[\]}]\s*$/m.test(text)) {
    text_format = 'json';
  } else if (y.score >= YAML_TH && y.score >= m.score) {
    text_format = 'yaml';
  } else if (detectCsv(text) && y.score < YAML_TH && m.score < MD_TH) {
    text_format = 'csv';
  } else if (asciiFinal >= ASCII_TH && asciiFinal > mdFinal + 0.1) {
    text_format = 'ascii';
  } else if (mdFinal >= MD_TH && mdFinal >= asciiFinal) {
    text_format = 'markdown';
  }

  return {
    text_format,
    asciiArt: Number(asciiFinal.toFixed(3)),
    markdown: Number(mdFinal.toFixed(3)),
    yaml: Number(y.score.toFixed(3)),
    binary_format,
    reasons: {
      ascii: a.reasons,
      markdown: m.reasons,
      yaml: y.reasons,
      codePenaltyApplied: codePenalty > 0,
    },
    stats: a.stats,
  };
}
