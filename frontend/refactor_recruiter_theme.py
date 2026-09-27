import re
import sys
import glob
import os

def refactor_file(file_path):
    print(f"Refactoring {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        (r"bg-\[\#0D1322\]", "bg-white"),
        (r"bg-\[\#070B14\]", "bg-slate-50"),
        (r"bg-\[\#0a0f1c\]", "bg-slate-50"),
        (r"border-slate-800(\/\d+)?", "border-slate-200"),
        (r"border-slate-700(\/\d+)?", "border-slate-200"),
        (r"bg-slate-900\/[0-9]+", "bg-slate-50"),
        (r"bg-slate-900", "bg-slate-50"),
        (r"bg-slate-800(\/\d+)?", "bg-slate-100"),
        (r"bg-slate-800", "bg-slate-100"),
        (r"text-slate-400", "text-slate-500"),
        (r"text-slate-300", "text-slate-600"),
        (r"text-slate-200", "text-slate-700"),
        (r"text-white", "text-slate-900"), 
        (r"bg-brand-600 hover:bg-brand-500 text-slate-900", "bg-brand-600 hover:bg-brand-500 text-white"),
        (r"bg-brand-500\/10 text-slate-900", "bg-brand-500/10 text-brand-700"),
        (r"text-rose-400", "text-rose-600"),
        (r"text-emerald-400", "text-emerald-600"),
        (r"text-amber-400", "text-amber-600"),
        (r"text-brand-400", "text-brand-600"),
        (r"text-brand-300", "text-brand-600"),
        (r"border-brand-500\/30", "border-brand-200"),
        (r"border-brand-500\/20", "border-brand-200"),
        (r"bg-brand-500\/20", "bg-brand-50"),
        (r"bg-brand-500\/10", "bg-brand-50"),
        (r"bg-brand-500\/5", "bg-brand-50"),
        (r"border-emerald-500\/20", "border-emerald-200"),
        (r"bg-emerald-500\/10", "bg-emerald-50"),
        (r"border-amber-500\/20", "border-amber-200"),
        (r"bg-amber-500\/10", "bg-amber-50"),
        (r"border-rose-500\/20", "border-rose-200"),
        (r"bg-rose-500\/10", "bg-rose-50"),
        (r"border-slate-800", "border-slate-200"),
    ]

    for old, new in replacements:
        content = re.sub(old, new, content)

    # Specific fixups
    content = content.replace("bg-brand-600 hover:bg-brand-500 text-slate-900", "bg-brand-600 hover:bg-brand-500 text-white")
    content = content.replace("text-slate-900 text-lg", "text-slate-900 text-lg")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

files_to_refactor = [
    r"c:\open source\ProofHire\frontend\src\pages\recruiter\TalentDiscovery.tsx",
    r"c:\open source\ProofHire\frontend\src\pages\recruiter\Jobs.tsx",
    r"c:\open source\ProofHire\frontend\src\pages\recruiter\Shortlists.tsx",
    r"c:\open source\ProofHire\frontend\src\pages\recruiter\Pipeline.tsx",
    r"c:\open source\ProofHire\frontend\src\pages\recruiter\Messages.tsx",
    r"c:\open source\ProofHire\frontend\src\pages\recruiter\Dashboard.tsx",
    r"c:\open source\ProofHire\frontend\src\pages\recruiter\Settings.tsx",
    r"c:\open source\ProofHire\frontend\src\pages\recruiter\CandidateDetail.tsx"
]

for fp in files_to_refactor:
    if os.path.exists(fp):
        refactor_file(fp)
    else:
        print(f"File not found: {fp}")

print("Done refactoring recruiter light theme")
