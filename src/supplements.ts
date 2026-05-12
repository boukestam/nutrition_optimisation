import { Food } from "./config";

const SUPPLEMENTS: {
  name: string;
  perDose: Record<string, number>;
  doseGrams: number;
  costPerDose: number;
}[] = [
  {
    name: "Supplement, B12 (1000µg)",
    perDose: { "Vitamin B12": 1000 /* µg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, D3 (25µg / 1000IU)",
    perDose: { "Vitamin D": 25 /* µg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, Iodine (150µg, kelp)",
    perDose: { Iodine: 150 /* µg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, Iron bisglycinate (18mg)",
    perDose: { Iron: 18 /* mg */ },
    doseGrams: 0.5,
    costPerDose: 0.1,
  },
  {
    name: "Supplement, Calcium carbonate (500mg)",
    perDose: { Calcium: 500 /* mg */ },
    doseGrams: 1.25,
    costPerDose: 0.08,
  },
  {
    name: "Supplement, Zinc (15mg)",
    perDose: { Zinc: 15 /* mg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, Magnesium (300mg)",
    perDose: { Magnesium: 300 /* mg */ },
    doseGrams: 1.0,
    costPerDose: 0.1,
  },
  {
    name: "Supplement, Selenium (100µg)",
    perDose: { Selenium: 100 /* µg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, Copper (1mg)",
    perDose: { Copper: 1 /* mg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, Manganese (2mg)",
    perDose: { Manganese: 2 /* mg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, K2 menaquinone (100µg)",
    perDose: { "Vitamin K": 100 /* µg */ },
    doseGrams: 0.5,
    costPerDose: 0.1,
  },
  {
    name: "Supplement, E tocopherol (15mg)",
    perDose: { "Vitamin E": 15 /* mg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, Folate methylfolate (400µg)",
    perDose: { Folate: 400 /* µg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, A retinol (700µg)",
    perDose: { "Vitamin A": 700 /* µg */ },
    doseGrams: 0.5,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, C ascorbic acid (500mg)",
    perDose: { "Vitamin C": 500 /* mg */ },
    doseGrams: 0.6,
    costPerDose: 0.05,
  },
  {
    name: "Supplement, ALA flaxseed oil (1g)",
    perDose: { "C18:3,n-3": 0.55 /* g */ },
    doseGrams: 1.0,
    costPerDose: 0.12,
  },
  {
    name: "Supplement, B-complex",
    perDose: {
      "Thiamin (Vitamin B1)": 1.2 /* mg */,
      "Riboflavin (Vitamin B2)": 1.3 /* mg */,
      "Niacin equivalent": 16 /* mg */,
      "Pantothenic acid": 5 /* mg */,
      "Vitamin B6": 1.5 /* mg */,
      Biotin: 30 /* µg */,
      Folate: 400 /* µg */,
      "Vitamin B12": 6 /* µg */,
    },
    doseGrams: 1.0,
    costPerDose: 0.15,
  },
  {
    name: "Supplement, daily multi",
    perDose: {
      "Vitamin A": 700 /* µg */,
      "Thiamin (Vitamin B1)": 1.2 /* mg */,
      "Riboflavin (Vitamin B2)": 1.3 /* mg */,
      "Niacin equivalent": 16 /* mg */,
      "Pantothenic acid": 5 /* mg */,
      "Vitamin B6": 1.5 /* mg */,
      Biotin: 30 /* µg */,
      Folate: 400 /* µg */,
      "Vitamin B12": 6 /* µg */,
      "Vitamin C": 80 /* mg */,
      "Vitamin D": 10 /* µg */,
      "Vitamin E": 15 /* mg */,
      "Vitamin K": 50 /* µg */,
      Iron: 14 /* mg */,
      Zinc: 10 /* mg */,
      Copper: 1 /* mg */,
      Manganese: 2 /* mg */,
      Selenium: 55 /* µg */,
      Iodine: 150 /* µg */,
    },
    doseGrams: 1.5,
    costPerDose: 0.3,
  },
];

export function addSupplements(foods: Food[]) {
  for (const s of SUPPLEMENTS) {
    const scale = 100 / s.doseGrams;
    const nutrients: Record<string, number> = {};
    for (const [key, value] of Object.entries(s.perDose)) {
      nutrients[key] = value * scale;
    }
    foods.push({
      name: s.name,
      nutrients,
      parentGroup: "Supplements",
      group: "Supplements",
      portion: s.doseGrams,
      usual: 10,
      cost: s.costPerDose * scale,
    });
  }
}
