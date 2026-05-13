export const BANNED_FOOD_GROUPS = [
  // Frida
  "Infant food",
  "Animal fats",
  "Offal and fish eggs",
  "Offal and other organs",
  "Candy",
  "Yeast and baking powder",
  "Other beverages",
  "Bouillon, extracts and the like",
  "Game",
  "Dairy ice cream",
  "Cakes",
  "Pizza",
  "Sandwich, burger, hotdog etc.",
  "Other composite foods",
  "Fish products",
  "Flour and bran",
  "Biscuits and cookies",
  "Ready meals",
  "Wines",
  "Mayonnaises,  remoulade etc",
  "Dressings",
  "Mayonnaise-Based Salad Spreads",
  "Beer and other malt beverages",
  "Mollusks and their products",
  " Ready meals, fastfood and composite foods",
  "Potato chip and snacks",
  "Processed cheese",

  // Nevo
  "Mixed dishes",
  "Miscellaneous foods",
  "Foods for special nutritional use",
];

export const VEGAN_GROUPS = [
  // Frida
  "Meat and meat products",
  "Fish, quatic animals and their products",
  "Poultry",
  "Animal fats",
  "Butter",
  "Eggs and egg products",
  "Cheese and cheese products",
  "Milk and milk preserves",

  // Nevo
  "Eggs",
  "Meat and poultry",
  "Fish, crustacean and shellfish",
  "Milk and milk products",
  "Cheese",
  "Cold meat cuts",
];

export const BANNED_WORDS = [
  "fortified",
  "vitamin",
  "enriched",
  "with added",
  "yogurt with",
  "yoghurt with",
  "milk with",
  "milkshake",
  "fried",
  "with chocolate",
  "protein",
  "acidophilus",
  "salad",
  "soup",
  "mix",
  "fries",
  "in brine",
];

export type Nutrient =
  | "Energy"
  | "Protein"
  | "Water"
  | "Carbohydrate"
  | "Added Sugar"
  | "Fibre"
  | "Saturated Fat"
  | "Trans Fat"
  | "Sodium"
  | "Calcium"
  | "Iron"
  | "Potassium"
  | "Magnesium"
  | "Zinc"
  | "Vitamin A"
  | "Vitamin B1"
  | "Vitamin B2"
  | "Vitamin B3"
  | "Vitamin B5"
  | "Vitamin B6"
  | "Biotin"
  | "Folate"
  | "Vitamin B12"
  | "Vitamin C"
  | "Vitamin E"
  | "Vitamin K"
  | "Iodine"
  | "Selenium"
  | "Copper"
  | "Manganese"
  | "Phosphorus"
  | "Omega-3"
  | "Lead"
  | "Cadmium"
  | "Arsenic";

export const FRIDA_TO_KEY: Record<string, Nutrient> = {
  "Energy (kcal)": "Energy",
  Protein: "Protein",
  Water: "Water",
  "Carbohydrate by difference": "Carbohydrate",
  "Added Sugar": "Added Sugar",
  "Dietary fibre": "Fibre",
  "Sum saturated fatty acids": "Saturated Fat",
  "Sum trans fatty acids": "Trans Fat",
  Sodium: "Sodium",
  Calcium: "Calcium",
  Iron: "Iron",
  Potassium: "Potassium",
  Magnesium: "Magnesium",
  Zinc: "Zinc",
  "Vitamin A": "Vitamin A",
  "Thiamin (Vitamin B1)": "Vitamin B1",
  "Riboflavin (Vitamin B2)": "Vitamin B2",
  "Niacin equivalent": "Vitamin B3",
  "Pantothenic acid": "Vitamin B5",
  "Vitamin B6": "Vitamin B6",
  Biotin: "Biotin",
  Folate: "Folate",
  "Vitamin B12": "Vitamin B12",
  "Vitamin C": "Vitamin C",
  "Vitamin E": "Vitamin E",
  "Vitamin K": "Vitamin K",
  Iodine: "Iodine",
  Selenium: "Selenium",
  Copper: "Copper",
  Manganese: "Manganese",
  Phosphorus: "Phosphorus",
  "C18:3,n-3": "Omega-3",
  Lead: "Lead",
  Cadmium: "Cadmium",
  Arsenic: "Arsenic",
};

export const NEVO_TO_KEY: Record<string, Nutrient> = {
  "ENERCC (kcal)": "Energy",
  "PROT (g)": "Protein",
  "WATER (g)": "Water",
  "CHO (g)": "Carbohydrate",
  "NVSUGAF (g)": "Added Sugar",
  "FIBT (g)": "Fibre",
  "FASAT (g)": "Saturated Fat",
  "FATRS (g)": "Trans Fat",
  "NA (mg)": "Sodium",
  "CA (mg)": "Calcium",
  "FE (mg)": "Iron",
  "K (mg)": "Potassium",
  "MG (mg)": "Magnesium",
  "ZN (mg)": "Zinc",
  "CU (mg)": "Copper",
  "SE (µg)": "Selenium",
  "ID (µg)": "Iodine",
  "MN (mg)": "Manganese",
  "P (mg)": "Phosphorus",
  "VITA_RAE (µg)": "Vitamin A",
  "THIA (mg)": "Vitamin B1",
  "RIBF (mg)": "Vitamin B2",
  "NIAEQ (mg)": "Vitamin B3",
  "PANTO (mg)": "Vitamin B5",
  "VITB6 (mg)": "Vitamin B6",
  "BIOT (µg)": "Biotin",
  "FOL (µg)": "Folate",
  "VITB12 (µg)": "Vitamin B12",
  "VITC (mg)": "Vitamin C",
  "VITE (mg)": "Vitamin E",
  "VITK (µg)": "Vitamin K",
  "F18:3CN3 (g)": "Omega-3",
  "PB (µg)": "Lead",
  "CD (µg)": "Cadmium",
  "AS (µg)": "Arsenic",
};

