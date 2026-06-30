
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
interface VerticalElementPlacement {
  id: string;
  y: {
    anchor: VerticalAnchor;
    offsetMm: number;
    heightMm: number;
  };
}

interface PageElementPlacement extends VerticalElementPlacement {
  placement: 'page';
  pageSide: PageSide;
  x: {
    cols: ColumnSpan;
  };
}

export interface PageImageElementPlacement extends PageElementPlacement {
  type: 'image';
  slotIndex: number;
  fit: ImageFit;
}

export interface SpreadImageElementPlacement
  extends VerticalElementPlacement {
  placement: 'spread';
  type: 'image';
  slotIndex: number;
  fit: ImageFit;
}

export type ImageElementPlacement =
  | PageImageElementPlacement
  | SpreadImageElementPlacement;

export interface TextElementPlacement extends PageElementPlacement {
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
          id: 'image_full_spread',
          placement: 'spread',
          type: 'image',
          slotIndex: 0,
          fit: 'cover',
          y: {
            anchor: 'top',
            offsetMm: 0,
            heightMm: 160,
          },
        },
      ],
    },

    {
      id: 'single_image_left',
      name: 'Single Image Left',
      description: 'A single image centered on the left page.',
      imageSlots: 1,

      elements: [
        {
          id: 'image_single_left',
          placement: 'page',
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
      id: 'single_image_right',
      name: 'Single Image Right',
      description: 'A single image centered on the right page.',
      imageSlots: 1,

      elements: [
        {
          id: 'image_single_right',
          placement: 'page',
          type: 'image',
          slotIndex: 0,
          fit: 'cover',
          pageSide: 'right',
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
      description: 'Two images balanced across the full spread.',
      imageSlots: 2,

      elements: [
        {
          id: 'image_left',
          placement: 'page',
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
        {
          id: 'image_right',
          placement: 'page',
          type: 'image',
          slotIndex: 1,
          fit: 'cover',
          pageSide: 'right',
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
  ],
};

/**
 * Convenience export for all v1 layout libraries.
 */
export const LAYOUT_LIBRARIES: LayoutLibrary[] = [SQUARE_210_LAYOUT_LIBRARY];
