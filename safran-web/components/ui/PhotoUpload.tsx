'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'] as const;
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i;

interface PhotoUploadProps {
  outillageId: string;
  currentPhotoUrl: string | null;
  onUploadSuccess: (url: string) => void;
}

function isAcceptedImage(file: File): boolean {
  if (file.type && ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
    return true;
  }
  return ACCEPTED_EXT.test(file.name);
}

function extensionFromFile(file: File): string {
  const name = file.name.toLowerCase();
  if (file.type === 'image/png' || name.endsWith('.png')) {
    return 'png';
  }
  if (file.type === 'image/webp' || name.endsWith('.webp')) {
    return 'webp';
  }
  return 'jpg';
}

function contentTypeFromFile(file: File): string {
  if (file.type === 'image/png') {
    return 'image/png';
  }
  if (file.type === 'image/webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function formatUploadError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('row-level security') || lower.includes('policy') || lower.includes('403')) {
    return 'Accès refusé au stockage. Exécutez la migration 005_storage_outillages_photos.sql dans Supabase.';
  }
  if (lower.includes('bucket') && lower.includes('not found')) {
    return 'Bucket outillages-photos introuvable. Créez-le dans Supabase Storage.';
  }
  return message || "Erreur lors de l'upload, réessayez";
}

async function uploadPhotoFile(path: string, file: File) {
  const contentType = contentTypeFromFile(file);
  const bucket = supabase.storage.from('outillages-photos');

  const { error: upsertError } = await bucket.upload(path, file, {
    upsert: true,
    contentType,
    cacheControl: '3600'
  });

  if (!upsertError) {
    return null;
  }

  console.error('Photo upload error (upsert):', upsertError);

  // Fallback : supprimer puis ré-uploader (si la policy UPDATE manque)
  if (
    upsertError.message.toLowerCase().includes('already exists') ||
    upsertError.message.toLowerCase().includes('duplicate')
  ) {
    await bucket.remove([path]);
    const { error: retryError } = await bucket.upload(path, file, {
      contentType,
      cacheControl: '3600'
    });
    if (retryError) {
      console.error('Photo upload error (retry):', retryError);
      return retryError;
    }
    return null;
  }

  return upsertError;
}

export function PhotoUpload({ outillageId, currentPhotoUrl, onUploadSuccess }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!isAcceptedImage(file)) {
      return 'Format non supporté. Utilisez JPG, PNG ou WEBP.';
    }
    if (file.size > MAX_BYTES) {
      return 'Fichier trop volumineux (max 5 Mo).';
    }
    return null;
  }, []);

  const startPreview = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPendingFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl, validateFile]
  );

  const cancelPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [previewUrl]);

  const handleUpload = useCallback(async () => {
    if (!pendingFile || !isSupabaseConfigured) {
      setError('Supabase non configuré.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const ext = extensionFromFile(pendingFile);
      const path = `${outillageId}.${ext}`;

      const uploadError = await uploadPhotoFile(path, pendingFile);
      if (uploadError) {
        setError(formatUploadError(uploadError.message));
        return;
      }

      const { data: urlData } = supabase.storage.from('outillages-photos').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('outillages')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', outillageId);

      if (updateError) {
        console.error('Photo update error:', updateError);
        setError(formatUploadError(updateError.message));
        return;
      }

      cancelPreview();
      onUploadSuccess(publicUrl);
    } catch (err) {
      console.error('Photo upload error:', err);
      const message = err instanceof Error ? err.message : "Erreur lors de l'upload, réessayez";
      setError(formatUploadError(message));
    } finally {
      setUploading(false);
    }
  }, [cancelPreview, onUploadSuccess, outillageId, pendingFile]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      if (uploading) {
        return;
      }
      const file = event.dataTransfer.files?.[0];
      if (file) {
        startPreview(file);
      }
    },
    [startPreview, uploading]
  );

  if (previewUrl && pendingFile) {
    return (
      <div className="space-y-3">
        <div
          className={clsx(
            'relative overflow-hidden rounded-lg',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Aperçu" className="h-[200px] w-[200px] rounded-lg object-cover" />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-8 w-8 animate-spin text-safran-blue" />
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => void handleUpload()}
            className="rounded-xl bg-safran-navy px-4 py-2 text-sm font-semibold text-white hover:bg-safran-blue/90 disabled:opacity-50"
          >
            Confirmer
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={cancelPreview}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-safran-navy hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
        {error ? <p className="max-w-[200px] text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            startPreview(file);
          }
        }}
      />

      {currentPhotoUrl ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="group relative h-[200px] w-[200px] overflow-hidden rounded-lg disabled:opacity-60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhotoUrl}
            alt="Photo outillage"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-safran-navy/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-safran-navy/50 group-hover:opacity-100">
            Changer la photo
          </span>
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-8 w-8 animate-spin text-safran-blue" />
            </span>
          ) : null}
        </button>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              inputRef.current?.click();
            }
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) {
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={clsx(
            'flex h-[200px] w-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition',
            dragOver ? 'border-safran-blue bg-safran-blue/5' : 'border-safran-blue/40',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-safran-blue" />
          ) : (
            <>
              <Camera className="mb-2 h-8 w-8 text-safran-blue" />
              <p className="text-sm font-medium text-safran-navy">Cliquer ou glisser une photo</p>
              <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP — max 5 Mo</p>
            </>
          )}
        </div>
      )}

      {error ? <p className="max-w-[200px] text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
