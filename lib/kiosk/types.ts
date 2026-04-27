export type KioskRestaurant = {
  id: string;
  name: string;
};

export type KioskMenuItem = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
};

export type ReceiptItem = {
  raw_text: string;
  menu_item_id: string | null;
  menu_item_name: string | null;
  quantity: number;
};

export type SelectedItem = {
  id: string;
  name: string;
  quantity: number;
};

export type EntitlementResult = {
  allowed: boolean;
  reason: string;
  limit: number;
  used: number;
  remaining: number;
  upgradeTarget: string | null;
};

export type KioskScanCopy = {
  scanEyebrow: string;
  title: string;
  subtitle: string;
  remainingScansLabel: string;
  scanButton: string;
  scanAgain: string;
  processing: string;
  exhaustedTitle: string;
  exhaustedBody: string;
  manualButton: string;
  manualTitle: string;
  manualBody: string;
  manualSearch: string;
  noMenuTitle: string;
  noMenuBody: string;
  selectedCountLabel: string;
  continueWithSelection: string;
  chooseAtLeastOne: string;
  extractedTitle: string;
  extractedBody: string;
  useExtracted: string;
  useManual: string;
  scanFailed: string;
  readyTitle: string;
  readyBody: string;
  editSelection: string;
  startCustomerStep: string;
  customerTitle: string;
  customerBody: string;
  finish: string;
  thanksTitle: string;
  thanksBody: string;
  reset: string;
  ownerUpgradeHint: string;
};

export type ScreenMode =
  | "scan"
  | "manual"
  | "review"
  | "ready"
  | "customer"
  | "thanks";

export type KioskScanScreenProps = {
  restaurant: KioskRestaurant;
  menuItems: KioskMenuItem[];
  initialEntitlement: EntitlementResult;
  copy: KioskScanCopy;
};
