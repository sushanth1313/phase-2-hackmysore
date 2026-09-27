import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Brain, Code2, Keyboard, Timer, ShieldCheck, 
  Link2, Activity, Send, Loader2, CheckCircle2, Award, 
  AlertCircle, RotateCcw, ChevronRight, Check, AlertTriangle, FileText, Target, Cpu
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface TurnEvaluation {
  status?: 'VALID' | 'PARTIAL' | 'INSUFFICIENT' | 'IRRELEVANT';
  score: number;
  relevance?: number | string;
  technical_accuracy?: number;
  technicalAccuracy?: number;
  problem_solving?: number;
  problemSolving?: number;
  communication?: number;
  depth?: number;
  evidenceGrounding?: number;
  evidence?: string[];
  domainKeywords?: string[];
  feedback?: string;
  next_question_reason?: string;
  missingConcepts?: string[];
  recommendation?: string;
  reasoning?: string;
  strengths?: string[];
  weaknesses?: string[];
}

interface Turn {
  questionId: string;
  question: string;
  questionContext?: string;
  answer?: string;
  evaluation?: TurnEvaluation;
  answeredAt?: string;
}

interface DimensionAssessment {
  score: number;
  evidence: string;
  explanation: string;
}

interface FinalReport {
  overallScore: number;
  status?: string;
  technicalKnowledge?: DimensionAssessment;
  problemSolving?: DimensionAssessment;
  communication?: DimensionAssessment;
  architecture?: DimensionAssessment;
  depth?: DimensionAssessment;
  evidenceGrounding?: DimensionAssessment;
  strengths?: string[];
  weaknesses?: string[];
  unansweredQuestions?: string[];
  recommendedTopics?: string[];
  summary: string;
  generatedAt?: string;
}