export interface Constraint {
  min?: number;
  max?: number;
  label: string;
  unit: string;
}

export const CONSTRAINTS: Record<Nutrient, Constraint> = {
  Energy: {
    label: "Calories",
    min: 2450,
    max: 2550,
    unit: "kcal",
  },

  Protein: {
    label: "Protein",
    min: 100,
    unit: "g",
  },

  Water: {
    label: "Water",
    max: 1200,
    unit: "g",
  }, // Prevents things like 1L of milk

  Carbohydrate: {
    label: "Carbohydrates",
    min: 130,
    unit: "g",
  },

  "Added Sugar": {
    label: "Added Sugar",
    max: 50,
    unit: "g",
  },

  Fibre: {
    label: "Fiber",
    min: 25,
    max: 40,
    unit: "g",
  },

  "Saturated Fat": {
    label: "Saturated Fat",
    max: 20,
    unit: "g",
  },

  "Trans Fat": {
    label: "Trans Fat",
    max: 2.5,
    unit: "g",
  },

  Sodium: {
    label: "Sodium",
    max: 2300,
    unit: "mg",
  },

  Calcium: {
    label: "Calcium",
    min: 950,
    max: 2500,
    unit: "mg",
  },

  Iron: {
    label: "Iron",
    min: 11,
    max: 40,
    unit: "mg",
  },

  Potassium: {
    label: "Potassium",
    min: 3500,
    unit: "mg",
  },

  Magnesium: {
    label: "Magnesium",
    min: 350,
    unit: "mg",
  }, // EFSA UL of 250 mg applies only to supplemental Mg

  Zinc: {
    label: "Zinc",
    min: 9.4,
    max: 25,
    unit: "mg",
  },

  "Vitamin A": {
    label: "Vitamin A",
    min: 750,
    max: 3000,
    unit: "µg",
  },

  "Vitamin B1": {
    label: "Vitamin B1",
    min: 1.1,
    unit: "mg",
  },

  "Vitamin B2": {
    label: "Vitamin B2",
    min: 1.6,
    unit: "mg",
  },

  "Vitamin B3": {
    label: "Vitamin B3",
    min: 15,
    max: 900,
    unit: "mg",
  }, // Nicotinamide UL; nicotinic acid UL is only 10 mg

  "Vitamin B5": {
    label: "Vitamin B5",
    min: 5,
    unit: "mg",
  },

  "Vitamin B6": {
    label: "Vitamin B6",
    min: 1.7,
    max: 12,
    unit: "mg",
  },

  Biotin: {
    label: "Biotin (Vitamin B7)",
    min: 40,
    unit: "µg",
  },

  Folate: {
    label: "Folate (Vitamin B9)",
    min: 330,
    max: 1000,
    unit: "µg",
  }, // UL applies to folic acid added to food/supplements only

  "Vitamin B12": {
    label: "Vitamin B12",
    min: 4,
    unit: "µg",
  },

  "Vitamin C": {
    label: "Vitamin C",
    min: 110,
    unit: "mg",
  },

  "Vitamin E": {
    label: "Vitamin E",
    min: 13,
    max: 300,
    unit: "mg",
  },

  "Vitamin K": {
    label: "Vitamin K",
    min: 70,
    unit: "µg",
  },

  Iodine: {
    label: "Iodine",
    min: 150,
    max: 600,
    unit: "µg",
  },

  Selenium: {
    label: "Selenium",
    min: 70,
    max: 255,
    unit: "µg",
  },

  Copper: {
    label: "Copper",
    min: 1.6,
    max: 5,
    unit: "mg",
  },

  Manganese: {
    label: "Manganese",
    min: 3,
    max: 8,
    unit: "mg",
  },

  Phosphorus: {
    label: "Phosphorus",
    min: 550,
    max: 4000,
    unit: "mg",
  }, // EFSA has no UL; this is the US IOM value

  "Omega-3": {
    label: "Omega-3",
    min: 1.6,
    unit: "g",
  },

  Lead: {
    label: "Lead",
    max: 25,
    unit: "µg",
  },

  Cadmium: {
    label: "Cadmium",
    max: 25,
    unit: "µg",
  },

  Arsenic: {
    label: "Arsenic",
    max: 15,
    unit: "µg",
  },
};

export const MIN_PORTION = 0.5;
export const MAX_PORTION = 1.5;

export const MIN_USUAL = 4;

export const NUM_DIETS = 5;
export const NUM_UNIQUE = 5;

export interface Food {
  name: string;
  nutrients: Record<string, number>;
  group: string;
  parentGroup?: string;
  portion: number;
  usual: number;
  cost: number;
  hasAnimalProtein?: boolean;
}
