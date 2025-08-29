const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export const getGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const extractAuthCodeFromUrl = (url: string): string | null => {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('code');
};

export const exchangeCodeForToken = async (code: string): Promise<string> => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || 'Error al obtener token');
    }

    return data.access_token;
  } catch (error) {
    console.error('Error intercambiando código por token:', error);
    throw error;
  }
};

export const openGoogleAuthPopup = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const authUrl = getGoogleAuthUrl();
    const popup = window.open(
      authUrl,
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      reject(new Error('No se pudo abrir la ventana de autenticación'));
      return;
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('Autenticación cancelada por el usuario'));
      }
    }, 1000);

    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        resolve(event.data.accessToken);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        reject(new Error(event.data.error || 'Error en la autenticación'));
      }
    };

    window.addEventListener('message', messageListener);
  });
};

export const validateGoogleConfig = (): boolean => {
  if (!GOOGLE_CLIENT_ID) {
    console.error('VITE_GOOGLE_CLIENT_ID no está configurado');
    return false;
  }

  if (!REDIRECT_URI) {
    console.error('VITE_GOOGLE_REDIRECT_URI no está configurado');
    return false;
  }

  return true;
};
