import { Food } from "./config";

export function getFood(foods: Food[], name: string): Food {
  const food = foods.find((f) => f.name === name);
  if (!food) throw new Error("No food found for: " + name);
  return food;
}
