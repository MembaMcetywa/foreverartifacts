import { AlbumSpec } from './album-spec';
import {
  ColumnSpan,
  ElementPlacement,
  LayoutLibrary,
  LayoutTemplate,
} from './layout.templates';

/**
 * Validation severity levels.
 * All errors here are internal correctness failures.
 */
export type ValidationSeverity = 'error' | 'warning';

export type ValidationCode =
  | 'DUPLICATE_TEMPLATE_ID'
  | 'DUPLICATE_ELEMENT_ID'
  | 'INVALID_IMAGE_SLOT_COUNT'
  | 'INVALID_IMAGE_SLOT_INDEX'
  | 'INCOMPLETE_IMAGE_SLOT_MAPPING'
  | 'COLUMN_OUT_OF_RANGE'
  | 'COLUMN_SPAN_OVERFLOW'
  | 'BASELINE_NOT_SNAPPED'
  | 'NEGATIVE_OR_ZERO_DIMENSION'
  | 'OUTSIDE_CONTENT_BOUNDS'
  | 'INVALID_TEMPLATE_SHAPE';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: ValidationCode;
  message: string;
  templateId?: string;
  elementId?: string;
}

/**
 * Utilities
 */

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isBaselineSnapped(valueMm: number, stepMm: number): boolean {
  const epsilon = 0.001;
  const mod = Math.abs(valueMm % stepMm);
  return mod < epsilon || Math.abs(mod - stepMm) < epsilon;
}

/**
 * Column validation
 */
function validateColumnSpan(
  cols: ColumnSpan,
  gridColumns: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { startCol, span } = cols;

  if (!Number.isInteger(startCol) || !Number.isInteger(span)) {
    issues.push({
      severity: 'error',
      code: 'COLUMN_OUT_OF_RANGE',
      message: 'startCol and span must be integers.',
    });
    return issues;
  }

  if (startCol < 1 || startCol > gridColumns) {
    issues.push({
      severity: 'error',
      code: 'COLUMN_OUT_OF_RANGE',
      message: `startCol must be between 1 and ${gridColumns}.`,
    });
  }

  if (span < 1 || span > gridColumns) {
    issues.push({
      severity: 'error',
      code: 'COLUMN_OUT_OF_RANGE',
      message: `span must be between 1 and ${gridColumns}.`,
    });
  }

  const endCol = startCol + span - 1;
  if (endCol > gridColumns) {
    issues.push({
      severity: 'error',
      code: 'COLUMN_SPAN_OVERFLOW',
      message: `Column span overflows grid (endCol=${endCol}, max=${gridColumns}).`,
    });
  }

  return issues;
}

/**
 * Element-level validation
 */
function validateElement(
  album: AlbumSpec,
  templateId: string,
  element: ElementPlacement,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { grid, page } = album;

  // Column checks
  issues.push(
    ...validateColumnSpan(element.x.cols, grid.columnsPerPage).map((issue) => ({
      ...issue,
      templateId,
      elementId: element.id,
    })),
  );

  // Dimension checks
  if (!isNonNegative(element.y.offsetMm)) {
    issues.push({
      severity: 'error',
      code: 'NEGATIVE_OR_ZERO_DIMENSION',
      message: 'y.offsetMm must be >= 0.',
      templateId,
      elementId: element.id,
    });
  }

  if (!isPositive(element.y.heightMm)) {
    issues.push({
      severity: 'error',
      code: 'NEGATIVE_OR_ZERO_DIMENSION',
      message: 'y.heightMm must be > 0.',
      templateId,
      elementId: element.id,
    });
  }

  // Baseline snapping
  if (!isBaselineSnapped(element.y.offsetMm, grid.baselineStepMm)) {
    issues.push({
      severity: 'error',
      code: 'BASELINE_NOT_SNAPPED',
      message: `y.offsetMm=${element.y.offsetMm} does not align to baselineStepMm=${grid.baselineStepMm}.`,
      templateId,
      elementId: element.id,
    });
  }

  if (!isBaselineSnapped(element.y.heightMm, grid.baselineStepMm)) {
    issues.push({
      severity: 'error',
      code: 'BASELINE_NOT_SNAPPED',
      message: `y.heightMm=${element.y.heightMm} does not align to baselineStepMm=${grid.baselineStepMm}.`,
      templateId,
      elementId: element.id,
    });
  }

  // Content bounds check (vertical only; horizontal is guaranteed by columns)
  const contentTop = grid.margins.topMm;
  const contentBottom = page.heightMm - grid.margins.bottomMm;

  const topY =
    element.y.anchor === 'top'
      ? contentTop + element.y.offsetMm
      : contentBottom - element.y.offsetMm - element.y.heightMm;

  const bottomY = topY + element.y.heightMm;

  if (topY < contentTop || bottomY > contentBottom) {
    issues.push({
      severity: 'error',
      code: 'OUTSIDE_CONTENT_BOUNDS',
      message: 'Element exceeds vertical content bounds.',
      templateId,
      elementId: element.id,
    });
  }

  return issues;
}

