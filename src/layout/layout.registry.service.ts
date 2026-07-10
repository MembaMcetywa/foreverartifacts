import { Injectable, OnModuleInit } from '@nestjs/common';

import { AlbumSpec, SQUARE_210_ALBUM_SPEC } from './album-spec';

import {
  ElementPlacement,
  LayoutLibrary,
  LayoutTemplate,
  PageImageElementPlacement,
  PageSide,
  SQUARE_210_LAYOUT_LIBRARY,
} from './layout.templates';

import { validateLayoutLibrary, ValidationIssue } from './layout.validator';

/**
 * LayoutRegistryService is the authoritative source of:
 * - AlbumSpecs
 * - LayoutLibraries
 *
 * It validates all templates on application startup.
 *
 * This validation is an internal correctness check intended to
 * guard against developer geometry errors. It is not user validation.
 */
@Injectable()
export class LayoutRegistryService implements OnModuleInit {
  private readonly albumSpecs: Map<string, AlbumSpec> = new Map();
  private readonly layoutLibraries: Map<string, LayoutLibrary> = new Map();

  onModuleInit(): void {
    this.registerAlbumSpec(SQUARE_210_ALBUM_SPEC);
    this.registerLayoutLibrary(SQUARE_210_LAYOUT_LIBRARY);

    this.validateAll();
  }

  /**
   * Registers an AlbumSpec.
   * AlbumSpecs are immutable and must be unique by id.
   */
  private registerAlbumSpec(spec: AlbumSpec): void {
    if (this.albumSpecs.has(spec.id)) {
      throw new Error(`Duplicate AlbumSpec id '${spec.id}'.`);
    }

    this.albumSpecs.set(spec.id, spec);
  }

  /**
   * Registers a LayoutLibrary.
   * LayoutLibraries are bound to a specific AlbumSpec via albumSpecId.
   */
  private registerLayoutLibrary(library: LayoutLibrary): void {
    if (this.layoutLibraries.has(library.albumSpecId)) {
      throw new Error(
        `LayoutLibrary already registered for albumSpecId '${library.albumSpecId}'.`,
      );
    }

    this.layoutLibraries.set(library.albumSpecId, library);
  }

  /**
   * Runs validation for all registered layout libraries.
   * Any error here is considered fatal and prevents app startup.
   */
  private validateAll(): void {
    const allIssues: ValidationIssue[] = [];

    for (const [albumSpecId, library] of this.layoutLibraries.entries()) {
      const spec = this.albumSpecs.get(albumSpecId);

      if (!spec) {
        allIssues.push({
          severity: 'error',
          code: 'INVALID_TEMPLATE_SHAPE',
          message: `No AlbumSpec registered for albumSpecId '${albumSpecId}'.`,
        });
        continue;
      }

      const issues = validateLayoutLibrary(spec, library);
      allIssues.push(...issues);
    }

    const errors = allIssues.filter((issue) => issue.severity === 'error');

    if (errors.length > 0) {
      const message = this.formatErrors(errors);
      throw new Error(`Layout validation failed:\n${message}`);
    }
  }

  /**
   * Formats validation issues into a readable startup error.
   */
  private formatErrors(errors: ValidationIssue[]): string {
    return errors
      .map((issue) => {
        const parts = [
          `[${issue.code}]`,
          issue.templateId ? `template=${issue.templateId}` : null,
          issue.elementId ? `element=${issue.elementId}` : null,
          issue.message,
        ].filter(Boolean);

        return parts.join(' ');
      })
      .join('\n');
  }

  /**
   * Public API
   */

  getAlbumSpec(albumSpecId: string): AlbumSpec {
    const spec = this.albumSpecs.get(albumSpecId);

    if (!spec) {
      throw new Error(`Unknown AlbumSpec '${albumSpecId}'.`);
    }

    return spec;
  }

  getLayoutLibrary(albumSpecId: string): LayoutLibrary {
    const library = this.layoutLibraries.get(albumSpecId);

    if (!library) {
      throw new Error(
        `No LayoutLibrary found for albumSpecId '${albumSpecId}'.`,
      );
    }

    return library;
  }

  getTemplate(albumSpecId: string, templateId: string): LayoutTemplate {
    const library = this.getLayoutLibrary(albumSpecId);
    const template = library.templates.find((tpl) => tpl.id === templateId);

    if (!template) {
      throw new Error(
        `Unknown template '${templateId}' for albumSpecId '${albumSpecId}'.`,
      );
    }

    return template;
  }

