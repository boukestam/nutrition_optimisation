import React from "react";
import { CONSTRAINTS, Food } from "./config";
import {
  BONUS_TARGETS,
  PIECEWISE_PENALTY_THRESHOLDS,
  TOXIN_WEIGHTS,
} from "./solve";

const TOXIN_NUTRIENTS = Object.keys(TOXIN_WEIGHTS);

const SOFT_NUTRIENTS = [
  "Sum saturated fatty acids",
  "Sum trans fatty acids",
  "Added Sugar",
  "C18:3,n-3",
];

const FOOD_COLORS = [
  "#059669",
  "#b45309",
  "#f97316",
  "#eab308",
  "#13c755",
  "#ec4899",
  "#78716c",
  "#2563eb",
  "#0f766e",
  "#a855f7",
  "#dc2626",
  "#0284c7",
  "#7e22ce",
  "#84cc16",
];

interface DietInspectorProps {
  solution: Record<string, number>;
  foods: Food[];
}

interface ActiveFood {
  food: Food;
  grams: number;
  color: string;
}

interface Contribution {
  foodName: string;
  color: string;
  value: number;
}

export function DietInspector({ solution, foods }: DietInspectorProps) {
  const active: ActiveFood[] = foods
    .filter((f) => (solution[f.name] ?? 0) > 1e-4)
    .map((food, i) => ({
      food,
      grams: (solution[food.name] ?? 0) * 100,
      color: FOOD_COLORS[i % FOOD_COLORS.length],
    }));

  const contributionsOf = (nutrient: string): Contribution[] =>
    active.map((a) => ({
      foodName: a.food.name,
      color: a.color,
      value: (a.food.nutrients[nutrient] ?? 0) * (solution[a.food.name] ?? 0),
    }));

  const totalOf = (nutrient: string) =>
    contributionsOf(nutrient).reduce((s, c) => s + c.value, 0);

  const totalKcal = totalOf("Energy (kcal)");
  const totalCost = active.reduce(
    (s, a) => s + a.food.cost * (a.grams / 100),
    0,
  );

  const skip = new Set([...SOFT_NUTRIENTS, ...TOXIN_NUTRIENTS]);
  const hardKeys = Object.keys(CONSTRAINTS).filter((k) => !skip.has(k));

  return (
    <div className="text-sm text-gray-900">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 pb-2.5 mb-3.5 border-b border-gray-200">
        <h2 className="text-lg font-medium w-full sm:w-auto">Diet</h2>
        <Stat label="kcal" value={Math.round(totalKcal).toLocaleString()} />
        <Stat label="foods" value={active.length.toString()} />
        <Stat label="/day" value={`€${totalCost.toFixed(2)}`} />
      </header>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {active.map((a) => (
          <span
            key={a.food.name}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-gray-200 bg-white max-w-full"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: a.color }}
            />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {a.food.name}
            </span>
            <span className="text-gray-500 tabular-nums shrink-0">
              {Math.round(a.grams)}g
            </span>
          </span>
        ))}
      </div>

      <SectionTitle>Hard constraints</SectionTitle>
      {hardKeys.map((n) => (
        <NutrientRow
          key={n}
          name={CONSTRAINTS[n]?.label ?? "Unknown"}
          unit={CONSTRAINTS[n].unit}
          contributions={contributionsOf(n)}
          min={CONSTRAINTS[n].min}
          max={CONSTRAINTS[n].max}
          target={BONUS_TARGETS[n]}
          threshold={PIECEWISE_PENALTY_THRESHOLDS[n]}
        />
      ))}

      <SectionTitle>Soft targets &amp; penalties</SectionTitle>
      {SOFT_NUTRIENTS.map((n) => {
        const c = CONSTRAINTS[n];
        const threshold = PIECEWISE_PENALTY_THRESHOLDS[n];
        const penaltyActive =
          c?.max !== undefined && threshold !== undefined && c.max > threshold;
        const total = totalOf(n);
        const flag =
          threshold !== undefined && total > threshold
            ? penaltyActive
              ? { cls: "warn" as const, txt: "over threshold" }
              : { cls: "bad" as const, txt: "penalty disabled" }
            : undefined;
        return (
          <NutrientRow
            key={n}
            name={CONSTRAINTS[n]?.label ?? "Unknown"}
            unit={c?.unit ?? "g"}
            contributions={contributionsOf(n)}
            min={c?.min}
            max={c?.max}
            target={BONUS_TARGETS[n]}
            threshold={threshold}
            flag={flag}
          />
        );
      })}

      <SectionTitle>Toxins</SectionTitle>
      {TOXIN_NUTRIENTS.map((n) => (
        <NutrientRow
          key={n}
          name={CONSTRAINTS[n]?.label ?? "Unknown"}
          unit={CONSTRAINTS[n]?.unit ?? "µg"}
          contributions={contributionsOf(n)}
          max={CONSTRAINTS[n]?.max}
        />
      ))}

      <Legend />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-gray-500">
      <strong className="text-gray-900 font-medium tabular-nums">
        {value}
      </strong>{" "}
      {label}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium text-gray-500 mt-4 mb-2">{children}</h3>
  );
}

