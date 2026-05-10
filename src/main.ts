import * as fs from "fs";
import { Options, parse } from "csv-parse/sync";
import GLPKLoader, { LP, GLPK, Result } from "glpk.js/node";

const CSV_PATH = "data/frida.csv";
const NAME_COL = 1;

interface Constraint {
  min?: number;
  max?: number;
  unit: string;
}

const BANNED_FOOD_GROUPS = [
  "Infant food",
  "Animal fats",
  "Offal and fish eggs",
  "Offal and other organs",
  "Candy",
  "Yeast and baking powder",
  "Other beverages",
  "Bouillon. extracts and the like",
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
];

const BANNED_WORDS = [
  "fortified",
  "vitamin",
  "enriched",
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
  "soaked in brine",

  // "salmon",
  // "oil",
  // "tuna",
];

const CONSTRAINTS: Record<string, Constraint> = {
  "Energy (kcal)": { min: 2450, max: 2550, unit: "kcal" },
  Protein: { min: 100, unit: "g" },
  Water: { max: 800, unit: "g" }, // Prevents things like 1L of milk
  "Carbohydrate by difference": { min: 130, unit: "g" },
  "Added Sugar": { max: 50, unit: "g" },
  "Dietary fibre": { min: 25, max: 40, unit: "g" },
  "Sum saturated fatty acids": { max: 20, unit: "g" },
  "Sum trans fatty acids": { max: 2, unit: "g" },
  Sodium: { max: 2300, unit: "mg" },
  Calcium: { min: 800, unit: "mg" },
  Iron: { min: 9, max: 45, unit: "mg" },
  Potassium: { min: 3500, unit: "mg" },
  Magnesium: { min: 300, unit: "mg" },
  Zinc: { min: 8, max: 40, unit: "mg" },
  "Vitamin A": { min: 600, max: 3000, unit: "µg" },
  "Thiamin (Vitamin B1)": { min: 1.1, unit: "mg" },
  "Riboflavin (Vitamin B2)": { min: 1.2, unit: "mg" },
  "Niacin equivalent": { min: 15, unit: "mg" },
  "Pantothenic acid": { min: 5, unit: "mg" },
  "Vitamin B6": { min: 1.4, unit: "mg" },
  Biotin: { min: 30, unit: "µg" },
  Folate: { min: 400, unit: "µg" },
  "Vitamin B12": { min: 2.4, unit: "µg" },
  "Vitamin C": { min: 80, unit: "mg" },
  //"Vitamin D": { min: 10, unit: "µg" }, // Not needed because supplemented or sun
  "Vitamin E": { min: 15, unit: "mg" },
  "Vitamin K": { min: 100, unit: "µg" },
  Cholesterol: { max: 300, unit: "mg" },
  Iodine: { min: 150, unit: "µg" },
  Selenium: { min: 55, unit: "µg" },
  Copper: { min: 0.9, unit: "mg" },
  Manganese: { min: 2, unit: "mg" },
  Phosphorus: { min: 700, unit: "mg" },
  "C18:3,n-3": { min: 1.6, unit: "g" },
  Lead: { max: 25, unit: "µg" },
  Cadmium: { max: 25, unit: "µg" },
  Arsenic: { max: 15, unit: "µg" },
};

const MIN_PORTION = 0.5;
const MAX_PORTION = 2;

const MIN_USUAL = 4;

const COST_PER_ITEM = 8;

const NUM_DIETS = 5;
const NUM_UNIQUE = 5;

interface Food {
  name: string;
  nutrients: Record<string, number>;
  others: Record<string, string>;
}

interface Portion {
  food: string;
  portion: number;
  usual: number;
  cost: number;
}

function getPortion(portions: Portion[], name: string): Portion {
  const portion = portions.find((p) => p.food === name);
  if (!portion) throw new Error("No portion found for: " + name);
  return portion;
}

function getFood(foods: Food[], name: string): Food {
  const food = foods.find((f) => f.name === name);
  if (!food) throw new Error("No food found for: " + name);
  return food;
}

const csvOptions: Options = { delimiter: ",", quote: '"' };

function loadPortions(): Portion[] {
  const raw = fs.readFileSync("data/portions.csv", "utf-8");
  const rows: string[][] = parse(raw, csvOptions);
  const portions: Portion[] = [];

  for (let i = 1; i < rows.length; i++) {
    if (portions.find((p) => p.food === rows[i][0])) continue;

    portions.push({
      food: rows[i][0],
      portion: parseFloat(rows[i][1]),
      usual: parseFloat(rows[i][2]),
      cost: parseFloat(rows[i][3]),
    });
  }

  return portions;
}

