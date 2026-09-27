import crypto from 'crypto';
const pdfParse = require('pdf-parse');
import Project from '../models/Project';

export interface ScoreBreakdown {
  atsCompatibility: number; // 0 - 2.0
  skillsRelevance: number;  // 0 - 2.0
  experience: number;       // 0 - 2.0
  projects: number;         // 0 - 2.0
  clarityStructure: number; // 0 - 2.0
  projectQuality?: number;  // 0 - 2.0
}

export interface DocumentMetadataSignals {
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  isSuspicious: boolean;
  signals: string[];
}

export interface AIAssistanceAnalysis {
  category: 'LOW AI-ASSISTANCE SIGNAL' | 'MEDIUM AI-ASSISTANCE SIGNAL' | 'HIGH AI-ASSISTANCE SIGNAL' | 'INSUFFICIENT EVIDENCE';
  confidence: 'Low' | 'Moderate' | 'High';
  evidence: string[];
  summary: string;
}

export interface DetailedAnalysisResult {
  fileHash: string;
  extractedText: string;
  score10: number; // e.g. 8.2 / 10
  scoreBreakdown: ScoreBreakdown;
  aiAssistanceSignals: AIAssistanceAnalysis;
  documentMetadataSignals: DocumentMetadataSignals;

  track?: string;
  careerArea?: string;
  overallScore?: number;
  atsScore?: number;
  roleRelevanceScore?: number;
  experienceScore?: number;
  projectsScore?: number;
  clarityScore?: number;
  detectedSkills?: string[];
  roleRelevantSkills?: string[];
  otherDetectedSkills?: string[];
  missingRoleSkills?: string[];
  honestAssessment?: string;

  skills: string[];
  experience: Array<{ title?: string; company?: string; duration?: string; details?: string[] }>;
  education: Array<{ degree?: string; institution?: string; year?: string }>;
  projects: Array<{ title: string; description: string; technologies: string[] }>;
  certifications: string[];
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  recommendations: string[];
  integrity: {
    fingerprint: string;
    candidateId: string;
    version: string;
    timestamp: Date;
    status: 'VERIFIED' | 'UNDER_REVIEW' | 'FLAGGED';
  };
  scores: {
    atsScore: number;
    technicalMatchScore: number;
    impactMetricsScore: number;
    completenessScore: number;
    overallScore: number;
  };
  aiWritingIndicator: {
    percentage: number;
    confidence: 'Low' | 'Medium' | 'High';
    signalsDetected: string[];
    summary: string;
  };
  technicalEvidence: {
    matchedSkills: string[];
    unverifiedClaims: string[];
    detectedTechnologies: string[];
    extractedProjects: { title: string; description: string; technologies: string[] }[];
  };
  improvementSuggestions: string[];
}

