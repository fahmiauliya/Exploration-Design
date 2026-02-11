/* ============================================================
   patterns.js — All pattern definitions
   Each pattern: name, slug, label, glslFn, glslCall, svgRender
   ============================================================ */

/* ---- SVG helper functions ---- */
function svgRect(x, y, w, h, fill) {
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${fill}"/>`;
}

function svgCircle(cx, cy, r, fill) {
    return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}"/>`;
}

function svgCircleStroke(cx, cy, r, stroke, sw) {
    return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="${stroke}" stroke-width="${sw.toFixed(2)}"/>`;
}

function svgLine(x1, y1, x2, y2, stroke, sw) {
    return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${stroke}" stroke-width="${sw.toFixed(2)}"/>`;
}

function svgPolygon(points, fill) {
    const pts = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    return `<polygon points="${pts}" fill="${fill}"/>`;
}

/* ============================================================
   PATTERN DEFINITIONS
   ============================================================ */
export const patterns = [

    /* --------------------------------------------------------
       0 — Plus (+)
       -------------------------------------------------------- */
    {
        name: 'Plus',
        slug: 'plus',
        label: '1. Plus (+)',

        glslFn: `
            float patPlus(vec2 lUv, float brightness) {
                float thick = 0.04;
                float len   = 0.35;
                return max(
                    step(abs(lUv.y), thick) * step(abs(lUv.x), len),
                    step(abs(lUv.x), thick) * step(abs(lUv.y), len)
                );
            }
        `,
        glslCall: 'patPlus(localUv, brightness)',

        svgRender(cx, cy, half, brightness, hex) {
            const tk = half * 0.08;
            const ln = half * 0.70;
            return [
                svgRect(cx - ln, cy - tk, ln * 2, tk * 2, hex),
                svgRect(cx - tk, cy - ln, tk * 2, ln * 2, hex),
            ];
        },
    },

    /* --------------------------------------------------------
       1 — ASCII (#, O, +, .)
       -------------------------------------------------------- */
    {
        name: 'ASCII',
        slug: 'ascii',
        label: '2. ASCII (#O+.)',

        glslFn: `
            float patASCII(vec2 lUv, float brightness) {
                float c = 0.0;
                if (brightness > 0.75) {
                    // '#' hash
                    float vL = step(abs(abs(lUv.x) - 0.15), 0.03) * step(abs(lUv.y), 0.35);
                    float hL = step(abs(abs(lUv.y) - 0.15), 0.03) * step(abs(lUv.x), 0.35);
                    c = max(vL, hL);
                } else if (brightness > 0.5) {
                    // 'O' ring
                    float d = length(lUv);
                    c = step(d, 0.35) - step(d, 0.25);
                } else if (brightness > 0.25) {
                    // '+' small plus
                    c = max(
                        step(abs(lUv.y), 0.03) * step(abs(lUv.x), 0.2),
                        step(abs(lUv.x), 0.03) * step(abs(lUv.y), 0.2)
                    );
                } else if (brightness > 0.05) {
                    // '.' dot
                    c = step(length(lUv), 0.06);
                }
                return c;
            }
        `,
        glslCall: 'patASCII(localUv, brightness)',

        svgRender(cx, cy, half, brightness, hex) {
            if (brightness > 0.75) {
                const lw = half * 0.06, sp = half * 0.70, off = half * 0.30;
                return [
                    svgRect(cx - off - lw, cy - sp, lw * 2, sp * 2, hex),
                    svgRect(cx + off - lw, cy - sp, lw * 2, sp * 2, hex),
                    svgRect(cx - sp, cy - off - lw, sp * 2, lw * 2, hex),
                    svgRect(cx - sp, cy + off - lw, sp * 2, lw * 2, hex),
                ];
            } else if (brightness > 0.5) {
                const outer = half * 0.70, inner = half * 0.50;
                return [svgCircleStroke(cx, cy, outer, hex, outer - inner)];
            } else if (brightness > 0.25) {
                const tk = half * 0.06, ln = half * 0.40;
                return [
                    svgRect(cx - ln, cy - tk, ln * 2, tk * 2, hex),
                    svgRect(cx - tk, cy - ln, tk * 2, ln * 2, hex),
                ];
            } else if (brightness > 0.05) {
                return [svgCircle(cx, cy, half * 0.12, hex)];
            }
            return [];
        },
    },

    /* --------------------------------------------------------
       2 — Symbols (*, =, :, .)
       -------------------------------------------------------- */
    {
        name: 'Symbols',
        slug: 'symbols',
        label: '3. Symbols (*=:.)',

        glslFn: `
            float patSymbols(vec2 lUv, float brightness) {
                float c = 0.0;
                if (brightness > 0.75) {
                    // '*' asterisk — 3 crossed lines
                    float l1 = step(abs(lUv.y), 0.03) * step(abs(lUv.x), 0.3);
                    float rx  = lUv.x * 0.5 - lUv.y * 0.866;
                    float ry  = lUv.x * 0.866 + lUv.y * 0.5;
                    float l2  = step(abs(ry), 0.03) * step(abs(rx), 0.3);
                    float rx2 = lUv.x * 0.5 + lUv.y * 0.866;
                    float ry2 = -lUv.x * 0.866 + lUv.y * 0.5;
                    float l3  = step(abs(ry2), 0.03) * step(abs(rx2), 0.3);
                    c = max(max(l1, l2), l3);
                } else if (brightness > 0.5) {
                    // '=' equals
                    float top = step(abs(lUv.y - 0.10), 0.03) * step(abs(lUv.x), 0.25);
                    float bot = step(abs(lUv.y + 0.10), 0.03) * step(abs(lUv.x), 0.25);
                    c = max(top, bot);
                } else if (brightness > 0.25) {
                    // ':' colon
                    float d1 = step(length(lUv - vec2(0.0, 0.12)), 0.06);
                    float d2 = step(length(lUv + vec2(0.0, 0.12)), 0.06);
                    c = max(d1, d2);
                } else if (brightness > 0.05) {
                    c = step(length(lUv), 0.04);
                }
                return c;
            }
        `,
        glslCall: 'patSymbols(localUv, brightness)',

        svgRender(cx, cy, half, brightness, hex) {
            if (brightness > 0.75) {
                const sLen = half * 0.60, sW = half * 0.06;
                return [
                    svgRect(cx - sLen, cy - sW, sLen * 2, sW * 2, hex),
                    svgLine(cx - sLen * 0.5, cy + sLen * 0.866, cx + sLen * 0.5, cy - sLen * 0.866, hex, sW * 2),
                    svgLine(cx - sLen * 0.5, cy - sLen * 0.866, cx + sLen * 0.5, cy + sLen * 0.866, hex, sW * 2),
                ];
            } else if (brightness > 0.5) {
                const eW = half * 0.50, eH = half * 0.06, eOff = half * 0.20;
                return [
                    svgRect(cx - eW, cy - eOff - eH, eW * 2, eH * 2, hex),
                    svgRect(cx - eW, cy + eOff - eH, eW * 2, eH * 2, hex),
                ];
            } else if (brightness > 0.25) {
                const dr = half * 0.12, dOff = half * 0.24;
                return [
                    svgCircle(cx, cy - dOff, dr, hex),
                    svgCircle(cx, cy + dOff, dr, hex),
                ];
            } else if (brightness > 0.05) {
                return [svgCircle(cx, cy, half * 0.08, hex)];
            }
            return [];
        },
    },

    /* --------------------------------------------------------
       3 — Dot Pixel (LED matrix)
       -------------------------------------------------------- */
    {
        name: 'Dot Pixel',
        slug: 'dotpixel',
        label: '4. Dot Pixel',

        glslFn: `
            float patDotPixel(vec2 lUv, float brightness) {
                // Constant large radius — all dots same size, color carries the info
                float dist = length(lUv);
                return smoothstep(0.44, 0.40, dist);
            }
        `,
        glslCall: 'patDotPixel(localUv, brightness)',

        svgRender(cx, cy, half, brightness, hex) {
            return [svgCircle(cx, cy, half * 0.82, hex)];
        },
    },

    /* --------------------------------------------------------
       4 — Lines (Scanline)
       Horizontal bars whose height scales with brightness
       -------------------------------------------------------- */
    {
        name: 'Lines',
        slug: 'lines',
        label: '5. Lines ☰',

        glslFn: `
            float patLines(vec2 lUv, float brightness) {
                float barH = mix(0.02, 0.22, brightness);
                return smoothstep(barH + 0.02, barH - 0.02, abs(lUv.y));
            }
        `,
        glslCall: 'patLines(localUv, brightness)',

        svgRender(cx, cy, half, brightness, hex) {
            const barH = (0.02 + brightness * 0.20) * half;
            const barW = half * 0.95;
            return [svgRect(cx - barW, cy - barH, barW * 2, barH * 2, hex)];
        },
    },

    /* --------------------------------------------------------
       5 — Diamond ◆
       Rotated square (Manhattan distance), size = brightness
       -------------------------------------------------------- */
    {
        name: 'Diamond',
        slug: 'diamond',
        label: '6. Diamond ◆',

        glslFn: `
            float patDiamond(vec2 lUv, float brightness) {
                float size = mix(0.04, 0.44, brightness);
                float d = abs(lUv.x) + abs(lUv.y);
                return smoothstep(size + 0.02, size - 0.02, d);
            }
        `,
        glslCall: 'patDiamond(localUv, brightness)',

        svgRender(cx, cy, half, brightness, hex) {
            const s = (0.04 + brightness * 0.40) * half;
            return [svgPolygon([
                [cx, cy - s], [cx + s, cy], [cx, cy + s], [cx - s, cy],
            ], hex)];
        },
    },

    /* --------------------------------------------------------
       6 — Cross-hatch ╳
       Layered diagonal lines, more layers = brighter
       -------------------------------------------------------- */
    {
        name: 'Cross-hatch',
        slug: 'crosshatch',
        label: '7. Cross-hatch ╳',

        glslFn: `
            float patCrosshatch(vec2 lUv, float brightness) {
                float c = 0.0;
                float lw = 0.03;
                float span = 0.40;
                // Diagonal /
                if (brightness > 0.15) {
                    c = max(c, step(abs(lUv.x + lUv.y), lw) * step(max(abs(lUv.x), abs(lUv.y)), span));
                }
                // Diagonal backslash
                if (brightness > 0.35) {
                    c = max(c, step(abs(lUv.x - lUv.y), lw) * step(max(abs(lUv.x), abs(lUv.y)), span));
                }
                // Horizontal —
                if (brightness > 0.55) {
                    c = max(c, step(abs(lUv.y), lw) * step(abs(lUv.x), span));
                }
                // Vertical |
                if (brightness > 0.75) {
                    c = max(c, step(abs(lUv.x), lw) * step(abs(lUv.y), span));
                }
                return c;
            }
        `,
        glslCall: 'patCrosshatch(localUv, brightness)',

        svgRender(cx, cy, half, brightness, hex) {
            const parts = [];
            const sp = half * 0.80;
            const sw = half * 0.06;
            if (brightness > 0.15) {
                parts.push(svgLine(cx - sp, cy + sp, cx + sp, cy - sp, hex, sw));
            }
            if (brightness > 0.35) {
                parts.push(svgLine(cx - sp, cy - sp, cx + sp, cy + sp, hex, sw));
            }
            if (brightness > 0.55) {
                parts.push(svgLine(cx - sp, cy, cx + sp, cy, hex, sw));
            }
            if (brightness > 0.75) {
                parts.push(svgLine(cx, cy - sp, cx, cy + sp, hex, sw));
            }
            return parts;
        },
    },

    /* --------------------------------------------------------
       7 — Blocks (Square Pixel)
       Filled squares, size = brightness → pixel art effect
       -------------------------------------------------------- */
    {
        name: 'Blocks',
        slug: 'blocks',
        label: '8. Blocks ■',

        glslFn: `
            float patBlocks(vec2 lUv, float brightness) {
                float size = mix(0.04, 0.46, brightness);
                float sq = max(abs(lUv.x), abs(lUv.y));
                return smoothstep(size + 0.01, size - 0.01, sq);
            }
        `,
        glslCall: 'patBlocks(localUv, brightness)',

        svgRender(cx, cy, half, brightness, hex) {
            const s = (0.04 + brightness * 0.42) * half;
            return [svgRect(cx - s, cy - s, s * 2, s * 2, hex)];
        },
    },
];

/* ============================================================
   BUILD HELPERS — used by app.js
   ============================================================ */

/** Combine all GLSL pattern functions into one string */
export function buildGlslFunctions() {
    return patterns.map((p) => p.glslFn).join('\n');
}

/** Build the GLSL if/else chain for mode switching */
export function buildGlslModeSwitch() {
    return patterns
        .map((p, i) => {
            if (i === 0) return `if (uMode < 0.5) { pattern = ${p.glslCall}; }`;
            if (i === patterns.length - 1) return `else { pattern = ${p.glslCall}; }`;
            return `else if (uMode < ${i + 0.5}) { pattern = ${p.glslCall}; }`;
        })
        .join('\n            ');
}
