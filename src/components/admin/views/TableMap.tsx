import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Users, Plus, Grip, Link2 } from 'lucide-react';
import api from '@/services/api';
import { AppSelect } from '../components/AppSelect';
import type { Table } from '@/types';
import { cn } from '@/utils/cn';

const GRID = 20;
const CANVAS_H = 580;
const TABLE_W = 80;
const TABLE_H = 64;

const snap = (v: number) => Math.round(v / GRID) * GRID;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const SECTION_COLORS: Record<string, string> = {
  VIP: 'border-warning-500 bg-warning-500/15 text-warning-700',
  Terrace: 'border-success-500 bg-success-500/15 text-success-700',
  Indoor: 'border-primary-500 bg-primary-500/15 text-primary-600',
  Bar: 'border-purple-500 bg-purple-500/15 text-purple-700',
};

function tableColorClass(t: Table, isMerged: boolean) {
  if (isMerged) return 'border-orange-400 bg-orange-400/15 text-orange-700';
  return t.section ? (SECTION_COLORS[t.section] ?? 'border-border bg-surface') : 'border-border bg-surface';
}

function tableShapeClass(t: Table) {
  if (t.shape === 'round') return 'rounded-full';
  return 'rounded-xl';
}

function tableWidth(t: Table) {
  return t.shape === 'rectangle' ? 104 : TABLE_W;
}

interface Props {
  tables: Table[];
  branchId: string;
}

