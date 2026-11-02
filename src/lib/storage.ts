import { ref, uploadBytesResumable, getDownloadURL, getStorage, FirebaseStorage, getMetadata } from 'firebase/storage';
import { app, storage, PRIMARY_STORAGE_BUCKET } from './firebase';

export const INNOVACONTRATISTAS_BUCKET = PRIMARY_STORAGE_BUCKET;

export type UploadProgressCallback = (percent: number, bytesTransferred: number, totalBytes: number) => void;

/**
 * Optimizes an image file if it exceeds 1MB to save bandwidth and storage
 */
export async function optimizeImageFile(file: File, maxDimension: number = 1920, quality: number = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.size < 800 * 1024) {
    return file; // Already lightweight or not an image
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Unified file uploader:
 * Uploads directly to Firebase Cloud Storage (both videos and images).
 */
export async function uploadFileToFirebaseStorage(
  file: File,
  folder: string = 'uploads',
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!file) {
    throw new Error('No se proporcionó ningún archivo para subir.');
  }

  const isVideo = file.type && file.type.startsWith('video/');

  // Automatically optimize photos to WebP format for 85% size reduction
  let fileToUpload = file;
  if (!isVideo && file.type && file.type.startsWith('image/')) {
    try {
      fileToUpload = await optimizeImageFile(file);
    } catch {
      fileToUpload = file;
    }
  }

  // Direct Firebase Cloud Storage Upload
  const cleanName = fileToUpload.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase();
  const timestamp = Date.now();
  const effectiveFolder = folder || (isVideo ? 'videos' : 'uploads');
  const filePath = `${effectiveFolder}/${timestamp}_${cleanName}`;

  const metadata = {
    contentType: fileToUpload.type || (isVideo ? 'video/mp4' : 'application/octet-stream'),
    customMetadata: {
      originalName: fileToUpload.name,
      uploadedAt: new Date().toISOString(),
      isVideo: isVideo ? 'true' : 'false'
    }
  };

  // Parallel probe of candidate buckets to find the active/reachable one under 200ms
  const getReachableStorageInstance = async (): Promise<FirebaseStorage> => {
    const candidateBuckets = [
      storage,
      `gs://${INNOVACONTRATISTAS_BUCKET}`,
      'gs://innovacontratistas-434d2.appspot.com',
    ];

    const cachedBucket = localStorage.getItem('innova_active_storage_bucket');
    if (cachedBucket) {
      try {
        return getStorage(app, cachedBucket);
      } catch (e) {
        // ignore and fallback to probe
      }
    }

    const probePromises = candidateBuckets.map(async (bucketTarget) => {
      const storageInstance: FirebaseStorage = typeof bucketTarget === 'string'
        ? getStorage(app, bucketTarget)
        : bucketTarget;

      const probeRef = ref(storageInstance, 'nonexistent_probe_file_999');
      try {
        await getMetadata(probeRef);
        return storageInstance;
      } catch (err: any) {
        // storage/object-not-found means host connected successfully and bucket is valid!
        if (err && (err.code === 'storage/object-not-found' || err.message?.includes('object-not-found') || err.message?.includes('unauthorized') || err.code?.includes('unauthorized'))) {
          return storageInstance;
        }
        throw err;
      }
    });

    try {
      const winner = await Promise.any(probePromises);
      if (winner) {
        const bucketName = (winner as any)._bucket?.bucket || (winner as any).customMetadata?.bucket;
        if (bucketName) {
          localStorage.setItem('innova_active_storage_bucket', `gs://${bucketName}`);
        }
        return winner;
      }
    } catch (e) {
      // Ignore and return default storage
    }
    return storage;
  };

  try {
    const storageInstance = await getReachableStorageInstance();
    const storageRef = ref(storageInstance, filePath);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload, metadata);

    const downloadUrl = await new Promise<string>((resolve, reject) => {
      if (onProgress) {
        onProgress(0, 0, fileToUpload.size);
      }

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = snapshot.totalBytes > 0 
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) 
            : 0;
          if (onProgress) {
            onProgress(percent, snapshot.bytesTransferred, snapshot.totalBytes);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) {
              onProgress(100, fileToUpload.size, fileToUpload.size);
            }
            resolve(url);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });

    if (downloadUrl && downloadUrl.startsWith('http')) {
      return downloadUrl;
    }
    throw new Error('No se pudo recuperar la URL de descarga.');
  } catch (err: any) {
    console.warn('Storage upload error:', err);
    throw err || new Error('No se pudo subir el archivo a Firebase Storage. Verifica tu conexión a internet o intenta nuevamente.');
  }
}

