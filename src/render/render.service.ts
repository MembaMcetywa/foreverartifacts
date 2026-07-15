import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  clip,
  endPath,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
} from 'pdf-lib';

import { LayoutRegistryService } from '../layout/layout.registry.service';
import { AlbumSpec } from '../layout/album-spec';
import {
  ElementPlacement,
  PageImageElementPlacement,
  PageSide,
} from '../layout/layout.templates';
import { AssetsService } from '../assets/assets.service';
import { StorageService } from '../storage/storage.service';

import { mmToPt, rectMmToPt } from './render.utils';
import { RenderDocument, RenderImageElement } from './render.types';

@Injectable()
export class RenderService {
  constructor(
    private readonly layoutRegistry: LayoutRegistryService,
    private readonly assetsService: AssetsService,
    private readonly storage: StorageService,
  ) {}

  async renderAlbum(input: {
    userId: string;
    albumSpecId: string;
    spreads: {
      templateId: string;
      slots: { slotIndex: number; assetId: string }[];
    }[];
  }): Promise<{ renderId: string; pdfKey: string }> {
    const renderId = randomUUID();

    const renderGraph = this.compileRenderGraph(
      input.albumSpecId,
      input.spreads,
    );

    const pdfBuffer = await this.renderPdf(input.userId, renderGraph);
    const pdfKey = `renders/${renderId}.pdf`;
    const uploadUrl = await this.storage.getPresignedUploadUrl(
      pdfKey,
      'application/pdf',
    );

    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: new Uint8Array(pdfBuffer),
    });

    return { renderId, pdfKey };
  }

  private async renderPdf(
    userId: string,
    doc: RenderDocument,
  ): Promise<Buffer> {
    const pdf = await PDFDocument.create();

    for (const pageDef of doc.pages) {
      const page = pdf.addPage([mmToPt(doc.widthMm), mmToPt(doc.heightMm)]);

      for (const element of pageDef.elements) {
        if (element.type !== 'image') continue;

        await this.drawImage(userId, pdf, page, element, doc.heightMm);
      }
    }

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  private async drawImage(
    userId: string,
    pdf: PDFDocument,
    page: any,
    element: RenderImageElement,
    pageHeightMm: number,
  ): Promise<void> {
    const asset = await this.assetsService.getAsset(userId, element.assetId);

    if (asset.status !== 'ready') {
      throw new Error(`Asset '${asset.id}' is not ready to render.`);
    }

    const downloadUrl = await this.storage.getPresignedDownloadUrl(
      asset.printKey ?? asset.key,
    );
    const response = await fetch(downloadUrl);
    const imageBytes = new Uint8Array(await response.arrayBuffer());

    const image =
      imageBytes[0] === 0x89
        ? await pdf.embedPng(imageBytes)
        : await pdf.embedJpg(imageBytes);

    const { xPt, widthPt, heightPt } = rectMmToPt(element.rect);
    const yPt = mmToPt(pageHeightMm - element.rect.yMm - element.rect.heightMm);
    const coverWidthPt = mmToPt(element.coverFrame.widthMm);
    const coverHeightPt = mmToPt(element.coverFrame.heightMm);
    const coverOffsetXPt = mmToPt(element.coverFrame.offsetXMm);

    const scale = Math.max(
      coverWidthPt / image.width,
      coverHeightPt / image.height,
    );
    const renderedWidthPt = image.width * scale;
    const renderedHeightPt = image.height * scale;
    const renderedXPt =
      xPt - coverOffsetXPt - (renderedWidthPt - coverWidthPt) / 2;
    const renderedYPt = yPt - (renderedHeightPt - coverHeightPt) / 2;

    page.pushOperators(
      pushGraphicsState(),
      rectangle(xPt, yPt, widthPt, heightPt),
      clip(),
      endPath(),
    );

    page.drawImage(image, {
      x: renderedXPt,
      y: renderedYPt,
      width: renderedWidthPt,
      height: renderedHeightPt,
    });

    page.pushOperators(popGraphicsState());
  }

  private compileRenderGraph(
    albumSpecId: string,
    spreads: {
      templateId: string;
      slots: { slotIndex: number; assetId: string }[];
    }[],
  ): RenderDocument {
    const spec = this.layoutRegistry.getAlbumSpec(albumSpecId);
    const library = this.layoutRegistry.getLayoutLibrary(albumSpecId);

    const pages: RenderDocument['pages'] = [];
    let pageIndex = 0;

    for (const [spreadIndex, spread] of spreads.entries()) {
      const template = library.templates.find(
        (t) => t.id === spread.templateId,
      );
      if (!template) {
        throw new Error(`Unknown template '${spread.templateId}'.`);
      }

      const slotMap = new Map<number, string>();
      for (const slot of spread.slots) {
        slotMap.set(slot.slotIndex, slot.assetId);
      }

      const pageElements: Record<PageSide, RenderImageElement[]> = {
        left: [],
        right: [],
      };

      for (const element of template.elements) {
        if (element.type !== 'image') continue;

        const assetId = slotMap.get(element.slotIndex);
        if (!assetId) {
          throw new Error(
            `Missing asset for slot ${element.slotIndex} in template '${template.id}'.`,
          );
        }

        if (element.placement === 'spread') {
          const { outerMm } = spec.grid.margins;
          const sliceWidthMm = spec.page.widthMm - outerMm;
          const coverWidthMm = sliceWidthMm * 2;
          const yMm = this.computeY(spec, element);

          pageElements.left.push({
            type: 'image',
            fit: element.fit,
            assetId,
            rect: {
              xMm: outerMm,
              yMm,
              widthMm: sliceWidthMm,
              heightMm: element.y.heightMm,
            },
            coverFrame: {
              widthMm: coverWidthMm,
              heightMm: element.y.heightMm,
              offsetXMm: 0,
            },
          });

          pageElements.right.push({
            type: 'image',
            fit: element.fit,
            assetId,
            rect: {
              xMm: 0,
              yMm,
              widthMm: sliceWidthMm,
              heightMm: element.y.heightMm,
            },
            coverFrame: {
              widthMm: coverWidthMm,
              heightMm: element.y.heightMm,
              offsetXMm: sliceWidthMm,
            },
          });
          continue;
        }

        const rect = {
          xMm: this.computeX(spec, element, element.pageSide),
          yMm: this.computeY(spec, element),
          widthMm: this.computeWidth(spec, element),
          heightMm: element.y.heightMm,
        };

        pageElements[element.pageSide].push({
          type: 'image',
          fit: element.fit,
          assetId,
          rect,
          coverFrame: {
            widthMm: rect.widthMm,
            heightMm: rect.heightMm,
            offsetXMm: 0,
          },
        });
      }

      for (const side of ['left', 'right'] as const) {
        pages.push({
          index: pageIndex++,
          spreadIndex,
          side,
          elements: pageElements[side],
        });
      }
    }

    return {
      widthMm: spec.page.widthMm,
      heightMm: spec.page.heightMm,
      pages,
    };
  }

  private computeX(
    spec: AlbumSpec,
    el: PageImageElementPlacement,
    side: PageSide,
  ): number {
    const { columnsPerPage, gutterMm, margins } = spec.grid;
    const contentWidth = spec.page.widthMm - margins.innerMm - margins.outerMm;
    const leftMargin = side === 'left' ? margins.outerMm : margins.innerMm;

    const columnWidth =
      (contentWidth - (columnsPerPage - 1) * gutterMm) / columnsPerPage;

    return leftMargin + (el.x.cols.startCol - 1) * (columnWidth + gutterMm);
  }

  private computeWidth(spec: AlbumSpec, el: PageImageElementPlacement): number {
    const { columnsPerPage, gutterMm, margins } = spec.grid;
    const contentWidth = spec.page.widthMm - margins.innerMm - margins.outerMm;

    const columnWidth =
      (contentWidth - (columnsPerPage - 1) * gutterMm) / columnsPerPage;

    return el.x.cols.span * columnWidth + (el.x.cols.span - 1) * gutterMm;
  }

  private computeY(spec: AlbumSpec, el: ElementPlacement): number {
    const { margins } = spec.grid;
    const contentTop = margins.topMm;
    const contentBottom = spec.page.heightMm - margins.bottomMm;

    if (el.y.anchor === 'top') {
      return contentTop + el.y.offsetMm;
    }

    return contentBottom - el.y.offsetMm - el.y.heightMm;
  }
}
