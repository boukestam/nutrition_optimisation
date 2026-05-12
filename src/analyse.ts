import { GLPK, Result } from "glpk.js";
import { Food, CONSTRAINTS } from "./config";
import { getFood } from "./utils";

export function calculateTotalNutrients(
  solution: Record<string, number>,
  foods: Food[],
) {
  const total: Record<string, number> = {};

  for (const foodName of Object.keys(solution)) {
    const food = getFood(foods, foodName);
    for (const key of Object.keys(CONSTRAINTS)) {
      if (!(key in total)) total[key] = 0;
      total[key] += (food.nutrients[key] || 0) * solution[foodName];
    }
  }

  return total;
}

export function calculateTotalCost(
  solution: Record<string, number>,
  foods: Food[],
) {
  let totalCost = 0;
  for (const foodName of Object.keys(solution)) {
    const food = getFood(foods, foodName);
    totalCost += solution[foodName] * food.cost;
  }
  return totalCost;
}

export function printSolution(
  glpk: GLPK,
  result: Result,
  foods: Food[],
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

    for (const foodName of foodNames) {
      output[foodName] = solution[foodName];
    }

    console.log("\n------------- Diet --------------");
    for (const foodName of foodNames) {
      const food = getFood(foods, foodName);
      console.log(
        `${foodName}: ${(solution[foodName] * 100).toFixed(1)}g, $${(solution[foodName] * food.cost).toFixed(2)} (${food.group})`,
      );
    }

    console.log("\n------------- Cost --------------");
    console.log(`Total $${calculateTotalCost(output, foods).toFixed(2)}`);
  } else {
    console.log("No feasible solution found!");
  }

  return output;
}
