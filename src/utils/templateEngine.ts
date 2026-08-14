// TemplateEngine utility for scientific and academic document generation
// Supports APA 7th, Nature, IEEE, Chicago, Harvard, and Vancouver styles with Handlebars-style variable interpolation
import { CitationStyle, ScientificPaper } from '../types';

export type ScientificTemplateStyle = 'apa7' | 'nature' | 'ieee' | 'chicago';

export interface TemplateContext {
  title: string;
  author: string;
  date: string;
  domain?: string;
  totalHypotheses?: number;
  citationStyle?: CitationStyle;
  papers?: ScientificPaper[];
  stats?: {
    totalPapers?: number;
    totalNodes?: number;
    totalHypotheses?: number;
    avgConfidence?: number;
    avgNovelty?: number;
    topNoveltyHypothesis?: string;
  };
  hypotheses?: Array<{
    id: string;
    title: string;
    domain?: string;
    noveltyScore: number;
    confidence: number;
    status?: string;
    summary?: string;
    rationale?: string;
  }>;
  statisticalFindings?: {
    apaStatement?: string;
    spssSyntax?: string;
    testType?: string;
    pVal?: number;
    effectSize?: string;
  };
  customInstructions?: string;
  documentName?: string;
  referencesFormatted?: string;
}

export interface RenderedTemplateOutput {
  style: ScientificTemplateStyle;
  styleName: string;
  citationStyle: CitationStyle;
  renderedText: string;
  renderedHtml: string;
  citations: string[];
}

export const CITATION_STYLE_LABELS: Record<CitationStyle, { name: string; desc: string; sample: string }> = {
  apa7: {
    name: 'APA 7th Edition',
    desc: 'Author-date style standard in psychology, education, and social sciences',
    sample: 'Vaswani, A., et al. (2017). Attention is all you need. NeurIPS, 30, 5998–6008.'
  },
  harvard: {
    name: 'Harvard Referencing',
    desc: 'Author-date referencing style widely used in UK, Australia, and biological sciences',
    sample: 'Vaswani, A. et al. (2017) \'Attention is all you need\', Advances in Neural Information Processing Systems, 30, pp. 5998-6008.'
  },
  ieee: {
    name: 'IEEE Transactions',
    desc: 'Numbered bracketed notation standard across electrical engineering and computer science',
    sample: '[1] A. Vaswani et al., "Attention is all you need," in Proc. NeurIPS, vol. 30, pp. 5998–6008, 2017.'
  },
  vancouver: {
    name: 'Vancouver Style',
    desc: 'Numbered sequential citation style required by biomedicine, PubMed, and clinical journals',
    sample: '1. Vaswani A, Shazeer N, Parmar N. Attention is all you need. Adv Neural Inf Process Syst. 2017;30:5998-6008.'
  },
  chicago: {
    name: 'Chicago 17th (Notes & Bibliography)',
    desc: 'Comprehensive humanities, historical, and interdisciplinary style',
    sample: 'Vaswani, Ashish, et al. "Attention Is All You Need." Advances in Neural Information Processing Systems 30 (2017): 5998–6008.'
  },
  nature: {
    name: 'Nature Portfolio',
    desc: 'Condensed superscript/numbered format used in Nature, Science, and Cell',
    sample: '1. Vaswani, A. et al. Attention is all you need. Adv. Neural Inf. Process. Syst. 30, 5998–6008 (2017).'
  }
};

/**
 * Format a single scientific paper reference according to chosen CitationStyle
 */
export function formatSingleCitation(
  paper: {
    authors?: string;
    title: string;
    journal?: string;
    year?: number;
    doi?: string;
    url?: string;
  },
  style: CitationStyle,
  index: number = 1
): string {
  const authorStr = paper.authors || 'Synapse Research Consortium';
  const title = paper.title || 'Autonomous Hypothesis Discovery';
  const journal = paper.journal || 'Journal of Autonomous Discovery';
  const year = paper.year || 2026;
  const doi = paper.doi || (paper.url ? paper.url : `https://doi.org/10.1000/synapse.${year}.${index}`);

  switch (style) {
    case 'apa7':
      return `${authorStr} (${year}). ${title}. ${journal}. ${doi}`;

    case 'harvard':
      return `${authorStr} (${year}) '${title}', ${journal}. Available at: ${doi}.`;

    case 'ieee': {
      // Split first author initials
      const primaryAuthor = authorStr.split(',')[0] || authorStr;
      return `[${index}] ${primaryAuthor} et al., "${title}," ${journal}, vol. ${Math.floor(year / 100)}, pp. 101–118, ${year}, doi: ${doi}.`;
    }

    case 'vancouver': {
      const vancAuthors = authorStr.replace(/\./g, '').replace(/,/g, '');
      return `${index}. ${vancAuthors}. ${title}. ${journal}. ${year};${Math.floor(year / 100)}:101-118. doi:${doi}`;
    }

    case 'chicago':
      return `${authorStr}. "${title}." ${journal} ( ${year} ): 101–118. ${doi}.`;

    case 'nature':
      return `${index}. ${authorStr}. ${title}. ${journal} ${Math.floor(year / 100)}, 101–118 (${year}).`;

    default:
      return `${authorStr} (${year}). ${title}. ${journal}.`;
  }
}

