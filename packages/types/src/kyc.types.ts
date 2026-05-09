export enum KycStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum KycDocumentType {
  NIN = 'nin',
  BVN = 'bvn',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  NATIONAL_ID = 'national_id',
  VOTER_CARD = 'voter_card',
  SELFIE = 'selfie',
  PROOF_OF_ADDRESS = 'proof_of_address',
  CAC = 'cac',
  TIN = 'tin',
}

export interface IKycRecord {
  id: string;
  userId: string;
  tier: number;
  status: KycStatus;
  documents: IKycDocument[];
  bvn?: string;
  nin?: string;
  dateOfBirth?: Date;
  address?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  submittedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKycDocument {
  id: string;
  kycId: string;
  type: KycDocumentType;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: KycStatus;
  verificationScore?: number;
  rejectionReason?: string;
  externalReference?: string;
  createdAt: Date;
}
