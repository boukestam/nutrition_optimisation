import { Options, parse } from "csv-parse/browser/esm";
import { Food, FRIDA_TO_KEY, NEVO_TO_KEY } from "./config";

const csvOptions: Options = { delimiter: ",", quote: '"' };

const BASE = "data/";

function parseCSV(text: string): Promise<string[][]> {
  return new Promise<string[][]>((resolve, reject) => {
    parse(text, csvOptions, (err, records) => {
      if (err) {
        reject(err);
      } else {
        resolve(records as string[][]);
      }
    });
  });
}

async function fetchAndParseCSV(url: string) {
  const response = await fetch(url);
  const text = await response.text();
  return await parseCSV(text);
}

export async function loadFrida(): Promise<Food[]> {
  const rows = await fetchAndParseCSV(BASE + "frida.csv");
  const headers = rows[1].map((h) => h.trim());
  const otherHeaders = rows[3].map((h) => h.trim());

  const foods: Food[] = [];

  const groupRows = await fetchAndParseCSV(BASE + "frida_groups.csv");
  const getParentGroup = (childGroup: string) =>
    groupRows.find((row) => row[5] === childGroup)?.[2] || "";

  const portionRows = await fetchAndParseCSV(BASE + "frida_portions.csv");
  const getPortionData = (name: string) => {
    const row = portionRows.find((row) => row[0] === name);
    if (!row) return null;
    return {
      portion: parseFloat(row[1]),
      usual: parseFloat(row[2]),
      cost: parseFloat(row[3]),
    };
  };

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[1] ?? "").trim();

    if (!name || name.startsWith("→")) continue;

    if (foods.find((f) => f.name === name)) continue;

    const portionData = getPortionData(name);
    if (portionData === null) continue;

    const nutrients: Record<string, number> = {};
    const others: Record<string, string> = {};

    for (let j = 2; j < headers.length; j++) {
      const header = headers[j];
      const otherHeader = otherHeaders[j];
      if (!header && !otherHeader) continue;

      const cell = (row[j] ?? "").trim();
      if (header && header in FRIDA_TO_KEY) {
        nutrients[FRIDA_TO_KEY[header]] =
          cell === "" || cell === "-" ? 0 : parseFloat(cell) || 0;
      } else {
        others[otherHeader] = cell;
      }
    }

    const food: Food = {
      name,
      nutrients,
      parentGroup: getParentGroup(others["FoodGroup"]),
      group: others["FoodGroup"],
      ...portionData,
    };

    foods.push(food);
  }

  return foods;
}

export async function loadNevo(): Promise<Food[]> {
  const rows = await fetchAndParseCSV(BASE + "nevo.csv");
  const headers = rows[0].map((h) => h.trim());

  const foods: Food[] = [];

  const portionRows = await fetchAndParseCSV(BASE + "nevo_portions.csv");
  const getPortionData = (name: string) => {
    const row = portionRows.find((row) => row[0] === name);
    if (!row) return null;
    return {
      portion: parseFloat(row[1]),
      usual: parseFloat(row[2]),
      cost: parseFloat(row[3]),
    };
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[5] ?? "").trim();

    if (!name) continue;

    if (foods.find((f) => f.name === name)) continue;

    const portionData = getPortionData(name);
    if (portionData === null) continue;

    const nutrients: Record<string, number> = {};
    const others: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];

      const cell = (row[j] ?? "").trim();
      if (j < 11 || !(header in NEVO_TO_KEY)) {
        others[header] = cell;
      } else {
        nutrients[NEVO_TO_KEY[header]] =
          cell === "" || cell === "-" ? 0 : parseFloat(cell) || 0;
      }
    }

    const food: Food = {
      name,
      nutrients,
      group: others["Food group"] as string,
      ...portionData,
    };

    if ("PROTAN (g)" in others && parseFloat(others["PROTAN (g)"]) > 0) {
      food.hasAnimalProtein = true;
    }

    foods.push(food);
  }

  return foods;
}
