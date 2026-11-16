export type PaymentStatus = 'Paid in Full - Cash' | 'Paid in Full - UPI' | 'Pending UPI' | 'verification_pending';

export interface ClientProject {
  id: string; // Firestore document ID
  clientName: string;
  songTitle: string;
  totalAmount: number; // in INR (₹)
  advancePaid: number; // in INR (₹)
  balanceDue: number; // calculated: totalAmount - advancePaid (or 0 if paid in full)
  isPaid: boolean; // boolean flag for lock/unlock security
  paymentStatus: PaymentStatus;
  genre: string;
  tempoBpm: number;
  audioPreviewUrl: string; // 128kbps watermarked MP3
  masterWavUrl?: string; // 24-bit lossless WAV download URL (only exposed on client when isPaid is true)
  previewFileName: string;
  masterWavFileName: string;
  masterWavFileSize: string;
  sampleRate: string;
  lufsIntegrated: string;
  truePeak: string;
  createdAt: string;
  updatedAt?: string;
  paymentNotified?: boolean;
  utrNote?: string;
  notifiedAt?: string;
}

export interface StudioSettings {
  upiId: string;
  payeeName: string;
  updatedAt?: string;
}
