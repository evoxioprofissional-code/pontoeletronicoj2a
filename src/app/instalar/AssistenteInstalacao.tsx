"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect, useRef, useState } from "react";
import { ContextoInstalacao } from "@/components/InstalacaoProvider";
import { ArrowLeft, ArrowRight, MoreVerticalIcon, PhoneIcon, ShareIcon } from "@/components/icons";
import { botao } from "@/components/ui";

type Celular = "android" | "iphone";
type Etapa = "inicio" | "navegador" | "adicionar" | "pronto";

const NOME = { android: "Android", iphone: "iPhone" };
const NAVEGADOR = { android: "Chrome", iphone: "Safari" };

export function AssistenteInstalacao() {
  const { instalar, instalado, abertoComoApp } = useContext(ContextoInstalacao);
  const [detectado, setDetectado] = useState<Celular | null>(null);
  const [celular, setCelular] = useState<Celular>("android");
  const [etapa, setEtapa] = useState<Etapa>("inicio");
  const [instalando, setInstalando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) setDetectado("android");
    if (/iPhone|iPad|iPod/i.test(ua)) setDetectado("iphone");

    // O link copiado abre diretamente na etapa que a pessoa precisa.
    const destino = new URLSearchParams(window.location.search).get("continuar");
    if (destino === "android" || destino === "iphone") {
      setCelular(destino);
      setEtapa("adicionar");
    }
  }, []);

  const atual = instalado || abertoComoApp ? "pronto" : etapa;
  const iphone = celular === "iphone";
  const navegador = NAVEGADOR[celular];
  const opcaoPrincipal = detectado ?? "android";
  const outraOpcao = opcaoPrincipal === "android" ? "iphone" : "android";

  useEffect(() => {
    if (atual !== "inicio") titulo.current?.focus();
  }, [atual]);

  function avancar(destino: Etapa) {
    setMensagem("");
    setEtapa(destino);
  }

  function comecar(escolhido: Celular) {
    setCelular(escolhido);
    avancar("navegador");
  }

  async function instalarAgora() {
    if (!instalar || instalando) return;

    setInstalando(true);
    let aceito = false;
    try {
      aceito = await instalar();
    } catch {
      // O menu do navegador continua disponível se a janela falhar.
    } finally {
      setInstalando(false);
    }
    setCelular("android");
    avancar(aceito ? "pronto" : "adicionar");
  }

  async function copiarLink() {
    const link = new URL("/instalar", window.location.origin);
    link.searchParams.set("continuar", celular);
    try {
      await navigator.clipboard.writeText(link.href);
      setMensagem(`Link copiado. Abra o ${navegador} e cole na barra de endereço.`);
    } catch {
      setMensagem(`Copie o endereço desta página e cole na barra do ${navegador}.`);
    }
  }

  const titulos = {
    inicio: "Instale o j2aponto no celular",
    navegador: `Abra no ${navegador}`,
    adicionar: "Adicione o app à tela inicial",
    pronto: abertoComoApp ? "Você já está no app" : "Agora abra pelo ícone",
  };
  const passo = atual === "navegador" ? 1 : 2;
  const botaoInstalar = (instalar || instalando) && (
    <button
      type="button"
      className={botao("primario", "lg", "w-full")}
      onClick={instalarAgora}
      disabled={instalando}
    >
      <PhoneIcon className="h-5 w-5" />
      {instalando ? "Aguardando confirmação…" : "Instalar agora"}
    </button>
  );

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-bar sm:p-7">
      {atual === "navegador" || atual === "adicionar" ? (
        <div className="mb-5">
          <p className="text-sm font-semibold text-brand">
            {NOME[celular]} · Etapa {passo} de 2
          </p>
          <div aria-hidden="true" className="mt-2 grid grid-cols-2 gap-1.5">
            <span className="h-1 rounded-full bg-brand" />
            <span className={`h-1 rounded-full ${passo === 2 ? "bg-brand" : "bg-line"}`} />
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <Image
            src="/icon-192.png"
            width={56}
            height={56}
            alt=""
            className="rounded-[22%]"
            unoptimized
          />
        </div>
      )}

      <h1
        ref={titulo}
        tabIndex={-1}
        className="text-2xl font-semibold tracking-tight text-ink focus:outline-none sm:text-3xl"
      >
        {titulos[atual]}
      </h1>

      {atual === "inicio" && (
        <>
          <p className="mt-2 leading-relaxed text-ink-2">
            Vamos colocar o ícone na tela inicial para você bater o ponto com um toque.
          </p>
          <div className="mt-5 grid gap-2">
            {botaoInstalar ? (
              <>
                {botaoInstalar}
                <button type="button" className={botao("texto")} onClick={() => comecar("android")} disabled={instalando}>
                  Ver passo a passo
                </button>
              </>
            ) : (
              <>
                <button type="button" className={botao("primario", "lg")} onClick={() => comecar(opcaoPrincipal)}>
                  {detectado ? "Continuar no " : ""}{NOME[opcaoPrincipal]}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" className={botao("secundario")} onClick={() => comecar(outraOpcao)}>
                  {detectado ? "Meu celular é " : ""}{NOME[outraOpcao]}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {atual === "navegador" && (
        <>
          <p className="mt-2 leading-relaxed text-ink-2">
            {iphone
              ? "O Safari é o app com o ícone de bússola."
              : "O Chrome é o app com o ícone redondo e colorido."}
            {" "}Se veio pelo WhatsApp ou está em outro navegador, copie o link
            abaixo e cole na barra de endereço do {navegador}.
          </p>
          <div className="mt-5 grid gap-2">
            <button type="button" className={botao("primario", "lg")} onClick={() => avancar("adicionar")}>
              Já estou no {navegador}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" className={botao("secundario")} onClick={copiarLink}>
              Copiar link
            </button>
            <p role="status" className="text-sm font-medium text-brand">{mensagem}</p>
          </div>
        </>
      )}

      {atual === "adicionar" && (
        <>
          {!iphone && botaoInstalar && <div className="mt-4">{botaoInstalar}</div>}
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-tint p-3 text-brand">
            {iphone ? <ShareIcon className="h-6 w-6 shrink-0" /> : <MoreVerticalIcon className="h-6 w-6 shrink-0" />}
            <p className="font-semibold">
              {iphone ? "Procure este botão no Safari" : "Procure os três pontinhos no Chrome"}
            </p>
          </div>
          {iphone ? (
            <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed text-ink-2">
              <li>Toque em <strong>Compartilhar</strong>. Em alguns iPhones, fica no menu da página.</li>
              <li>Role o menu e toque em <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Deixe <strong>Abrir como App da Web</strong> ligado, se aparecer. Toque em <strong>Adicionar</strong>.</li>
            </ol>
          ) : (
            <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed text-ink-2">
              <li>Toque nos <strong>três pontinhos</strong> ao lado da barra de endereço.</li>
              <li>Procure <strong>Instalar app</strong>, <strong>Instalar e criar atalho</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
              <li>Se aparecer uma escolha, toque em <strong>Instalar</strong> e confirme.</li>
            </ol>
          )}
          <button type="button" className={botao("primario", "lg", "mt-5 w-full")} onClick={() => avancar("pronto")}>
            {iphone ? "Já adicionei o app" : "Já instalei o app"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <details className="mt-2 text-sm text-ink-2">
            <summary className="cursor-pointer rounded-lg py-3 font-semibold text-brand">
              A opção não apareceu?
            </summary>
            <p className="rounded-lg bg-paper p-3 leading-relaxed">
              {iphone
                ? "No Safari, role até o fim do menu Compartilhar e toque em Editar Ações. Procure Adicionar à Tela de Início."
                : "Confira se a página está aberta no Chrome, em uma aba normal. Se o app já estiver instalado, procure j2aponto na tela inicial ou na lista de apps."}
            </p>
          </details>
        </>
      )}

      {atual === "pronto" && (
        <>
          <p className="mt-2 leading-relaxed text-ink-2">
            {abertoComoApp
              ? "Sempre que precisar bater o ponto, abra o j2aponto por este ícone."
              : "Volte à tela inicial do celular, procure este ícone e toque em j2aponto. Se pedir login, use o e-mail e a senha que o RH passou."}
          </p>
          {abertoComoApp ? (
            <Link href="/" className={botao("primario", "lg", "mt-5 w-full")}>
              Continuar para o j2aponto
            </Link>
          ) : !instalado && (
            <button type="button" className={botao("texto", "md", "mt-4")} onClick={() => avancar("adicionar")}>
              Ainda não achei o ícone
            </button>
          )}
        </>
      )}

      {(atual === "navegador" || atual === "adicionar") && (
        <button
          type="button"
          className={botao("texto", "md", "mt-2 !px-0")}
          onClick={() => avancar(atual === "adicionar" ? "navegador" : "inicio")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar uma etapa
        </button>
      )}
    </section>
  );
}
