import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PDFDocument } from 'pdf-lib';

import { LayoutRegistryService } from '../layout/layout.registry.service';
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
    albumSpecId: string;
    spreads: {
      templateId: string;
      slots: { slotIndex: number; assetId: string }[];
    }[];
  }): Promise<{ renderId: string; pdfKey: string }> {
    const renderId = randomUUID();



        const renderGraph = this.compileRenderGraph(
        input.albumSpecId,
        input.spreads
      );


    const pdfBuffer = await this.renderPdf(renderGraph);
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

  private async renderPdf(doc: RenderDocument): Promise<Buffer> {
    const pdf = await PDFDocument.create();

    for (const pageDef of doc.pages) {
      const page = pdf.addPage([mmToPt(doc.widthMm), mmToPt(doc.heightMm)]);

      for (const element of pageDef.elements) {
        if (element.type !== 'image') continue;

        await this.drawImage(pdf, page, element);
      }
    }

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

    private async drawImage(
      pdf: PDFDocument,
      page: any,
      element: RenderImageElement,
    ): Promise<void> {

     const asset = this.assetsService.getAsset(element.assetId);

     const downloadUrl = await this.storage.getPresignedDownloadUrl(asset.key);
     const response = await fetch(downloadUrl);
     const imageBytes = new Uint8Array(await response.arrayBuffer());
    //  const imageBytes = await readFile('assets/test-image.jpg');

      const image =
        imageBytes[0] === 0x89
          ? await pdf.embedPng(imageBytes)
          : await pdf.embedJpg(imageBytes);

      const { xPt, yPt, widthPt, heightPt } = rectMmToPt(element.rect);

      page.drawImage(image, {
        x: xPt,
        y: yPt,
        width: widthPt,
        height: heightPt,
      });
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

    for (const spread of spreads) {
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

      for (const side of ['left', 'right'] as const) {
        const elements: RenderImageElement[] = template.elements
          .filter((el) => el.type === 'image' && el.pageSide === side)
          .map((el, index): RenderImageElement => {
            const assetId = slotMap.get(index);
            if (!assetId) {
              throw new Error(
                `Missing asset for slot ${index} in template '${template.id}'.`,
              );
            }

            return {
              type: 'image',
              assetId,
              rect: {
                xMm: this.computeX(spec, el),
                yMm: this.computeY(spec, el),
                widthMm: this.computeWidth(spec, el),
                heightMm: el.y.heightMm,
              },
            };
          });

    if (elements.length === 1) {
      const element = elements[0];

      const { margins } = spec.grid;
      const contentWidth =
        spec.page.widthMm - margins.innerMm - margins.outerMm;

      element.rect.xMm =
        margins.innerMm + (contentWidth - element.rect.widthMm) / 2;
    }

    if (elements.length > 0) {
      pages.push({
        index: pageIndex++,
        elements,
      });
    }

      }
    }

    return {
      widthMm: spec.page.widthMm,
      heightMm: spec.page.heightMm,
      pages,
    };
  }

  private computeX(spec: any, el: any): number {
    const { columnsPerPage, gutterMm, margins } = spec.grid;
    const contentWidth = spec.page.widthMm - margins.innerMm - margins.outerMm;

    const columnWidth =
      (contentWidth - (columnsPerPage - 1) * gutterMm) / columnsPerPage;

    return (
      margins.innerMm + (el.x.cols.startCol - 1) * (columnWidth + gutterMm)
    );
  }

  private computeWidth(spec: any, el: any): number {
    const { columnsPerPage, gutterMm, margins } = spec.grid;
    const contentWidth = spec.page.widthMm - margins.innerMm - margins.outerMm;

    const columnWidth =
      (contentWidth - (columnsPerPage - 1) * gutterMm) / columnsPerPage;

    return el.x.cols.span * columnWidth + (el.x.cols.span - 1) * gutterMm;
  }

  private computeY(spec: any, el: any): number {
    const { margins } = spec.grid;
    const contentTop = margins.topMm;
    const contentBottom = spec.page.heightMm - margins.bottomMm;

    if (el.y.anchor === 'top') {
      return contentTop + el.y.offsetMm;
    }

    return contentBottom - el.y.offsetMm - el.y.heightMm;
  }
}