export function TableMap({ tables, branchId }: Props) {
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const init: Record<string, { x: number; y: number }> = {};
    tables.forEach((t, i) => {
      init[t.id] = {
        x: snap(t.posX ?? (GRID + (i % 5) * (TABLE_W + GRID * 3))),
        y: snap(t.posY ?? (GRID + Math.floor(i / 5) * (TABLE_H + GRID * 3))),
      };
    });
    return init;
  });

  useEffect(() => {
    setPositions(prev => {
      const next = { ...prev };
      tables.forEach((t, i) => {
        if (!next[t.id]) {
          next[t.id] = {
            x: snap(t.posX ?? (GRID + (i % 5) * (TABLE_W + GRID * 3))),
            y: snap(t.posY ?? (GRID + Math.floor(i / 5) * (TABLE_H + GRID * 3))),
          };
        }
      });
      return next;
    });
  }, [tables]);

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    canvasLeft: number;
    canvasTop: number;
    canvasWidth: number;
  } | null>(null);

  const [dragging, setDragging] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: ({ id, posX, posY }: { id: string; posX: number; posY: number }) =>
      api.patch(`/qr/tables/${id}`, { posX, posY }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
    onError: () => toast.error('Mövqe saxlanmadı'),
  });

  const addMutation = useMutation({
    mutationFn: (data: { branchId: string; number: string; section?: string }) =>
      api.post('/qr/tables', data),
    onSuccess: () => { toast.success('Masa əlavə edildi'); qc.invalidateQueries({ queryKey: ['tables'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const [addSection, setAddSection] = useState('');
  const nextNumber = String(Math.max(0, ...tables.map(t => Number(t.number) || 0)) + 1);

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pos = positions[id] ?? { x: 0, y: 0 };
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      canvasLeft: rect.left,
      canvasTop: rect.top,
      canvasWidth: rect.width,
    };
    setDragging(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [positions]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const tw = tableWidth(tables.find(t => t.id === d.id) ?? { shape: 'square' } as Table);
    const x = clamp(snap(d.origX + dx), 0, d.canvasWidth - tw);
    const y = clamp(snap(d.origY + dy), 0, CANVAS_H - TABLE_H);
    setPositions(prev => ({ ...prev, [d.id]: { x, y } }));
  }, [tables]);

  const onPointerUp = useCallback((_e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDragging(null);
    const pos = positions[d.id];
    if (!pos) return;
    if (pos.x !== d.origX || pos.y !== d.origY) {
      saveMutation.mutate({ id: d.id, posX: pos.x, posY: pos.y });
    }
  }, [positions, saveMutation]);

  const sections = Array.from(new Set(tables.map(t => t.section).filter(Boolean))) as string[];

  // Build merge relationships
  const mergedIds = new Set<string>(); // all tables in any merge (both sides)
  tables.forEach(t => {
    if (t.mergedWith) {
      mergedIds.add(t.id);
      mergedIds.add(t.mergedWith);
    }
  });

  // Merge pairs for SVG lines: [secondaryId, primaryId]
  const mergePairs = tables
    .filter(t => t.mergedWith)
    .map(t => ({ from: t.id, to: t.mergedWith! }));

  const tableCenter = (id: string, t: Table) => {
    const pos = positions[id] ?? { x: 0, y: 0 };
    const tw = tableWidth(t);
    return { cx: pos.x + tw / 2, cy: pos.y + TABLE_H / 2 };
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-success-500 inline-block" /> Boş
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-danger-500 inline-block" /> Dolu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-foreground-muted/30 inline-block" /> Deaktiv
          </span>
          {mergePairs.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-orange-400 inline-block" /> Birləşmiş
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="w-36">
            <AppSelect
              value={addSection}
              onChange={setAddSection}
              placeholder="Bölmə seç"
              options={['VIP', 'Terrace', 'Indoor', 'Bar'].map(s => ({ value: s, label: s }))}
            />
          </div>
          <button
            onClick={() => addMutation.mutate({ branchId, number: nextNumber, section: addSection || undefined })}
            disabled={addMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Masa əlavə et
          </button>
        </div>
      </div>

      {/* Section açarı */}
      {sections.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {sections.map(s => (
            <span key={s} className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', SECTION_COLORS[s] ?? 'border-border bg-surface text-foreground-muted')}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative rounded-2xl border-2 border-dashed border-border bg-surface-elevated overflow-hidden"
        style={{
          height: CANVAS_H,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: `${GRID}px ${GRID}px`,
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* SVG overlay — merge xətləri */}
        {mergePairs.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', zIndex: 10 }}
          >
            <defs>
              <marker id="merge-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <circle cx="3" cy="3" r="2" fill="#f97316" opacity="0.8" />
              </marker>
            </defs>
            {mergePairs.map(({ from, to }) => {
              const fromTable = tables.find(t => t.id === from);
              const toTable = tables.find(t => t.id === to);
              if (!fromTable || !toTable) return null;
              const a = tableCenter(from, fromTable);
              const b = tableCenter(to, toTable);
              const mx = (a.cx + b.cx) / 2;
              const my = (a.cy + b.cy) / 2;
              return (
                <g key={`${from}-${to}`}>
                  <line
                    x1={a.cx} y1={a.cy}
                    x2={b.cx} y2={b.cy}
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    opacity="0.7"
                  />
                  {/* Mərkəzdə link ikonu yerinə dairə */}
                  <circle cx={mx} cy={my} r="10" fill="#f97316" opacity="0.15" />
                  <circle cx={mx} cy={my} r="10" fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.6" />
                  {/* Birləşmə ikonu — sadə x işarəsi */}
                  <line x1={mx - 4} y1={my - 4} x2={mx + 4} y2={my + 4} stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
                  <line x1={mx + 4} y1={my - 4} x2={mx - 4} y2={my + 4} stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
                </g>
              );
            })}
          </svg>
        )}

        {tables.map(table => {
          const pos = positions[table.id] ?? { x: 0, y: 0 };
          const tw = tableWidth(table);
          const isDragging = dragging === table.id;
          const isMerged = mergedIds.has(table.id);
          const isSecondary = !!table.mergedWith;
          const primaryTable = isSecondary ? tables.find(t => t.id === table.mergedWith) : null;

          return (
            <div
              key={table.id}
              onPointerDown={e => onPointerDown(e, table.id)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: tw,
                height: TABLE_H,
                touchAction: 'none',
                zIndex: isDragging ? 20 : isMerged ? 5 : 1,
                transform: isDragging ? 'scale(1.06)' : 'scale(1)',
                transition: isDragging ? 'none' : 'transform 0.15s ease',
                userSelect: 'none',
              }}
              className={cn(
                'flex flex-col items-center justify-center border-2 cursor-grab active:cursor-grabbing',
                tableShapeClass(table),
                tableColorClass(table, isMerged),
                isMerged && 'ring-2 ring-orange-400/50',
                table.status === 'occupied' && !isMerged && 'ring-2 ring-danger-500',
                table.status === 'inactive' && 'opacity-40',
                isDragging && 'shadow-2xl',
              )}
            >
              <Grip className="h-3 w-3 text-foreground-muted/30 absolute top-1 right-1" />

              {/* Birləşmə ikonu — sol üst */}
              {isMerged && (
                <Link2 className="h-3 w-3 text-orange-500 absolute top-1 left-1" />
              )}

              <span className="text-sm font-bold leading-none">{table.number}</span>

              {table.section && !isMerged && (
                <span className="text-[9px] font-medium mt-0.5 opacity-70">{table.section}</span>
              )}

              {/* Birləşmə məlumatı */}
              {isSecondary && primaryTable && (
                <span className="text-[8px] font-semibold mt-0.5 text-orange-600 leading-tight">
                  + {primaryTable.number}
                </span>
              )}
              {!isSecondary && isMerged && (
                <span className="text-[8px] font-semibold mt-0.5 text-orange-600 leading-tight">
                  əsas
                </span>
              )}

              {table.capacity && !isMerged && (
                <span className="flex items-center gap-0.5 text-[9px] mt-0.5 text-foreground-muted">
                  <Users className="h-2.5 w-2.5" />{table.capacity}
                </span>
              )}

              {/* Status indicator */}
              <span className={cn(
                'absolute bottom-1 right-1 h-2 w-2 rounded-full',
                table.status === 'occupied' ? 'bg-danger-500' :
                table.status === 'inactive' ? 'bg-foreground-muted/40' : 'bg-success-500',
              )} />
            </div>
          );
        })}

        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-foreground-muted text-sm">
            Masa tapılmadı — yuxarıdan əlavə edin
          </div>
        )}
      </div>

      <p className="text-xs text-foreground-muted">
        Masaları sürüklə-burax ilə yerləşdir. Mövqe şəbəkəyə yapışır və avtomatik saxlanılır.
        {mergePairs.length > 0 && (
          <span className="ml-2 text-orange-600 font-medium">
            · {mergePairs.length} birləşmə aktiv
          </span>
        )}
      </p>
    </div>
  );
}