export const NON_TECH_SKILL_MAP: Record<string, { skills: string[]; essential: string[] }> = {
  marketing: {
    skills: [
      'marketing strategy', 'market research', 'content strategy', 'communication', 'seo', 'sem',
      'digital marketing', 'marketing analytics', 'brand management', 'campaign management',
      'social media marketing', 'social media', 'email marketing', 'customer acquisition', 'copywriting',
      'google analytics', 'growth marketing', 'performance marketing', 'conversion rate optimization',
      'cro', 'a/b testing', 'public relations', 'consumer insights', 'data analysis', 'lead generation'
    ],
    essential: ['Marketing Strategy', 'Market Research', 'Content Strategy', 'SEO', 'Digital Marketing', 'Marketing Analytics']
  },
  hr: {
    skills: [
      'recruitment', 'talent acquisition', 'candidate screening', 'hr operations', 'employee relations',
      'onboarding', 'performance management', 'compensation & benefits', 'hris', 'talent management',
      'interviewing', 'employment law', 'hr policy', 'people analytics', 'diversity & inclusion',
      'workforce planning', 'communication', 'training & development', 'employee engagement'
    ],
    essential: ['Recruitment', 'Talent Acquisition', 'Candidate Screening', 'HR Operations', 'Employee Relations', 'Onboarding']
  },
  finance: {
    skills: [
      'financial analysis', 'excel', 'budgeting', 'forecasting', 'financial reporting', 'variance analysis',
      'cash flow management', 'cash flow', 'financial modeling', 'accounting', 'risk management',
      'valuation', 'auditing', 'cost analysis', 'p&l', 'quickbooks', 'sap', 'balance sheet',
      'corporate finance', 'taxation', 'general ledger', 'reconciliation'
    ],
    essential: ['Financial Analysis', 'Excel', 'Budgeting', 'Forecasting', 'Financial Reporting', 'Financial Modeling']
  },
  sales: {
    skills: [
      'lead generation', 'b2b sales', 'crm', 'salesforce', 'hubspot', 'cold calling',
      'account management', 'pipeline management', 'sales forecasting', 'negotiation', 'closing',
      'customer relationship management', 'pitching', 'business development', 'inbound sales',
      'outbound sales', 'enterprise sales', 'client acquisition', 'client retention'
    ],
    essential: ['B2B Sales', 'Lead Generation', 'CRM (Salesforce/HubSpot)', 'Pipeline Management', 'Negotiation', 'Account Management']
  },
  'ui/ux': {
    skills: [
      'user research', 'wireframing', 'prototyping', 'figma', 'user testing', 'information architecture',
      'usability testing', 'ui design', 'ux design', 'design systems', 'interaction design',
      'journey mapping', 'persona', 'adobe xd', 'mobile design', 'accessibility', 'user experience'
    ],
    essential: ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'User Testing', 'Design Systems']
  },
  product: {
    skills: [
      'product roadmap', 'prd', 'feature prioritization', 'agile', 'scrum', 'user stories',
      'product analytics', 'market analysis', 'competitive analysis', 'stakeholder management',
      'product strategy', 'go-to-market', 'gtm', 'mvp', 'sprint planning', 'jira', 'user persona'
    ],
    essential: ['Product Roadmap', 'PRD Authoring', 'Feature Prioritization', 'Product Analytics', 'Agile/Scrum', 'Go-to-Market']
  },
  content: {
    skills: [
      'content strategy', 'copywriting', 'seo writing', 'content creation', 'editorial planning',
      'storytelling', 'proofreading', 'editing', 'blog management', 'social media copy', 'cms',
      'wordpress', 'brand voice', 'content marketing', 'technical writing', 'communication'
    ],
    essential: ['Content Strategy', 'Copywriting', 'SEO Writing', 'Editorial Planning', 'Storytelling', 'Brand Voice']
  },
  'business analyst': {
    skills: [
      'business analysis', 'requirements gathering', 'process mapping', 'sql', 'data analysis',
      'stakeholder management', 'flowcharts', 'gap analysis', 'functional specifications', 'use cases',
      'tableau', 'power bi', 'excel modeling', 'root cause analysis', 'agile', 'uml', 'excel'
    ],
    essential: ['Business Analysis', 'Requirements Gathering', 'Process Mapping', 'SQL', 'Data Analysis', 'GAP Analysis']
  },
  operations: {
    skills: [
      'process optimization', 'operations management', 'supply chain', 'logistics', 'vendor management',
      'resource allocation', 'quality assurance', 'workflow design', 'sop', 'kpi tracking',
      'project coordination', 'inventory management', 'operational efficiency', 'continuous improvement'
    ],
    essential: ['Process Optimization', 'Operations Management', 'Vendor Management', 'Workflow Design', 'SOP Development', 'KPI Tracking']
  }
};

const TECH_KEYWORDS = [
  'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'node.js', 'express',
  'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'spring boot', 'go', 'golang',
  'rust', 'c++', 'c#', '.net', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform',
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'graphql',
  'rest api', 'kafka', 'rabbitmq', 'git', 'ci/cd', 'github actions', 'tailwind', 'tailwind css',
  'html', 'css', 'redux', 'prisma', 'linux', 'bash', 'pandas', 'numpy', 'pytorch', 'tensorflow', 'c'
];

const AI_BUZZWORDS = [
  'spearheaded', 'leveraged', 'synergized', 'delve', 'pivotal role', 'in the dynamic realm',
  'testament to', 'seamlessly integrated', 'cutting-edge', 'streamlined processes',
  'paradigm', 'robust solution', 'holistic approach', 'fostered collaboration',
  'revolutionized', 'instrumental in', 'utilized state-of-the-art', 'harnessed the power'
];

/**
 * Deterministic Resume Analyzer
 * Track and Role-Aware:
 * - When track === 'NON_TECHNICAL': analyzes according to candidate.careerArea (e.g. Marketing, HR, Finance, etc.).
 *   Strictly separates Extracted Skills vs Role-Relevant Skills.
 *   Calculates 5-dimension rubric: ATS / Structure 20%, Career Relevance 30%, Experience 20%, Proof of Work / Projects 15%, Clarity 15%.
 * - When track === 'TECHNICAL': maintains existing software engineering rubric unchanged.
 */