  listAlbumSpecs(): AlbumSpec[] {
    return Array.from(this.albumSpecs.values());
  }

  listTemplates(albumSpecId: string): LayoutTemplate[] {
    return this.getLayoutLibrary(albumSpecId).templates;
  }

  listTemplatePreviews(albumSpecId: string): LayoutTemplatePreview[] {
    const spec = this.getAlbumSpec(albumSpecId);

    return this.listTemplates(albumSpecId).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      imageSlots: template.imageSlots,
      preview: {
        widthRatio: 2,
        heightRatio: 1,
        slots: template.elements
          .filter((element) => element.type === 'image')
          .map((element) => ({
            slotIndex: element.slotIndex,
            rect: this.computePreviewRect(spec, element),
          })),
      },
    }));
  }

  private computePreviewRect(
    spec: AlbumSpec,
    element: Extract<ElementPlacement, { type: 'image' }>,
  ): PreviewRect {
    const spreadWidthMm = spec.page.widthMm * 2;

    if (element.placement === 'spread') {
      const { outerMm } = spec.grid.margins;
      const xMm = outerMm;
      const yMm = this.computeY(spec, element);
      const widthMm = spreadWidthMm - outerMm * 2;

      return this.toPreviewRect(spec, {
        xMm,
        yMm,
        widthMm,
        heightMm: element.y.heightMm,
      });
    }

    const xMm =
      this.getPageOffsetMm(spec, element.pageSide) +
      this.computeX(spec, element, element.pageSide);
    const yMm = this.computeY(spec, element);
    const widthMm = this.computeWidth(spec, element);

    return this.toPreviewRect(spec, {
      xMm,
      yMm,
      widthMm,
      heightMm: element.y.heightMm,
    });
  }

  private toPreviewRect(
    spec: AlbumSpec,
    rect: {
      xMm: number;
      yMm: number;
      widthMm: number;
      heightMm: number;
    },
  ): PreviewRect {
    const spreadWidthMm = spec.page.widthMm * 2;

    return {
      left: (rect.xMm / spreadWidthMm) * 100,
      top: (rect.yMm / spec.page.heightMm) * 100,
      width: (rect.widthMm / spreadWidthMm) * 100,
      height: (rect.heightMm / spec.page.heightMm) * 100,
    };
  }

  private getPageOffsetMm(spec: AlbumSpec, side: PageSide): number {
    return side === 'left' ? 0 : spec.page.widthMm;
  }

  private computeX(
    spec: AlbumSpec,
    element: PageImageElementPlacement,
    side: PageSide,
  ): number {
    const { columnsPerPage, gutterMm, margins } = spec.grid;
    const contentWidth = spec.page.widthMm - margins.innerMm - margins.outerMm;
    const leftMargin = side === 'left' ? margins.outerMm : margins.innerMm;
    const columnWidth =
      (contentWidth - (columnsPerPage - 1) * gutterMm) / columnsPerPage;

    return leftMargin + (element.x.cols.startCol - 1) * (columnWidth + gutterMm);
  }

  private computeWidth(
    spec: AlbumSpec,
    element: PageImageElementPlacement,
  ): number {
    const { columnsPerPage, gutterMm, margins } = spec.grid;
    const contentWidth = spec.page.widthMm - margins.innerMm - margins.outerMm;
    const columnWidth =
      (contentWidth - (columnsPerPage - 1) * gutterMm) / columnsPerPage;

    return element.x.cols.span * columnWidth + (element.x.cols.span - 1) * gutterMm;
  }

  private computeY(spec: AlbumSpec, element: ElementPlacement): number {
    const { margins } = spec.grid;
    const contentTop = margins.topMm;
    const contentBottom = spec.page.heightMm - margins.bottomMm;

    if (element.y.anchor === 'top') {
      return contentTop + element.y.offsetMm;
    }

    return contentBottom - element.y.offsetMm - element.y.heightMm;
  }
}

export interface LayoutTemplatePreview {
  id: string;
  name: string;
  description: string;
  imageSlots: number;
  preview: {
    widthRatio: number;
    heightRatio: number;
    slots: {
      slotIndex: number;
      rect: PreviewRect;
    }[];
  };
}

interface PreviewRect {
  left: number;
  top: number;
  width: number;
  height: number;
}
