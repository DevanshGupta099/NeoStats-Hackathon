'use client';

import React, { useState, useEffect } from 'react';
import { useConflictStore } from '@/lib/stores/conflict-store';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Check, ArrowRight, X } from 'lucide-react';

type ResolutionChoice = 'theirs' | 'mine';

export function ConflictResolutionSheet() {
  const { conflict, closeConflict } = useConflictStore();
  const [choices, setChoices] = useState<Record<string, ResolutionChoice>>({});
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (conflict) {
      // Default to 'mine' for fields the user explicitly changed
      const initial: Record<string, ResolutionChoice> = {};
      Object.keys(conflict.pendingChanges).forEach((field) => {
        initial[field] = 'mine';
      });
      setChoices(initial);
    }
  }, [conflict]);

  if (!conflict) return null;

  const { serverTask, pendingChanges, onResolve } = conflict;

  const fieldsToCompare = Object.keys(pendingChanges).filter(
    (f) => f !== 'version' && f !== 'id' && f !== 'projectId',
  );

  const handleApplyResolution = async () => {
    setIsResolving(true);
    try {
      const resolved: Record<string, any> = {};

      fieldsToCompare.forEach((field) => {
        const choice = choices[field] || 'mine';
        resolved[field] =
          choice === 'mine' ? (pendingChanges as any)[field] : (serverTask as any)[field];
      });

      await onResolve(resolved, serverTask.version);
      closeConflict();
    } catch {
      // Error handled by mutation
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Drawer.Root open={!!conflict} onOpenChange={(open) => !open && closeConflict()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-basalt border-t-2 border-crimson rounded-t-xl z-50 p-6 outline-none overflow-y-auto">
          <div className="w-12 h-1.5 bg-steel rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-steel/60">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded bg-crimson/20 border border-crimson/50 text-crimson">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-crimson font-bold uppercase">
                    HTTP 409 VERSION_CONFLICT
                  </span>
                  <Badge variant="crimson" className="text-[10px]">
                    SERVER REV: v{serverTask.version}
                  </Badge>
                </div>
                <h3 className="font-hud uppercase tracking-wider text-base font-bold text-bone mt-0.5">
                  OPTIMISTIC CONCURRENCY RECONCILIATION
                </h3>
                <p className="font-body text-xs text-ash mt-0.5">
                  Another collaborator committed changes to this record while you were editing. Choose which fields to preserve.
                </p>
              </div>
            </div>

            <button onClick={closeConflict} className="text-ash hover:text-bone p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Diff comparison table */}
          <div className="py-5 space-y-4">
            <div className="grid grid-cols-12 gap-2 font-mono text-[11px] text-ash uppercase px-3 pb-1 border-b border-steel/40">
              <div className="col-span-3">FIELD ATTRIBUTE</div>
              <div className="col-span-4">LATEST REMOTE (SERVER)</div>
              <div className="col-span-5">MY PENDING REVISION</div>
            </div>

            <div className="space-y-3">
              {fieldsToCompare.map((field) => {
                const serverVal = String((serverTask as any)[field] ?? 'None');
                const myVal = String((pendingChanges as any)[field] ?? 'None');
                const choice = choices[field] || 'mine';

                return (
                  <div
                    key={field}
                    className="grid grid-cols-12 gap-2 items-center p-3 rounded bg-graphite/60 border border-steel/50"
                  >
                    <div className="col-span-3 font-mono text-xs uppercase text-bone font-bold">
                      {field}
                    </div>

                    {/* Server Value Button */}
                    <div className="col-span-4">
                      <button
                        type="button"
                        onClick={() =>
                          setChoices((prev) => ({ ...prev, [field]: 'theirs' }))
                        }
                        className={`w-full text-left p-2 rounded border text-xs font-mono transition-colors min-h-[44px] flex items-center justify-between ${
                          choice === 'theirs'
                            ? 'bg-plasma/10 border-plasma text-plasma font-bold'
                            : 'bg-void/60 border-steel text-ash hover:text-bone'
                        }`}
                      >
                        <span className="truncate">{serverVal}</span>
                        {choice === 'theirs' && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1 text-plasma" />}
                      </button>
                      <span className="block text-[9px] font-mono text-ash/60 mt-0.5">
                        {choice === 'theirs' ? '[Selected]' : 'Click to keep'}
                      </span>
                    </div>

                    {/* My Pending Value Button */}
                    <div className="col-span-5">
                      <button
                        type="button"
                        onClick={() =>
                          setChoices((prev) => ({ ...prev, [field]: 'mine' }))
                        }
                        className={`w-full text-left p-2 rounded border text-xs font-mono transition-colors min-h-[44px] flex items-center justify-between ${
                          choice === 'mine'
                            ? 'bg-ember/10 border-ember text-ember font-bold'
                            : 'bg-void/60 border-steel text-ash hover:text-bone'
                        }`}
                      >
                        <span className="truncate">{myVal}</span>
                        {choice === 'mine' && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1 text-ember" />}
                      </button>
                      <span className="block text-[9px] font-mono text-ash/60 mt-0.5">
                        {choice === 'mine' ? '[Selected]' : 'Click to apply'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-steel/60 flex items-center justify-end space-x-3">
            <Button variant="outline" size="sm" onClick={closeConflict}>
              CANCEL
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isResolving}
              onClick={handleApplyResolution}
            >
              {isResolving ? 'RE-SYNCHRONIZING...' : 'RESOLVE & RESUBMIT'}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
