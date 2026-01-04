
export enum InsulinType {
  RAPID = 'Rapid-acting',
  REGULAR = 'Regular'
}

export interface FoodItem {
  food: string;
  quantity: string;
  carbs: number;
}

export interface CalculationResult {
  foods: FoodItem[];
  totalCarbs: number;
  ccr: number;
  cf: number;
  carbInsulin: number;
  correctionInsulin: number;
  finalDose: number;
}

export interface AppSettings {
  tdd: number;
  insulinType: InsulinType;
  ccrConstant: number;
  isfConstant: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mealText: string;
  glucose?: string;
  result: CalculationResult;
}
