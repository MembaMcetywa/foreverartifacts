import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { LayoutRegistryService } from '../layout/layout.registry.service';
import { Album, AlbumSpread, AlbumState } from './album.types';

@Injectable()
export class AlbumsService {
  private readonly albums = new Map<string, Album>();

  constructor(private readonly layoutRegistry: LayoutRegistryService) {}

  createAlbum(albumSpecId: string): Album {
    // Ensure spec exists
    this.layoutRegistry.getAlbumSpec(albumSpecId);

    const album: Album = {
      id: randomUUID(),
      albumSpecId,
      state: 'draft',
      spreads: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.albums.set(album.id, album);
    return album;
  }

  getAlbum(albumId: string): Album {
    const album = this.albums.get(albumId);
    if (!album) {
      throw new Error(`Unknown album '${albumId}'.`);
    }
    return album;
  }

  addSpread(albumId: string, spread: AlbumSpread): Album {
    const album = this.getAlbum(albumId);

    const library = this.layoutRegistry.getLayoutLibrary(album.albumSpecId);

    const template = library.templates.find((t) => t.id === spread.templateId);

    if (!template) {
      throw new Error(
        `Unknown template '${spread.templateId}' for album '${albumId}'.`,
      );
    }

    if (spread.slots.length !== template.imageSlots) {
      throw new Error(
        `Template '${template.id}' requires ${template.imageSlots} image slots.`,
      );
    }

    album.spreads.push(spread);
    album.updatedAt = new Date();

    return album;
  }

  setState(albumId: string, state: AlbumState): Album {
    const album = this.getAlbum(albumId);
    album.state = state;
    album.updatedAt = new Date();
    return album;
  }

  listAlbums(): Album[] {
    return Array.from(this.albums.values());
  }
}
