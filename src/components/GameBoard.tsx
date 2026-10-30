import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TacticalEngine } from '../game/engine';
import { drawUnitModel } from '../game/unitRenderer';
import { FACTION_COLORS, AIR_UNITS, NEUTRAL_COLOR, COSMETIC_SKINS } from '../game/constants';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair, 
  Move, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Expand, 
  Shrink,
  Radar
} from 'lucide-react';

interface GameBoardProps {
  engine: TacticalEngine;
  onTileClick: (x: number, y: number) => void;
  graphicsQuality: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  engine,
  onTileClick,
  graphicsQuality,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isTheater, setIsTheater] = useState<boolean>(false);
  const [showDpad, setShowDpad] = useState<boolean>(true);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);

  // Background caching
  const renderBackground = useCallback(
    (N: number, C: number) => {
      if (!bgCanvasRef.current) {
        bgCanvasRef.current = document.createElement('canvas');
      }
      const bg = bgCanvasRef.current;
      bg.width = bg.height = N * C;
      const g = bg.getContext('2d');
      if (!g) return;

      g.textAlign = 'center';
      g.textBaseline = 'middle';

      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          g.fillStyle = (x + y) % 2 ? '#222926' : '#1d2320';
          g.fillRect(x * C, y * C, C, C);
          g.strokeStyle = 'rgba(212,217,211,0.06)';
          g.lineWidth = 1;
          g.strokeRect(x * C + 0.5, y * C + 0.5, C, C);

          // Obstacles
          const obVal = engine.ob[y]?.[x];
          if (obVal) {
            const cx = x * C + C / 2;
            const cy = y * C + C / 2;
            g.beginPath();
            if (obVal === 1) {
              // Rocky boulder
              g.moveTo(cx - 15, cy + 8);
              g.lineTo(cx - 9, cy - 9);
              g.lineTo(cx + 4, cy - 13);
              g.lineTo(cx + 15, cy - 2);
              g.lineTo(cx + 11, cy + 10);
              g.closePath();
              g.fillStyle = '#161a18';
              g.strokeStyle = '#4a544e';
            } else {
              // Concrete barrier ruin
              g.moveTo(cx - 20, cy + 14);
              g.lineTo(cx - 6, cy - 14);
              g.lineTo(cx + 2, cy - 2);
              g.lineTo(cx + 10, cy - 10);
              g.lineTo(cx + 21, cy + 14);
              g.closePath();
              g.fillStyle = '#121614';
              g.strokeStyle = '#5f6962';
            }
            g.fill();
            g.lineWidth = 1.5;
            g.stroke();
          }
        }
      }

      // Coordinate labels
      g.font = `${N > 15 ? 12 : 10}px JetBrains Mono, monospace`;
      g.fillStyle = 'rgba(212,217,211,0.35)';
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcd';
      for (let i = 0; i < N; i++) {
        g.fillText(letters[i] || `${i + 1}`, i * C + C / 2, 8);
        g.fillText(`${i + 1}`, 8, i * C + C / 2);
      }
    },
    [engine.ob]
  );

  useEffect(() => {
    renderBackground(engine.N, engine.C);
  }, [engine.N, engine.C, engine.ob, renderBackground]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    let animId: number;

    const render = () => {
      const { N, C } = engine;
      const totalSize = N * C;

      if (canvas.width !== totalSize || canvas.height !== totalSize) {
        canvas.width = canvas.height = totalSize;
      }

      const now = performance.now();
      const vis = engine.getVisibilityMap(engine.view);

      g.clearRect(0, 0, totalSize, totalSize);
      g.save();

      // Screen Shake
      if (engine.shake > 0.4) {
        g.translate((Math.random() - 0.5) * engine.shake, (Math.random() - 0.5) * engine.shake);
        engine.shake *= 0.9;
      }

      // 1. Draw cached background
      if (bgCanvasRef.current) {
        g.drawImage(bgCanvasRef.current, 0, 0);
      }

      // 2. Scorch marks
      engine.scorch.forEach((sc) => {
        if (vis[sc.y * N + sc.x]) {
          g.globalAlpha = sc.a;
          g.fillStyle = '#080a09';
          g.beginPath();
          g.ellipse((sc.x + 0.5) * C, (sc.y + 0.5) * C + 6, sc.r, sc.r * 0.55, 0, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
        }
      });

      // 3. Tile Highlights
      const drawBox = (color: string, x: number, y: number, alpha: number, dashed = false) => {
        g.globalAlpha = alpha;
        g.fillStyle = color;
        g.fillRect(x * C + 1, y * C + 1, C - 2, C - 2);
        g.globalAlpha = Math.min(1, alpha + 0.4);
        g.strokeStyle = color;
        g.lineWidth = 1;
        if (dashed) g.setLineDash([4, 3]);
        g.strokeRect(x * C + 1.5, y * C + 1.5, C - 3, C - 3);
        g.setLineDash([]);
        g.globalAlpha = 1;
      };

      const drawBrackets = (x: number, y: number, color: string) => {
        g.strokeStyle = color;
        g.lineWidth = 2;
        g.beginPath();
        const pts = [
          [x * C + 3, y * C + 3, 1, 1],
          [(x + 1) * C - 3, y * C + 3, -1, 1],
          [x * C + 3, (y + 1) * C - 3, 1, -1],
          [(x + 1) * C - 3, (y + 1) * C - 3, -1, -1],
        ];
        for (const [px, py, sx, sy] of pts) {
          g.moveTo(px + sx * 7, py);
          g.lineTo(px, py);
          g.lineTo(px, py + sy * 7);
        }
        g.stroke();
      };

      // Movement tiles (blue)
      engine.hl.m.forEach((c) => drawBox('#38bdf8', c.x, c.y, 0.22));

      // Range tiles (red)
      engine.hl.r.forEach(([x, y]) => drawBox('#f87171', x, y, 0.15));

      // Deployment tiles (gold)
      engine.hl.s.forEach(([x, y]) => drawBox('#d3a85a', x, y, 0.3, true));

      // Attack Targets
      engine.hl.t.forEach((e) => {
        drawBox('#f87171', e.x, e.y, 0.25 + 0.12 * Math.sin(now / 180));
        drawBrackets(e.x, e.y, '#fca5a5');
      });

      // Capturable buildings
      engine.hl.c.forEach((e) => {
        drawBox('#facc15', e.x, e.y, 0.24 + 0.12 * Math.sin(now / 180));
        drawBrackets(e.x, e.y, '#facc15');
      });

      // 4. Fog of War
      if (!engine.fogOff) {
        g.fillStyle = 'rgba(7,9,11,0.76)';
        g.beginPath();
        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            if (!vis[y * N + x]) {
              g.rect(x * C, y * C, C, C);
            }
          }
        }
        g.fill();
      }

      // 5. Units & Structures
      const sortedUnits = [...engine.U].sort((a, b) => {
        const aAir = AIR_UNITS.includes(a.t) ? 9 : 0;
        const bAir = AIR_UNITS.includes(b.t) ? 9 : 0;
        return a.ry - b.ry + aAir - bAir;
      });

      sortedUnits.forEach((e) => {
        const bp = engine.getBlueprint(e.t);
        const isVisible = vis[Math.round(e.ry) * N + Math.round(e.rx)] || e.o === engine.view;

        // Enemy units inside fog are hidden (unless neutral building)
        if (!isVisible && !(bp.bl && e.t !== 'H')) return;

        const isAir = AIR_UNITS.includes(e.t);
        const isFriendly = e.o === engine.view;
        const isDamagedFlash = now - (e.fl || 0) < 250;
        const X = (e.rx + 0.5) * C + e.wx + (isDamagedFlash ? (Math.random() - 0.5) * 5 : 0);
        const Y = (e.ry + 0.5) * C;
        let factionColor = isVisible && e.o >= 0 ? FACTION_COLORS[e.o] : NEUTRAL_COLOR;
        if (isVisible && e.o === 0 && engine.profile?.activeSkin) {
          const equippedSkin = COSMETIC_SKINS.find((s) => s.id === engine.profile?.activeSkin);
          if (equippedSkin && equippedSkin.accentColor) {
            factionColor = equippedSkin.accentColor;
          }
        }
        const isDone =
          e.o === engine.cur &&
          isFriendly &&
          !bp.bl &&
          !engine.canUnitMove(e) &&
          !engine.canUnitAct(e) &&
          !engine.getCapturableBuildings(e).length;

        const ly = Y - (isAir ? 10 : 0) - 2;
        e.rc *= 0.9;

        // Ground shadow
        g.globalAlpha = isVisible ? 1 : 0.45;
        g.fillStyle = 'rgba(0,0,0,0.45)';
        g.beginPath();
        g.ellipse(X + (isAir ? 8 : 0), Y + 16 + (isAir ? 8 : 0), bp.bl ? 26 : isAir ? 13 : 19, isAir ? 4 : 6, 0, 0, Math.PI * 2);
        g.fill();

        // Tactical selection ring
        g.strokeStyle = factionColor;
        g.lineWidth = isFriendly ? 2.5 : 1.5;
        g.setLineDash(isFriendly || e.o < 0 ? [] : [5, 3]);
        g.beginPath();
        g.ellipse(X, Y + 15, bp.bl ? 27 : 21, bp.bl ? 9 : 7, 0, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);

        if (e === engine.sel) {
          const z = Math.sin(now / 150);
          g.globalAlpha = 0.6 + 0.3 * z;
          g.strokeStyle = '#facc15';
          g.lineWidth = 2.5;
          g.beginPath();
          g.ellipse(X, Y + 15, (bp.bl ? 32 : 26) + z * 2, (bp.bl ? 12 : 10) + z, 0, 0, Math.PI * 2);
          g.stroke();
        }

        // Draw Unit Model
        g.save();
        g.translate(X, ly);
        const scaleFactor = e.t === 'H' ? 1.15 : 1;
        g.scale((bp.bl ? 1 : e.dr) * scaleFactor, scaleFactor);
        g.globalAlpha = (isDone ? 0.55 : 1) * (isVisible ? 1 : 0.45);
        drawUnitModel(g, e.t, factionColor, now + e.ph, e.mw, e.rc);
        g.restore();

        // Flash on damage
        if (isDamagedFlash) {
          g.globalAlpha = 0.7 * (1 - (now - (e.fl || 0)) / 250);
          g.fillStyle = '#fff';
          g.beginPath();
          g.ellipse(X, ly, 19, 17, 0, 0, Math.PI * 2);
          g.fill();
        }

        // Frozen / EMP effect
        if (e.fz) {
          g.globalAlpha = 0.8;
          g.strokeStyle = '#7fc4d6';
          g.lineWidth = 1.5;
          for (let i = 0; i < 2; i++) {
            g.beginPath();
            g.moveTo(X - 16, ly - 12 + Math.random() * 24);
            g.lineTo(X + 16, ly - 12 + Math.random() * 24);
            g.stroke();
          }
          g.fillStyle = 'rgba(127,196,214,0.25)';
          g.beginPath();
          g.ellipse(X, ly, 20, 18, 0, 0, Math.PI * 2);
          g.fill();
        }

        // Health bar & badges
        g.globalAlpha = 1;
        if (isVisible) {
          const hpRatio = e.hp / e.maxHp;
          const by = Y + 21;
          g.fillStyle = '#0b0e0f';
          g.fillRect(X - 18, by, 36, 4);
          g.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
          g.fillRect(X - 18, by, 36 * Math.max(0, hpRatio), 4);

          g.font = '700 10px JetBrains Mono, monospace';
          if (e.cd > 0 && e.o >= 0) {
            g.fillStyle = '#38bdf8';
            g.fillText(`CD${e.cd}`, X + 20, Y - 20);
          }
          if (e.am === 0 || e.fu === 0) {
            g.fillStyle = '#f59e0b';
            g.fillText('!', X - 20, Y - 20);
          }
        }
      });

      // 6. Projectiles and FX
      engine.fx.forEach((f) => {
        if (f.f === 'r') {
          // Shockwave ring
          if (vis[f.y * N + f.x]) {
            g.globalAlpha = 1 - f.k;
            g.strokeStyle = f.c;
            g.lineWidth = 3.5;
            g.beginPath();
            g.arc((f.x + 0.5) * C, (f.y + 0.5) * C, f.k * (f.R || 70), 0, Math.PI * 2);
            g.stroke();
            g.globalAlpha = 1;
          }
        } else if (f.f === 't') {
          // Floating Text
          g.fillStyle = f.c;
          g.font = '700 20px JetBrains Mono, monospace';
          g.textAlign = 'center';
          g.fillText(f.s || '', (f.x + 0.5) * C, (f.y + 0.2) * C - f.k * 32);
        } else if (f.seen) {
          const X = (f.x + 0.5) * C;
          const Y = (f.y + 0.5) * C;
          if (f.f === 'p') {
            g.strokeStyle = g.fillStyle = f.c;
            if (f.l) {
              g.lineWidth = 3;
              g.beginPath();
              g.moveTo(((f.ox || 0) + 0.5) * C, ((f.oy || 0) + 0.5) * C);
              g.lineTo(X, Y);
              g.stroke();
            } else {
              g.beginPath();
              g.arc(X, Y - (f.h || 0), f.r || 3, 0, Math.PI * 2);
              g.fill();
            }
          } else if (f.big) {
            const k = f.k;
            const R = (0.3 + 0.7 * Math.sqrt(k)) * 92;
            const a = 1 - k;
            const gr = g.createRadialGradient(X, Y, 0, X, Y, R);
            gr.addColorStop(0, `rgba(255,255,235,${a})`);
            gr.addColorStop(0.3, `rgba(255,205,90,${0.95 * a})`);
            gr.addColorStop(0.7, `rgba(240,100,30,${0.6 * a})`);
            gr.addColorStop(1, 'rgba(110,30,10,0)');
            g.fillStyle = gr;
            g.beginPath();
            g.arc(X, Y, R, 0, Math.PI * 2);
            g.fill();
          } else {
            g.globalAlpha = 1 - f.k;
            g.fillStyle = f.c;
            g.beginPath();
            g.arc(X, Y, f.k * (f.b ? 46 : 26), 0, Math.PI * 2);
            g.fill();
            g.globalAlpha = 1;
          }
        }
      });

      // 7. Particles
      if (engine.pt.length > 300) engine.pt.splice(0, engine.pt.length - 300);
      engine.pt = engine.pt.filter((p) => p.l > 0);
      engine.pt.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 + (p.gv || 0);
        p.l -= p.d;
        if (vis[p.gy * N + p.gx]) {
          g.globalAlpha = Math.max(0, p.l);
          g.fillStyle = p.c;
          g.beginPath();
          g.arc(p.x, p.y, p.s * p.l + 0.5, 0, Math.PI * 2);
          g.fill();
        }
      });
      g.globalAlpha = 1;

      // 8. Screen Flash
      if (engine.flash > 0.02) {
        g.fillStyle = `rgba(255,236,190,${engine.flash * 0.4})`;
        g.fillRect(0, 0, totalSize, totalSize);
        engine.flash *= 0.85;
      }

      g.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, graphicsQuality]);

  // Fit board neatly into container
  const fitBoard = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;
    const totalSize = engine.N * engine.C;
    const pad = 48;
    const availableW = Math.max(100, clientWidth - pad);
    const availableH = Math.max(100, clientHeight - pad);
    // Allow generous sizing so 15x15 fills the view comfortably, and 30x30 scales neatly
    const fitZoom = Math.min(1.4, Math.max(0.35, Math.min(availableW / totalSize, availableH / totalSize)));
    const initialPanX = (clientWidth - totalSize * fitZoom) / 2;
    const initialPanY = (clientHeight - totalSize * fitZoom) / 2;
    setZoom(+fitZoom.toFixed(2));
    setPan({ x: Math.round(initialPanX), y: Math.round(initialPanY) });
  }, [engine.N, engine.C]);

  // Center on selected unit or active HQ
  const centerOnSelection = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const C = engine.C;

    let targetX = engine.N / 2;
    let targetY = engine.N / 2;

    if (engine.sel) {
      targetX = engine.sel.x + 0.5;
      targetY = engine.sel.y + 0.5;
    } else {
      const hq = engine.U.find((u) => u.t === 'H' && u.o === engine.cur);
      if (hq) {
        targetX = hq.x + 0.5;
        targetY = hq.y + 0.5;
      }
    }

    setPan({
      x: Math.round(clientWidth / 2 - targetX * C * zoom),
      y: Math.round(clientHeight / 2 - targetY * C * zoom),
    });
  }, [engine.sel, engine.U, engine.cur, engine.N, engine.C, zoom]);

  // Initial fit and resize listener
  useEffect(() => {
    fitBoard();
    const timer = setTimeout(fitBoard, 60);
    window.addEventListener('resize', fitBoard);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', fitBoard);
    };
  }, [engine.N, isTheater, fitBoard]);

  // Keyboard navigation for maneuvering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const step = 60;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setPan((p) => ({ ...p, y: p.y + step }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setPan((p) => ({ ...p, y: p.y - step }));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setPan((p) => ({ ...p, x: p.x + step }));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setPan((p) => ({ ...p, x: p.x - step }));
      } else if (e.key === '+' || e.key === '=') {
        handleZoomBy(0.15);
      } else if (e.key === '-' || e.key === '_') {
        handleZoomBy(-0.15);
      } else if (e.key === 'r' || e.key === 'R') {
        fitBoard();
      } else if (e.key === ' ' || e.key === 'c' || e.key === 'C') {
        centerOnSelection();
      } else if (e.key === 'Escape' && isTheater) {
        setIsTheater(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitBoard, centerOnSelection, isTheater]);

  const handleZoomBy = (delta: number) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;

    setZoom((prevZoom) => {
      const nextZoom = Math.min(2.5, Math.max(0.35, +(prevZoom + delta).toFixed(2)));
      if (nextZoom === prevZoom) return prevZoom;

      setPan((prevPan) => {
        const worldX = (centerX - prevPan.x) / prevZoom;
        const worldY = (centerY - prevPan.y) / prevZoom;
        return {
          x: Math.round(centerX - worldX * nextZoom),
          y: Math.round(centerY - worldY * nextZoom),
        };
      });

      return nextZoom;
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomMultiplier = e.deltaY < 0 ? 1.14 : 0.88;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(2.5, Math.max(0.35, +(prevZoom * zoomMultiplier).toFixed(2)));
      if (nextZoom === prevZoom) return prevZoom;

      setPan((prevPan) => {
        const worldX = (mouseX - prevPan.x) / prevZoom;
        const worldY = (mouseY - prevPan.y) / prevZoom;
        return {
          x: Math.round(mouseX - worldX * nextZoom),
          y: Math.round(mouseY - worldY * nextZoom),
        };
      });

      return nextZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: pan.x, y: pan.y };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        hasDraggedRef.current = true;
      }
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const tileX = Math.floor((clientX / rect.width) * engine.N);
      const tileY = Math.floor((clientY / rect.height) * engine.N);
      if (engine.inBounds(tileX, tileY)) {
        setHoveredTile({ x: tileX, y: tileY });
      } else {
        setHoveredTile(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      if (!hasDraggedRef.current && e.button === 0 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        const tileX = Math.floor((clientX / rect.width) * engine.N);
        const tileY = Math.floor((clientY / rect.height) * engine.N);
        if (engine.inBounds(tileX, tileY)) {
          onTileClick(tileX, tileY);
        }
      }
    }
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Touch maneuvers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { x: pan.x, y: pan.y };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 5) {
        hasDraggedRef.current = true;
      }
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      const nextZoom = Math.min(2.5, Math.max(0.35, +(touchStartZoomRef.current * ratio).toFixed(2)));
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.changedTouches.length === 1 && isDraggingRef.current && !hasDraggedRef.current && canvasRef.current) {
      const touch = e.changedTouches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = touch.clientX - rect.left;
      const clientY = touch.clientY - rect.top;
      const tileX = Math.floor((clientX / rect.width) * engine.N);
      const tileY = Math.floor((clientY / rect.height) * engine.N);
      if (engine.inBounds(tileX, tileY)) {
        onTileClick(tileX, tileY);
      }
    }
    isDraggingRef.current = false;
    touchStartDistRef.current = null;
    setIsDragging(false);
  };

  // Nudge pan helper for D-Pad
  const nudgePan = (dx: number, dy: number) => {
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const totalBoardPixels = engine.N * engine.C;

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-2xl bg-[#0b0f13] border border-[#232c32] shadow-2xl overflow-hidden select-none transition-all ${
        isTheater ? 'fixed inset-0 z-50 rounded-none border-0' : 'w-full h-[76vh] md:h-[82vh] min-h-[640px]'
      }`}
    >
      {/* Top Bar Floating Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 bg-[#141b20]/95 backdrop-blur-md rounded-xl border border-[#2d373e] shadow-xl">
        <button
          onClick={() => handleZoomBy(-0.15)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            if (containerRef.current) {
              const { clientWidth, clientHeight } = containerRef.current;
              setPan({
                x: Math.round((clientWidth - totalBoardPixels) / 2),
                y: Math.round((clientHeight - totalBoardPixels) / 2),
              });
            }
          }}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
          title="Click to reset zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => handleZoomBy(0.15)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700/60 mx-0.5" />
        <button
          onClick={centerOnSelection}
          className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-900/40 rounded-lg transition-colors"
          title="Center Camera on Selected Unit / HQ (Space)"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={fitBoard}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Fit Entire Battlefield to Window (R)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowDpad(!showDpad)}
          className={`p-1.5 rounded-lg transition-colors ${showDpad ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Toggle On-Screen Maneuver D-Pad"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsTheater(!isTheater)}
          className={`p-1.5 rounded-lg transition-colors ${isTheater ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          title={isTheater ? 'Exit Full-Screen Battlefield (Esc)' : 'Expand to Full-Screen Battlefield'}
        >
          {isTheater ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
        </button>
      </div>

      {/* Hover Coordinate HUD with Beginner-Friendly Intel */}
      {hoveredTile && (() => {
        const u = engine.unitAt(hoveredTile.x, hoveredTile.y);
        const ob = engine.ob[hoveredTile.y]?.[hoveredTile.x];
        const isMoveTile = engine.hl.m.has(`${hoveredTile.x},${hoveredTile.y}`);
        const isAttackTile = engine.hl.t.some((t) => t.x === hoveredTile.x && t.y === hoveredTile.y);
        const isDeployTile = engine.hl.s.some(([x, y]) => x === hoveredTile.x && y === hoveredTile.y);

        let desc = `Tile ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[hoveredTile.x] || hoveredTile.x + 1}${hoveredTile.y + 1}`;
        let badgeColor = 'text-slate-300';

        if (u) {
          const bp = engine.getBlueprint(u.t);
          if (u.isDefendTarget) {
            desc = `★ DEFEND TARGET: ${u.customName || 'Allied Facility'} (${u.hp}/${u.maxHp} HP) · DO NOT LOSE`;
            badgeColor = 'text-blue-400 font-bold';
          } else if (u.isVip) {
            desc = `☠ VIP TARGET: ${u.customName || 'Prototype Boss'} (${u.hp}/${u.maxHp} HP) · DESTROY TO WIN`;
            badgeColor = 'text-rose-400 font-bold';
          } else if (bp.bl) {
            const ownerText = u.o === engine.cur ? 'Friendly' : u.o >= 0 ? 'Hostile' : 'Neutral';
            desc = u.t === 'H' 
              ? `${ownerText} HQ Fortress (${u.hp}/${u.maxHp} HP)` 
              : u.t === 'W'
              ? `${ownerText} Barracks (${u.hp}/${u.maxHp} HP)`
              : `${ownerText} Outpost (+1 Gold/turn)`;
            badgeColor = u.o === engine.cur ? 'text-cyan-400' : u.o >= 0 ? 'text-red-400' : 'text-amber-400';
          } else {
            const ownerText = u.o === engine.cur ? 'Friendly' : 'Hostile';
            desc = `${ownerText} ${bp.n} · HP ${u.hp}/${u.maxHp} · Mv ${engine.getMoveReach(u)}`;
            badgeColor = u.o === engine.cur ? 'text-cyan-400' : 'text-red-400';
          }
        } else if (ob) {
          desc = ob === 1 ? 'Rocky Boulder (Blocks movement & shots)' : 'Concrete Ruin (Obstacle)';
          badgeColor = 'text-amber-400';
        } else if (isAttackTile) {
          desc = 'Target In Weapon Range (Tap to Fire)';
          badgeColor = 'text-red-400';
        } else if (isMoveTile) {
          desc = 'Valid Move Destination (Tap to Move)';
          badgeColor = 'text-cyan-400';
        } else if (isDeployTile) {
          desc = 'Deployment Zone (Tap to Place Unit)';
          badgeColor = 'text-amber-400';
        }

        return (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-[#141a1e]/95 backdrop-blur-md rounded-xl border border-[#2d373e] text-xs font-mono shadow-xl">
            <Crosshair className={`w-3.5 h-3.5 ${badgeColor}`} />
            <span className={`font-semibold ${badgeColor}`}>{desc}</span>
          </div>
        );
      })()}

      {/* Maneuver Navigation Helper Pill */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-2 px-3 py-1 bg-[#12181d]/85 backdrop-blur-md rounded-full border border-[#252f36] text-[11px] text-slate-400 font-mono pointer-events-none shadow-lg">
        <Move className="w-3 h-3 text-cyan-400" />
        <span>Click & drag or WASD to maneuver · Scroll to zoom</span>
      </div>

      {/* MiniMap Tactical Radar (Bottom-Left) */}
      <div 
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const rx = (e.clientX - rect.left) / rect.width;
          const ry = (e.clientY - rect.top) / rect.height;
          const targetTileX = Math.floor(rx * engine.N);
          const targetTileY = Math.floor(ry * engine.N);
          if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            setPan({
              x: Math.round(clientWidth / 2 - (targetTileX + 0.5) * engine.C * zoom),
              y: Math.round(clientHeight / 2 - (targetTileY + 0.5) * engine.C * zoom),
            });
          }
        }}
        className="absolute bottom-3 left-3 z-20 bg-[#11171c]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#2d3840] shadow-2xl cursor-pointer group"
        title="Tactical Radar: Click anywhere to jump camera"
      >
        <div className="relative w-20 h-20 bg-[#0d1216] rounded-lg overflow-hidden border border-[#1e272f]">
          {/* Radar scanline animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

          {/* Unit dots on radar */}
          {engine.U.map((u) => {
            const xPercent = ((u.x + 0.5) / engine.N) * 100;
            const yPercent = ((u.y + 0.5) / engine.N) * 100;
            const color = u.o >= 0 ? FACTION_COLORS[u.o] : '#eab308';
            return (
              <span
                key={u.id}
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  backgroundColor: color,
                }}
                className={`absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  u.t === 'H' ? 'ring-1 ring-white w-2 h-2 z-10' : ''
                }`}
              />
            );
          })}

          {/* Current Viewport Camera Frustum Outline */}
          {containerRef.current && (() => {
            const { clientWidth, clientHeight } = containerRef.current;
            const left = Math.max(0, (-pan.x / (totalBoardPixels * zoom)) * 100);
            const top = Math.max(0, (-pan.y / (totalBoardPixels * zoom)) * 100);
            const width = Math.min(100, (clientWidth / (totalBoardPixels * zoom)) * 100);
            const height = Math.min(100, (clientHeight / (totalBoardPixels * zoom)) * 100);

            return (
              <div
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                }}
                className="absolute border border-cyan-400 bg-cyan-400/10 pointer-events-none rounded-[2px]"
              />
            );
          })()}
        </div>
        <div className="flex items-center justify-between mt-1 px-0.5 text-[9px] font-mono text-slate-400 group-hover:text-cyan-400">
          <span className="flex items-center gap-1">
            <Radar className="w-2.5 h-2.5 text-cyan-400" />
            <span>RADAR</span>
          </span>
          <span>{engine.N}x{engine.N}</span>
        </div>
      </div>

      {/* Maneuver D-Pad Controls (Bottom-Right) */}
      {showDpad && (
        <div className="absolute bottom-3 right-3 z-20 flex flex-col items-center bg-[#141b20]/95 backdrop-blur-md p-1.5 rounded-xl border border-[#2d373e] shadow-2xl">
          <button
            onClick={() => nudgePan(0, 70)}
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
            title="Pan Up (W / ↑)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => nudgePan(70, 0)}
              className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              title="Pan Left (A / ←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={centerOnSelection}
              className="p-1 text-cyan-400 hover:text-white hover:bg-cyan-900/40 rounded transition-colors"
              title="Center on Selection (Space)"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nudgePan(-70, 0)}
              className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              title="Pan Right (D / →)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => nudgePan(0, -70)}
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
            title="Pan Down (S / ↓)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Interactive Pannable & Zoomable Canvas Viewport */}
      <div
        className={`w-full h-full relative overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onMouseLeave={() => {
          setHoveredTile(null);
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
            setIsDragging(false);
          }
        }}
      >
        <div
          className="absolute will-change-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${totalBoardPixels}px`,
            height: `${totalBoardPixels}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={totalBoardPixels}
            height={totalBoardPixels}
            className="block rounded-lg shadow-2xl border border-[#202930]"
            style={{
              width: `${totalBoardPixels}px`,
              height: `${totalBoardPixels}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

