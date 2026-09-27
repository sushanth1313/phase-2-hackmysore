import React, { useState, useEffect } from 'react';
import { 
  Play, Send, RotateCcw, CheckCircle2, XCircle, AlertTriangle, 
  Clock, ShieldCheck, Code2, Sparkles, ChevronRight, Terminal, 
  HelpCircle, History, ExternalLink, Loader2, Award, ArrowLeft
} from 'lucide-react';
import api from '../../api/client';
import CodeEditor from '../../components/practice/CodeEditor';

interface Parameter {
  name: string;
  type: string;
}

interface TestCase {
  _id?: string;
  label: string;
  args: any[];
  expectedReturn: any;
  isHidden?: boolean;
}

interface Challenge {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  allowedLanguages: string[];
  functionName: string;
  parameters: Parameter[];
  returnType: string;
  starterCode: {
    java?: string;
    python?: string;
    javascript?: string;
    cpp?: string;
    [key: string]: string | undefined;
  };
  constraints: string[];
  hints: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  candidateStatus?: 'PASSED' | 'IN_PROGRESS' | 'NOT_STARTED';
  bestScore?: number | null;
  testCasesCount?: number;
}

interface TestResult {
  testCaseId?: string;
  label: string;
  args: any[];
  expectedReturn: any;
  actualOutput: any;
  passed: boolean;
  failureReason?: string;
  executionTimeMs?: number;
  stderr?: string;
  stdout?: string;
}

interface SubmissionItem {
  _id: string;
  language: string;
  code: string;
  status: 'PASSED' | 'FAILED';
  passedTests: number;
  totalTests: number;
  executionTimeMs: number;
  evidenceGenerated: boolean;
  submittedAt: string;
}

const DIFFICULTY_CONFIG = {
  EASY: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Easy' },
  MEDIUM: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Medium' },
  HARD: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Hard' }
};

interface CandidateStats {
  solved: number;
  attempted: number;
  totalChallenges: number;
  accuracy: number;
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
  topicProgress: Record<string, { solved: number; total: number }>;
}

