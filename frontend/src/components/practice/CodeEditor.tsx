import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'java' | 'python' | 'javascript' | 'cpp';
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const getLanguageExtension = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'cpp':
      case 'c++':
        return cpp();
      case 'java':
        return java();
      case 'python':
        return python();
      case 'javascript':
      default:
        return javascript();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        getLanguageExtension(language),
        oneDark,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const nextVal = update.state.doc.toString();
            if (nextVal !== valueRef.current) {
              onChange(nextVal);
            }
          }
        }),
        EditorState.readOnly.of(readOnly),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'inherit'
          },
          '.cm-content': {
            padding: '12px 0'
          },
          '.cm-gutters': {
            backgroundColor: '#0A0F1D',
            color: '#475569',
            borderRight: '1px solid #1E293B',
            paddingRight: '6px'
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, readOnly]);

  // Keep external updates in sync if changed outside
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value
        }
      });
    }
  }, [value]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden bg-[#0A0F1D] rounded-b-xl border border-t-0 border-slate-800" 
    />
  );
};

export default CodeEditor;