function loadFoods(whitelistSet: Set<string>): Food[] {
  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const rows: string[][] = parse(raw, csvOptions);
  const headers = rows[1].map((h) => h.trim());
  const otherHeaders = rows[3].map((h) => h.trim());

  const foods: Food[] = [];

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[NAME_COL] ?? "").trim();

    if (!name || name.startsWith("→") || !whitelistSet.has(name)) continue;

    if (foods.find((f) => f.name === name)) continue;

    const nutrients: Record<string, number> = {};
    const others: Record<string, string> = {};

    for (let j = NAME_COL + 1; j < headers.length; j++) {
      const header = headers[j];
      const otherHeader = otherHeaders[j];
      if (!header && !otherHeader) continue;

      const cell = (row[j] ?? "").trim();
      if (header) {
        nutrients[header] =
          cell === "" || cell === "-" ? 0 : parseFloat(cell) || 0;
      } else {
        others[otherHeader] = cell;
      }
    }
    foods.push({ name, nutrients, others });
  }
  return foods;
}

async function solve(
  glpk: GLPK,
  foods: Food[],
  portions: Portion[],
  previousSolutions: Set<string>[] = [],
) {
  const subjectTo: LP["subjectTo"] = [];

  const variables: { [name: string]: Record<string, number> } = {};
  for (const food of foods) {
    const portion = getPortion(portions, food.name);
    if (!portion) continue;

    variables[food.name] = {
      ...food.nutrients,
      grams: 100,
      cost: portion.cost,
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
  for (const foodName of Object.keys(variables)) {
    const indicatorName = foodName + "_used";
    binaries.push(indicatorName);

    const portion = getPortion(portions, foodName);
    const minGrams = portion.portion * MIN_PORTION;
    const maxGrams = portion.portion * MAX_PORTION;

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
      if (
        foodName + "_used" in
        Object.fromEntries(binaries.map((b) => [b, 1]))
      ) {
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

  // const objVars: { name: string; coef: number }[] = [];
  // for (const foodName of Object.keys(variables)) {
  //   const portion = getPortion(portions, foodName);
  //   objVars.push({ name: foodName, coef: portion.cost });
  // }
  // for (const b of binaries) {
  //   objVars.push({ name: b, coef: COST_PER_ITEM });
  // }

  const HEALTH_PENALTIES: Record<string, number> = {
    Sodium: 1 / 2300,
    "Sum saturated fatty acids": 1 / 20,
    "Sum trans fatty acids": 1 / 2,
    "Added Sugar": 1 / 50,
    Cholesterol: 1 / 300,
    Lead: 1 / 25,
    Cadmium: 1 / 25,
    Arsenic: 1 / 15,
  };

  const HEALTH_REWARDS: Record<string, number> = {
    "Dietary fibre": 25,
    "C18:3,n-3": 1.6,
  };

  const HEALTH_PER_ITEM = 1.0;

  const bounds: { name: string; type: number; ub: number; lb: number }[] = [];
  const creditNames: Record<string, string> = {};

  for (const [nutrient, target] of Object.entries(HEALTH_REWARDS)) {
    const creditName = "credit_" + nutrient.replace(/[^a-zA-Z0-9]/g, "_");
    creditNames[nutrient] = creditName;

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
      bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
    });

    bounds.push({
      name: creditName,
      type: glpk.GLP_DB,
      lb: 0,
      ub: target,
    });
  }

  const objVars: { name: string; coef: number }[] = [];
  for (const foodName of Object.keys(variables)) {
    let coef = 0;
    for (const [nutrient, weight] of Object.entries(HEALTH_PENALTIES)) {
      coef += (variables[foodName][nutrient] ?? 0) * weight;
    }
    objVars.push({ name: foodName, coef });
  }
  for (const [nutrient, target] of Object.entries(HEALTH_REWARDS)) {
    objVars.push({ name: creditNames[nutrient], coef: -1 / target });
  }
  for (const b of binaries) {
    objVars.push({ name: b, coef: HEALTH_PER_ITEM });
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
    //mipgap: 0.05,
  });
}

function printSolution(
  glpk: GLPK,
  result: Result,
  foods: Food[],
  portions: Portion[],
): Record<string, number> {
  const solution = result.result.vars;

  const output: Record<string, number> = {};

  if (
    result.result.status === glpk.GLP_OPT ||
    result.result.status === glpk.GLP_FEAS
  ) {
    const foodNames = foods
      .map((f) => f.name)
      .filter((name) => solution[name] > 1e-9);
    const total: Record<string, number> = {};

    for (const foodName of foodNames) {
      const food = getFood(foods, foodName);
      for (const key of Object.keys(CONSTRAINTS)) {
        if (!(key in total)) total[key] = 0;
        total[key] += food.nutrients[key] * solution[foodName];
      }

      output[foodName] = solution[foodName];
    }

    // console.log("------------- Total --------------");
    // for (const key in total) console.log(key + ": " + total[key].toFixed(1));

    console.log("\n------------- Diet --------------");
    for (const foodName of foodNames) {
      const food = getFood(foods, foodName);
      const portion = getPortion(portions, foodName);
      console.log(
        `${foodName}: ${(solution[foodName] * 100).toFixed(1)}g, $${(solution[foodName] * portion.cost).toFixed(2)} (${food.others["FoodGroup"]})`,
      );
    }

    console.log("\n------------- Cost --------------");
    let totalCost = 0;
    for (const foodName of foodNames) {
      totalCost += solution[foodName] * getPortion(portions, foodName).cost;
    }
    console.log(`Total $${totalCost.toFixed(2)}`);
  } else {
    console.log("No feasible solution found!");
  }

  return output;
}

async function diagnoseInfeasibility(
  glpk: GLPK,
  foods: Food[],
  portions: Portion[],
) {
  const subjectTo: LP["subjectTo"] = [];
  const slackVars: string[] = [];

  const variables: { [name: string]: Record<string, number> } = {};
  for (const food of foods) {
    const portion = getPortion(portions, food.name);
    variables[food.name] = {
      ...food.nutrients,
      grams: 100,
      cost: portion.cost,
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

    // For min constraints: add a slack so (sum + slack >= min), slack absorbs any deficit
    if (constraint.min !== undefined) {
      const slackName = constraintName + "_slack_min";
      slackVars.push(slackName);
      subjectTo.push({
        name: constraintName + "_min",
        vars: [...vars, { name: slackName, coef: 1 }],
        bnds: { type: glpk.GLP_LO, lb: constraint.min, ub: 0 },
      });
    }

    // For max constraints: add a slack so (sum - slack <= max), slack absorbs any excess
    if (constraint.max !== undefined) {
      const slackName = constraintName + "_slack_max";
      slackVars.push(slackName);
      subjectTo.push({
        name: constraintName + "_max",
        vars: [...vars, { name: slackName, coef: -1 }],
        bnds: { type: glpk.GLP_UP, lb: 0, ub: constraint.max },
      });
    }
  }

  // Portion bounds (continuous relaxation — no binaries)
  for (const foodName of Object.keys(variables)) {
    const portion = getPortion(portions, foodName);
    const minGrams = (portion.portion * MIN_PORTION) / 100;
    const maxGrams = (portion.portion * MAX_PORTION) / 100;
    subjectTo.push({
      name: foodName + "_bounds",
      vars: [{ name: foodName, coef: 1 }],
      bnds: { type: glpk.GLP_DB, lb: 0, ub: maxGrams },
    });
  }

  const lp: LP = {
    name: "diagnosis",
    objective: {
      direction: glpk.GLP_MIN,
      name: "total_slack",
      vars: slackVars.map((s) => ({ name: s, coef: 1 })),
    },
    subjectTo,
  };

  const result = await glpk.solve(lp, { msglev: glpk.GLP_MSG_OFF });
  const vars = result.result.vars;

  console.log("\n------------- Infeasibility Diagnosis --------------");
  let anyViolation = false;
  for (const slackName of slackVars) {
    const slack = vars[slackName] ?? 0;
    if (slack > 1e-6) {
      anyViolation = true;
      const isMin = slackName.endsWith("_slack_min");
      const constraintName = slackName.replace(/_slack_(min|max)$/, "");
      const constraint = CONSTRAINTS[constraintName];
      const bound = isMin ? constraint.min : constraint.max;
      const direction = isMin ? "below minimum" : "above maximum";
      console.log(
        `  ${constraintName}: ${direction} by ${slack.toFixed(2)} ${constraint.unit} (target: ${bound} ${constraint.unit})`,
      );
    }
  }
  if (!anyViolation) {
    console.log(
      "  No nutrient constraint violations found in continuous relaxation.",
    );
    console.log("  The issue may be with food count / binary constraints.");
  }
}

async function run() {
  const glpk = await GLPKLoader();
  const portions = loadPortions();
  const whitelistSet = new Set(
    portions.filter((p) => p.usual >= MIN_USUAL).map((p) => p.food),
  );
  let foods = loadFoods(whitelistSet);
  foods = foods.filter(
    (f) =>
      !BANNED_FOOD_GROUPS.includes(f.others["FoodGroup"]) &&
      !BANNED_WORDS.some((word) =>
        f.name.toLowerCase().replaceAll(",", "").includes(word),
      ),
  );

  console.log(`Loaded ${foods.length} foods from ${CSV_PATH}`);

  const previousSolutions: Set<string>[] = [];

  for (let i = 0; i < NUM_DIETS; i++) {
    console.log(`\n========== Diet ${i + 1} ==========`);
    const result = await solve(glpk, foods, portions, previousSolutions);

    if (
      result.result.status !== glpk.GLP_OPT &&
      result.result.status !== glpk.GLP_FEAS
    ) {
      console.log("No more feasible unique diets.");
      await diagnoseInfeasibility(glpk, foods, portions);
      break;
    }

    const output = printSolution(glpk, result, foods, portions);
    previousSolutions.push(new Set(Object.keys(output)));
  }
}

run().catch(console.error);
