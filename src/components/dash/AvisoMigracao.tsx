import { Aviso } from "@/components/ui";

/** Mostrado quando as tabelas do Bloco A ainda não existem no banco. */
export function AvisoMigracao() {
  return (
    <Aviso tom="aviso">
      <p className="font-semibold">Este módulo ainda não foi ativado no banco de dados.</p>
      <p className="mt-1">
        Abra o Supabase → SQL Editor, cole o conteúdo do arquivo{" "}
        <code className="rounded bg-surface px-1">supabase/migrations/0006_bloco_a_rh.sql</code>{" "}
        e clique em Run. Depois recarregue esta página.
      </p>
    </Aviso>
  );
}
