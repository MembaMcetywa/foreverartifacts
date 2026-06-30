/**
 * Render graph types.
 *
 * All geometry is expressed in millimeters (mm).
 * No PDF, DPI, or pixel concepts appear in this layer.
 */

export interface RenderDocument {
  widthMm: number;
  heightMm: number;
  pages: RenderPage[];
}

export interface RenderPage {
  index: number;
  spreadIndex: number;
  side: 'left' | 'right';
  elements: RenderElement[];
}

export type RenderElement = RenderImageElement | RenderTextElement;

export interface RenderRect {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface RenderImageElement {
  type: 'image';
  fit: 'cover';
  rect: RenderRect;
  coverFrame: {
    widthMm: number;
    heightMm: number;
    offsetXMm: number;
  };
  assetId: string;
}

export interface RenderTextElement {
  type: 'text';
  rect: RenderRect;
  text: string;
  fontSizePt: number;
}
