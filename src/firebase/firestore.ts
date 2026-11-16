import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './config.ts';
import { ClientProject } from '../types.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const TRACKS_COLLECTION = 'tracks';
const SETTINGS_COLLECTION = 'settings';
const PAYMENT_SETTINGS_ID = 'payment';

// Fetch a single track by document ID (Public read for client link)
export async function getTrackById(trackId: string): Promise<ClientProject | null> {
  const path = `${TRACKS_COLLECTION}/${trackId}`;
  try {
    const docRef = doc(db, TRACKS_COLLECTION, trackId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      id: snap.id,
      clientName: data.clientName || 'Valued Client',
      songTitle: data.songTitle || 'Untitled Track',
      totalAmount: Number(data.totalAmount) || 0,
      advancePaid: Number(data.advancePaid) || 0,
      balanceDue: Number(data.balanceDue) || 0,
      isPaid: Boolean(data.isPaid),
      paymentStatus: data.paymentStatus || 'Pending UPI',
      genre: data.genre || 'Audio Production',
      tempoBpm: Number(data.tempoBpm) || 120,
      audioPreviewUrl: data.audioPreviewUrl || '',
      // Only include masterWavUrl if track is actually paid!
      masterWavUrl: data.isPaid ? data.masterWavUrl : undefined,
      previewFileName: data.previewFileName || 'Preview_128k_Watermarked.mp3',
      masterWavFileName: data.masterWavFileName || 'Master_24bit_96k.wav',
      masterWavFileSize: data.masterWavFileSize || '84.0 MB',
      sampleRate: data.sampleRate || '96.0 kHz / 24-bit Lossless Broadcast WAV',
      lufsIntegrated: data.lufsIntegrated || '-14.0 LUFS',
      truePeak: data.truePeak || '-0.3 dBTP',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt,
      paymentNotified: Boolean(data.paymentNotified),
      utrNote: data.utrNote || '',
      notifiedAt: data.notifiedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Subscribe to all tracks in real-time (Admin Dashboard only)
export function subscribeToTracks(
  onData: (tracks: ClientProject[]) => void,
  onError?: (err: Error) => void
) {
  const path = TRACKS_COLLECTION;
  const q = query(collection(db, TRACKS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tracks: ClientProject[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          clientName: d.clientName || '',
          songTitle: d.songTitle || '',
          totalAmount: Number(d.totalAmount) || 0,
          advancePaid: Number(d.advancePaid) || 0,
          balanceDue: Number(d.balanceDue) || 0,
          isPaid: Boolean(d.isPaid),
          paymentStatus: d.paymentStatus || 'Pending UPI',
          genre: d.genre || '',
          tempoBpm: Number(d.tempoBpm) || 120,
          audioPreviewUrl: d.audioPreviewUrl || '',
          masterWavUrl: d.masterWavUrl || '',
          previewFileName: d.previewFileName || '',
          masterWavFileName: d.masterWavFileName || '',
          masterWavFileSize: d.masterWavFileSize || '',
          sampleRate: d.sampleRate || '96.0 kHz / 24-bit Lossless Broadcast WAV',
          lufsIntegrated: d.lufsIntegrated || '-14.0 LUFS',
          truePeak: d.truePeak || '-0.3 dBTP',
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt,
          paymentNotified: Boolean(d.paymentNotified),
          utrNote: d.utrNote || '',
          notifiedAt: d.notifiedAt,
        };
      });
      onData(tracks);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

// Create new track (Admin only)
export async function createTrack(
  trackData: Omit<ClientProject, 'id'>,
  customDocId?: string
): Promise<string> {
  const path = TRACKS_COLLECTION;
  try {
    const payload = {
      ...trackData,
      createdAt: trackData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (customDocId) {
      const docRef = doc(db, TRACKS_COLLECTION, customDocId);
      await setDoc(docRef, payload);
      return customDocId;
    } else {
      const docRef = await addDoc(collection(db, TRACKS_COLLECTION), payload);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// Update existing track (Admin only)
export async function updateTrack(
  trackId: string,
  updates: Partial<ClientProject>
): Promise<void> {
  const path = `${TRACKS_COLLECTION}/${trackId}`;
  try {
    const docRef = doc(db, TRACKS_COLLECTION, trackId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Submit payment verification (Public client access)
export async function submitPaymentNotification(
  trackId: string,
  utrNote: string
): Promise<void> {
  const path = `${TRACKS_COLLECTION}/${trackId}`;
  try {
    const docRef = doc(db, TRACKS_COLLECTION, trackId);
    await updateDoc(docRef, {
      paymentStatus: 'verification_pending',
      utrNote: utrNote.trim(),
      notifiedAt: new Date().toISOString(),
      paymentNotified: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Studio Settings operations
export async function getStudioSettings(): Promise<any | null> {
  const path = `${SETTINGS_COLLECTION}/${PAYMENT_SETTINGS_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PAYMENT_SETTINGS_ID);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function updateStudioSettings(settings: any): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${PAYMENT_SETTINGS_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PAYMENT_SETTINGS_ID);
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Delete track (Admin only)
export async function deleteTrack(trackId: string): Promise<void> {
  const path = `${TRACKS_COLLECTION}/${trackId}`;
  try {
    const docRef = doc(db, TRACKS_COLLECTION, trackId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// Upload audio to Firebase Storage
export async function uploadAudioToStorage(
  file: File,
  folder: 'previews' | 'masters',
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const cleanName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storagePath = `audio/${folder}/${Date.now()}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || (folder === 'previews' ? 'audio/mpeg' : 'audio/wav'),
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}
