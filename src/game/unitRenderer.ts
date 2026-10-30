import { UnitTypeCode } from '../types/game';

const Sn = Math.sin;
const Cs = Math.cos;

/**
 * Procedural vector graphics model for each military unit and building
 */
export function drawUnitModel(
  q: CanvasRenderingContext2D,
  t: UnitTypeCode,
  factionColor: string,
  tm: number,
  isMoving: number,
  rc: number
): void {
  const w = isMoving ? tm / 55 : 0;
  const b = Sn(tm / 240) * (isMoving ? 1.4 : 0.9);
  const hv = Sn(tm / 230) * 2;

  const R = (x: number, y: number, rw: number, rh: number, f: string, r = 2) => {
    q.fillStyle = f;
    q.beginPath();
    if (q.roundRect) {
      q.roundRect(x, y, rw, rh, r);
    } else {
      q.rect(x, y, rw, rh);
    }
    q.fill();
  };

  const P = (f: string, ...p: number[]) => {
    q.fillStyle = f;
    q.beginPath();
    for (let i = 0; i < p.length; i += 2) {
      if (i === 0) q.moveTo(p[i], p[i + 1]);
      else q.lineTo(p[i], p[i + 1]);
    }
    q.closePath();
    q.fill();
  };

  const O = (x: number, y: number, r: number, f: string) => {
    q.fillStyle = f;
    q.beginPath();
    q.arc(x, y, r, 0, Math.PI * 2);
    q.fill();
  };

  const E = (x: number, y: number, a: number, c: number, f: string) => {
    q.fillStyle = f;
    q.beginPath();
    q.ellipse(x, y, a, c, 0, 0, Math.PI * 2);
    q.fill();
  };

  const L = (x: number, y: number, X: number, Y: number, c: string, l: number) => {
    q.strokeStyle = c;
    q.lineWidth = l;
    q.beginPath();
    q.moveTo(x, y);
    q.lineTo(X, Y);
    q.stroke();
  };

  const FL = (x: number, y: number, s = 6) => {
    if (rc > 0.5) {
      O(x, y, s * rc, 'rgba(255,238,160,.95)');
      O(x, y, s * rc * 0.5, '#fff');
    }
  };

  const D = '#1b2123';
  const M = '#55605a';
  const N2 = '#3a433e';
  const G = '#98a39c';
  const Gl = '#9ec3d1';
  const k = factionColor;

  const wh = (x: number, y: number, r: number) => {
    O(x, y, r, D);
    O(x, y, r * 0.55, N2);
    L(x + Cs(w * 4) * r * 0.8, y + Sn(w * 4) * r * 0.8, x - Cs(w * 4) * r * 0.8, y - Sn(w * 4) * r * 0.8, G, 1.4);
  };

  const tk = (a: number, z: number, y: number, h: number) => {
    R(a, y, z - a, h, D, h / 2);
    for (let x = a + h / 2; x <= z - h / 2 + 0.1; x += h * 0.8) {
      O(x, y + h / 2, h * 0.36, N2);
      O(x + Cs(w * 3 + x) * h * 0.26, y + h / 2 + Sn(w * 3 + x) * h * 0.26, 1, G);
    }
  };

  const sol = (hc: string, bc: string, it?: () => void, bk?: () => void) => {
    const s = Sn(w * 2) * 5;
    L(-3, 6, -3 + s, 15, D, 4);
    L(3, 6, 3 - s, 15, D, 4);
    if (bk) bk();
    R(-6, -7 + b, 12, 14, bc, 3);
    R(-6, 2 + b, 12, 3, k, 1);
    O(0, -11 + b, 5.2, '#c9a77c');
    q.fillStyle = hc;
    q.beginPath();
    q.arc(0, -12 + b, 6, Math.PI, 0);
    q.fill();
    R(-6, -12 + b, 12, 2, k, 0);
    if (it) it();
  };

  const gun = (l = 17, c = D) => {
    L(0, -1 + b, l - rc * 4, -1 + b, c, 3);
    FL(l + 3, -1 + b);
  };

  const X: Record<string, () => void> = {
    R: () => sol('#4b5a3d', '#3f4b36', () => gun(17)),
    G: () =>
      sol('#16191a', '#23282a', () => {
        gun(16, '#0d0f10');
        L(-5, -9 + b, -12, -7 + b + Sn(tm / 110) * 2.5, k, 2.5);
      }),
    S: () =>
      sol('#4d5b3b', '#56603f', () => {
        P('#46553a', -8, -5 + b, 0, -14 + b, 8, -5 + b);
        gun(25);
        R(8, -5 + b, 6, 2.5, G, 1);
      }),
    P: () =>
      sol(
        '#4b5a3d',
        '#3f4b36',
        () => {},
        () => {
          R(-14, -6 + b, 9, 13, N2, 2);
          L(-9.5, -3 + b, -9.5, 3 + b, '#8fbf7a', 2.4);
          L(-12.5, b, -6.5, b, '#8fbf7a', 2.4);
        }
      ),
    K: () =>
      sol(
        '#e6eae4',
        '#4b5a3d',
        () => {
          L(0, -17 + b, 0, -12 + b, '#e0554a', 2.4);
          L(-2.4, -14.5 + b, 2.4, -14.5 + b, '#e0554a', 2.4);
          O(13, -3 + b, 3 + Sn(tm / 180) * 1.4, '#8fbf7a');
          L(5, -2 + b, 12, -3 + b, '#c9a77c', 3);
        },
        () => R(-14, -3 + b, 8, 10, '#d9d3c0', 2)
      ),
    T: () =>
      sol('#4b5a3d', '#3f4b36', () => {
        R(-9 - rc * 3, -10 + b, 28, 5, N2, 2);
        P('#c2563f', 19 - rc * 3, -10 + b, 26 - rc * 3, -7.5 + b, 19 - rc * 3, -5 + b);
        if (rc > 0.5) O(-11, -7 + b, 7 * rc, 'rgba(255,200,110,.9)');
      }),
    Z: () =>
      sol('#4b5a3d', '#3f4b36', () => {
        L(2, 9, -5, 15, D, 2);
        L(5, 9, 11, 15, D, 2);
        R(3 - rc * 3, -5 + b, 20, 4, D, 1);
        R(-3, -2 + b, 6, 6, '#b08b3a', 1);
        FL(26, -3 + b, 7);
      }),
    N: () =>
      sol(
        '#e0b13a',
        '#4b5a3d',
        () => {
          L(6, 1 + b, 16, -8 + b, G, 3);
          O(17, -9 + b, 3, G);
        },
        () => R(-14, b, 8, 7, '#c2563f', 1)
      ),
    C: () => {
      wh(-11, 9, 6);
      wh(11, 9, 6);
      R(-18, -2 + b, 36, 10, M, 3);
      R(-7, -10 + b, 15, 9, k, 2);
      R(1, -8 + b, 6, 5, Gl, 1);
      L(-14, -2 + b, -17, -17 + b, G, 1);
      O(-17, -17 + b, 1.6 + Math.abs(Sn(tm / 200)), '#e0554a');
      R(9 - rc * 3, -14 + b, 12, 2.6, D, 1);
      FL(23, -13 + b, 6);
    },
    V: () => {
      const y = -4 + Sn(tm / 200) * 3;
      for (const s of [-1, 1]) {
        L(0, y, s * 14, y - 4, N2, 3);
        q.fillStyle = 'rgba(210,220,215,.55)';
        q.beginPath();
        q.ellipse(s * 14, y - 6, 4 + Math.abs(Sn(tm / 25)) * 7, 1.8, 0, 0, Math.PI * 2);
        q.fill();
        O(s * 14, y - 4, 2, D);
      }
      O(0, y, 6.5, D);
      O(0, y, 3, k);
      O(3, y, 1.6, '#e0554a');
      O(0, y + 8, 3.4, '#7a2a22');
      L(0, y + 4, 0, y + 6, G, 1.6);
    },
    M: () => {
      tk(-20, 20, 7, 9);
      P('#4d5a48', -20, 7, -16, -4 + b, 16, -4 + b, 21, 3 + b, 20, 7);
      R(-9, -12 + b, 17, 9, N2, 3);
      R(-9, -12 + b, 17, 3, k, 2);
      R(8 - rc * 4, -10 + b, 17, 2.6, D, 1);
      R(8 - rc * 4, -6.5 + b, 17, 2.6, D, 1);
      FL(26, -9 + b, 7);
    },
    B: () => {
      tk(-23, 23, 6, 10);
      P('#475245', -23, 6, -19, -5 + b, 19, -5 + b, 24, 3 + b, 23, 6);
      P('#566249', -11, -5 + b, -7, -15 + b, 10, -15 + b, 14, -5 + b);
      R(-8, -9 + b, 19, 2.4, k, 0);
      O(-2, -16 + b, 2.4, D);
      R(11 - rc * 8, -12 + b, 26, 3.6, D, 1);
      R(35 - rc * 8, -13.5 + b, 4, 6.6, N2, 1);
      FL(42, -10 + b, 10);
    },
    J: () => {
      tk(-25, 25, 4, 13);
      R(-25, -6 + b, 50, 13, '#3a423c', 3);
      P(G, 25, -6 + b, 32, b, 25, 6 + b);
      R(-25, -11 + b, 50, 5, N2, 2);
      R(-21, -3 + b, 42, 3, k, 0);
      R(-15, -20 + b, 17, 10, M, 3);
      R(2 - rc * 8, -18 + b, 30, 5, D, 2);
      R(8, -14 + b, 9, 5, N2, 2);
      R(15, b, 12, 4, '#a8463a', 2);
      O(30 + Sn(tm / 45), 2 + b, 2.6 + Sn(tm / 55), '#fb923c');
      FL(35 - rc * 8, -15.5 + b, 10);
    },
    A: () => {
      tk(-21, 21, 8, 9);
      R(-19, -4 + b, 36, 12, M, 3);
      R(-19, -11 + b, 12, 8, k, 2);
      R(-21, 2 + b, 3, 11, N2, 1);
      q.save();
      q.translate(3, -4 + b);
      q.rotate(-0.62);
      R(-rc * 9, -2.6, 36, 5, D, 1);
      R(30 - rc * 9, -4, 6, 8, N2, 1);
      q.restore();
      FL(33, -25 + b, 11);
    },
    L: () => {
      wh(-14, 9, 6);
      wh(2, 9, 6);
      wh(15, 9, 6);
      R(-21, -1 + b, 44, 9, N2, 2);
      R(13, -9 + b, 11, 10, k, 2);
      R(18, -7 + b, 5, 4, Gl, 1);
      q.save();
      q.translate(-15, -1 + b);
      q.rotate(-0.5);
      R(0, -10, 31, 12, M, 2);
      for (let i = 0; i < 3; i++) {
        R(3 - rc * 6, -9 + i * 3.8, 26, 2.6, '#b8483a', 1);
        P('#e0b868', 29, -9 + i * 3.8, 33, -7.7 + i * 3.8, 29, -6.4 + i * 3.8);
      }
      q.restore();
      FL(9, -22 + b, 11);
    },
    E: () => {
      wh(-10, 9, 6);
      wh(10, 9, 6);
      R(-19, -2 + b, 38, 10, M, 2);
      R(9, -10 + b, 11, 9, k, 2);
      R(-7, -9 + b, 3, 8, D, 1);
      q.save();
      q.translate(-5, -13 + b);
      q.rotate(Sn(tm / 450) * 0.5 - 0.4);
      E(0, 0, 4, 10, G);
      q.restore();
      q.strokeStyle = 'rgba(127,196,214,' + (0.35 + 0.5 * Math.abs(Sn(tm / 90))) + ')';
      q.lineWidth = 1.6;
      for (let i = 0; i < 2; i++) {
        q.beginPath();
        q.arc(-5, -13 + b, 9 + i * 6 + ((tm / 50) % 6), -0.9, 0.9);
        q.stroke();
      }
    },
    F: () => {
      const y = hv;
      P(M, -24, y, -10, -6 + y, 16, -5 + y, 28, y, 16, 5 + y, -10, 5 + y);
      P(Gl, 10, -5 + y, 16, -5 + y, 21, -1 + y, 11, -1 + y);
      P(N2, -6, y, 6, 2 + y, -4, 13 + y, -15, 13 + y);
      P(k, -24, y, -25, -12 + y, -14, -4 + y);
      R(-11, -1 + y, 16, 2.6, k, 0);
      E(29, y, 2, 9.5 * Math.abs(Cs(tm / 22)) + 1, 'rgba(210,220,215,.5)');
      O(-2, 8 + y, 2.6, D);
      O(5, 8 + y, 2.6, D);
    },
    Y: () => {
      const y = hv;
      R(-31, -3 + y, 20, 4, N2, 1);
      P(k, -31, -3 + y, -35, -13 + y, -27, -3 + y);
      E(-32, -8 + y, 2, 3 + Math.abs(Sn(tm / 20)) * 4, 'rgba(210,220,215,.5)');
      E(0, y, 17, 9, N2);
      P(Gl, 6, -5 + y, 14, -1 + y, 6, 2 + y);
      R(-6, 6 + y, 11, 4, k, 1);
      L(-11, 12 + y, 13, 12 + y, D, 2.2);
      L(-6, 7 + y, -6, 12 + y, D, 2);
      L(6, 8 + y, 6, 12 + y, D, 2);
      R(14 - rc * 3, 4 + y, 10, 2.6, D, 1);
      FL(27, 5 + y, 7);
      L(0, -9 + y, 0, -13 + y, D, 2.4);
      const x = Cs(tm / 38) * 29;
      L(-x, -13 + y, x, -13 + y, 'rgba(25,30,32,.9)', 2.4);
      E(0, -13 + y, 29, 2.4, 'rgba(210,220,215,.2)');
    },
    H: () => {
      R(-23, -2, 46, 18, '#2a3134', 2);
      R(-23, -2, 46, 4, k, 0);
      R(-17, -14, 34, 13, '#38413f', 2);
      for (let i = 0; i < 4; i++) {
        R(-13 + i * 8, -10, 5, 4, 'rgba(230,185,100,' + (0.65 + 0.3 * Sn(tm / 400 + i)) + ')', 1);
      }
      R(-19, -17, 38, 4, N2, 1);
      q.save();
      q.translate(11, -22);
      q.rotate(tm / 600);
      L(-9, 0, 9, 0, G, 2);
      O(0, 0, 2.6, D);
      q.restore();
      L(-13, -17, -13, -33, G, 1.6);
      O(-13, -34, 2.6, Sn(tm / 250) > 0 ? '#e0554a' : '#4a2a26');
      L(19, -17, 19, -31, G, 1.6);
      P(k, 19, -31, 30 + Sn(tm / 170) * 1.5, -28 + Sn(tm / 130), 19, -24);
    },
    O: () => {
      for (let i = 0; i < 5; i++) R(-19 + i * 8, 7, 9, 6, '#8a7a55', 3);
      R(-3, -14, 6, 21, '#4a4338', 1);
      R(-10, -19, 20, 6, '#5a5143', 1);
      P('#3a342b', -12, -19, 0, -27, 12, -19);
      L(0, -27, 0, -36, G, 1.4);
      P(k, 0, -36, 10, -33.5 + Sn(tm / 160) * 2, 0, -30);
    },
    W: () => {
      R(-24, -3, 48, 19, '#3a403a', 2);
      P('#2b3230', -27, -3, -19, -14, 19, -14, 27, -3);
      R(-27, -5, 54, 3, k, 0);
      R(-4, 6, 8, 10, '#14181a', 1);
      for (const x of [-17, 11]) R(x, 3, 7, 5, 'rgba(230,185,100,.7)', 1);
      for (let i = 0; i < 2; i++) {
        P(k, -13, -12 + i * 4, -8, -9.5 + i * 4, -3, -12 + i * 4, -3, -10 + i * 4, -8, -7.5 + i * 4, -13, -10 + i * 4);
      }
      R(15, 10, 8, 6, '#7a6a45', 1);
      L(22, -3, 22, -24, G, 1.4);
      P(k, 22, -24, 31, -22 + Sn(tm / 150) * 1.5, 22, -18);
    },
    D: () => {
      // Railgun Destroyer
      tk(-24, 24, 6, 10);
      P('#2d383b', -24, 6, -18, -6 + b, 18, -6 + b, 24, 6);
      R(-12, -11 + b, 24, 6, N2, 2);
      R(-12, -11 + b, 24, 2, k, 0);
      // Long railgun barrel with accelerator magnets
      L(-4 - rc * 6, -8 + b, 36 - rc * 6, -8 + b, D, 4);
      L(-4 - rc * 6, -5 + b, 36 - rc * 6, -5 + b, D, 4);
      for (let i = 0; i < 3; i++) {
        R(8 + i * 8 - rc * 6, -10 + b, 4, 8, '#22d3ee', 1);
      }
      FL(38 - rc * 6, -6.5 + b, 12);
    },
    U: () => {
      // Flak Halftrack
      wh(-15, 8, 5.5);
      tk(-5, 22, 6, 8);
      R(-18, -2 + b, 38, 9, M, 2);
      R(-14, -8 + b, 14, 7, k, 1);
      q.save();
      q.translate(6, -8 + b);
      q.rotate(-0.45);
      L(-rc * 4, -2, 24 - rc * 4, -2, D, 2.5);
      L(-rc * 4, 2, 24 - rc * 4, 2, D, 2.5);
      q.restore();
      FL(24, -18 + b, 8);
    },
    Q: () => {
      // Hovercraft Raider
      const hy = hv * 1.2;
      P('#354247', -22, 8 + hy, -16, -2 + hy, 16, -2 + hy, 22, 8 + hy);
      // Hover cushion skirt
      R(-24, 6 + hy, 48, 5, '#161a1d', 3);
      R(-12, -8 + hy, 24, 7, k, 2);
      R(2, -6 + hy, 8, 4, Gl, 1);
      // Glow under skirt
      q.strokeStyle = 'rgba(56,189,248,0.5)';
      q.lineWidth = 2;
      q.beginPath();
      q.ellipse(0, 12 + hy, 22, 4, 0, 0, Math.PI * 2);
      q.stroke();
      L(12 - rc * 3, -4 + hy, 24 - rc * 3, -4 + hy, D, 2.5);
      FL(26, -4 + hy, 6);
    },
    I: () => {
      // Infiltrator (Stealth Operative)
      sol(
        '#1a2022',
        '#1f272a',
        () => {
          // Night vision visor
          R(-4, -14 + b, 8, 2.5, '#22d3ee', 1);
          // Silenced precision rifle
          gun(22, '#111416');
          O(20, -1 + b, 2, D);
        },
        () => {
          R(-12, -4 + b, 7, 10, '#161b1d', 2);
        }
      );
    },
    X: () => {
      // Shock Trooper (Flamethrower Assault)
      sol(
        '#2a3532',
        '#232c2a',
        () => {
          // Heavy rebreather mask
          O(2, -9 + b, 2.8, '#b45309');
          // Flamethrower nozzle & pilot flame
          L(2, 2 + b, 19 - rc * 3, -1 + b, D, 3.5);
          O(20 - rc * 3, -1 + b, 2.5 + Math.abs(Sn(tm / 60)) * 1.5, '#f97316');
        },
        () => {
          // Dual fuel tanks on back
          R(-15, -9 + b, 6, 14, '#b45309', 2);
          R(-11, -9 + b, 6, 14, '#ea580c', 2);
        }
      );
    },
  };

  (X[t] || X.R)();
}
