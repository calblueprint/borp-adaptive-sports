// Map-app marker: at rest a round white head (black rim, black glyph) sitting right on the spot, so the
// route stays quiet. Tapped, the same head lifts off the spot and a solid triangle slides out under it,
// pointing down at a dot left on the exact spot, with a few points of air between.
export const HEAD = 42; // head diameter, the same at rest and selected
export const RIM = 1.5;
export const M = 6; // room around the head for the shadow
export const GAP = 7; // air between the triangle's tip and the dot
export const DOT = 4; // dot radius, plus a white ring so it reads on the black route
export const DOT_RING = 1.5;

/**
 * The pin's parts for a head of radius r drawn `margin` in from the box: the round head, a solid triangle
 * stuck under it pointing down, the two together, and where the triangle's tip lands.
 */
export function bubbleShape(r: number, margin: number) {
  const cx = margin + r;
  const cy = margin + r;
  const tipX = cx;
  const tipY = cy + r * 1.3;
  const half = r * 0.3; // half the triangle's base, tucked up inside the head so the rim covers the join
  const baseY = cy + r * 0.8;
  const f = (n: number) => n.toFixed(2);
  const head = `M${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 1 ${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 1 ${f(cx - r)} ${f(cy)}Z`;
  const tail = `M${f(cx - half)} ${f(baseY)}L${f(cx + half)} ${f(baseY)}L${f(tipX)} ${f(tipY)}Z`;
  return {
    head,
    tail,
    d: head + tail,
    cx,
    cy,
    tipX,
    tipY,
    width: 2 * (margin + r),
    height: tipY + margin,
  };
}

export const SHAPE = bubbleShape(HEAD / 2, M);
export const BOX_W = SHAPE.width;
// The dot sits under the tip; its centre is the spot
export const DOT_X = SHAPE.tipX;
export const DOT_Y = SHAPE.tipY + GAP + DOT + DOT_RING;
export const BOX_H = DOT_Y + HEAD / 2 + M;
export const BUBBLE_H = SHAPE.height;
// At rest the head sits this far below where it floats when selected, centred on the spot
export const REST_DY = DOT_Y - SHAPE.cy;
