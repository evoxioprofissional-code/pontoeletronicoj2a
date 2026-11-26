"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  enviarSolicitacao,
  minhasMarcacoesDoDia,
  type EnvioState,
} from "@/app/app/solicitacoes/actions";
import {
  ANEXO_MAX_BYTES,
  ANEXO_TIPOS,
  CATEGORIAS,
  type Categoria,
} from "@/lib/solicitacoes";
import { CICLO, rotuloTipo, type TipoDB } from "@/lib/ponto";
import { Aviso, Campo, botao } from "./ui";

function Enviar({ enviando }: { enviando: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || enviando}
      className={botao("primario", "lg", "w-full sm:w-auto")}
    >
      {enviando ? "Enviando anexo…" : pending ? "Enviando…" : "Enviar para o RH"}
    </button>
  );
}

export function NovaSolicitacao({
  empresaId,
  funcionarioId,
  hoje,
  diaInicial,
  categoriaInicial,
}: {
  empresaId: string;
  funcionarioId: string;
  hoje: string;
  diaInicial?: string;
  categoriaInicial?: Categoria;
}) {
  const [state, formAction] = useFormState<EnvioState, FormData>(enviarSolicitacao, {});
  const [categoria, setCategoria] = useState<Categoria>(categoriaInicial ?? "incluir");
  const [dia, setDia] = useState(diaInicial ?? hoje);
  const [marcacoes, setMarcacoes] = useState<{ id: string; tipo: TipoDB; hora: string }[] | null>(null);
  const [anexoPath, setAnexoPath] = useState("");
  const [anexoNome, setAnexoNome] = useState("");
  const [anexoErro, setAnexoErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  // Para "corrigir horário", carrega as marcações do dia escolhido.
  useEffect(() => {
    if (categoria !== "alterar" || !dia) return;
    let vivo = true;
    setMarcacoes(null);
    minhasMarcacoesDoDia(dia).then((m) => vivo && setMarcacoes(m));
    return () => {
      vivo = false;
    };
  }, [categoria, dia]);

  // Depois de enviar com sucesso, limpa o formulário.
  useEffect(() => {
    if (!state.ok) return;
    form.current?.reset();
    setAnexoPath("");
    setAnexoNome("");
  }, [state]);

  async function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    setAnexoErro(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ANEXO_TIPOS.includes(f.type)) {
      setAnexoErro("Envie uma foto (JPG, PNG) ou um PDF.");
      e.target.value = "";
      return;
    }
    if (f.size > ANEXO_MAX_BYTES) {
      setAnexoErro("O arquivo passa de 5 MB. Tire uma foto com menos resolução.");
      e.target.value = "";
      return;
    }
    setEnviando(true);
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const caminho = `${empresaId}/${funcionarioId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient()
      .storage.from("anexos")
      .upload(caminho, f, { contentType: f.type, upsert: false });
    setEnviando(false);
    if (error) {
      setAnexoErro(
        "Não foi possível enviar o arquivo. Verifique a internet e tente de novo.",
      );
      e.target.value = "";
      return;
    }
    setAnexoPath(caminho);
    setAnexoNome(f.name);
  }

  return (
    <form ref={form} action={formAction} className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">O que aconteceu?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {CATEGORIAS.map((c) => (
            <label
              key={c.id}
              className={`flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-3.5 transition-colors ${
                categoria === c.id
                  ? "border-brand bg-brand-tint"
                  : "border-transparent bg-sunken hover:bg-sunken/70"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="categoria"
                  value={c.id}
                  checked={categoria === c.id}
                  onChange={() => setCategoria(c.id)}
                  className="h-4 w-4"
                />
                <span className="font-medium text-ink">{c.titulo}</span>
              </span>
              <span className="pl-6 text-sm text-ink-3">{c.descricao}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo rotulo="Dia">
          <input
            type="date"
            name="dia"
            required
            max={hoje}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className="campo num"
          />
        </Campo>

        {categoria === "incluir" && (
          <>
            <Campo rotulo="Qual marcação faltou">
              <select name="tipo" defaultValue="saida" className="campo">
                {CICLO.map((t) => (
                  <option key={t} value={t}>
                    {rotuloTipo(t)}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Horário em que aconteceu">
              <input type="time" name="hora" required className="campo num" />
            </Campo>
          </>
        )}

        {categoria === "alterar" && (
          <>
            <Campo rotulo="Qual marcação está errada">
              {marcacoes === null ? (
                <p className="campo flex items-center text-ink-3">Carregando…</p>
              ) : marcacoes.length === 0 ? (
                <p className="campo flex items-center text-ink-3">
                  Nenhuma marcação neste dia
                </p>
              ) : (
                <select name="registro_id" required className="campo">
                  {marcacoes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {rotuloTipo(m.tipo)} — {m.hora}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
            <Campo rotulo="Horário correto">
              <input type="time" name="hora" required className="campo num" />
            </Campo>
          </>
        )}
      </div>

      {categoria === "alterar" && marcacoes?.length === 0 && (
        <Aviso tom="info">
          Não há marcação neste dia para corrigir. Se você esqueceu de bater o
          ponto, escolha “Esqueci de bater o ponto”.
        </Aviso>
      )}

      <Campo
        rotulo="Motivo"
        dica="Conte o que aconteceu. O RH lê antes de aprovar."
      >
        <textarea
          name="justificativa"
          required
          minLength={5}
          maxLength={1000}
          rows={3}
          className="campo min-h-[6rem] resize-y"
          placeholder={
            categoria === "abonar"
              ? "Ex.: consulta médica, atestado anexado."
              : "Ex.: o celular descarregou na hora da saída."
          }
        />
      </Campo>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-2">
          Anexo{" "}
          <span className="font-normal text-ink-3">
            {categoria === "abonar" ? "(atestado ou comprovante)" : "(opcional)"}
          </span>
        </p>
        <label className={botao("secundario", "md", "cursor-pointer")}>
          {anexoNome ? "Trocar arquivo" : "Escolher foto ou PDF"}
          <input
            type="file"
            accept={ANEXO_TIPOS.join(",")}
            onChange={escolherArquivo}
            className="sr-only"
          />
        </label>
        {anexoNome && (
          <p className="mt-2 text-sm text-ok">Anexo pronto: {anexoNome}</p>
        )}
        {anexoErro && <p className="mt-2 text-sm text-danger">{anexoErro}</p>}
        <input type="hidden" name="anexo_path" value={anexoPath} />
      </div>

      {state.error && <Aviso tom="erro">{state.error}</Aviso>}
      {state.ok && (
        <Aviso tom="ok">
          Pedido enviado. Você vê a resposta do RH logo abaixo, em “Meus pedidos”.
        </Aviso>
      )}

      <div>
        <Enviar enviando={enviando} />
      </div>
    </form>
  );
}
