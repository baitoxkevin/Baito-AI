import { supabase } from './supabase';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: Window['google']['accounts']['oauth2']['TokenClient'];
let gisInited = false;

export async function initializeGoogleDrive(): Promise<void> {
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);

  return new Promise<void>((resolve, reject) => {
    script.onload = () => {
      window.gapi.load('client:picker', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Will be set later
          });
          
          gisInited = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
    script.onerror = reject;
  });
}

export async function authenticateGoogleDrive(): Promise<void> {
  if (!gisInited) {
    throw new Error('Google Identity Services not initialized');
  }

  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = async (response: { error?: any; access_token?: string; expires_in?: number }) => {
        if (response.error) {
          reject(response);
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('user_integrations')
          .upsert({
            user_id: user.id,
            provider: 'google_drive',
            access_token: response.access_token,
            expires_at: new Date(Date.now() + (response.expires_in || 0) * 1000).toISOString(),
          });

        if (error) throw error;
        resolve();
      };

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      reject(error);
    }
  });
}

export async function uploadToGoogleDrive(file: File): Promise<string> {
  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const accessToken = await getStoredAccessToken();
  
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to Google Drive');
  }

  const result = await response.json();
  return result.id;
}

export async function listGoogleDriveFiles(): Promise<any[]> {
  const accessToken = await getStoredAccessToken();
  
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,size,modifiedTime)', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to list Google Drive files');
  }

  const result = await response.json();
  return result.files;
}

async function getStoredAccessToken(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_integrations')
    .select('access_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'google_drive')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Google Drive not connected');

  if (new Date(data.expires_at) <= new Date()) {
    throw new Error('Access token expired');
  }

  return data.access_token;
}
