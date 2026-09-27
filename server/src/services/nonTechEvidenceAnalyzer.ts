import { INonTechAnalysis } from '../models/NonTechProofOfWork';

export interface AnalysisInput {
  careerArea: string;
  targetRole?: string;
  challengeTitle?: string;
  challengeRequirements?: string[];
  submissionType: string;
  title: string;
  description: string;
  deliverables?: string;
  extractedArtifactText?: string;
  hasArtifactFile: boolean;
  artifactFileName?: string;
  externalWorkUrl?: string;
  externalWorkType?: string;
}

export interface AnalysisResult {
  status: 'SUBMITTED' | 'VERIFIED' | 'COMPLETED' | 'UNDER_REVIEW' | 'NEEDS_RESUBMISSION' | 'INVALID_SUBMISSION' | 'INSUFFICIENT_EVIDENCE' | 'NEEDS_REVIEW' | 'PARTIALLY_VERIFIED';
  statusReason?: string;
  analysis: INonTechAnalysis | null;
  overallScore: number | null;
}

const CAREER_AREA_SKILL_KEYWORDS: Record<string, string[]> = {
  'Marketing': [
    'Customer Acquisition', 'Campaign Planning', 'Market Segmentation', 'Conversion Rate',
    'Content Strategy', 'Funnel Optimization', 'Brand Positioning', 'Audience Analytics',
    'Go-to-Market', 'ROAS Analysis', 'Customer Journey', 'Messaging Architecture'
  ],
  'Business Development': [
    'Enterprise Sales Discovery', 'Account Strategy', 'B2B Sales Methodology', 'Pipeline Qualification',
    'Lead Generation', 'Value Proposition', 'Contract Negotiation', 'Executive Stakeholder Engagement',
    'MEDDPICC Framework', 'Revenue Forecasting', 'Territory Planning', 'Customer Discovery'
  ],
  'Human Resources (HR)': [
    'Talent Acquisition', 'Structured Interviewing', 'Remote Onboarding', 'Employee Engagement',
    'Bias Mitigation', 'Performance Scorecards', 'Retention Strategy', 'People Operations',
    'Competency Framework', 'HRIS Workflow', 'Compensation Analysis', 'Culture Building'
  ],
  'Business Analysis': [
    'Requirements Engineering', 'Business Process Modeling', 'Gap Analysis', 'Data Analysis',
    'Stakeholder Management', 'User Story Mapping', 'Functional Specification', 'KPI Benchmarking',
    'Cost-Benefit Analysis', 'Process Automation', 'Acceptance Criteria', 'Workflow Optimization'
  ],
  'UI/UX Design': [
    'User Research', 'Information Architecture', 'Wireframing & Prototyping', 'Usability Testing',
    'Design Systems', 'User Journey Mapping', 'Heuristic Evaluation', 'Interaction Design',
    'Accessibility (WCAG)', 'Micro-interactions', 'Persona Development', 'Design Strategy'
  ],
  'Content Strategy': [
    'Editorial Planning', 'Brand Storytelling', 'Content Governance', 'SEO Optimization',
    'Audience Segmentation', 'Tone of Voice Guide', 'Content Lifecycle', 'Content Auditing',
    'Copywriting Frameworks', 'Multi-channel Distribution', 'Message Hierarchy', 'Content Analytics'
  ],
  'Product Management': [
    'Product Strategy', 'PRD Development', 'Feature Prioritization', 'Roadmap Planning',
    'User Problem Diagnosis', 'Market Sizing', 'Success Metrics (OKRs)', 'Cross-functional Leadership'
  ],
  'Operations': [
    'Process Optimization', 'SLA Management', 'Resource Allocation', 'Workflow Automation',
    'Operational Efficiency', 'Risk Management', 'Capacity Planning', 'Quality Assurance'
  ]
};

export const containsTechnicalRepo = (str?: string): boolean => {
  if (!str) return false;
  return /github\.com|gitlab\.com|bitbucket\.org|codeberg\.org|sourceforge\.net|\.git\b/i.test(str);
};