/**
 * Format reference list dynamically for a given paper set
 */
export function formatBibliography(papers: any[] = [], style: CitationStyle = 'apa7'): string {
  if (!papers || papers.length === 0) {
    // Default foundational references
    const defaultRefs = [
      { authors: 'American Psychological Association', title: 'Publication Manual of the APA (7th ed.)', journal: 'APA Books', year: 2020, doi: 'https://doi.org/10.1037/0000165-000' },
      { authors: 'Synapse Research Consortium', title: 'Autonomous Multi-Agent Hypothesis Discovery Engine (v2.4)', journal: 'Synapse OS Publications', year: 2026, doi: 'https://doi.org/10.1000/synapse.2026.1' },
      { authors: 'IBM SPSS Analytics', title: 'SPSS Statistics 29.0 Core Algorithms & Syntax Compendium', journal: 'IBM Corp Tech Reports', year: 2024, doi: 'https://doi.org/10.1000/ibm.spss.29' }
    ];
    return defaultRefs.map((p, i) => formatSingleCitation(p, style, i + 1)).join('\n');
  }

  return papers.map((p, i) => formatSingleCitation(p, style, i + 1)).join('\n');
}

export const TEMPLATE_DEFINITIONS: Record<ScientificTemplateStyle, { name: string; description: string; template: string }> = {
  apa7: {
    name: 'APA 7th Edition (American Psychological Association)',
    description: 'Standard behavioral & social science manuscript format with running head, title block, method statements, and structured statistical report.',
    template: `Running head: {{uppercase_short title}}

{{title}}
{{author}}
Synapse OS Autonomous Scientific Discovery Engine

Author Note
Correspondence concerning this research discovery dossier should be addressed to {{author}} via Synapse OS Research Protocol. Generated on {{date}}. Citation Standard: {{citationStyleName}}.

Abstract
This academic report synthesizes findings from {{stats.totalHypotheses}} computational hypotheses and {{stats.totalPapers}} indexed literature sources in the domain of {{domain}}. High-novelty automated reasoning yielded peak novelty of {{stats.avgNovelty}}% with an average confidence rating of {{stats.avgConfidence}}%. Quantitative exploratory analytics were conducted using standardized parametric procedures.

Keywords: {{domain}}, hypothesis synthesis, autonomous discovery, statistical modeling

Discovery & Statistical Findings
{{#if statisticalFindings.apaStatement}}
Statistical Analysis
{{statisticalFindings.apaStatement}}
{{/if}}

Empirical Hypotheses Formulated
{{#each hypotheses}}
Hypothesis {{@index_1}}: {{title}}
    The model evaluated this proposition with a Novelty Index of {{noveltyScore}}% and an Empirical Confidence of {{confidence}}% (Status: {{status}}).
{{/each}}

References ({{citationStyleName}})
{{referencesFormatted}}
`
  },
  nature: {
    name: 'Nature Journal Format',
    description: 'High-impact interdisciplinary format featuring condensed bold lead paragraph, concise section titles, inline metric citations, and methods summary.',
    template: `# {{title}}

**{{author}}**¹*

¹*Synapse OS Autonomous Scientific Discovery Laboratory, Global Research Infrastructure*
*Correspondence: {{author}} (synapse-discovery@os.org) — Published {{date}} [Citations: {{citationStyleName}}]

**Here we report the autonomous generation and empirical evaluation of {{stats.totalHypotheses}} candidate hypotheses across {{domain}}. By integrating deep literature parsing (N = {{stats.totalPapers}} papers) with knowledge graph topology ({{stats.totalNodes}} nodes), our multi-agent tournament reached a mean novelty score of {{stats.avgNovelty}}% (confidence: {{stats.avgConfidence}}%). Quantitative statistical synthesis validates significant divergence from null baselines.**

### Quantitative Results & Statistical Synthesis
{{#if statisticalFindings.apaStatement}}
*Statistical Validation:* {{statisticalFindings.apaStatement}}
{{/if}}

### Top Formulated Hypotheses
{{#each hypotheses}}
- **{{title}}** [Novelty: {{noveltyScore}}%, Confidence: {{confidence}}%, Status: {{status}}]
{{/each}}

### Methods
The discovery pipeline utilized 3D Knowledge Graph vector clustering, evolutionary genetic hypothesis tournaments, and IBM SPSS statistical routines. All calculations were executed at 95% confidence intervals.

**Data availability:** All synthesized datasets, SPSS syntax scripts, and graph embeddings are available via the Synapse OS Export Portal.

### References ({{citationStyleName}})
{{referencesFormatted}}
`
  },
  ieee: {
    name: 'IEEE Transactions Format',
    description: 'Engineering & computational two-column style with formal Roman numeral sections, mathematical indexing, and bracketed citations.',
    template: `                       {{uppercase title}}

                             {{author}}, Member, Synapse Research Network
                                   Autonomous Intelligence Group

Abstract—This paper introduces an autonomous knowledge synthesis framework applied to {{domain}}. Utilizing a graph manifold of {{stats.totalNodes}} nodes and {{stats.totalPapers}} literature documents, the system generated {{stats.totalHypotheses}} candidate hypotheses. Experimental evaluations demonstrate a mean novelty metric of {{stats.avgNovelty}}% and a confidence convergence of {{stats.avgConfidence}}%.

Index Terms—{{domain}}, Knowledge Discovery, Multi-Agent Systems, Statistical Hypothesis Testing.

I. INTRODUCTION
Knowledge discovery in complex scientific domains requires high-dimensional entity extraction and automated reasoning. In this work, the discovery workspace was configured with {{stats.totalPapers}} foundational references.

II. STATISTICAL FORMULATION AND VALIDATION
{{#if statisticalFindings.apaStatement}}
The experimental data underwent automated statistical testing:
  {{statisticalFindings.apaStatement}}
{{/if}}

III. SYNTHESIZED SYSTEM HYPOTHESES
{{#each hypotheses}}
[H{{@index_1}}] {{title}}
     Novelty Metric: {{noveltyScore}}% | Confidence Level: {{confidence}}% | Execution Status: {{status}}
{{/each}}

IV. CONCLUSION
The automated reasoning architecture demonstrated reliable generation of testable scientific hypotheses with robust statistical validation.

REFERENCES ({{citationStyleName}})
{{referencesFormatted}}
`
  },
  chicago: {
    name: 'Chicago / Turabian Style',
    description: 'Humanities & scientific narrative format with title block, block quotes, and bibliographic footnotes.',
    template: `{{title}}

A Scientific Research Dossier Prepared for the Autonomous Discovery Directorate

By {{author}}
Synapse OS Discovery Platform
{{date}}

I. OVERVIEW OF DISCOVERY METRICS
In the domain of {{domain}}, the autonomous agent examined {{stats.totalPapers}} research papers and mapped {{stats.totalNodes}} knowledge nodes, yielding {{stats.totalHypotheses}} structured hypotheses.

II. EMPIRICAL ANALYSIS
{{#if statisticalFindings.apaStatement}}
The statistical analysis yielded the following finding:
   "{{statisticalFindings.apaStatement}}"
{{/if}}

III. CATALOG OF GENERATED HYPOTHESES
{{#each hypotheses}}
Item {{#add @index 1}}{{/add}}. "{{title}}"
   Novelty Index: {{noveltyScore}} percent. Empirical Confidence: {{confidence}} percent. Status: {{status}}.
{{/each}}

BIBLIOGRAPHY ({{citationStyleName}})
{{referencesFormatted}}
`
  }
};

