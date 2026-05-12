import GLPKLoader from "glpk.js";
import { loadFoods } from "./loader";
import { addSupplements } from "./supplements";
import {
  BANNED_FOOD_GROUPS,
  BANNED_WORDS,
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
import { DietInspector } from "./diet-inspector";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = () => {
    setSolutions([]);
    setSelectedSolution(null);
    setIsLoading(true);
    loadAndFilterFoods(options)
      .then((foods) => {
        setFoods(foods);
        return run(foods, (solution) => {
          console.log(solution);
          console.log(calculateTotalNutrients(solution, foods));
          setSolutions((prev) => [...prev, solution]);
          setSelectedSolution((current) => current ?? solution);
        });
      })
      .finally(() => setIsLoading(false));
  };

  const progress = solutions.length / NUM_DIETS;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 md:items-start">
        <aside className="w-full md:w-72 md:shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Options
            </h2>
            <ToggleRow
              label="Vegan"
              checked={options.vegan}
              onChange={(v) => setOptions({ ...options, vegan: v })}
            />
            <ToggleRow
              label="Supplements"
              checked={options.supplements}
              onChange={(v) => setOptions({ ...options, supplements: v })}
            />
          </div>

          <button
            onClick={handleCalculate}
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Calculating…" : "Calculate"}
          </button>

          {isLoading && (
            <div className="space-y-1.5 px-1">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-300 ease-out"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 tabular-nums">
                {solutions.length} of {NUM_DIETS} diets
              </p>
            </div>
          )}

          {solutions.length > 0 && (
            <div className="space-y-1.5">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
                Solutions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-1">
                {solutions.map((solution, i) => {
                  const isSelected = solution === selectedSolution;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedSolution(solution)}
                      className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                        isSelected
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-sm">
                          Diet {i + 1}
                        </span>
                        <span
                          className={`text-xs tabular-nums ${
                            isSelected ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          €{calculateTotalCost(solution, foods).toFixed(2)}
                        </span>
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          isSelected ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {Object.keys(solution).length} items
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 w-full">
          {selectedSolution ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <DietInspector solution={selectedSolution} foods={foods} />
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-10 sm:p-16 text-center text-sm text-gray-400">
              {isLoading
                ? "Computing first diet…"
                : "Click Calculate to generate diets."}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-gray-900 cursor-pointer"
      />
    </label>
  );
}