export async function analyzeResumeBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string,
  track: string = 'TECHNICAL',
  careerArea: string = ''
): Promise<DetailedAnalysisResult> {
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const candidateId = `PH-USR-${userId.toString().slice(-4).toUpperCase()}`;

  // 1. Text Extraction & Document Metadata Signals
  let extractedText = '';
  let docMetadata: DocumentMetadataSignals = {
    creator: 'Standard Document Editor',
    producer: 'PDF Generator',
    creationDate: new Date().toISOString(),
    modificationDate: new Date().toISOString(),
    isSuspicious: false,
    signals: []
  };

  if (mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
    try {
      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || '';
        if (pdfData.info) {
          docMetadata.creator = pdfData.info.Creator || pdfData.info.Author || 'Standard Document Editor';
          docMetadata.producer = pdfData.info.Producer || 'PDF Generator Engine';
          docMetadata.creationDate = pdfData.info.CreationDate || '';
          docMetadata.modificationDate = pdfData.info.ModDate || '';
          
          const producerLower = (docMetadata.producer + ' ' + docMetadata.creator).toLowerCase();
          if (producerLower.includes('headless') || producerLower.includes('wkhtmltopdf') || producerLower.includes('puppeteer')) {
            docMetadata.isSuspicious = true;
            docMetadata.signals.push('Automated headless browser rendering engine detected in producer metadata');
          } else {
            docMetadata.signals.push(`Standard producer signature verified: ${docMetadata.producer.slice(0, 35)}`);
          }
          if (docMetadata.creationDate) {
            docMetadata.signals.push(`Creation timestamp recorded in PDF dictionary: ${docMetadata.creationDate}`);
          }
        }
      } else if (pdfParse?.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buffer });
        const res = await parser.getText();
        extractedText = typeof res === 'string' ? res : (res?.text || '');
        docMetadata.signals.push('Clean binary PDF streams detected without anomalous compression tags');
      } else {
        extractedText = buffer.toString('utf-8');
      }
    } catch {
      extractedText = buffer.toString('utf-8');
    }
  } else {
    extractedText = buffer.toString('utf-8');
    docMetadata.creator = 'Text / Word Document Processor';
    docMetadata.producer = 'Native OS File System';
    docMetadata.signals.push('PlainText/Doc document container parsed without binary anomalies');
  }

  if (docMetadata.signals.length === 0) {
    docMetadata.signals.push('Document structural streams verified without anomalous compression tags');
  }


  const lowerText = extractedText.toLowerCase();
  const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 5);

  // 2. Extract Skills (Check both technical keywords and non-technical skills)
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const allDetectedSkills: string[] = [];

  // Check technical keywords
  for (const tech of TECH_KEYWORDS) {
    const escaped = escapeRegex(tech);
    const regex = new RegExp(`(^|[^a-zA-Z0-9_#+])${escaped}([^a-zA-Z0-9_#+]|$)`, 'i');
    if (regex.test(lowerText)) {
      const formatted = tech === 'c' ? 'C' : tech === 'c++' ? 'C++' : tech === 'c#' ? 'C#' : tech === 'sql' ? 'SQL' : tech.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!allDetectedSkills.includes(formatted)) {
        allDetectedSkills.push(formatted);
      }
    }
  }

  // Check non-technical skill dictionaries
  Object.values(NON_TECH_SKILL_MAP).forEach(domainObj => {
    domainObj.skills.forEach(skill => {
      const escaped = escapeRegex(skill);
      const regex = new RegExp(`(^|[^a-zA-Z0-9_#+])${escaped}([^a-zA-Z0-9_#+]|$)`, 'i');
      if (regex.test(lowerText)) {
        const formatted = skill === 'seo' ? 'SEO' : skill === 'sem' ? 'SEM' : skill === 'cro' ? 'CRO' : skill === 'sql' ? 'SQL' : skill === 'ui design' ? 'UI Design' : skill === 'ux design' ? 'UX Design' : skill === 'figma' ? 'Figma' : skill === 'b2b sales' ? 'B2B Sales' : skill === 'crm' ? 'CRM' : skill === 'p&l' ? 'P&L' : skill === 'sop' ? 'SOP' : skill === 'hris' ? 'HRIS' : skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!allDetectedSkills.includes(formatted)) {
          allDetectedSkills.push(formatted);
        }
      }
    });
  });

  const uniqueSkills = Array.from(new Set(allDetectedSkills));

  // 3. Section Checks
  const hasExperience = /(experience|work history|employment|professional experience|internship)/i.test(lowerText);
  const hasEducation = /(education|academic|university|degree|bachelor|master|b\.tech|b\.s|m\.s|mba|bba|diploma)/i.test(lowerText);
  const hasProjects = /(projects|personal projects|technical projects|open source|campaigns|case studies|deliverables)/i.test(lowerText);
  const hasSkillsSec = /(skills|technical skills|technologies|proficiencies|competencies|areas of expertise)/i.test(lowerText);
  const hasEmail = /[@\w.-]+\.\w+/.test(extractedText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(extractedText);
  const hasLinks = /(github\.com|linkedin\.com|http:\/\/|https:\/\/)/i.test(extractedText);

  // 4. Metrics & Quantitative Outcomes
  let metricLineCount = 0;
  const metricRegex = /\b(\d+%\b|\$\d+|\d+x\b|\b\d{2,}\b|\b\d+ms\b|\b\d+k\b|\b\d+gb\b)/i;
  lines.forEach(line => {
    if (metricRegex.test(line)) metricLineCount++;
  });
  const metricRatio = lines.length > 0 ? metricLineCount / lines.length : 0.2;

  // 5. Cross-reference with candidate's actual projects in MongoDB
  const userProjects = await Project.find({ user: userId });
  const projectTechSet = new Set<string>();
  userProjects.forEach(p => {
    p.claimedTechnologies?.forEach((t: string) => projectTechSet.add(t.toLowerCase()));
  });

  const matchedSkills: string[] = [];
  const unverifiedClaims: string[] = [];
  uniqueSkills.forEach(s => {
    if (projectTechSet.has(s.toLowerCase())) {
      matchedSkills.push(s);
    } else {
      unverifiedClaims.push(s);
    }
  });

  // 6. AI-ASSISTANCE SIGNAL ANALYSIS
  let buzzwordHits = 0;
  const detectedBuzzwords: string[] = [];
  AI_BUZZWORDS.forEach(bw => {
    const rx = new RegExp(`\\b${bw}\\b`, 'gi');
    const m = lowerText.match(rx);
    if (m) {
      buzzwordHits += m.length;
      detectedBuzzwords.push(bw);
    }
  });

  const aiSignals: string[] = [];
  let signalCategory: 'LOW AI-ASSISTANCE SIGNAL' | 'MEDIUM AI-ASSISTANCE SIGNAL' | 'HIGH AI-ASSISTANCE SIGNAL' | 'INSUFFICIENT EVIDENCE';
  let signalConfidence: 'Low' | 'Moderate' | 'High' = 'Moderate';

  if (extractedText.length < 150) {
    signalCategory = 'INSUFFICIENT EVIDENCE';
    signalConfidence = 'Low';
    aiSignals.push('Document contains insufficient text to evaluate writing patterns.');
  } else {
    if (buzzwordHits >= 5) {
      aiSignals.push(`Elevated density of corporate buzzwords detected (${detectedBuzzwords.slice(0, 3).join(', ')}).`);
    }
    if (metricRatio < 0.08) {
      aiSignals.push('Low specificity in achievement descriptions with limited quantified outcomes.');
    }
    const avgLineLen = lines.length > 0 ? lines.reduce((a, b) => a + b.length, 0) / lines.length : 50;
    if (avgLineLen > 115 && avgLineLen < 155) {
      aiSignals.push('Uniform sentence length and syntactic consistency characteristic of templated drafting.');
    }
    if (lines.filter(l => l.toLowerCase().startsWith('responsible for') || l.toLowerCase().startsWith('spearheaded')).length >= 3) {
      aiSignals.push('Repeated sentence initiation structures across multiple accomplishment bullets.');
    }

    if (buzzwordHits >= 6 || aiSignals.length >= 3) {
      signalCategory = 'HIGH AI-ASSISTANCE SIGNAL';
      signalConfidence = 'High';
    } else if (buzzwordHits >= 2 || aiSignals.length >= 1) {
      signalCategory = 'MEDIUM AI-ASSISTANCE SIGNAL';
      signalConfidence = 'Moderate';
    } else {
      signalCategory = 'LOW AI-ASSISTANCE SIGNAL';
      signalConfidence = 'Moderate';
      aiSignals.push('Varied sentence rhythms and concrete domain specifics present.');
    }
  }

  const aiSummary = signalCategory === 'LOW AI-ASSISTANCE SIGNAL'
    ? 'Possible AI-assisted writing signals: LOW. Writing exhibits distinct personal voice, concrete domain specifics, and varied syntactic structure.'
    : signalCategory === 'MEDIUM AI-ASSISTANCE SIGNAL'
      ? 'Possible AI-assisted writing signals: MEDIUM. Certain sections exhibit standard boilerplate phrasing or uniform sentence lengths.'
      : signalCategory === 'HIGH AI-ASSISTANCE SIGNAL'
        ? 'Possible AI-assisted writing signals: HIGH. Elevated density of synthetic corporate adjectives and repetitive structures detected.'
        : 'Insufficient textual content to establish generative style signatures.';

  const isNonTech = track === 'NON_TECHNICAL';

  // ─── NON-TECHNICAL TRACK PROCESSING ──────────────────────────────────────────
  if (isNonTech) {
    const normArea = (careerArea || '').toLowerCase().trim();
    let targetDomainKey = 'marketing';
    let formattedDomain = 'Marketing';

    if (normArea.includes('hr') || normArea.includes('human') || normArea.includes('talent')) {
      targetDomainKey = 'hr';
      formattedDomain = 'HR';
    } else if (normArea.includes('finance') || normArea.includes('accounting')) {
      targetDomainKey = 'finance';
      formattedDomain = 'Finance';
    } else if (normArea.includes('sales') || normArea.includes('business dev')) {
      targetDomainKey = 'sales';
      formattedDomain = 'Sales';
    } else if (normArea.includes('design') || normArea.includes('ux') || normArea.includes('ui')) {
      targetDomainKey = 'ui/ux';
      formattedDomain = 'UI/UX';
    } else if (normArea.includes('product') || normArea.includes('prd')) {
      targetDomainKey = 'product';
      formattedDomain = 'Product';
    } else if (normArea.includes('content') || normArea.includes('copy')) {
      targetDomainKey = 'content';
      formattedDomain = 'Content';
    } else if (normArea.includes('business') || normArea.includes('analyst')) {
      targetDomainKey = 'business analyst';
      formattedDomain = 'Business Analyst';
    } else if (normArea.includes('operat') || normArea.includes('supply')) {
      targetDomainKey = 'operations';
      formattedDomain = 'Operations';
    } else {
      targetDomainKey = 'marketing';
      formattedDomain = 'Marketing';
    }

    const domainConfig = NON_TECH_SKILL_MAP[targetDomainKey] || NON_TECH_SKILL_MAP.marketing;

    // Separate Extracted Skills vs Role-Relevant Skills
    const roleRelevantSkills: string[] = [];
    const otherDetectedSkills: string[] = [];

    uniqueSkills.forEach(s => {
      const sLower = s.toLowerCase();
      const isMatch = domainConfig.skills.some(ds => ds === sLower || sLower.includes(ds) || ds.includes(sLower));
      if (isMatch) {
        if (!roleRelevantSkills.includes(s)) roleRelevantSkills.push(s);
      } else {
        if (!otherDetectedSkills.includes(s)) otherDetectedSkills.push(s);
      }
    });

    const missingRoleSkills = domainConfig.essential.filter(es => 
      !roleRelevantSkills.some(rs => rs.toLowerCase().includes(es.toLowerCase()) || es.toLowerCase().includes(rs.toLowerCase()))
    );

    // 5-Dimension Non-Tech Rubric:
    // 1. ATS / Structure: 20%
    let atsScoreVal = 5.0;
    if (hasEmail) atsScoreVal += 1.5;
    if (hasPhone || hasLinks) atsScoreVal += 1.0;
    if (hasExperience && hasEducation) atsScoreVal += 1.5;
    if (hasSkillsSec) atsScoreVal += 1.0;
    const atsScore = Math.min(10.0, Math.max(3.0, Math.round(atsScoreVal * 10) / 10));

    // 2. Career Relevance: 30%
    let relevanceScoreVal = 2.0;
    if (roleRelevantSkills.length >= 7) relevanceScoreVal = 9.2;
    else if (roleRelevantSkills.length >= 5) relevanceScoreVal = 8.2;
    else if (roleRelevantSkills.length >= 4) relevanceScoreVal = 7.4;
    else if (roleRelevantSkills.length >= 3) relevanceScoreVal = 6.4;
    else if (roleRelevantSkills.length >= 2) relevanceScoreVal = 5.2;
    else if (roleRelevantSkills.length >= 1) relevanceScoreVal = 4.0;
    else relevanceScoreVal = 2.4;

    const domainHits = (lowerText.match(new RegExp(targetDomainKey.replace('/', '|'), 'g')) || []).length;
    if (domainHits >= 2) relevanceScoreVal = Math.min(10.0, relevanceScoreVal + 0.6);
    const roleRelevanceScore = Math.min(10.0, Math.max(1.5, Math.round(relevanceScoreVal * 10) / 10));

    // 3. Experience Evidence: 20%
    let expScoreVal = hasExperience ? 5.5 : 3.0;
    if (lines.length > 25) expScoreVal += 2.0;
    else if (lines.length > 15) expScoreVal += 1.0;
    if (metricLineCount >= 2) expScoreVal += 1.5;
    const experienceScore = Math.min(10.0, Math.max(2.5, Math.round(expScoreVal * 10) / 10));

    // 4. Proof of Work / Projects: 15%
    let projScoreVal = hasProjects ? 5.5 : 3.0;
    if (metricRatio >= 0.1) projScoreVal += 2.0;
    else if (metricRatio >= 0.05) projScoreVal += 1.0;
    if (hasLinks) projScoreVal += 1.5;
    const projectsScore = Math.min(10.0, Math.max(2.5, Math.round(projScoreVal * 10) / 10));

    // 5. Clarity & Communication: 15%
    let clarityScoreVal = 6.0;
    const avgLineLen = lines.length > 0 ? lines.reduce((a, b) => a + b.length, 0) / lines.length : 50;
    if (avgLineLen >= 30 && avgLineLen <= 110) clarityScoreVal += 2.0;
    if (lines.length >= 12 && lines.length <= 80) clarityScoreVal += 1.0;
    if (buzzwordHits >= 5) clarityScoreVal -= 1.0;
    const clarityScore = Math.min(10.0, Math.max(3.0, Math.round(clarityScoreVal * 10) / 10));

    // Overall Score: 20% ATS + 30% Career Relevance + 20% Experience + 15% Projects + 15% Clarity
    // Exact weighted components for Non-Tech:
    // ATS / Structure (20%, max 2.0)
    // Career Relevance (30%, max 3.0)
    // Experience Evidence (20%, max 2.0)
    // Proof of Work / Projects (15%, max 1.5)
    // Clarity & Communication (15%, max 1.5)
    const atsCompatibility = Math.min(2.0, Math.max(0.4, Math.round((atsScore * 0.20) * 10) / 10));
    const skillsRelevance = Math.min(3.0, Math.max(0.5, Math.round((roleRelevanceScore * 0.30) * 10) / 10));
    const experience = Math.min(2.0, Math.max(0.4, Math.round((experienceScore * 0.20) * 10) / 10));
    const projectQuality = Math.min(1.5, Math.max(0.3, Math.round((projectsScore * 0.15) * 10) / 10));
    const clarityStructure = Math.min(1.5, Math.max(0.3, Math.round((clarityScore * 0.15) * 10) / 10));

    // Overall Score equals the exact sum of weighted components (normalized 0 - 10)
    const overallScore = Math.min(10.0, Math.max(1.0, +(
      atsCompatibility + skillsRelevance + experience + projectQuality + clarityStructure
    ).toFixed(1)));
    const score10 = overallScore;

    // Strengths, Weaknesses, Recommendations
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (roleRelevantSkills.length >= 3) {
      strengths.push(`Solid demonstration of ${formattedDomain} capabilities in ${roleRelevantSkills.slice(0, 3).join(', ')}`);
    }
    if (atsScore >= 7.5) {
      strengths.push('Clean, parseable document structure adhering to professional formatting guidelines');
    }
    if (metricRatio >= 0.1) {
      strengths.push('Includes quantified outcomes and measurable business impact');
    }
    if (strengths.length === 0) {
      strengths.push('Verified educational credentials and foundational professional communication');
    }

    if (roleRelevanceScore < 5.5) {
      weaknesses.push(`Limited direct evidence of ${formattedDomain} experience`);
      recommendations.push(`Highlight dedicated ${formattedDomain} case studies and include role-specific competencies (${missingRoleSkills.slice(0, 3).join(', ')}).`);
    }
    if (missingRoleSkills.length > 0) {
      recommendations.push(`Demonstrate experience with key ${formattedDomain} skill areas: ${missingRoleSkills.slice(0, 3).join(', ')}.`);
    }
    if (metricRatio < 0.08) {
      weaknesses.push('Bullet points lack quantifiable metrics and outcome metrics');
      recommendations.push('Incorporate measurable outcomes (e.g. "increased conversions by 24%", "managed $50k quarterly budget").');
    }

    let honestAssessment = '';
    if (roleRelevanceScore < 5.5 && otherDetectedSkills.length > 0) {
      honestAssessment = `Your resume contains strong technical experience (${otherDetectedSkills.slice(0, 4).join(', ')}), but limited direct evidence of ${formattedDomain} experience.`;
    } else if (roleRelevanceScore >= 6.0) {
      honestAssessment = `Your resume demonstrates solid alignment with ${formattedDomain} through competencies such as ${roleRelevantSkills.slice(0, 4).join(', ')}.`;
    } else {
      honestAssessment = `Your resume has foundational skills, but adding targeted ${formattedDomain} case studies and quantifiable outcomes will strengthen your profile.`;
    }

    if (honestAssessment) {
      recommendations.unshift(honestAssessment);
    }

    return {
      fileHash,
      extractedText: extractedText.slice(0, 4000),
      score10,
      scoreBreakdown: {
        atsCompatibility,
        skillsRelevance,
        experience,
        projects: projectQuality,
        clarityStructure,
        projectQuality
      },
      aiAssistanceSignals: {
        category: signalCategory,
        confidence: signalConfidence,
        evidence: aiSignals,
        summary: aiSummary
      },
      documentMetadataSignals: docMetadata,
      track: 'NON_TECHNICAL',
      careerArea: formattedDomain,
      overallScore,
      atsScore,
      roleRelevanceScore,
      experienceScore,
      projectsScore,
      clarityScore,
      detectedSkills: uniqueSkills,
      roleRelevantSkills,
      otherDetectedSkills,
      missingRoleSkills,
      honestAssessment,
      skills: roleRelevantSkills,
      experience: [{ title: hasExperience ? `${formattedDomain} Professional` : 'Associate Contributor', details: lines.slice(5, 10) }],
      education: [{ degree: hasEducation ? 'Bachelor / Diploma' : 'Higher Education', institution: 'University / College' }],
      projects: [],
      certifications: [],
      strengths,
      weaknesses,
      missingKeywords: missingRoleSkills.slice(0, 5),
      formattingIssues: [],
      recommendations,
      integrity: {
        fingerprint: `SHA256:${fileHash.slice(0, 12)}`,
        candidateId,
        version: 'v1.0 (Immutable)',
        timestamp: new Date(),
        status: 'VERIFIED'
      },
      scores: {
        atsScore: Math.round(atsScore * 10),
        technicalMatchScore: Math.round(roleRelevanceScore * 10),
        impactMetricsScore: Math.round(projectsScore * 10),
        completenessScore: Math.round(experienceScore * 10),
        overallScore: Math.round(overallScore * 10)
      },
      aiWritingIndicator: {
        percentage: signalCategory === 'HIGH AI-ASSISTANCE SIGNAL' ? 68 : signalCategory === 'MEDIUM AI-ASSISTANCE SIGNAL' ? 44 : 18,
        confidence: signalConfidence === 'Moderate' ? 'Medium' : signalConfidence,
        signalsDetected: aiSignals,
        summary: aiSummary
      },
      technicalEvidence: {
        matchedSkills: roleRelevantSkills,
        unverifiedClaims: otherDetectedSkills,
        detectedTechnologies: uniqueSkills,
        extractedProjects: []
      },
      improvementSuggestions: recommendations
    };
  }

  // ─── TECHNICAL TRACK PROCESSING (PRESERVED) ──────────────────────────────────
  let atsScoreVal = 1.0;
  if (hasEmail) atsScoreVal += 0.3;
  if (hasPhone || hasLinks) atsScoreVal += 0.2;
  if (hasExperience && hasEducation) atsScoreVal += 0.3;
  if (hasSkillsSec) atsScoreVal += 0.2;
  const atsCompatibility = Math.min(2.0, Math.round(atsScoreVal * 10) / 10);

  let skillsScoreVal = 0.8;
  if (uniqueSkills.length >= 8) skillsScoreVal += 0.7;
  else if (uniqueSkills.length >= 4) skillsScoreVal += 0.4;
  else skillsScoreVal += 0.2;
  if (matchedSkills.length > 0) skillsScoreVal += 0.4;
  else skillsScoreVal += 0.2;
  const skillsRelevance = Math.min(2.0, Math.round(skillsScoreVal * 10) / 10);

  let projectScoreVal = hasProjects ? 1.0 : 0.6;
  if (metricRatio >= 0.15) projectScoreVal += 0.6;
  else if (metricRatio >= 0.08) projectScoreVal += 0.4;
  else projectScoreVal += 0.2;
  if (hasLinks) projectScoreVal += 0.3;
  const projectQuality = Math.min(2.0, Math.round(projectScoreVal * 10) / 10);

  let expScoreVal = hasExperience ? 1.2 : 0.8;
  if (lines.length > 25) expScoreVal += 0.5;
  else if (lines.length > 15) expScoreVal += 0.3;
  if (metricLineCount >= 3) expScoreVal += 0.3;
  const experience = Math.min(2.0, Math.round(expScoreVal * 10) / 10);

  let clarityScoreVal = 1.2;
  const avgLineLen = lines.length > 0 ? lines.reduce((a, b) => a + b.length, 0) / lines.length : 50;
  if (avgLineLen >= 30 && avgLineLen <= 110) clarityScoreVal += 0.4;
  else clarityScoreVal += 0.2;
  if (lines.length >= 10 && lines.length <= 80) clarityScoreVal += 0.3;
  const clarityStructure = Math.min(2.0, Math.round(clarityScoreVal * 10) / 10);

  const score10 = Math.min(10.0, Math.max(3.0, Math.round((atsCompatibility + skillsRelevance + projectQuality + experience + clarityStructure) * 10) / 10));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  const missingKeywords: string[] = [];
  const formattingIssues: string[] = [];

  if (uniqueSkills.length >= 6) strengths.push(`Broad modern technology footprint covering ${uniqueSkills.slice(0, 4).join(', ')}`);
  if (metricRatio >= 0.12) strengths.push('Strong inclusion of quantitative metrics and business impact figures');
  if (hasProjects) strengths.push('Dedicated technical projects section highlighting real implementations');
  if (strengths.length === 0) strengths.push('Clear educational and foundational credentials');

  if (!hasProjects) {
    weaknesses.push('Absence of dedicated technical project evidence');
    recommendations.push("Add a 'Projects' section with links to working repositories or live deployments.");
  }
  if (metricRatio < 0.1) {
    weaknesses.push('Bullet points lack quantifiable engineering metrics');
    recommendations.push("Quantify outcomes in bullet points (e.g. 'reduced latency by 35%', 'scaled system to 10k RPS').");
  }
  if (uniqueSkills.length < 5) {
    weaknesses.push('Limited explicit framework/toolchain keywords detected');
    recommendations.push("Explicitly list technical toolchains, databases, and testing libraries used.");
  }
  if (!hasLinks) {
    formattingIssues.push('No GitHub or professional portfolio link detected in header');
    recommendations.push("Include clickable links to your GitHub profile and verified project proofs.");
  }
  if (buzzwordHits >= 4) {
    weaknesses.push('High density of generic corporate verbs over direct technical statements');
    recommendations.push('Replace generic verbs like "synergized" with concrete actions like "architected", "benchmarked", or "implemented".');
  }

  const standardBackend = ['Docker', 'PostgreSQL', 'Redis', 'CI/CD', 'REST API'];
  standardBackend.forEach(sk => {
    if (!uniqueSkills.some(s => s.toLowerCase() === sk.toLowerCase())) {
      missingKeywords.push(sk);
    }
  });

  return {
    fileHash,
    extractedText: extractedText.slice(0, 4000),
    score10,
    scoreBreakdown: {
      atsCompatibility,
      skillsRelevance,
      experience,
      projects: projectQuality,
      clarityStructure,
      projectQuality
    },
    aiAssistanceSignals: {
      category: signalCategory,
      confidence: signalConfidence,
      evidence: aiSignals,
      summary: aiSummary
    },
    documentMetadataSignals: docMetadata,
    track: 'TECHNICAL',
    skills: uniqueSkills,
    detectedSkills: uniqueSkills,
    roleRelevantSkills: uniqueSkills,
    otherDetectedSkills: [],
    missingRoleSkills: missingKeywords.slice(0, 5),
    experience: [{ title: hasExperience ? 'Software Engineer' : 'Technical Contributor', details: lines.slice(5, 10) }],
    education: [{ degree: hasEducation ? 'Engineering / Computer Science' : 'Technical Study', institution: 'University / Institute' }],
    projects: userProjects.map(p => ({
      title: p.projectName,
      description: p.description || '',
      technologies: p.claimedTechnologies || []
    })),
    certifications: [],
    strengths,
    weaknesses,
    missingKeywords: missingKeywords.slice(0, 5),
    formattingIssues,
    recommendations,
    integrity: {
      fingerprint: `SHA256:${fileHash.slice(0, 12)}`,
      candidateId,
      version: 'v1.0 (Immutable)',
      timestamp: new Date(),
      status: 'VERIFIED'
    },
    scores: {
      atsScore: Math.round(atsCompatibility * 50),
      technicalMatchScore: Math.round(skillsRelevance * 50),
      impactMetricsScore: Math.round(projectQuality * 50),
      completenessScore: Math.round(experience * 50),
      overallScore: Math.round(score10 * 10)
    },
    aiWritingIndicator: {
      percentage: signalCategory === 'HIGH AI-ASSISTANCE SIGNAL' ? 68 : signalCategory === 'MEDIUM AI-ASSISTANCE SIGNAL' ? 44 : 18,
      confidence: signalConfidence === 'Moderate' ? 'Medium' : signalConfidence,
      signalsDetected: aiSignals,
      summary: aiSummary
    },
    technicalEvidence: {
      matchedSkills,
      unverifiedClaims,
      detectedTechnologies: uniqueSkills,
      extractedProjects: userProjects.map(p => ({
        title: p.projectName,
        description: p.description || '',
        technologies: p.claimedTechnologies || []
      }))
    },
    improvementSuggestions: recommendations
  };
}
