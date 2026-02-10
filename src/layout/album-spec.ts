/**
 * AlbumSpec defines the physical and structural constraints
 * for an album format.
 *
 * All units are millimeters (mm) unless otherwise stated.
 * This file contains no logic — it is pure configuration + types.
 */

export interface PageFormat {
  widthMm: number;
  heightMm: number;
  isLayFlat: boolean;
}

export interface PageMargins {
  topMm: number;
  bottomMm: number;
  innerMm: number;
  outerMm: number;
}

export interface GridSpec {
  /**
   * Number of columns per single page.
   * Columns are 1-indexed in templates.
   */
  columnsPerPage: number;

  /**
   * Gutter size between columns.
   */
  gutterMm: number;

  /**
   * Baseline grid step used for all vertical rhythm.
   */
  baselineStepMm: number;

  /**
   * Page margins.
   * Inner/outer are resolved per page side.
   */
  margins: PageMargins;
}

export interface PageCountRules {
  /**
   * Minimum total page count.
   */
  min: number;

  /**
   * Maximum total page count.
   */
  max: number;

  /**
   * Allowed increment step (e.g. +4 pages).
   */
  step: number;

  /**
   * Default page count when creating a new album.
   */
  default: number;
}

export interface AlbumSpec {
  /**
   * Unique identifier for this album specification.
   * Used to bind templates and album drafts.
   */
  id: string;

  /**
   * Physical page format.
   */
  page: PageFormat;

  /**
   * Grid and layout system definition.
   */
  grid: GridSpec;

  /**
   * Rules governing allowed page counts.
   */
  pageCount: PageCountRules;
}

/**
 * v1 square album specification.
 * This is the canonical starting format.
 */
export const SQUARE_210_ALBUM_SPEC: AlbumSpec = {
  id: 'square_210_v1',

  page: {
    widthMm: 210,
    heightMm: 210,
    isLayFlat: true,
  },

  grid: {
    columnsPerPage: 8,
    gutterMm: 6,
    baselineStepMm: 4,
    margins: {
      topMm: 20,
      bottomMm: 28,
      innerMm: 22,
      outerMm: 16,
    },
  },

  pageCount: {
    min: 24,
    max: 64,
    step: 4,
    default: 24,
  },
};
