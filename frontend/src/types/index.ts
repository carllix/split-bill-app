export interface Item {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface ItemAssignment {
  item_index: number;
  quantity: number;
}

export interface PersonAssignment {
  name: string;
  items: ItemAssignment[];
}

export interface SplitRequest {
  session_id: string;
  items: Item[];
  assignments: PersonAssignment[];
  total_payment: number;
  discount: number;
  discount_plus: number;
  handling_fee: number;
  other_fee: number;
}

export interface PersonSplitResult {
  name: string;
  total: number;
  items: ItemAssignment[];
}

export interface ParsedData {
  items: Item[];
  total_price: number;
  handling_fee: number;
  other_fee: number;
  discount: number;
  discount_plus: number;
  total_payment: number;
}

export interface AppState {
  currentStep: number;
  sessionId: string;
  parsedData: ParsedData | null;
  items: Item[];
  people: string[];
  assignments: PersonAssignment[];
  splitResults: PersonSplitResult[];
}