interface InterviewSessionData {
  _id: string;
  language: string;
  domain: string;
  focus: string;
  targetLevel: string;
  detectedSkills: string[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  turns: Turn[];
  finalReport?: FinalReport;
  startedAt: string;
}

const INTERVIEW_DOMAINS = [
  'Data Structures & Algorithms',
  'Backend Engineering',
  'Full Stack',
  'System Design',
  'Database Systems',
  'Distributed Systems',
  'Software Engineering'
];

const NON_TECH_DOMAINS = [
  'Marketing & Growth Strategy',
  'Human Resources & Talent Management',
  'Business Analysis & Strategy',
  'UI/UX Design & User Research',
  'Product Management & Roadmapping',
  'Content Strategy & Copywriting',
  'Sales Operations & Business Development'
];

const CODING_LANGUAGES = ['C++', 'Python', 'Go', 'Java'];

export default function AIInterview() {
  const { user } = useAuth();
  const isNonTech = user?.track === 'NON_TECHNICAL';

  const [session, setSession] = useState<InterviewSessionData | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Setup configuration state
  const [selectedLanguage, setSelectedLanguage] = useState('C++');
  const [selectedDomain, setSelectedDomain] = useState(
    isNonTech ? 'Marketing & Growth Strategy' : 'Data Structures & Algorithms'
  );
  const [targetLevel, setTargetLevel] = useState(isNonTech ? 'Senior' : 'Senior (L5)');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    let interval: any;
    if (hasStarted && session?.status === 'IN_PROGRESS') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted, session?.status]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.turns, submitting]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    try {
      setLoading(true);
      setError('');
      const payload = {
        language: isNonTech ? 'Functional Strategy' : selectedLanguage,
        domain: selectedDomain,
        focus: selectedDomain,
        targetLevel
      };

      const res = await api.post('/interview/start', payload);

      if (res.data?.success) {
        setSession(res.data.data);
        setHasStarted(true);
        setElapsedSeconds(0);
      } else {
        setError(res.data?.message || 'Failed to start interview session');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'AI Interview Service is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async () => {
    const answer = inputText.trim();
    if (!answer) {
      setError('Answer cannot be empty. Please enter your technical reasoning.');
      return;
    }
    if (!session || submitting) return;

    setInputText('');
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`/interview/${session._id}/respond`, { answer });
      if (res.data?.success) {
        setSession(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to evaluate answer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Evaluation service encountered an error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendResponse();
    }
  };

  const initials = user?.firstName 
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
    : 'ME';

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'INSUFFICIENT':
        return { text: 'INSUFFICIENT', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'IRRELEVANT':
        return { text: 'IRRELEVANT', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'PARTIAL':
        return { text: 'PARTIAL', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'VALID':
        return { text: 'VALID', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { text: 'EVALUATED', color: 'bg-slate-500/10 text-slate-500 border-slate-500/30' };
    }
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500">
      
      {!hasStarted ? (
        // SETUP SCREEN
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-2xl relative">
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {isNonTech ? 'AI ROLE & CASE INTERVIEW' : 'AI TECHNICAL INTERVIEW'}
                </h1>
                <p className="text-slate-500 text-sm">
                  {isNonTech
                    ? 'Scenario-based business and operational assessment evaluating your strategic reasoning and communication.'
                    : 'Adaptive technical and architectural assessment evaluating your live technical answers.'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6 mb-8">
              
              {/* Primary Coding Language Selector (Hidden for Non-Tech) */}
              {!isNonTech && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                    Primary Coding Language
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {CODING_LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLanguage(lang)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          selectedLanguage === lang
                            ? 'bg-brand-500/20 border-brand-500 text-slate-900 shadow-lg'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        <div className="font-bold text-slate-900 mb-0.5">{lang}</div>
                        <div className="text-[10px] text-brand-400 font-mono">
                          {lang === 'C++' ? 'PRIMARY' : 'SUPPORTED'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus Domain Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                  {isNonTech ? 'Career Area & Focus Topic' : 'Technical Domain (Select Focus Area)'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(isNonTech ? NON_TECH_DOMAINS : INTERVIEW_DOMAINS).map(dom => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => setSelectedDomain(dom)}
                      className={`p-3 rounded-xl border text-xs text-left transition-all ${
                        selectedDomain === dom
                          ? 'border-brand-500 bg-brand-500/10 text-brand-700 font-bold shadow-md'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:border-slate-200'
                      }`}
                    >
                      {dom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Level */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                  {isNonTech ? 'Target Career Level' : 'Target Engineering Level'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(isNonTech 
                    ? ['Associate / Mid', 'Senior', 'Lead / Director']
                    : ['Mid-Level (L4)', 'Senior (L5)', 'Staff / Architect (L6)']
                  ).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTargetLevel(lvl)}
                      className={`p-2.5 rounded-lg border text-xs text-center transition-all ${
                        targetLevel === lvl
                          ? 'border-brand-500 bg-brand-500/10 text-brand-700 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-600'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl text-xs text-slate-500 leading-relaxed font-mono">
                <span className="text-brand-400 font-bold block mb-0.5">Evaluation Rubric Guarantee:</span>
                {isNonTech
                  ? 'Your interview is evaluated solely on your live strategic responses, problem decomposition, methodology, and business impact. Evasive or off-topic answers receive 0. Resume and project scores are not mixed in.'
                  : `Your interview is evaluated solely on your live responses, correctness, depth, and reasoning in ${selectedLanguage}. Evasive or irrelevant answers receive 0. Resume and project scores are not mixed in.`}
              </div>
            </div>

            <button 
              onClick={handleStartInterview}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-base bg-brand-600 hover:bg-brand-500 text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              {loading ? 'Initializing Adaptive Interview...' : (isNonTech ? `Start ${selectedDomain} Interview` : `Start ${selectedLanguage} Technical Interview`)}
            </button>
          </div>
        </div>
      ) : (
        // ACTIVE INTERVIEW UI
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* CENTER: CONVERSATION */}
          <div className="lg:col-span-8 flex flex-col border-r border-slate-200 bg-slate-50">
            
            {/* Header Bar */}
            <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${session?.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
                <span className="text-sm font-bold text-slate-900 tracking-wider font-mono">
                  {session?.status === 'COMPLETED' ? 'COMPLETED' : formatTime(elapsedSeconds)}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  • Turn {session?.turns?.length || 1} of 3
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {isNonTech ? `${session?.domain || selectedDomain} • Strategy` : `${session?.language || 'C++'} • ${session?.domain}`}
                </span>
              </div>
              <button 
                onClick={() => setHasStarted(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded bg-slate-100/80 border border-slate-200 transition-colors"
              >
                {session?.status === 'COMPLETED' ? 'Back to Setup' : 'End Session'}
              </button>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              
              {session?.turns?.map((turn, idx) => {
                const evalData = turn.evaluation;
                const statusBadge = getStatusBadge(evalData?.status);

                return (
                  <div key={idx} className="space-y-6">
                    {/* AI Question */}
                    <div className="flex gap-4 max-w-3xl">
                      <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center shrink-0">
                        <Brain className="w-5 h-5 text-brand-400" />
                      </div>
                      <div className="pt-2 space-y-2">
                        {turn.questionContext && (
                          <span className="text-[10px] font-mono text-brand-400 font-bold uppercase tracking-wider bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                            {turn.questionContext}
                          </span>
                        )}
                        <p className="text-slate-700 leading-relaxed text-base font-medium">
                          {turn.question}
                        </p>
                      </div>
                    </div>

                    {/* Candidate Answer */}
                    {turn.answer && (
                      <div className="flex gap-4 max-w-3xl ml-auto flex-row-reverse">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 font-bold text-slate-900 text-xs">
                          {initials}
                        </div>
                        <div className="pt-2 text-right">
                          <p className="text-slate-700 leading-relaxed bg-white border border-slate-200 p-4 rounded-2xl text-sm text-left whitespace-pre-wrap font-mono">
                            {turn.answer}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Structured Evaluation Output */}
                    {evalData && (
                      <div className="ml-14 p-5 rounded-xl bg-white border border-slate-200 space-y-4 max-w-2xl">
                        
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Evaluation Result</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusBadge.color}`}>
                              STATUS: {statusBadge.text}
                            </span>
                          </div>
                          <span className="text-sm font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                            {evalData.score} / 10
                          </span>
                        </div>

                        {/* 5-Dimension Rubric Breakdown (0-10) */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                          <div className="p-2 rounded bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase">Accuracy</span>
                            <span className="text-slate-900 font-bold">{evalData.technical_accuracy ?? evalData.technicalAccuracy ?? 0}/10</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase">Problem Solving</span>
                            <span className="text-slate-900 font-bold">{evalData.problem_solving ?? evalData.problemSolving ?? 0}/10</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase">Communication</span>
                            <span className="text-slate-900 font-bold">{evalData.communication ?? 0}/10</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[9px] uppercase">Depth</span>
                            <span className="text-slate-900 font-bold">{evalData.depth ?? 0}/10</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                            <span className="text-slate-500 block text-[9px] uppercase">Relevance</span>
                            <span className="text-emerald-400 font-bold">{evalData.relevance ?? 0}/10</span>
                          </div>
                        </div>

                        {/* Demonstrated Technical Evidence */}
                        {evalData.evidence && evalData.evidence.length > 0 && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-mono">
                              Demonstrated Concepts ({session?.language}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {evalData.evidence.map((kw, i) => (
                                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Direct Feedback */}
                        <p className="text-xs text-slate-600 leading-relaxed font-mono">
                          {evalData.feedback || evalData.reasoning}
                        </p>
                        
                        {/* Adaptive Next Question Reason */}
                        {evalData.next_question_reason && (
                          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 font-mono">
                            <span className="text-brand-400 font-semibold">Adaptive Follow-up Reason:</span> {evalData.next_question_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {submitting && (
                <div className="flex gap-4 max-w-3xl">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                  </div>
                  <div className="pt-3 text-slate-500 text-sm font-mono flex items-center gap-2">
                    Validating relevance, technical correctness, and depth...
                  </div>
                </div>
              )}

              {/* Final Report if Completed */}
              {session?.status === 'COMPLETED' && session.finalReport && (
                <div className={`p-6 md:p-8 bg-white border rounded-2xl space-y-6 ${
                  session.finalReport.status === 'INSUFFICIENT INTERVIEW EVIDENCE'
                    ? 'border-rose-500/40'
                    : 'border-emerald-500/30'
                }`}>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <Award className="w-6 h-6 text-brand-400" />
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Interview Technical Assessment</h3>
                        <p className="text-xs text-slate-500">Grounded exclusively in candidate responses across interview turns.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-brand-400 font-mono">
                        {session.finalReport.overallScore} <span className="text-base text-slate-500">/ 100</span>
                      </div>
                      {session.finalReport.status && (
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                          session.finalReport.status === 'INSUFFICIENT INTERVIEW EVIDENCE'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {session.finalReport.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed font-mono">
                    {session.finalReport.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Validated Competencies</div>
                      {session.finalReport.strengths && session.finalReport.strengths.length > 0 ? (
                        session.finalReport.strengths.map((str, i) => (
                          <div key={i} className="text-xs text-slate-600 flex items-start gap-2 mb-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{str}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">None demonstrated due to insufficient or uninformative answers.</span>
                      )}
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Target Growth Topics</div>
                      {(session.finalReport.recommendedTopics || session.finalReport.weaknesses || []).map((imp, i) => (
                        <div key={i} className="text-xs text-slate-600 flex items-start gap-2 mb-1">
                          <span className="text-amber-400 shrink-0">•</span>
                          <span>{imp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {session.finalReport.unansweredQuestions && session.finalReport.unansweredQuestions.length > 0 && (
                    <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/20">
                      <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                        Questions flagged as INSUFFICIENT or IRRELEVANT:
                      </div>
                      {session.finalReport.unansweredQuestions.map((q, i) => (
                        <div key={i} className="text-xs text-slate-600 flex items-start gap-2 mb-1">
                          <span className="text-rose-400 font-bold shrink-0">!</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleStartInterview}
                    className="px-5 py-2.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Start New Interview Session
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            {session?.status === 'IN_PROGRESS' && (
              <div className="p-6 bg-white border-t border-slate-200 shrink-0">
                {error && (
                  <div className="mb-3 text-rose-400 text-xs flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                <div className="max-w-3xl mx-auto flex items-end gap-3">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden focus-within:border-brand-500 transition-colors">
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={submitting}
                      placeholder={isNonTech 
                        ? 'Explain your strategic reasoning, execution methodology, metrics, and business impact...' 
                        : `Explain your ${session?.language || 'C++'} solution, algorithmic trade-offs, and memory/concurrency reasoning...`}
                      className="w-full bg-transparent border-none outline-none text-slate-700 px-4 py-3.5 resize-none h-20 text-sm font-mono"
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      <kbd className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-500">
                        <Keyboard className="w-3 h-3" /> Enter to send
                      </kbd>
                    </div>
                  </div>

                  <button
                    onClick={handleSendResponse}
                    disabled={submitting || !inputText.trim()}
                    className="w-12 h-12 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: LIVE INTERVIEW METRICS */}
          <div className="lg:col-span-4 bg-white flex flex-col overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-8 space-y-8">
              
              <div>
                <h3 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 font-mono">
                  <Activity className="w-4 h-4" /> Active Session Details
                </h3>
                
                <div className="space-y-3 font-mono text-xs">
                  {!isNonTech && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500">Coding Language:</span>
                      <span className="text-brand-400 font-bold">{session?.language || 'C++'}</span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">{isNonTech ? 'Career Area:' : 'Technical Domain:'}</span>
                    <span className="text-slate-700 font-bold truncate max-w-[180px]">{session?.domain}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Target Level:</span>
                    <span className="text-slate-700 font-bold">{session?.targetLevel}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Session Status:</span>
                    <span className={`font-bold ${session?.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {session?.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl text-[11px] text-slate-500 leading-relaxed font-mono">
                  All evaluations are isolated. Resume, ATS, and project scores do not artificially influence this interview assessment.
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> {isNonTech ? 'Strategy & Reasoning Rubric' : 'Grounded Evaluation Primitives'}
                </h3>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  {session?.detectedSkills && session.detectedSkills.length > 0 ? (
                    session.detectedSkills.map((skill, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono font-bold text-slate-600">{skill}</span>
                        <span className="text-[10px] text-emerald-400 ml-auto font-mono">Active Rubric</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 font-mono">
                      {isNonTech
                        ? 'Functional strategy, business reasoning, and practical communication rubric active.'
                        : 'Systems architecture and algorithmic rubric active.'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
