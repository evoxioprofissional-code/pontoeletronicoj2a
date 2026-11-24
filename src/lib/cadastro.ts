// Validação dos dados de cadastro do colaborador (servidor e cliente).

export function soDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

/** CPF válido (dígitos verificadores). Aceita com ou sem pontuação. */
export function cpfValido(cpf: string): boolean {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function formatarCpf(cpf: string): string {
  const d = soDigitos(cpf);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}

/** PIS/PASEP/NIT válido (11 dígitos com verificador). */
export function pisValido(pis: string): boolean {
  const d = soDigitos(pis);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma = pesos.reduce((a, p, i) => a + p * Number(d[i]), 0);
  const r = 11 - (soma % 11);
  return (r >= 10 ? 0 : r) === Number(d[10]);
}

export const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lê um campo de texto opcional do formulário (vazio → null). */
export function opcional(form: FormData, nome: string, max = 200): string | null {
  const v = String(form.get(nome) ?? "").trim();
  return v ? v.slice(0, max) : null;
}

/** Senha inicial legível: sem caracteres ambíguos (0/O, 1/l). */
export function senhaInicial(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz";
  const nums = "23456789";
  const r = (s: string) => s[Math.floor(Math.random() * s.length)];
  return `${r(letras).toUpperCase()}${r(letras)}${r(letras)}${r(letras)}${r(nums)}${r(nums)}${r(nums)}${r(nums)}`;
}

/**
 * Lê CSV (separador ; ou ,) com cabeçalho. Devolve linhas como objetos com
 * as chaves do cabeçalho normalizadas (minúsculas, sem acento).
 */
export function lerCsv(texto: string): Record<string, string>[] {
  const linhas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return [];
  const sep = (linhas[0].match(/;/g)?.length ?? 0) >= (linhas[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const partir = (l: string) => {
    const out: string[] = [];
    let atual = "";
    let aspas = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') {
        if (aspas && l[i + 1] === '"') {
          atual += '"';
          i++;
        } else aspas = !aspas;
      } else if (c === sep && !aspas) {
        out.push(atual.trim());
        atual = "";
      } else atual += c;
    }
    out.push(atual.trim());
    return out;
  };
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const cab = partir(linhas[0]).map(norm);
  return linhas.slice(1).map((l) => {
    const v = partir(l);
    return Object.fromEntries(cab.map((c, i) => [c, v[i] ?? ""]));
  });
}

/** "31/12/2024" ou "2024-12-31" → "2024-12-31" (ou null). */
export function dataDeTexto(s: string): string | null {
  const t = s.trim();
  if (DIA_RE.test(t)) return t;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}
