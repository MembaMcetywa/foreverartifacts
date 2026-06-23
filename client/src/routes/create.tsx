import { createFileRoute } from '@tanstack/react-router';
import type { ChangeEvent, SubmitEvent} from 'react';
import { useState } from 'react';
import { useCreateAlbumStore } from '../stores/albumStore';

export const Route = createFileRoute('/create')({
  component: CreatePage,
});

interface UploadUrlResponse {
  assetId: string;
  uploadUrl: string;
}

const API_BASE_URL = 'http://localhost:3000';

function CreatePage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addUploadedAsset = useCreateAlbumStore(
    (state) => state.addUploadedAsset,
  );

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    setSelectedImages((currentImages) => [
      ...currentImages,
      ...files,
    ]);

    event.target.value = '';
  }

  async function handleContinue(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedImages.length === 0 || isUploading) return;

    setIsUploading(true);

    try {
      for (const image of selectedImages) {
        const response = await fetch(`${API_BASE_URL}/assets/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: image.name,
            contentType: image.type,
          }),
        })
        // TODO: Add a toast message here
        if (!response.ok) throw new Error('Failed to create upload URL.')

        const { assetId, uploadUrl } =
          (await response.json()) as UploadUrlResponse

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': image.type },
          body: image,
        })
        // TODO: Add a toast message here
        if (!uploadResponse.ok) throw new Error('Failed to upload image.')

        addUploadedAsset({
          assetId,
          filename: image.name,
          previewUrl: URL.createObjectURL(image),
        })
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className='min-h-screen bg-[#f8f7f4] text-[#111111]'>
      <section className='mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16'>
        <h1 className='mb-6 text-5xl font-normal tracking-[-0.04em]'>
          Add your photos
        </h1>

        <form onSubmit={handleContinue}>
          <label className='mb-8 flex h-56 cursor-pointer items-center justify-center border border-neutral-300 bg-white'>
            <input
              type='file'
              accept='image/jpeg,image/png'
              multiple
              className='hidden'
              onChange={handleImageSelection}
            />

            <span className='text-sm tracking-wide'>
              {selectedImages.length > 0
                ? `${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} selected`
                : 'Choose images'}
            </span>
          </label>

          {selectedImages.length > 0 && (
            <div className='mb-10 grid grid-cols-2 gap-4 md:grid-cols-4'>
              {selectedImages.map((image, index) => (
                <img
                  key={`${image.name}-${image.lastModified}-${index}`}
                  src={URL.createObjectURL(image)}
                  alt={image.name}
                  className='aspect-square w-full object-cover'
                />
              ))}
            </div>
          )}

          <button
            type='submit'
            disabled={selectedImages.length === 0 || isUploading}
            className='border border-neutral-900 px-6 py-3 text-sm tracking-wide disabled:border-neutral-300 disabled:text-neutral-400'
          >
            {isUploading ? 'Uploading…' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  );
}