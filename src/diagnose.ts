import { GLPK, LP } from "glpk.js";
import { Food, CONSTRAINTS, MIN_PORTION, MAX_PORTION } from "./config";
import { getFood } from "./utils";

export async function diagnoseInfeasibility(glpk: GLPK, foods: Food[]) {
  const subjectTo: LP["subjectTo"] = [];
  const slackVars: string[] = [];

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
    const food = getFood(foods, foodName);
    const minGrams = (food.portion * MIN_PORTION) / 100;
    const maxGrams = (food.portion * MAX_PORTION) / 100;
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