/**
 * Template-level validation
 */
function validateTemplateShape(template: LayoutTemplate): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!template.id || !Array.isArray(template.elements)) {
    issues.push({
      severity: 'error',
      code: 'INVALID_TEMPLATE_SHAPE',
      message: 'Template must have an id and an elements array.',
      templateId: template.id,
    });
    return issues;
  }

  const seen = new Set<string>();
  const referencedImageSlots = new Set<number>();

  if (!Number.isInteger(template.imageSlots) || template.imageSlots < 0) {
    issues.push({
      severity: 'error',
      code: 'INVALID_IMAGE_SLOT_COUNT',
      message: 'imageSlots must be a non-negative integer.',
      templateId: template.id,
    });
  }

  for (const element of template.elements) {
    if (seen.has(element.id)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_ELEMENT_ID',
        message: `Duplicate element id '${element.id}'.`,
        templateId: template.id,
        elementId: element.id,
      });
    }
    seen.add(element.id);

    if (element.type === 'image') {
      if (
        !Number.isInteger(element.slotIndex) ||
        element.slotIndex < 0 ||
        element.slotIndex >= template.imageSlots
      ) {
        issues.push({
          severity: 'error',
          code: 'INVALID_IMAGE_SLOT_INDEX',
          message: `Image slotIndex must be between 0 and ${template.imageSlots - 1}.`,
          templateId: template.id,
          elementId: element.id,
        });
      } else {
        referencedImageSlots.add(element.slotIndex);
      }
    }
  }

  if (
    Number.isInteger(template.imageSlots) &&
    template.imageSlots >= 0 &&
    referencedImageSlots.size !== template.imageSlots
  ) {
    const missingSlots = Array.from(
      { length: template.imageSlots },
      (_, slotIndex) => slotIndex,
    ).filter((slotIndex) => !referencedImageSlots.has(slotIndex));

    issues.push({
      severity: 'error',
      code: 'INCOMPLETE_IMAGE_SLOT_MAPPING',
      message: `Template does not reference image slots: ${missingSlots.join(', ')}.`,
      templateId: template.id,
    });
  }

  return issues;
}

/**
 * Public validation entry point.
 * Intended to run at startup / CI.
 */
export function validateLayoutLibrary(
  album: AlbumSpec,
  library: LayoutLibrary,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (library.albumSpecId !== album.id) {
    issues.push({
      severity: 'error',
      code: 'INVALID_TEMPLATE_SHAPE',
      message: `LayoutLibrary.albumSpecId='${library.albumSpecId}' does not match AlbumSpec.id='${album.id}'.`,
    });
  }

  const seenTemplateIds = new Set<string>();

  for (const template of library.templates) {
    if (seenTemplateIds.has(template.id)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_TEMPLATE_ID',
        message: `Duplicate template id '${template.id}'.`,
        templateId: template.id,
      });
    }
    seenTemplateIds.add(template.id);

    issues.push(...validateTemplateShape(template));

    for (const element of template.elements) {
      issues.push(...validateElement(album, template.id, element));
    }
  }

  return issues;
}
