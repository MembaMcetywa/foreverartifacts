import { Injectable, OnModuleInit } from '@nestjs/common';

import { AlbumSpec, SQUARE_210_ALBUM_SPEC } from './album-spec';

import {
  LayoutLibrary,
  LayoutTemplate,
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
}
