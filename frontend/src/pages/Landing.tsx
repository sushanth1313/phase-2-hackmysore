import { ShieldCheck, Code2, Brain, Activity, Award, ArrowRight, CheckCircle, Star, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── Top Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
              <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold text-slate-900 tracking-tight">ProofHire</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#for-recruiters" className="hover:text-slate-900 transition-colors">Recruiters</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary text-sm px-4 py-2">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        {/* Background decorations */}
        <div className="absolute -top-24 -right-48 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-24 -left-48 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-8 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            HACK MYSURU 1.0 — India's Proof-of-Work Hiring Platform
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.05] mb-6">
            Show what you can <span className="text-blue-600">build</span>,<br />
            not just your résumé.
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Resumes tell you what someone <em>claims</em>. Proof of Work shows what they can actually do.
            The verified engineering capability platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="btn btn-primary px-8 py-3.5 text-base rounded-xl shadow-lg shadow-blue-500/25"
            >
              I'm a Developer <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="btn btn-secondary px-8 py-3.5 text-base rounded-xl"
            >
              I'm a Recruiter
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-12 text-slate-400 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {['bg-blue-400','bg-emerald-400','bg-violet-400','bg-amber-400'].map((c,i) => (
                  <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-white`} />
                ))}
              </div>
              <span>500+ developers</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              <span className="ml-1">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label text-blue-600 mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Hiring should be based on proof
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              Every feature is designed to surface real capability — not keyword matches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Code2 className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
              title="Verified Proof of Work"
              desc="Solve real architecture and coding challenges. Submit code, ADRs, and get verified expert reviews that stand behind the score."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              title="Resume Intelligence"
              desc="AI analyzes resume claims against actual GitHub repositories and verified challenge submissions — no more resume fraud."
            />
            <FeatureCard
              icon={<Brain className="w-5 h-5 text-violet-600" />}
              iconBg="bg-violet-50"
              title="Capability Passport"
              desc="A holistic engineering score based on code quality, architecture decisions, AI technical interviews, and peer review."
            />
            <FeatureCard
              icon={<Activity className="w-5 h-5 text-amber-600" />}
              iconBg="bg-amber-50"
              title="Live Talent Signals"
              desc="Recruiters see real-time signals — new project submissions, certifications earned, reviews completed — not stale profiles."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5 text-rose-600" />}
              iconBg="bg-rose-50"
              title="Expert Review Network"
              desc="Senior engineers review candidates' submissions against multi-dimensional rubrics, adding human verification to AI signals."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5 text-indigo-600" />}
              iconBg="bg-indigo-50"
              title="ProofAI Assistant"
              desc="AI evidence assistant surfaces what the candidate demonstrated, what's missing, and what the expert should verify manually."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label text-blue-600 mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Three steps to verified talent</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Build & Submit', desc: 'Candidates solve real engineering challenges, submit their GitHub repos, and complete AI-driven technical interviews.' },
              { step: '02', title: 'AI + Expert Review', desc: 'ProofAI analyzes the evidence. Senior expert engineers review against structured rubrics for human verification.' },
              { step: '03', title: 'Hire with Confidence', desc: "Recruiters discover candidates with verified Capability Passports — you know exactly what you're getting." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-6xl font-black text-blue-50 leading-none mb-4 select-none">{step}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Recruiters ──────────────────────────────── */}
      <section id="for-recruiters" className="py-24 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">For Recruiters</p>
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Stop guessing. Start hiring with proof.
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Discover engineers whose skills are verified by code, not claims. Filter by capability score,
            tech stack, and domain expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors">
              Start for free
            </Link>
            <Link to="/login" className="btn bg-white/10 text-white border border-white/20 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors">
              Sign in
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            {[
              { value: '500+', label: 'Verified Candidates' },
              { value: '98%',  label: 'Review Accuracy' },
              { value: '3×',   label: 'Faster Hiring' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-black">{value}</div>
                <div className="text-blue-200 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-white">ProofHire</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2025 ProofHire · Hack Mysuru 1.0 · The verified engineering capability platform.
          </p>
          <div className="flex gap-4 text-xs">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, iconBg, title, desc }: any) {
  return (
    <div className="card card-hover p-6">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}
