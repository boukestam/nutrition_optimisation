import { GLPK, LP } from "glpk.js";
import {
  Food,
  CONSTRAINTS,
  MIN_PORTION,
  MAX_PORTION,
  NUM_UNIQUE,
} from "./config";
import { getFood } from "./utils";

const PIECEWISE_PENALTY_THRESHOLDS: Record<string, number> = {
  Sodium: 1500,
  "Sum saturated fatty acids": 15,
  "Sum trans fatty acids": 0,
  "Added Sugar": 25,
};

const TOXIN_WEIGHTS: Record<string, number> = {
  Lead: 10,
  Cadmium: 10,
  Arsenic: 10,
};

const BONUS_TARGETS: Record<string, number> = {
  "Dietary fibre": 40,
  "C18:3,n-3": 3,
  Potassium: 4700,
  Magnesium: 500,
  "Vitamin C": 200,
  Calcium: 1500,
  Folate: 600,
  "Vitamin A": 1500,
  "Vitamin E": 30,
};

const PER_ITEM_PENALTY = 0.4;

const COST_REFERENCE = 10;
const COST_WEIGHT = 0.4;

export async function solve(
  glpk: GLPK,
  foods: Food[],
  previousSolutions: Set<string>[] = [],
) {
  const subjectTo: LP["subjectTo"] = [];

  const variables: { [name: string]: Record<string, number> } = {};
  for (const food of foods) {
    variables[food.name] = {
      ...food.nutrients,
      grams: 100,
      cost: food.cost,
    };
  }

  for (const [constraintName, constraint] of Object.entries(CONSTRAINTS)) {
    const vars: { name: string; coef: number }[] = [];
    for (const foodName of Object.keys(variables)) {
      if (constraintName in variables[foodName]) {
        vars.push({
          name: foodName,
          coef: variables[foodName][constraintName],
        });
      }
    }

    if (vars.length === 0) continue;

    let bnds;
    if (constraint.min !== undefined && constraint.max !== undefined) {
      bnds = { type: glpk.GLP_DB, lb: constraint.min, ub: constraint.max };
    } else if (constraint.min !== undefined) {
      bnds = { type: glpk.GLP_LO, lb: constraint.min, ub: 0 };
    } else if (constraint.max !== undefined) {
      bnds = { type: glpk.GLP_UP, lb: 0, ub: constraint.max };
    } else {
      bnds = { type: glpk.GLP_FR, lb: 0, ub: 0 };
    }
    subjectTo.push({ name: constraintName, vars, bnds });
  }

  const binaries: string[] = [];
  const binarySet = new Set<string>();
  for (const foodName of Object.keys(variables)) {
    const indicatorName = foodName + "_used";
    binaries.push(indicatorName);
    binarySet.add(indicatorName);

    const food = getFood(foods, foodName);
    const portion = food.portion;
    const minGrams = portion * MIN_PORTION;
    const maxGrams = portion * MAX_PORTION;

    subjectTo.push({
      name: foodName + "_ub",
      vars: [
        { name: foodName, coef: 100 },
        { name: indicatorName, coef: -maxGrams },
      ],
      bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
    });

    subjectTo.push({
      name: foodName + "_lb",
      vars: [
        { name: foodName, coef: 100 },
        { name: indicatorName, coef: -minGrams },
      ],
      bnds: { type: glpk.GLP_LO, lb: 0, ub: 0 },
    });
  }

  for (let i = 0; i < previousSolutions.length; i++) {
    const prev = previousSolutions[i];
    const vars: { name: string; coef: number }[] = [];
    for (const foodName of prev) {
      if (binarySet.has(foodName + "_used")) {
        vars.push({ name: foodName + "_used", coef: 1 });
      }
    }
    if (vars.length < NUM_UNIQUE) continue;
    subjectTo.push({
      name: "diversity_" + i,
      vars,
      bnds: { type: glpk.GLP_UP, lb: 0, ub: prev.size - NUM_UNIQUE },
    });
  }

  const bounds: { name: string; type: number; ub: number; lb: number }[] = [];
  const objVars: { name: string; coef: number }[] = [];

  for (const [nutrient, threshold] of Object.entries(
    PIECEWISE_PENALTY_THRESHOLDS,
  )) {
    const max = CONSTRAINTS[nutrient]?.max;
    if (max === undefined || max <= threshold) continue;

    const excessName = "excess_" + nutrient.replace(/[^a-zA-Z0-9]/g, "_");

    const vars: { name: string; coef: number }[] = [
      { name: excessName, coef: 1 },
    ];
    for (const foodName of Object.keys(variables)) {
      if (nutrient in variables[foodName]) {
        vars.push({ name: foodName, coef: -variables[foodName][nutrient] });
      }
    }
    subjectTo.push({
      name: excessName + "_def",
      vars,
      bnds: { type: glpk.GLP_LO, lb: -threshold, ub: 0 },
    });
    bounds.push({
      name: excessName,
      type: glpk.GLP_LO,
      lb: 0,
      ub: 0,
    });

    objVars.push({ name: excessName, coef: 1 / (max - threshold) });
  }

  for (const [nutrient, target] of Object.entries(BONUS_TARGETS)) {
    const min = CONSTRAINTS[nutrient]?.min ?? 0;
    if (target <= min) continue;

    const creditName = "credit_" + nutrient.replace(/[^a-zA-Z0-9]/g, "_");

    const vars: { name: string; coef: number }[] = [
      { name: creditName, coef: 1 },
    ];
    for (const foodName of Object.keys(variables)) {
      if (nutrient in variables[foodName]) {
        vars.push({ name: foodName, coef: -variables[foodName][nutrient] });
      }
    }
    subjectTo.push({
      name: creditName + "_cap",
      vars,
      bnds: { type: glpk.GLP_UP, lb: 0, ub: -min },
    });
    bounds.push({
      name: creditName,
      type: glpk.GLP_DB,
      lb: 0,
      ub: target - min,
    });

    objVars.push({ name: creditName, coef: -1 / (target - min) });
  }

  for (const foodName of Object.keys(variables)) {
    const food = getFood(foods, foodName);
    let coef = 0;

    for (const [nutrient, weight] of Object.entries(TOXIN_WEIGHTS)) {
      const max = CONSTRAINTS[nutrient]?.max;
      if (max === undefined) continue;
      coef += ((variables[foodName][nutrient] ?? 0) * weight) / max;
    }

    coef += (food.cost * COST_WEIGHT) / COST_REFERENCE;

    if (coef !== 0) objVars.push({ name: foodName, coef });
  }

  for (const b of binaries) {
    objVars.push({ name: b, coef: PER_ITEM_PENALTY });
  }

  const lp: LP = {
    name: "diet",
    objective: { direction: glpk.GLP_MIN, name: "objective", vars: objVars },
    subjectTo,
    bounds,
    binaries,
  };

  return await glpk.solve(lp, {
    msglev: glpk.GLP_MSG_OFF,
    tmlim: 10,
    mipgap: 0.02,
  });
}
