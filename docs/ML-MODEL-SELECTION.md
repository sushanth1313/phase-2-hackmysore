# ML Model Selection

## 1. Programming Language Identification
- **Model**: `huggingface/CodeBERTa-language-id`
- **Task**: Identify programming languages from source code snippets or files.
- **Why selected**: It's specifically fine-tuned for code language identification on a robust RoBERTa base, supporting the top most common languages.
- **License**: Apache-2.0
- **Languages Supported**: Python, Java, JavaScript, PHP, Ruby, Go, C, C++, C#, etc.
- **Model Size**: ~330 MB (Base model)
- **Inference Method**: Transformers `pipeline("text-classification")`. Runs efficiently on CPU.
- **Limitations**: Only works well on individual files or snippets; requires aggregation logic for full repositories.
- **Fallback**: Extension-based and heuristics-based language detection.
- **Source URL**: https://huggingface.co/huggingface/CodeBERTa-language-id

## 2. Code Understanding and Summarization
- **Model**: `Salesforce/codet5-base`
- **Task**: Summarize code, understand functionality, and generate brief explanations of architecture.
- **Why selected**: CodeT5 is an encoder-decoder model pretrained on code, excelling at code-to-text generation tasks.
- **License**: BSD 3-Clause
- **Languages Supported**: Ruby, JavaScript, Go, Python, Java, PHP, C, C#.
- **Model Size**: ~850 MB
- **Inference Method**: Transformers `AutoModelForSeq2SeqLM`. Can run on CPU for smaller files, but GPU recommended for speed.
- **Limitations**: Struggles with extremely long files (context window limits). We must chunk code by functions or small modules.
- **Fallback**: Extractive summarization based on AST parsing (docstrings, function signatures).
- **Source URL**: https://huggingface.co/Salesforce/codet5-base

## 3. Code Embeddings (Semantic Similarity)
- **Model**: `microsoft/codebert-base`
- **Task**: Generate code embeddings for semantic search, anti-gaming (duplicate detection), and candidate-project matching.
- **Why selected**: CodeBERT is an industry-standard foundation model for generating dense representations of code.
- **License**: MIT
- **Languages Supported**: Python, Java, JavaScript, PHP, Ruby, Go
- **Model Size**: ~498 MB
- **Inference Method**: Extract pooled output from Transformers `AutoModel`.
- **Limitations**: Fixed maximum sequence length (512 tokens).
- **Fallback**: TF-IDF on AST tokens or Jaccard similarity on dependencies.
- **Source URL**: https://huggingface.co/microsoft/codebert-base

## 4. Security Vulnerability Detection
- **Model**: `mrm8488/securebert-base-vuln-detection`
- **Task**: Detect security vulnerabilities (CWEs) in source code.
- **Why selected**: It's fine-tuned on a large dataset of vulnerable code and provides good baseline probabilities for common security anti-patterns.
- **License**: Apache-2.0
- **Languages Supported**: Multi-language (C/C++, Java, Python, JS primarily)
- **Model Size**: ~500 MB
- **Inference Method**: Transformers `pipeline("text-classification")`.
- **Limitations**: ML security models have false positives. It must be used in conjunction with deterministic static analysis tools (like Bandit, ESLint-security).
- **Fallback**: Rule-based SAST (Static Application Security Testing).
- **Source URL**: https://huggingface.co/mrm8488/securebert-base-vuln-detection
