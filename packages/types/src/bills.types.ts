export enum BillCategory {
  AIRTIME = 'airtime',
  DATA = 'data',
  ELECTRICITY = 'electricity',
  CABLE_TV = 'cable_tv',
  INTERNET = 'internet',
  EDUCATION = 'education',
  WATER = 'water',
  BETTING = 'betting',
}

export enum BillProvider {
  MTN = 'MTN',
  AIRTEL = 'Airtel',
  GLO = 'Glo',
  NINE_MOBILE = '9Mobile',
  DSTV = 'DStv',
  GOTV = 'GOtv',
  STARTIMES = 'Startimes',
  EKEDC = 'EKEDC',
  IKEDC = 'IKEDC',
  AEDC = 'AEDC',
  KAEDC = 'KAEDC',
  SMILE = 'Smile',
  SPECTRANET = 'Spectranet',
}

export interface IBillPlan {
  id: string;
  providerId: string;
  category: BillCategory;
  name: string;
  code: string;
  amount?: number;
  description?: string;
  validity?: string;
  isAvailable: boolean;
}

export interface IBillProvider {
  id: string;
  name: BillProvider;
  category: BillCategory;
  logoUrl: string;
  isAvailable: boolean;
  supportsVariableAmount: boolean;
  minimumAmount?: number;
  maximumAmount?: number;
}
