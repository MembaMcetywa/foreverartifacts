import { Controller, Post } from '@nestjs/common';
import { RenderService } from './render.service';

@Controller('render')
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Post('test')
  async testRender(): Promise<{ ok: true }> {
    await this.renderService.renderAlbum({
      albumSpecId: 'square_210_v1',
      spreads: [],
    });

    return { ok: true };
  }
}