export default function TechnicalPractice() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'catalog' | 'solve'>('catalog');

  // Stats & Filters
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [langFilter, setLangFilter] = useState<string>('ALL');

  // Editor State
  const [selectedLanguage, setSelectedLanguage] = useState<'java' | 'python' | 'javascript' | 'cpp'>('cpp');
  const [code, setCode] = useState<string>('');
  
  // Execution & Submissions State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runSummary, setRunSummary] = useState<any>(null);
  const [visibleTestCases, setVisibleTestCases] = useState<TestCase[]>([]);
  const [submissionsHistory, setSubmissionsHistory] = useState<SubmissionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'testcases' | 'results' | 'history'>('testcases');
  const [showHints, setShowHints] = useState(false);
  const [verifiedEvidenceNotice, setVerifiedEvidenceNotice] = useState<any | null>(null);

  // Load challenge list and candidate stats
  const fetchChallengesAndStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [challengesRes, statsRes] = await Promise.allSettled([
        api.get('/practice/challenges'),
        api.get('/practice/stats')
      ]);

      if (challengesRes.status === 'fulfilled') {
        const challengeList = challengesRes.value.data?.data || challengesRes.value.data?.challenges || [];
        setChallenges(challengeList);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || statsRes.value.data?.stats || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load coding challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengesAndStats();
  }, []);

  // Select a challenge and load its full details
  const selectChallenge = async (challenge: Challenge) => {
    try {
      const res = await api.get(`/practice/challenges/${challenge._id}`);
      const fullChallenge = res.data?.data || res.data?.challenge || challenge;
      setSelectedChallenge(fullChallenge);
      setVisibleTestCases(fullChallenge.testCases || []);
      setViewMode('solve');

      // Default to cpp if allowed, then first allowed language, then javascript
      const langs: Array<'cpp' | 'java' | 'python' | 'javascript'> = ['cpp', 'java', 'python', 'javascript'];
      const allowed = fullChallenge.allowedLanguages?.map((l: string) => l.toLowerCase()) || [];
      const defaultLang = langs.find(l => allowed.includes(l)) || 'javascript';
      setSelectedLanguage(defaultLang);

      // starterCode may be a Mongoose Map — access via object or .get
      const sc = fullChallenge.starterCode;
      const getStarter = (lang: string): string => {
        if (!sc) return '';
        if (typeof sc.get === 'function') return sc.get(lang) || '';
        return sc[lang] || '';
      };
      setCode(getStarter(defaultLang));
      
      // Clear previous execution results
      setTestResults([]);
      setRunSummary(null);
      setActiveTab('testcases');
      setShowHints(false);
      setVerifiedEvidenceNotice(null);

      // Load submission history for this challenge
      loadHistory(fullChallenge._id);
    } catch (err) {
      console.error('Error fetching challenge details:', err);
    }
  };

  const loadHistory = async (challengeId: string) => {
    try {
      const res = await api.get(`/practice/challenges/${challengeId}/history`);
      setSubmissionsHistory(res.data?.data || res.data?.submissions || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Handle language switch
  const handleLanguageChange = (newLang: 'java' | 'python' | 'javascript' | 'cpp') => {
    setSelectedLanguage(newLang);
    if (selectedChallenge) {
      const sc = selectedChallenge.starterCode;
      let starter = '';
      if (sc) {
        starter = typeof (sc as any).get === 'function'
          ? (sc as any).get(newLang) || ''
          : (sc as any)[newLang] || '';
      }
      setCode(starter);
    }
  };

  // Reset to starter code
  const handleResetCode = () => {
    if (selectedChallenge) {
      const sc = selectedChallenge.starterCode;
      let starter = '';
      if (sc) {
        starter = typeof (sc as any).get === 'function'
          ? (sc as any).get(selectedLanguage) || ''
          : (sc as any)[selectedLanguage] || '';
      }
      setCode(starter);
    }
  };

  // Run visible test cases
  const handleRunCode = async () => {
    if (!selectedChallenge || !code) return;
    try {
      setIsRunning(true);
      setActiveTab('results');
      setVerifiedEvidenceNotice(null);

      const res = await api.post(`/practice/challenges/${selectedChallenge._id}/run`, {
        language: selectedLanguage,
        code
      });

      const data = res.data?.data || res.data;
      setTestResults(data.results || []);
      setRunSummary(data.summary || null);
    } catch (err: any) {
      setTestResults([{
        label: 'Execution Error',
        args: [],
        expectedReturn: '',
        actualOutput: '',
        passed: false,
        failureReason: 'runtime_error',
        stderr: err.response?.data?.message || err.message || 'Execution failed'
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit solution (all tests + verified evidence)
  const handleSubmit = async () => {
    if (!selectedChallenge || !code) return;
    try {
      setIsSubmitting(true);
      setActiveTab('results');

      const res = await api.post(`/practice/challenges/${selectedChallenge._id}/submit`, {
        language: selectedLanguage,
        code
      });

      const data = res.data?.data || res.data;
      setTestResults(data.results || []);
      setRunSummary({
        passedTests: data.passedTests,
        totalTests: data.totalTests,
        passRate: data.passRate,
        isPassed: data.status === 'PASSED',
        totalExecutionTimeMs: data.executionTimeMs
      });

      if (data.evidence) {
        setVerifiedEvidenceNotice(data.evidence);
      }

      // Reload challenge list & stats & history
      fetchChallengesAndStats();
      loadHistory(selectedChallenge._id);
    } catch (err: any) {
      setTestResults([{
        label: 'Submission Failed',
        args: [],
        expectedReturn: '',
        actualOutput: '',
        passed: false,
        failureReason: 'runtime_error',
        stderr: err.response?.data?.message || err.message || 'Submission error'
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered challenges list
  const filteredChallenges = challenges.filter(c => {
    const matchesDiff = difficultyFilter === 'ALL' || c.difficulty === difficultyFilter;
    const matchesTopic = selectedTopic === 'ALL' || c.category?.toLowerCase() === selectedTopic.toLowerCase();
    const matchesSearch = !searchQuery || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = langFilter === 'ALL' || 
      c.allowedLanguages?.map(l => l.toLowerCase())?.includes(langFilter.toLowerCase());
    return matchesDiff && matchesTopic && matchesSearch && matchesLang;
  });

  const allTopics = [
    'ALL', 'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
    'Sorting', 'Binary Search', 'Linked Lists', 'Stack', 'Queue', 'Trees',
    'Graphs', 'Recursion', 'Backtracking', 'Greedy', 'Dynamic Programming'
  ];

  if (loading && challenges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading technical practice environment...</p>
      </div>
    );
  }

  // ================= CATALOGUE VIEW =================
  if (viewMode === 'catalog') {
    return (
      <div className="page-container">
        {/* HEADER & STATS BANNER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
              <Code2 className="w-4 h-4" /> Algorithmic Sandbox
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Technical Practice</h1>
            <p className="text-slate-500 text-sm mt-1">
              Sandboxed algorithmic problem solving with verifiable evidence records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 shadow-sm">
              {challenges.length} Challenges Available
            </span>
          </div>
        </div>

        {/* CANDIDATE STATS CARDS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Solved</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {stats.solved} <span className="text-xs font-semibold text-slate-400">/ {stats.totalChallenges}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Attempted</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{stats.attempted}</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Accuracy</div>
              <div className="text-2xl font-black text-brand-600 mt-1">{stats.accuracy}%</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Easy / Med / Hard</div>
              <div className="flex items-center gap-2 mt-1 text-xs font-bold">
                <span className="text-emerald-600">{stats.easy.solved}/{stats.easy.total} E</span>
                <span className="text-amber-600">{stats.medium.solved}/{stats.medium.total} M</span>
                <span className="text-rose-600">{stats.hard.solved}/{stats.hard.total} H</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Topics Mastered</div>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {Object.values(stats.topicProgress || {}).filter(t => t.solved > 0).length}
                <span className="text-xs font-semibold text-slate-400"> active</span>
              </div>
            </div>
          </div>
        )}

        {/* FILTERS & SEARCH */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problems by title or topic..."
                className="input pl-4"
              />
            </div>

            {/* Difficulty Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    difficultyFilter === diff 
                      ? 'bg-white text-brand-700 shadow-sm border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {diff === 'ALL' ? 'All Difficulties' : diff}
                </button>
              ))}
            </div>
          </div>

          {/* Topics Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {allTopics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedTopic.toLowerCase() === topic.toLowerCase()
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Language:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'cpp', 'java', 'python', 'javascript'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLangFilter(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    langFilter === lang
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {lang === 'ALL' ? 'All Languages' : lang === 'javascript' ? 'JS' : lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PROBLEMS TABLE */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Topic</div>
            <div className="col-span-2">Languages</div>
            <div className="col-span-1">Difficulty</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredChallenges.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500 font-medium">
                No technical practice challenges match your filter criteria.
              </div>
            ) : (
              filteredChallenges.map((c) => (
                <div
                  key={c._id}
                  onClick={() => selectChallenge(c)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="col-span-1">
                    {c.candidateStatus === 'PASSED' ? (
                      <span className="flex items-center text-emerald-600" title="Solved">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    ) : c.candidateStatus === 'IN_PROGRESS' ? (
                      <span className="flex items-center text-amber-500" title="Attempted">
                        <Clock className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block ml-1" />
                    )}
                  </div>
                  <div className="col-span-4">
                    <div className="font-bold text-slate-900 text-sm hover:text-brand-600 transition-colors">
                      {c.title}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                      {c.category}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex flex-wrap gap-1">
                      {(c.allowedLanguages || []).map((lang: string) => {
                        const l = lang.toLowerCase();
                        const label = l === 'javascript' ? 'JS' : l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1);
                        const color = l === 'cpp' ? 'text-cyan-700 border-cyan-200 bg-cyan-50'
                          : l === 'java' ? 'text-orange-700 border-orange-200 bg-orange-50'
                          : l === 'python' ? 'text-yellow-700 border-yellow-200 bg-yellow-50'
                          : 'text-emerald-700 border-emerald-200 bg-emerald-50';
                        return (
                          <span key={lang} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${color}`}>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      c.difficulty === 'EASY' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      c.difficulty === 'MEDIUM' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                      'text-rose-700 bg-rose-50 border-rose-200'
                    }`}>
                      {DIFFICULTY_CONFIG[c.difficulty]?.label}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectChallenge(c);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-brand-50 text-brand-600 border border-slate-200 hover:border-brand-200 text-xs font-bold transition-all shadow-sm"
                    >
                      {c.candidateStatus === 'PASSED' ? 'Re-solve' : 'Solve'} →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= PROBLEM SOLVER VIEW =================
  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-slate-50 text-slate-900 overflow-hidden">
      {/* TOP HEADER */}
      <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('catalog')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Problem Catalogue</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* CHALLENGE SELECTOR DROPDOWN */}
          <div className="flex items-center gap-2">
            <select
              value={selectedChallenge?._id || ''}
              onChange={(e) => {
                const found = challenges.find(c => c._id === e.target.value);
                if (found) selectChallenge(found);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-sm"
            >
              {challenges.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.difficulty}) {c.candidateStatus === 'PASSED' ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RIGHT METRICS & CONTROLS */}
        <div className="flex items-center gap-3">
          {selectedChallenge?.candidateStatus === 'PASSED' && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Solved & Verified ({selectedChallenge.bestScore}%)</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Time limit: {((selectedChallenge?.timeLimitMs || 5000) / 1000).toFixed(1)}s</span>
          </div>

          <a 
            href="/candidate/passport"
            className="flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-all shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Capability Passport</span>
          </a>
        </div>
      </header>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT COLUMN: CHALLENGE SPECIFICATION */}
        <div className="w-[42%] border-r border-slate-200 flex flex-col bg-white overflow-y-auto">
          {selectedChallenge ? (
            <div className="p-6 space-y-6">
              {/* Challenge Title & Badges */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    selectedChallenge.difficulty === 'EASY' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                    selectedChallenge.difficulty === 'MEDIUM' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                    'text-rose-700 bg-rose-50 border-rose-200'
                  }`}>
                    {DIFFICULTY_CONFIG[selectedChallenge.difficulty]?.label}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                    {selectedChallenge.category}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedChallenge.title}
                </h2>
              </div>

              {/* Verified Evidence Notice Banner if generated */}
              {verifiedEvidenceNotice && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in fade-in duration-300 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 mb-1">
                    <Award className="w-4 h-4" />
                    Verified Evidence Generated
                  </div>
                  <p className="text-xs text-emerald-600 mb-2 font-medium">
                    Proportional technical evidence recorded in MongoDB Atlas and attached to your Capability Passport.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {verifiedEvidenceNotice.skillsDemonstrated?.map((s: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-700 shadow-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Problem Description */}
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed font-medium">
                <div className="whitespace-pre-line">
                  {selectedChallenge.description}
                </div>
              </div>

              {/* Function Signature Specification */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Function Specification
                </div>
                <div className="font-mono text-xs text-slate-800 font-semibold bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-purple-600">{selectedChallenge.returnType}</span>{' '}
                  <span className="text-amber-600">{selectedChallenge.functionName}</span>(
                  {selectedChallenge.parameters.map((p, i) => (
                    <span key={i}>
                      <span className="text-blue-600">{p.type}</span> {p.name}
                      {i < selectedChallenge.parameters.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  )
                </div>
              </div>

              {/* Example Test Cases */}
              {visibleTestCases.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Example Test Cases
                  </div>
                  <div className="space-y-2.5">
                    {visibleTestCases.slice(0, 3).map((tc, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-1.5 shadow-sm">
                        <div className="text-slate-500 text-[11px] font-sans font-bold">
                          {tc.label}
                        </div>
                        <div className="text-slate-700">
                          <span className="text-slate-400 font-semibold">Input:</span> {tc.args.map((a) => JSON.stringify(a)).join(', ')}
                        </div>
                        <div className="text-slate-700">
                          <span className="text-slate-400 font-semibold">Expected:</span> <span className="text-emerald-600 font-bold">{JSON.stringify(tc.expectedReturn)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {selectedChallenge.constraints && selectedChallenge.constraints.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Constraints
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 font-mono">
                    {selectedChallenge.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints Collapsible */}
              {selectedChallenge.hints && selectedChallenge.hints.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
                    <span>{showHints ? 'Hide Hints' : `Show Hints (${selectedChallenge.hints.length})`}</span>
                  </button>
                  {showHints && (
                    <div className="mt-2.5 space-y-2 pl-3 border-l-2 border-slate-200">
                      {selectedChallenge.hints.map((h, i) => (
                        <div key={i} className="text-xs text-slate-600 leading-relaxed font-medium">
                          <span className="font-bold text-slate-700">Hint {i + 1}:</span> {h}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm font-medium">
              Select a challenge to begin practice.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CODEMIRROR EDITOR & EXECUTION RESULTS */}
        <div className="w-[58%] flex flex-col bg-white">
          {/* EDITOR MENU BAR */}
          <div className="h-11 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-brand-500" />
                Solution Editor
              </span>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
                {(['cpp', 'java', 'python', 'javascript'] as const).map((lang) => {
                  const isAllowed = selectedChallenge?.allowedLanguages?.map(l => l.toLowerCase())?.includes(lang);
                  const displayName = lang === 'javascript' ? 'JS' : lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1);
                  return (
                    <button
                      key={lang}
                      disabled={!isAllowed}
                      onClick={() => handleLanguageChange(lang)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        selectedLanguage === lang
                          ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-200/50'
                          : isAllowed
                          ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                          : 'text-slate-400 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCode}
                title="Reset to starter code template"
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* CODEMIRROR 6 EDITOR PANEL */}
          <div className="flex-1 min-h-0 relative">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={selectedLanguage}
            />
          </div>

          {/* LOWER RESULTS & TEST CASES PANEL */}
          <div className="h-[280px] border-t border-slate-200 bg-white flex flex-col shrink-0">
            {/* Panel Navigation Tabs & Action Buttons */}
            <div className="h-10 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-slate-50 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('testcases')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    activeTab === 'testcases'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Test Cases ({visibleTestCases.length})
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'results'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>Results</span>
                  {testResults.length > 0 && (
                    <span className={`w-2 h-2 rounded-full ${testResults.every(r => r.passed) ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Submissions ({submissionsHistory.length})</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-brand-600 fill-brand-600" />
                  )}
                  <span>Run Tests</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Solution</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT CONTAINER */}
            <div className="flex-1 p-4 overflow-y-auto">
              {/* TAB 1: TEST CASES */}
              {activeTab === 'testcases' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {visibleTestCases.map((tc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-mono space-y-1.5">
                      <div className="text-slate-800 font-sans font-bold flex items-center justify-between mb-1">
                        <span>Case {idx + 1}: {tc.label}</span>
                      </div>
                      <div className="text-slate-700">
                        <span className="text-slate-500 font-sans font-semibold">Input:</span> {tc.args.map((a) => JSON.stringify(a)).join(', ')}
                      </div>
                      <div className="text-slate-700">
                        <span className="text-slate-500 font-sans font-semibold">Expected:</span> <span className="text-emerald-600 font-bold">{JSON.stringify(tc.expectedReturn)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: EXECUTION RESULTS */}
              {activeTab === 'results' && (
                <div className="space-y-3">
                  {/* Summary Bar */}
                  {runSummary && (
                    <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${
                      runSummary.isPassed || runSummary.passedTests === runSummary.totalTests
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {runSummary.isPassed || runSummary.passedTests === runSummary.totalTests ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        <span>
                          {runSummary.passedTests}/{runSummary.totalTests} Tests Passed ({runSummary.passRate}%)
                        </span>
                      </div>
                      <div className="text-[11px] font-mono font-medium opacity-80">
                        Time: {runSummary.totalExecutionTimeMs || 0}ms
                      </div>
                    </div>
                  )}

                  {testResults.length === 0 && !isRunning && !isSubmitting && (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 text-sm font-medium">
                      <Terminal className="w-8 h-8 mb-3 text-slate-400" />
                      <p>Run code or submit solution to execute against real test cases.</p>
                    </div>
                  )}

                  {/* Individual Test Results */}
                  <div className="space-y-3">
                    {testResults.map((r, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border text-xs font-mono space-y-2 shadow-sm ${
                          r.passed
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-sans">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              r.passed
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}>
                              {r.passed ? 'PASSED' : r.failureReason || 'FAILED'}
                            </span>
                            <span className="font-bold text-slate-800 text-sm">{r.label}</span>
                          </div>
                          {r.executionTimeMs != null && (
                            <span className="text-[11px] text-slate-500 font-mono font-medium">{r.executionTimeMs}ms</span>
                          )}
                        </div>

                        {r.args && r.args.length > 0 && (
                          <div className="text-slate-700 mt-2">
                            <span className="text-slate-500 font-sans font-semibold">Input:</span> {r.args.map((a) => JSON.stringify(a)).join(', ')}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2 mt-2 border-t border-slate-200">
                          <div>
                            <span className="text-slate-500 font-sans font-semibold">Expected:</span>{' '}
                            <span className="text-emerald-700 font-medium">{JSON.stringify(r.expectedReturn)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-sans font-semibold">Actual:</span>{' '}
                            <span className={`font-medium ${r.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {r.actualOutput || (r.passed ? 'Matched' : 'None')}
                            </span>
                          </div>
                        </div>

                        {/* Compiler / Runtime Diagnostic Output */}
                        {r.stderr && (
                          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 whitespace-pre-wrap font-mono text-[11px] leading-tight">
                            {r.stderr}
                          </div>
                        )}
                        {r.stdout && (
                          <div className="mt-2 p-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-mono">
                            <span className="text-slate-500 font-sans font-semibold">stdout:</span> {r.stdout}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: SUBMISSIONS HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {submissionsHistory.length === 0 ? (
                    <div className="text-center py-10 text-sm font-medium text-slate-500">
                      No previous submissions recorded for this challenge.
                    </div>
                  ) : (
                    submissionsHistory.map((sub) => (
                      <div
                        key={sub._id}
                        className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            sub.status === 'PASSED'
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : 'text-rose-700 bg-rose-50 border border-rose-200'
                          }`}>
                            {sub.status}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                              <span>{sub.passedTests}/{sub.totalTests} tests passed</span>
                              <span className="text-[10px] text-slate-600 uppercase font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {sub.language}
                              </span>
                              {sub.evidenceGenerated && (
                                <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3" /> Verified Evidence
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono font-medium mt-1">
                              {new Date(sub.submittedAt).toLocaleString()} • {sub.executionTimeMs}ms
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (sub.code) {
                              setCode(sub.code);
                              setSelectedLanguage((sub.language.toLowerCase() as any) || 'java');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-bold transition-all shadow-sm"
                        >
                          Restore Code
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
