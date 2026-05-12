import GLPKLoader from "glpk.js";
import { loadFoods } from "./loader";
import { addSupplements } from "./supplements";
import {
  BANNED_FOOD_GROUPS,
  BANNED_WORDS,
  CONSTRAINTS,
  Food,
  MIN_USUAL,
  NUM_DIETS,
  VEGAN_GROUPS,
} from "./config";
import { diagnoseInfeasibility } from "./diagnose";
import { solve } from "./solve";
import { useState } from "react";
import {
  calculateTotalCost,
  calculateTotalNutrients,
  printSolution,
} from "./analyse";

interface FoodOptions {
  vegan: boolean;
  supplements: boolean;
}

async function loadAndFilterFoods(options: FoodOptions) {
  let foods = await loadFoods();

  let bannedGroups = BANNED_FOOD_GROUPS;

  if (options.vegan) {
    bannedGroups = bannedGroups.concat(VEGAN_GROUPS);
  }

  foods = foods.filter(
    (f) =>
      !bannedGroups.includes(f.group) &&
      !bannedGroups.includes(f.parentGroup) &&
      !BANNED_WORDS.some((word) =>
        f.name.toLowerCase().replaceAll(",", "").includes(word),
      ) &&
      f.usual >= MIN_USUAL,
  );

  console.log(`Loaded ${foods.length} foods`);

  if (options.supplements) addSupplements(foods);

  return foods;
}

async function run(
  foods: Food[],
  onSolution: (solution: Record<string, number>) => void,
) {
  const glpk = await GLPKLoader();

  const solutions: Record<string, number>[] = [];
  const previousFoods: Set<string>[] = [];

  for (let i = 0; i < NUM_DIETS; i++) {
    console.log(`\n========== Diet ${i + 1} ==========`);
    const result = await solve(glpk, foods, previousFoods);

    if (
      result.result.status !== glpk.GLP_OPT &&
      result.result.status !== glpk.GLP_FEAS
    ) {
      console.log("No more feasible unique diets.");
      await diagnoseInfeasibility(glpk, foods);
      break;
    }

    const output = printSolution(glpk, result, foods);

    solutions.push(output);
    previousFoods.push(new Set(Object.keys(output)));

    onSolution(output);
  }

  return solutions;
}

export default function App() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [solutions, setSolutions] = useState<Record<string, number>[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<Record<
    string,
    number
  > | null>(null);

  const [options, setOptions] = useState<FoodOptions>({
    vegan: false,
    supplements: false,
  });

  return (
    <div>
      <div>
        <div>
          Vegan{" "}
          <input
            type="checkbox"
            checked={options.vegan}
            onChange={(e) =>
              setOptions({ ...options, vegan: e.target.checked })
            }
          />
        </div>

        <div>
          Supplements{" "}
          <input
            type="checkbox"
            checked={options.supplements}
            onChange={(e) =>
              setOptions({ ...options, supplements: e.target.checked })
            }
          />
        </div>

        <div>
          <button
            onClick={() => {
              setSolutions([]);
              setSelectedSolution(null);
              loadAndFilterFoods(options).then((foods) => {
                setFoods(foods);
                return run(foods, (solution) => {
                  console.log(solution);
                  console.log(calculateTotalNutrients(solution, foods));
                  setSolutions((prev) => [...prev, solution]);
                });
              });
            }}
          >
            Calculate
          </button>
        </div>

        <div>
          {solutions.map((solution, solutionIndex) => (
            <div
              key={solutionIndex}
              onClick={() => setSelectedSolution(solution)}
            >
              Day {solutionIndex + 1} - {Object.keys(solution).length} items - $
              {calculateTotalCost(solution, foods).toFixed(2)}
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedSolution && (
          <div>
            <div>
              {Object.keys(selectedSolution).map((key) => (
                <div key={key}>
                  {(selectedSolution[key] * 100).toFixed(0)}g {key}
                </div>
              ))}
            </div>

            <div>
              <div>Nutrients</div>
              <div>
                {Object.keys(CONSTRAINTS).map((nutrient) => (
                  <div key={nutrient}>
                    {nutrient}:{" "}
                    {calculateTotalNutrients(selectedSolution, foods)[
                      nutrient
                    ].toFixed(1)}
                    {CONSTRAINTS[nutrient].unit}/
                    {(
                      CONSTRAINTS[nutrient].min || CONSTRAINTS[nutrient].max
                    ).toFixed(1)}
                    {CONSTRAINTS[nutrient].unit} (
                    {(
                      (calculateTotalNutrients(selectedSolution, foods)[
                        nutrient
                      ] /
                        (CONSTRAINTS[nutrient].min ||
                          CONSTRAINTS[nutrient].max)) *
                      100
                    ).toFixed(0)}
                    % )
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
