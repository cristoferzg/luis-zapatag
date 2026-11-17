/**
 * YouTube API v3 Direct Resumable Upload Service
 * 
 * Allows uploading videos directly to the user's YouTube channel in "unlisted" (No Listado) mode.
 * Videos uploaded in "unlisted" mode:
 * 1. Do NOT appear in YouTube public searches or channel pages.
 * 2. Consume 0 MB of Firebase Storage.
 * 3. Can be streamed globally with auto-HD quality.
 */

export interface YouTubeUploadOptions {
  file: File;
  title: string;
  description?: string;
  privacyStatus?: 'unlisted' | 'private' | 'public';
  accessToken: string;
  onProgress?: (percent: number, bytesTransferred: number, totalBytes: number) => void;
}

/**
 * Uploads a video file directly to YouTube using Resumable Upload Protocol
 */
export async function uploadVideoToYouTube(options: YouTubeUploadOptions): Promise<{ videoId: string; url: string }> {
  const { file, title, description, privacyStatus = 'unlisted', accessToken, onProgress } = options;

  if (!accessToken) {
    throw new Error('Se requiere un token de acceso de Google para subir a YouTube.');
  }

  // Step 1: Initiate Resumable Upload Session
  const metadata = {
    snippet: {
      title: title || file.name,
      description: description || 'Video subido desde la plataforma de capacitación Academia Técnica',
      categoryId: '27' // Education category
    },
    status: {
      privacyStatus: privacyStatus,
      selfDeclaredMadeForKids: false
    }
  };

  const initResponse = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': file.size.toString(),
        'X-Upload-Content-Type': file.type || 'video/mp4'
      },
      body: JSON.stringify(metadata)
    }
  );

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error('YouTube API Init Error:', errorText);
    throw new Error(`Error al iniciar la sesión en YouTube API: ${initResponse.statusText}`);
  }

  const uploadUrl = initResponse.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('No se recibió la URL de subida por parte de la API de YouTube.');
  }

  // Step 2: Upload File Binary via XHR to monitor progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent, e.loaded, e.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const videoId = response.id;
          const url = `https://www.youtube.com/watch?v=${videoId}`;
          resolve({ videoId, url });
        } catch (e) {
          reject(new Error('Error al procesar la respuesta de YouTube API.'));
        }
      } else {
        console.error('YouTube XHR Upload Error:', xhr.responseText);
        reject(new Error(`Error durante la transferencia del video a YouTube (Código ${xhr.status}).`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Error de red al transferir el archivo a YouTube. Por favor verifique su conexión.'));
    };

    xhr.send(file);
  });
}

/**
 * Initiates Google OAuth2 Token Flow for YouTube upload scope
 */
export function requestYouTubeAccessToken(clientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if Google Identity Services script is available
    if (typeof window === 'undefined') {
      reject(new Error('Entorno no soportado.'));
      return;
    }

    const SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

    // If Google GIS library is loaded
    if ((window as any).google?.accounts?.oauth2) {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId || '969835994110-34ae0769.apps.googleusercontent.com',
        scope: SCOPE,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`Error de autenticación Google: ${response.error}`));
          } else if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('No se recibió token de acceso de Google.'));
          }
        }
      });
      client.requestAccessToken();
    } else {
      // Fallback popup token prompt
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId || '969835994110-34ae0769.apps.googleusercontent.com')}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent(SCOPE)}&` +
        `include_granted_scopes=true&` +
        `prompt=consent`;

      const width = 500;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(authUrl, 'google_youtube_oauth', `width=${width},height=${height},top=${top},left=${left}`);

      if (!popup) {
        reject(new Error('El navegador bloqueó la ventana emergente de autenticación. Por favor permítala.'));
        return;
      }

      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            // Check session storage
            const token = sessionStorage.getItem('yt_temp_token');
            if (token) {
              sessionStorage.removeItem('yt_temp_token');
              resolve(token);
            } else {
              reject(new Error('Inicio de sesión cancelado o no completado.'));
            }
          } else if (popup.location.href.includes('access_token=')) {
            const hash = popup.location.hash || popup.location.search;
            const params = new URLSearchParams(hash.replace('#', '?'));
            const token = params.get('access_token');
            if (token) {
              popup.close();
              clearInterval(checkPopup);
              resolve(token);
            }
          }
        } catch (e) {
          // Cross-origin check while navigating to google.com
        }
      }, 500);
    }
  });
}
