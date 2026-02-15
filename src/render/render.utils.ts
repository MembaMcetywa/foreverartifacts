/**
 * Rendering utilities.
 *
 * Unit conversion helpers only.
 * No layout or PDF logic belongs here.
 */

const MM_PER_INCH = 25.4;
const POINTS_PER_INCH = 72;

/**
 * Convert millimeters to PDF points.
 */
export function mmToPt(mm: number): number {
  return (mm / MM_PER_INCH) * POINTS_PER_INCH;
}

/**
 * Convert a rectangle from mm to pt.
 */
export function rectMmToPt(rect: {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}): {
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
} {
  return {
    xPt: mmToPt(rect.xMm),
    yPt: mmToPt(rect.yMm),
    widthPt: mmToPt(rect.widthMm),
    heightPt: mmToPt(rect.heightMm),
  };
}
