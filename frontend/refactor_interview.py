import re

file_path = r"c:\open source\ProofHire\frontend\src\pages\candidate\AIInterview.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (r"bg-\[\#0D1322\]", "bg-white"),
    (r"border-slate-800(\/\d+)?", "border-slate-200"),
    (r"bg-\[\#070B14\]", "bg-slate-50"),
    (r"bg-slate-900\/[0-9]+", "bg-white"),
    (r"border-slate-700", "border-slate-200"),
    (r"text-slate-400", "text-slate-500"),
    (r"text-slate-300", "text-slate-600"),
    (r"text-slate-200", "text-slate-700"),
    (r"text-white", "text-slate-900"), 
]

for old, new in replacements:
    content = re.sub(old, new, content)

# Fix some specific text-slate-900 that should remain text-white
content = content.replace("bg-brand-600 hover:bg-brand-500 text-slate-900", "bg-brand-600 hover:bg-brand-500 text-white")
content = content.replace("bg-brand-500/10 text-slate-900", "bg-brand-500/10 text-brand-700")

# Other custom adjustments for light theme
content = content.replace("bg-slate-800", "bg-slate-100")
content = content.replace("bg-slate-900", "bg-slate-50")
content = content.replace("border-slate-800", "border-slate-200")
content = content.replace("text-slate-500 font-mono\">\\n                  • Turn", "text-slate-400 font-mono\">\\n                  • Turn")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done refactoring AIInterview")