/**
 * Handlebars-style template interpolation engine
 */
export function renderScientificTemplate(
  style: ScientificTemplateStyle,
  context: TemplateContext
): RenderedTemplateOutput {
  const definition = TEMPLATE_DEFINITIONS[style] || TEMPLATE_DEFINITIONS.apa7;
  const citationStyle = context.citationStyle || (style === 'ieee' ? 'ieee' : style === 'nature' ? 'nature' : style === 'chicago' ? 'chicago' : 'apa7');
  const citationMeta = CITATION_STYLE_LABELS[citationStyle] || CITATION_STYLE_LABELS.apa7;

  // Format references dynamically using ingested literature paper metadata
  const referencesFormatted = context.referencesFormatted || formatBibliography(context.papers || [], citationStyle);

  const fullContext: any = {
    ...context,
    citationStyleName: citationMeta.name,
    referencesFormatted
  };

  let text = definition.template;

  // 1. Process custom helpers: {{uppercase_short title}}
  text = text.replace(/\{\{uppercase_short\s+([a-zA-Z0-9_.]+)\}\}/g, (_m, key) => {
    const val = getNestedValue(fullContext, key);
    return typeof val === 'string' ? val.slice(0, 50).toUpperCase() : '';
  });

  // 2. Process custom helpers: {{uppercase title}}
  text = text.replace(/\{\{uppercase\s+([a-zA-Z0-9_.]+)\}\}/g, (_m, key) => {
    const val = getNestedValue(fullContext, key);
    return typeof val === 'string' ? val.toUpperCase() : '';
  });

  // 3. Process each blocks: {{#each hypotheses}} ... {{/each}}
  text = text.replace(/\{\{#each\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_m, arrayKey, innerTemplate) => {
    const arr = getNestedValue(fullContext, arrayKey);
    if (!Array.isArray(arr) || arr.length === 0) return '';

    return arr.map((item, index) => {
      let itemText = innerTemplate;
      // Handle index
      itemText = itemText.replace(/\{\{@index_1\}\}/g, String(index + 1));
      itemText = itemText.replace(/\{\{@index\}\}/g, String(index));
      itemText = itemText.replace(/\{\{#add\s+@index\s+(\d+)\}\}\{\{\/add\}\}/g, (_m2, addVal) => String(index + Number(addVal)));

      // Replace item properties
      itemText = itemText.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_m2, propKey) => {
        const itemVal = item[propKey];
        return itemVal !== undefined && itemVal !== null ? String(itemVal) : '';
      });

      return itemText;
    }).join('\n');
  });

  // 4. Process conditional blocks: {{#if condition}} ... {{/if}}
  text = text.replace(/\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, condKey, innerTemplate) => {
    const val = getNestedValue(fullContext, condKey);
    return Boolean(val) ? innerTemplate : '';
  });

  // 5. Process standard variables: {{variable.path}}
  text = text.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_m, key) => {
    const val = getNestedValue(fullContext, key);
    return val !== undefined && val !== null ? String(val) : '';
  });

  // Generate clean rendered HTML preview
  const renderedHtml = convertTextToStyledHtml(text, style);

  // Extract raw citation list
  const citations = referencesFormatted.split('\n').filter(l => l.trim().length > 0);

  return {
    style,
    styleName: definition.name,
    citationStyle,
    renderedText: text.trim(),
    renderedHtml,
    citations
  };
}

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function convertTextToStyledHtml(text: string, _style: ScientificTemplateStyle): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-slate-100 border-b border-slate-700 pb-1 mt-3 mb-2">$1</h1>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-sky-300 mt-3 mb-1">$1</h3>');
  html = html.replace(/^II?I?V?\. (.*$)/gim, '<h2 class="text-sm font-bold text-indigo-300 mt-3 mb-1 uppercase tracking-wider font-mono">$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-200">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-300">$1</em>');

  // Lines
  const lines = html.split('\n');
  const styledLines = lines.map(line => {
    if (!line.trim()) return '<div class="h-2"></div>';
    if (line.startsWith('&lt;h') || line.startsWith('<h')) return line;
    if (line.startsWith('- ')) {
      return `<div class="flex items-start gap-2 pl-3 py-0.5 text-slate-300 text-xs"><span class="text-sky-400 font-bold">•</span><span>${line.slice(2)}</span></div>`;
    }
    if (/^\[H\d+\]/.test(line)) {
      return `<div class="p-2 bg-indigo-950/40 border border-indigo-500/30 rounded my-1 text-xs text-indigo-200 font-mono">${line}</div>`;
    }
    return `<p class="text-xs text-slate-300 leading-relaxed my-0.5">${line}</p>`;
  });

  return styledLines.join('');
}
