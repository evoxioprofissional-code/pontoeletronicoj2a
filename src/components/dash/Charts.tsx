"use client";

import type { ReactNode } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Serie {
  nome: string;
  valor: number;
}

const AXIS = "#8A93A3";
const GRID = "#2A313B";

export function Card({
  titulo,
  children,
  className = "",
}: {
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-steel-line bg-steel p-4 ${className}`}
    >
      <h3 className="mb-3 text-sm font-semibold text-ink">{titulo}</h3>
      {children}
    </section>
  );
}

export function minToHHMM(min: number): string {
  const m = Math.max(0, Math.round(min));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
    m % 60,
  ).padStart(2, "0")}`;
}

function EmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted">
      Sem dados no período.
    </div>
  );
}

export function BarCard({
  titulo,
  data,
  cor = "#F5A623",
  formato = "numero",
}: {
  titulo: string;
  data: Serie[];
  cor?: string;
  formato?: "numero" | "tempo";
}) {
  const fmt = (v: number) => (formato === "tempo" ? minToHHMM(v) : String(v));
  const vazio = data.length === 0 || data.every((d) => d.valor === 0);
  return (
    <Card titulo={titulo}>
      {vazio ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis
              dataKey="nome"
              tick={{ fill: AXIS, fontSize: 10 }}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={50}
              stroke={GRID}
            />
            <YAxis
              tick={{ fill: AXIS, fontSize: 10 }}
              tickFormatter={fmt}
              stroke={GRID}
              width={44}
            />
            <Tooltip
              formatter={(value) => [fmt(Number(value)), ""] as [string, string]}
              contentStyle={{
                background: "#14171C",
                border: "1px solid #2A313B",
                borderRadius: 8,
                color: "#EDEFF2",
              }}
              labelStyle={{ color: "#8A93A3" }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="valor" fill={cor} radius={[4, 4, 0, 0]} maxBarSize={38} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export function PieCard({
  titulo,
  data,
  cores,
}: {
  titulo: string;
  data: Serie[];
  cores: string[];
}) {
  const vazio = data.every((d) => d.valor === 0);
  return (
    <Card titulo={titulo}>
      {vazio ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="valor"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              stroke="none"
              label={(p: { value?: number }) => `${p.value ?? ""}`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={cores[i % cores.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#14171C",
                border: "1px solid #2A313B",
                borderRadius: 8,
                color: "#EDEFF2",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: AXIS }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
