/**
 * Unified Medical Content Formatter
 * Combines the best features from all formatters with no conflicts
 * Provides rich formatting: bold, italic, colors through CSS classes
 */

interface FormattingOptions {
  enableWarningBoxes?: boolean;
  enableDosageHighlight?: boolean;
  enableNumberHighlight?: boolean;
  enableMedicalTerms?: boolean;
  enableParentheticals?: boolean;
}

const DEFAULT_OPTIONS: FormattingOptions = {
  enableWarningBoxes: true,
  enableDosageHighlight: true,
  enableNumberHighlight: true,
  enableMedicalTerms: true,
  enableParentheticals: true
};

/**
 * Main unified formatting function
 * Process content in optimal order to avoid conflicts
 */
export function formatMedicalContent(
  element: HTMLElement, 
  options: FormattingOptions = DEFAULT_OPTIONS
): void {
  // Guard against double-processing
  if (element.dataset['formatted'] === 'true') {
    return;
  }

  // Step 1: Convert markdown-style bold (**text**) to HTML
  convertMarkdownToHtml(element);
  
  // Step 2: Process structure (headers, warning boxes, lists)
  processStructure(element, options);
  
  // Step 3: Apply inline formatting (bold, italics, highlights)
  applyInlineFormatting(element, options);
  
  // Mark as processed to prevent double-formatting
  element.dataset['formatted'] = 'true';
}

/**
 * Convert markdown syntax to HTML
 */
function convertMarkdownToHtml(element: HTMLElement): void {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  const nodes: Text[] = [];
  let node;
  while (node = walker.nextNode()) {
    nodes.push(node as Text);
  }
  
  nodes.forEach((textNode) => {
    const text = textNode.textContent || '';
    let html = text;
    
    // Convert headers (###, ##, #) to HTML
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Convert horizontal rules (---)
    html = html.replace(/^---+$/gm, '<hr/>');
    
    // Convert **text** to <b>text</b> (bold) - improved regex
    html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    
    // Convert *text* to <i>text</i> (italic) - make sure not to match bold
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<i>$1</i>');
    
    // Convert numbered lists (1. , 2. , etc.)
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    if (html !== text && textNode.parentNode) {
      const span = document.createElement('span');
      span.innerHTML = html;
      textNode.parentNode.replaceChild(span, textNode);
    }
  });
}

/**
 * Process document structure
 */
function processStructure(element: HTMLElement, options: FormattingOptions): void {
  const content = element.innerHTML;
  const lines = content.split('\n');
  const processedLines: string[] = [];
  
  let inList = false;
  let currentList: string[] = [];
  let inWarningSection = false;
  let warningContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || '';
    const nextLine = lines[i + 1]?.trim() || '';
    
    // Warning Box Detection (When to See Your Doctor, Emergency Signs, etc.)
    if (options.enableWarningBoxes && isWarningSection(line)) {
      inWarningSection = true;
      warningContent = [`<div class="medical-warning-box">`, `<div class="warning-title">⚠️ ${line}</div>`, `<div class="warning-content">`];
      continue;
    }
    
    // Handle warning section content
    if (inWarningSection) {
      if (line.startsWith('•') || line.startsWith('-')) {
        const bulletContent = line.substring(1).trim();
        const formatted = formatBulletContent(bulletContent);
        warningContent.push(`<div class="warning-item">• ${formatted}</div>`);
      } else if (line && !isLikelyHeader(line, nextLine)) {
        warningContent.push(line);
      } else if (!line && nextLine && !isWarningContinuation(nextLine)) {
        // End warning section
        warningContent.push('</div></div>');
        processedLines.push(warningContent.join('\n'));
        inWarningSection = false;
        warningContent = [];
      }
      continue;
    }
    
    // Bullet Point Processing
    if (line.startsWith('•') || line.startsWith('-')) {
      if (!inList) {
        currentList = ['<ul class="medical-list">'];
        inList = true;
      }
      
      const bulletContent = line.substring(1).trim();
      const formatted = formatBulletContent(bulletContent);
      currentList.push(`  <li>${formatted}</li>`);
    }
    // Section Headers
    else if (isLikelyHeader(line, nextLine)) {
      // Close any open list
      if (inList) {
        currentList.push('</ul>');
        processedLines.push(currentList.join('\n'));
        inList = false;
        currentList = [];
      }
      
      // Style header based on position
      if (i === 0) {
        processedLines.push(`<h2 class="medical-title">${line}</h2>`);
      } else {
        processedLines.push(`<h3 class="medical-section">${line}</h3>`);
      }
    }
    // Regular content
    else if (line) {
      // Close any open list
      if (inList) {
        currentList.push('</ul>');
        processedLines.push(currentList.join('\n'));
        inList = false;
        currentList = [];
      }
      
      processedLines.push(`<p>${line}</p>`);
    }
    // Empty lines
    else if (!inList) {
      processedLines.push('');
    }
  }
  
  // Close any remaining structures
  if (inList) {
    currentList.push('</ul>');
    processedLines.push(currentList.join('\n'));
  }
  
  if (inWarningSection) {
    warningContent.push('</div></div>');
    processedLines.push(warningContent.join('\n'));
  }
  
  element.innerHTML = processedLines.join('\n');
}

