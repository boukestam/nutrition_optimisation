export const BANNED_FOOD_GROUPS = [
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
];

export const VEGAN_GROUPS = [
  "Meat and meat products",
  "Fish, quatic animals and their products",
  "Poultry",
  "Animal fats",
  "Butter",

  "Eggs and egg products",
  "Cheese and cheese products",
  "Milk and milk preserves",
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

export interface Constraint {
  min?: number;
  max?: number;
  label: string;
  unit: string;
}

export const CONSTRAINTS: Record<string, Constraint> = {
  "Energy (kcal)": {
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

  "Carbohydrate by difference": {
    label: "Carbohydrates",
    min: 130,
    unit: "g",
  },

  "Added Sugar": {
    label: "Added Sugar",
    max: 50,
    unit: "g",
  },

  "Dietary fibre": {
    label: "Fiber",
    min: 25,
    max: 40,
    unit: "g",
  },

  "Sum saturated fatty acids": {
    label: "Saturated Fat",
    max: 20,
    unit: "g",
  },

  "Sum trans fatty acids": {
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

  "Thiamin (Vitamin B1)": {
    label: "Vitamin B1",
    min: 1.1,
    unit: "mg",
  },

  "Riboflavin (Vitamin B2)": {
    label: "Vitamin B2",
    min: 1.6,
    unit: "mg",
  },

  "Niacin equivalent": {
    label: "Vitamin B3",
    min: 15,
    max: 900,
    unit: "mg",
  }, // Nicotinamide UL; nicotinic acid UL is only 10 mg

  "Pantothenic acid": {
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
    label: "Biotin",
    min: 40,
    unit: "µg",
  },

  Folate: {
    label: "Folate",
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

  //"Vitamin D": { label: "Vitamin D", min: 10, unit: "µg" }, // Not needed because supplemented or sun

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

  "C18:3,n-3": {
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
export const MAX_PORTION = 2;

export const MIN_USUAL = 4;

export const NUM_DIETS = 5;
export const NUM_UNIQUE = 5;

export interface Food {
  name: string;
  nutrients: Record<string, number>;
  parentGroup: string;
  group: string;
  portion: number;
  usual: number;
  cost: number;
}