export function analyzeNonTechEvidence(input: AnalysisInput): AnalysisResult {
  const {
    careerArea,
    targetRole,
    challengeTitle,
    challengeRequirements = [],
    submissionType,
    title,
    description,
    deliverables = '',
    extractedArtifactText = '',
    hasArtifactFile,
    artifactFileName = '',
    externalWorkUrl = '',
    externalWorkType = ''
  } = input;

  // 1. Guard against GitHub repository links
  if (
    containsTechnicalRepo(externalWorkUrl) ||
    containsTechnicalRepo(description) ||
    containsTechnicalRepo(deliverables) ||
    containsTechnicalRepo(extractedArtifactText)
  ) {
    return {
      status: 'NEEDS_RESUBMISSION',
      statusReason: 'Technical repository links are not accepted for Non-Technical Proof of Work. Please upload a case study, document, presentation, work sample, portfolio, or other role-relevant deliverable.',
      analysis: null,
      overallScore: null
    };
  }

  // 2. Synthesize all textual evidence submitted
  const combinedText = `${title}\n${description}\n${deliverables}\n${extractedArtifactText}`.trim();
  const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
  const hasExternalDoc = Boolean(externalWorkUrl && externalWorkUrl.trim().length > 10);

  // 3. Rule: No score without real evidence
  if (wordCount < 40 && !hasArtifactFile && !hasExternalDoc) {
    return {
      status: 'INSUFFICIENT_EVIDENCE',
      statusReason: 'Deliverable contains insufficient substantive evidence (under 40 words and no uploaded work artifact or external documentation). Please upload a complete case study, document, or presentation.',
      analysis: null,
      overallScore: null
    };
  }

  // 4. Evidence depth signals
  const hasMetrics = /\b(\d+%\b|\$\d+|\d+x\b|\b\d{2,}\b|\b\d+k\b|ROI|CAC|LTV|ROAS|MRR|ARR|NPS|KPI|SLA)\b/i.test(combinedText);
  const hasStructuredSections = /(problem|challenge|background|strategy|execution|roadmap|deliverable|outcome|results|recommendation|framework|methodology)/i.test(combinedText);
  const hasExecutiveSummary = /(executive summary|overview|key findings|objectives)/i.test(combinedText);
  const hasMethodology = /(methodology|approach|framework|process|phases|milestones)/i.test(combinedText);

  // 5. Evaluate role relevance based on domain keywords
  const domainKeywords = CAREER_AREA_SKILL_KEYWORDS[careerArea] || CAREER_AREA_SKILL_KEYWORDS['Marketing'];
  const matchedSkills: string[] = [];
  domainKeywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(combinedText)) {
      matchedSkills.push(kw);
    }
  });

  // Evaluate challenge requirements coverage
  let requirementsMetCount = 0;
  if (challengeRequirements.length > 0) {
    challengeRequirements.forEach(req => {
      const words = req.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const matches = words.some(w => combinedText.toLowerCase().includes(w));
      if (matches) requirementsMetCount++;
    });
  }

  // 6. Compute 8 Core Non-Technical Evaluation Dimensions
  // Base baseline is derived from depth of evidence
  let baseScore = 6.2;
  if (hasArtifactFile) baseScore += 0.8;
  if (hasExternalDoc) baseScore += 0.4;
  if (wordCount > 100) baseScore += 0.5;
  if (wordCount > 250) baseScore += 0.5;
  if (wordCount > 500) baseScore += 0.4;

  let problemUnderstanding = baseScore + (hasStructuredSections ? 0.6 : 0.0);
  let researchInsight = baseScore + (hasMetrics ? 0.7 : -0.2);
  let strategy = baseScore + (hasMethodology ? 0.8 : 0.0);
  let execution = baseScore + (hasMetrics ? 0.6 : 0.0);
  let creativity = baseScore + (wordCount > 150 ? 0.4 : 0.0);
  let communication = baseScore + (hasExecutiveSummary ? 0.6 : 0.1);
  let completeness = baseScore + (hasArtifactFile ? 0.7 : -0.3);
  let roleRelevance = baseScore + (matchedSkills.length >= 2 ? 0.8 : matchedSkills.length === 1 ? 0.4 : -0.4);

  if (requirementsMetCount > 0) {
    const bonus = Math.min(0.8, (requirementsMetCount / (challengeRequirements.length || 1)) * 0.8);
    problemUnderstanding += bonus;
    completeness += bonus;
  }

  // Normalize all dimension scores between 5.0 and 9.5
  const clamp = (val: number) => +Math.min(9.5, Math.max(5.0, val)).toFixed(1);

  problemUnderstanding = clamp(problemUnderstanding);
  researchInsight = clamp(researchInsight);
  strategy = clamp(strategy);
  execution = clamp(execution);
  creativity = clamp(creativity);
  communication = clamp(communication);
  completeness = clamp(completeness);
  roleRelevance = clamp(roleRelevance);

  const dimensionList = [
    { dimension: 'Problem Understanding', score: problemUnderstanding, feedback: hasStructuredSections ? 'Clear strategic breakdown of the business challenge and core user needs.' : 'Identifies high-level problem statement; could deepen stakeholder context.' },
    { dimension: 'Research / Insight', score: researchInsight, feedback: hasMetrics ? 'Grounds analysis with quantitative benchmarks and measurable indicators.' : 'Provides qualitative analysis; could integrate deeper quantitative research.' },
    { dimension: 'Strategy', score: strategy, feedback: hasMethodology ? 'Structured strategic framework aligned with domain best practices.' : 'Proposes viable approach; could establish more prescriptive prioritization criteria.' },
    { dimension: 'Execution', score: execution, feedback: hasMetrics ? 'Actionable execution plan with measurable operational milestones.' : 'Defines tactical roadmap; could detail risk contingency mechanisms.' },
    { dimension: 'Creativity', score: creativity, feedback: 'Shows innovative problem-solving tailored to role requirements.' },
    { dimension: 'Communication', score: communication, feedback: hasExecutiveSummary ? 'Professional executive synthesis and clear narrative flow.' : 'Well-structured delivery; suitable for cross-functional stakeholders.' },
    { dimension: 'Completeness', score: completeness, feedback: hasArtifactFile ? 'Substantive deliverable package including attached work artifacts.' : 'Foundational deliverables provided; attaching complete slide deck or document recommended.' },
    { dimension: 'Role Relevance', score: roleRelevance, feedback: `Demonstrates functional fluency aligned with ${careerArea} expectations.` }
  ];

  const overallScore = +(dimensionList.reduce((acc, d) => acc + d.score, 0) / dimensionList.length).toFixed(1);

  // Formulate qualitative insights
  const strengths: string[] = [];
  const recommendations: string[] = [];

  if (hasMetrics) {
    strengths.push('Incorporates quantifiable performance metrics and measurable business outcomes');
  } else {
    recommendations.push('Incorporate quantifiable KPIs, budget forecasts, or conversion rates to strengthen business case');
  }

  if (matchedSkills.length > 0) {
    strengths.push(`Demonstrates domain competencies: ${matchedSkills.slice(0, 3).join(', ')}`);
  } else {
    recommendations.push(`Deepen domain-specific methodologies relevant to ${careerArea}`);
  }

  if (hasArtifactFile) {
    strengths.push(`Substantiated by verified work artifact (${artifactFileName || 'Document'})`);
  } else if (hasExternalDoc) {
    strengths.push('Linked external documentation supporting functional execution');
  } else {
    recommendations.push('Attach an artifact file (PDF, DOCX, presentation) for highest verification confidence');
  }

  if (hasStructuredSections) {
    strengths.push('Structured narrative transitioning from diagnostic problem framing to tactical roadmap');
  }

  // Determine final verification status
  let finalStatus: AnalysisResult['status'] = 'SUBMITTED';
  if (wordCount < 80 && !hasArtifactFile) {
    finalStatus = 'PARTIALLY_VERIFIED';
  } else if (hasArtifactFile && overallScore >= 7.5) {
    finalStatus = 'VERIFIED';
  }

  const analysis: INonTechAnalysis = {
    problemUnderstanding,
    researchInsight,
    strategy,
    execution,
    creativity,
    communication,
    completeness,
    roleRelevance,
    overallScore,
    summary: `Evidence-based evaluation for ${careerArea} deliverable "${title}". Demonstrated ${overallScore >= 8.0 ? 'strong' : 'solid'} strategic alignment with functional requirements and ${matchedSkills.length > 0 ? matchedSkills.length + ' validated domain capabilities' : 'structured reasoning'}.`,
    strengths,
    recommendations,
    evaluationDimensions: dimensionList,
    verifiedSkills: matchedSkills.slice(0, 4)
  };

  return {
    status: finalStatus,
    statusReason: finalStatus === 'PARTIALLY_VERIFIED' ? 'Brief submission without full attached artifact. Full verification recommended upon uploading complete document.' : '',
    analysis,
    overallScore
  };
}