/**
 * Format bullet point content with smart bolding
 */
function formatBulletContent(content: string): string {
  const colonIndex = content.indexOf(':');
  
  // If there's a colon, bold the term before it
  if (colonIndex > 0 && colonIndex < 50) {
    const term = content.substring(0, colonIndex);
    const description = content.substring(colonIndex);
    return `<b>${term}</b>${description}`;
  }
  
  // Otherwise, bold first 2-3 significant words
  const words = content.split(' ');
  if (words.length >= 3) {
    const boldWords = words.slice(0, 2).join(' ');
    const rest = words.slice(2).join(' ');
    return `<b>${boldWords}</b> ${rest}`;
  } else if (words.length === 2) {
    return `<b>${words.join(' ')}</b>`;
  }
  
  return content;
}

/**
 * Apply inline formatting (highlights, medical terms, etc.)
 */
function applyInlineFormatting(element: HTMLElement, options: FormattingOptions): void {
  // Process in specific order to avoid conflicts
  
  if (options.enableDosageHighlight) {
    highlightDosages(element);
  }
  
  if (options.enableNumberHighlight) {
    highlightNumbers(element);
  }
  
  if (options.enableMedicalTerms) {
    highlightMedicalTerms(element);
  }
  
  if (options.enableParentheticals) {
    formatParentheticals(element);
  }
}

/**
 * Highlight dosage information with color
 */
function highlightDosages(element: HTMLElement): void {
  applyHighlight(element, {
    pattern: /\b(\d+(?:-\d+)?\s*(?:mg|mcg|g|ml|mL|IU|units?|tablets?|pills?|capsules?|doses?))\b/gi,
    className: 'dose-highlight',
    skipTags: ['B', 'STRONG', 'I', 'EM', 'SPAN']
  });
}

/**
 * Highlight significant numbers and percentages
 */
function highlightNumbers(element: HTMLElement): void {
  applyHighlight(element, {
    pattern: /\b(\d+%|\d{3,}(?:,\d{3})*)\b/g,
    className: 'number-highlight',
    skipTags: ['B', 'STRONG', 'I', 'EM', 'SPAN', 'CODE']
  });
}

/**
 * Highlight important medical terms
 */
function highlightMedicalTerms(element: HTMLElement): void {
  const medicalTerms = [
    /\b(emergency|urgent|immediate|critical|severe|life-threatening)\b/gi,
    /\b(diabetes|hypertension|arthritis|asthma|COPD|heart disease)\b/gi,
    /\b(NSAIDs|DMARDs|ACE inhibitors|beta blockers|statins)\b/gi
  ];
  
  medicalTerms.forEach(pattern => {
    applyHighlight(element, {
      pattern,
      className: 'medical-term',
      skipTags: ['B', 'STRONG', 'I', 'EM', 'SPAN', 'H2', 'H3']
    });
  });
}

