
/**
 * Element types supported by the layout system.
 */
export type LayoutElementType = 'image' | 'caption' | 'metadata';

export type ImageFit = 'cover';

/**
 * Page side within a spread.
 */
export type PageSide = 'left' | 'right';

/**
 * Column-based horizontal placement.
 * Columns are 1-indexed.
 */
export interface ColumnSpan {
  startCol: number;
  span: number;
}

/**
 * Vertical anchoring within the content area.
 */
export type VerticalAnchor = 'top' | 'bottom';

/**
 * Placement definition for a single layout element.
 * This is declarative intent, not computed geometry.
 */
interface BaseElementPlacement {
  id: string;
  pageSide: PageSide;

  x: {
    cols: ColumnSpan;
  };

  y: {
    anchor: VerticalAnchor;
    offsetMm: number;
    heightMm: number;
  };
}

export interface ImageElementPlacement extends BaseElementPlacement {
  type: 'image';
  slotIndex: number;
  fit: ImageFit;
}

export interface TextElementPlacement extends BaseElementPlacement {
  type: Exclude<LayoutElementType, 'image'>;
}

export type ElementPlacement =
  | ImageElementPlacement
  | TextElementPlacement;

/**
 * Layout template definition.
 */
export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;

  /**
   * Number of image slots this template exposes.
   * Used for instance validation.
   */
  imageSlots: number;

  elements: ElementPlacement[];
}

/**
 * Layout library bound to a specific AlbumSpec.
 */
export interface LayoutLibrary {
  albumSpecId: string;
  templates: LayoutTemplate[];
}

/**
 * v1 layout templates for the 210mm square album.
 */
export const SQUARE_210_LAYOUT_LIBRARY: LayoutLibrary = {
  albumSpecId: 'square_210_v1',

  templates: [
    {
      id: 'full_spread_image',
      name: 'Full Spread Image',
      description: 'A single image spanning both pages.',
      imageSlots: 1,

      elements: [
        {
          id: 'image_full_left',
          type: 'image',
          slotIndex: 0,
          fit: 'cover',
          pageSide: 'left',
          x: {
            cols: { startCol: 1, span: 8 },
          },
          y: {
            anchor: 'top',
            offsetMm: 0,
            heightMm: 160,
          },
        },
        {
          id: 'image_full_right',
          type: 'image',
          slotIndex: 0,
          fit: 'cover',
          pageSide: 'right',
          x: {
            cols: { startCol: 1, span: 8 },
          },
          y: {
            anchor: 'top',
            offsetMm: 0,
            heightMm: 160,
          },
        },
      ],
    },

    {
      id: 'single_page_image',
      name: 'Single Page Image',
      description: 'A single image centered on one page.',
      imageSlots: 1,

      elements: [
        {
          id: 'image_single_left',
          type: 'image',
          slotIndex: 0,
          fit: 'cover',
          pageSide: 'left',
          x: {
            cols: { startCol: 2, span: 6 },
          },
          y: {
            anchor: 'top',
            offsetMm: 0,
            heightMm: 144,
          },
        },
      ],
    },

    {
      id: 'balanced_pair',
      name: 'Balanced Pair',
      description: 'Two images balanced evenly across the page.',
      imageSlots: 2,

      elements: [
        {
          id: 'image_left',
          type: 'image',
          slotIndex: 0,
          fit: 'cover',
          pageSide: 'left',
          x: {
            cols: { startCol: 1, span: 4 },
          },
          y: {
            anchor: 'top',
            offsetMm: 0,
            heightMm: 120,
          },
        },
        {
          id: 'image_right',
          type: 'image',
          slotIndex: 1,
          fit: 'cover',
          pageSide: 'left',
          x: {
            cols: { startCol: 5, span: 4 },
          },
          y: {
            anchor: 'top',
            offsetMm: 0,
            heightMm: 120,
          },
        },
      ],
    },
  ],
};

/**
 * Convenience export for all v1 layout libraries.
 */
export const LAYOUT_LIBRARIES: LayoutLibrary[] = [SQUARE_210_LAYOUT_LIBRARY];
