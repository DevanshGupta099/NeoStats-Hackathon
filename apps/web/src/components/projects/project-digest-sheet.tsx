'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Terminal, Copy, Check, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectDigestSheetProps {
  projectId: string;
  projectKey: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDigestSheet({
  projectId,
  projectKey,
  projectName,
  open,
  onOpenChange,
}: ProjectDigestSheetProps) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const startStream = async () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
    }

    setContent('');
    setIsStreaming(true);
    setIsAiGenerated(null);

    const controller = new AbortController();
    streamAbortRef.current = controller;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/ai/digest`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response body returned from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');

          if (dataStr === '[DONE]') {
            setIsStreaming(false);
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              setContent((prev) => prev + parsed.text);
            }
            if (typeof parsed.aiGenerated === 'boolean') {
              setIsAiGenerated(parsed.aiGenerated);
            }
          } catch {
            // Raw text fallback
            setContent((prev) => prev + dataStr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setContent((prev) => prev + `\n\n[ERROR: Stream connection lost: ${err.message}]`);
    } finally {
      setIsStreaming(false);
      streamAbortRef.current = null;
    }
  };

  useEffect(() => {
    if (open) {
      startStream();
    } else {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
      }
    }
    return () => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
    };
  }, [open, projectId]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Standup brief copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-void border-steel text-bone font-mono p-0 overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-graphite/90 border-b border-steel px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-plasma" />
            <span className="text-xs font-bold uppercase tracking-wider text-bone">
              [{projectKey}] AI STANDUP TELEMETRY // {projectName}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {isStreaming ? (
              <Badge variant="plasma" className="text-[10px] animate-pulse">
                ● STREAMING
              </Badge>
            ) : (
              <Badge variant="ice" className="text-[10px]">
                {isAiGenerated === false ? 'FALLBACK ENGINE' : 'STANDUP READY'}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0 text-ash hover:text-bone"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Terminal Screen */}
        <div className="p-4 bg-void min-h-[320px] max-h-[500px] overflow-y-auto text-xs font-mono leading-relaxed text-bone/90 selection:bg-plasma/30">
          {content ? (
            <div className="whitespace-pre-wrap space-y-1">
              {content}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-plasma animate-pulse align-middle" />
              )}
            </div>
          ) : isStreaming ? (
            <div className="flex items-center space-x-2 text-plasma py-8">
              <span className="w-2 h-4 bg-plasma animate-pulse" />
              <span>INITIALIZING SECURE MISTRAL INFERENCE STREAM...</span>
            </div>
          ) : (
            <div className="text-ash py-8 text-center">No telemetry stream available.</div>
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Footer Controls */}
        <div className="bg-graphite/60 border-t border-steel px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[10px] text-ash">
            <span>MODEL: {process.env.NEXT_PUBLIC_MISTRAL_MODEL || 'mistral-small-latest'}</span>
            <span>•</span>
            <span>SCOPED: PROJECT-{projectKey} ONLY</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={startStream}
              disabled={isStreaming}
              className="h-8 text-xs border-steel"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isStreaming ? 'animate-spin' : ''}`} />
              RE-GENERATE
            </Button>
            <Button
              variant="plasma"
              size="sm"
              onClick={handleCopy}
              disabled={!content}
              className="h-8 text-xs font-bold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> COPIED
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> COPY BRIEF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