/**
 * Format parenthetical content with italics
 */
function formatParentheticals(element: HTMLElement): void {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (parent && (parent.tagName === 'I' || parent.tagName === 'EM')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const nodes: Text[] = [];
  let node;
  while (node = walker.nextNode()) {
    nodes.push(node as Text);
  }
  
  nodes.forEach((textNode) => {
    const text = textNode.textContent || '';
    const parenPattern = /\(([^)]+)\)/g;
    
    if (parenPattern.test(text)) {
      const html = text.replace(parenPattern, '(<i>$1</i>)');
      if (textNode.parentNode) {
        const span = document.createElement('span');
        span.innerHTML = html;
        textNode.parentNode.replaceChild(span, textNode);
      }
    }
  });
}

/**
 * Generic highlight application helper
 */
function applyHighlight(
  element: HTMLElement,
  config: {
    pattern: RegExp;
    className: string;
    skipTags: string[];
  }
): void {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (parent && config.skipTags.includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip if already has the class we're trying to apply
        if (parent && parent.classList.contains(config.className)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const nodes: Text[] = [];
  let node;
  while (node = walker.nextNode()) {
    nodes.push(node as Text);
  }
  
  nodes.forEach((textNode) => {
    const text = textNode.textContent || '';
    
    if (config.pattern.test(text)) {
      const html = text.replace(config.pattern, `<span class="${config.className}">$1</span>`);
      if (textNode.parentNode) {
        const span = document.createElement('span');
        span.innerHTML = html;
        textNode.parentNode.replaceChild(span, textNode);
      }
    }
  });
}

/**
 * Check if line is a warning section header
 */
function isWarningSection(line: string): boolean {
  const warningPhrases = [
    'when to see your doctor',
    'when to seek help',
    'emergency signs',
    'warning signs',
    'red flags',
    'seek immediate care',
    'call 911'
  ];
  
  const lower = line.toLowerCase();
  return warningPhrases.some(phrase => lower.includes(phrase));
}

/**
 * Check if line continues warning section
 */
function isWarningContinuation(line: string): boolean {
  return line.startsWith('•') || line.startsWith('-') || line.startsWith('→');
}

/**
 * Detect if line is likely a header
 */
function isLikelyHeader(line: string, nextLine: string): boolean {
  if (!line || line.length > 50) return false;
  if (line.endsWith('.') || line.endsWith('!') || line.endsWith('?')) return false;
  
  const headerKeywords = [
    'overview', 'causes', 'symptoms', 'treatment', 'prevention',
    'diagnosis', 'management', 'medications', 'complications',
    'prognosis', 'risk factors', 'self-care', 'lifestyle',
    'when to', 'how to', 'what to', 'understanding'
  ];
  
  const lower = line.toLowerCase();
  const hasKeyword = headerKeywords.some(keyword => lower.includes(keyword));
  
  const followedByContent = !!(nextLine && (
    nextLine.startsWith('•') || 
    nextLine.startsWith('-') ||
    nextLine.length > line.length * 1.5
  ));
  
  return hasKeyword || (line.length < 30 && followedByContent);
}

/**
 * Apply formatting to all medical messages on the page
 */
export function formatAllMedicalMessages(options?: FormattingOptions): void {
  const messageElements = document.querySelectorAll('.message-text, .medical-content');
  messageElements.forEach((el) => {
    formatMedicalContent(el as HTMLElement, options);
  });
}

/**
 * Remove all formatting (useful for reset)
 */
export function removeFormatting(element: HTMLElement): void {
  // Remove data attribute
  delete element.dataset['formatted'];
  
  // Remove all formatting spans and classes
  const formattedElements = element.querySelectorAll(
    '.dose-highlight, .number-highlight, .medical-term, ' +
    '.medical-warning-box, .medical-list, .medical-title, .medical-section'
  );
  
  formattedElements.forEach(el => {
    const text = el.textContent || '';
    const textNode = document.createTextNode(text);
    el.parentNode?.replaceChild(textNode, el);
  });
}