interface NutrientRowProps {
  name: string;
  unit: string;
  contributions: Contribution[];
  min?: number;
  max?: number;
  target?: number;
  threshold?: number;
  flag?: { cls: "warn" | "bad"; txt: string };
}

function NutrientRow({
  name,
  unit,
  contributions,
  min,
  max,
  target,
  threshold,
  flag,
}: NutrientRowProps) {
  const total = contributions.reduce((s, c) => s + c.value, 0);
  const cap =
    Math.max(max ?? 0, total, target ?? 0, (min ?? 0) * 1.6) * 1.02 || 1;
  const pct = (v: number) => Math.min((v / cap) * 100, 100);

  const display =
    total >= 100
      ? Math.round(total).toLocaleString()
      : total < 10
        ? total.toFixed(1)
        : total.toFixed(0);

  const flagClass =
    flag?.cls === "bad"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[130px_84px_1fr] gap-x-2.5 sm:items-center py-1.5 text-xs">
      <div className="font-medium leading-tight min-w-0 flex flex-wrap items-baseline gap-y-0.5">
        <span className="truncate">{name}</span>
        {flag && (
          <span
            className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${flagClass}`}
          >
            {flag.txt}
          </span>
        )}
      </div>
      <div className="text-right tabular-nums shrink-0">
        {display}
        <span className="text-gray-400 text-[10px] ml-0.5">{unit}</span>
      </div>
      <div className="relative h-4 bg-gray-100 rounded-sm col-span-2 sm:col-span-1 mt-1 sm:mt-0">
        <div className="absolute inset-y-0 left-0 right-0 flex rounded-sm overflow-hidden">
          {contributions.map((c) =>
            c.value > 0 ? (
              <span
                key={c.foodName}
                className="h-full"
                style={{
                  width: `${(c.value / cap) * 100}%`,
                  backgroundColor: c.color,
                }}
                title={`${c.foodName}: ${c.value.toFixed(1)} ${unit}`}
              />
            ) : null,
          )}
        </div>
        {min !== undefined && <Marker pos={pct(min)} variant="bound" />}
        {max !== undefined && <Marker pos={pct(max)} variant="bound" />}
        {target !== undefined && <Marker pos={pct(target)} variant="target" />}
        {threshold !== undefined && (
          <Marker pos={pct(threshold)} variant="threshold" />
        )}
      </div>
    </div>
  );
}

function Marker({
  pos,
  variant,
}: {
  pos: number;
  variant: "bound" | "target" | "threshold";
}) {
  const cls =
    variant === "bound"
      ? "border-l border-solid border-gray-400"
      : variant === "target"
        ? "border-l border-dashed border-blue-500"
        : "border-l border-dashed border-amber-500";
  return (
    <span
      className={`absolute -top-0.5 -bottom-0.5 ${cls}`}
      style={{ left: `${pos}%` }}
    />
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mt-3.5 pt-2.5 border-t border-gray-200">
      <LegendItem className="border-t border-gray-400">min / max</LegendItem>
      <LegendItem className="border-t border-dashed border-blue-500">
        bonus target
      </LegendItem>
      <LegendItem className="border-t border-dashed border-amber-500">
        penalty threshold
      </LegendItem>
    </div>
  );
}

function LegendItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-4 ${className}`} />
      {children}
    </span>
  );
}
