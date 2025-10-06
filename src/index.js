// Regular expressions for Unicode character detection
const BOX_DRAWING_RE = /[\u2500-\u257F]/;
const BLOCK_ELEMS_RE = /[\u2580-\u259F]/;
const BRAILLE_RE = /[\u2800-\u28FF]/;
const GEOM_RE = /[\u25A0-\u25FF]/;
const ANSI_RE = /\x1B\[[0-9;]*m/;

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
      reasons: { ascii: ['empty'], markdown: [] },
    };
  }

  const a = asciiArtScore(text);
  const m = markdownScore(text);
  const codePenalty = codeLikePenalty(text);

  const asciiFinal = Math.max(0, a.score - codePenalty);
  const mdFinal = m.score;

  const ASCII_TH = 0.35;
  const MD_TH = 0.08;

  let text_format = 'plain'; // default

  // Extra quick detections for specific formats (check these first)
  if (/```[\s\S]*?```|~~~[\s\S]*?~~~/m.test(text)) {
    text_format = 'code';
  } else if (/^\s*<\?xml/i.test(text)) {
    text_format = 'xml';
  } else if (/^\s*<[^>]+>/.test(text)) {
    text_format = 'html';
  } else if (/^\s*[{[][\s\S]*[\]}]\s*$/m.test(text)) {
    text_format = 'json';
  } else if (asciiFinal >= ASCII_TH && asciiFinal > mdFinal + 0.1) {
    text_format = 'ascii';
  } else if (mdFinal >= MD_TH && mdFinal >= asciiFinal) {
    text_format = 'markdown';
  }

  return {
    text_format,
    asciiArt: Number(asciiFinal.toFixed(3)),
    markdown: Number(mdFinal.toFixed(3)),
    reasons: {
      ascii: a.reasons,
      markdown: m.reasons,
      codePenaltyApplied: codePenalty > 0,
    },
    stats: a.stats,
  };
}
