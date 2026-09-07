// Lógica da interface: upload do PDF -> chama /api/curriculo/analisar -> mostra vagas

const inputPdf = document.getElementById("input-pdf");
const uploadLabel = document.getElementById("upload-label");
const btnBuscar = document.getElementById("btn-buscar");
const btnBuscarLabel = document.getElementById("btn-buscar-label");
const errorBox = document.getElementById("error-box");

const telaUpload = document.getElementById("tela-upload");
const telaCarregando = document.getElementById("tela-carregando");
const telaResultados = document.getElementById("tela-resultados");

const listaVagas = document.getElementById("lista-vagas");
const tituloResultados = document.getElementById("titulo-resultados");
const btnExportar = document.getElementById("btn-exportar");
const btnNovaBusca = document.getElementById("btn-nova-busca");

let arquivoSelecionado = null;
let sessionIdAtual = null;

inputPdf.addEventListener("change", () => {
  const arquivo = inputPdf.files[0];
  esconderErro();
  if (!arquivo) return;

  if (arquivo.type !== "application/pdf") {
    mostrarErro("Por favor, envie um arquivo em formato PDF.");
    return;
  }

  arquivoSelecionado = arquivo;
  uploadLabel.textContent = `📄 ${arquivo.name}`;
  btnBuscar.disabled = false;
});

btnBuscar.addEventListener("click", async () => {
  if (!arquivoSelecionado) return;
  esconderErro();
  setBuscando(true);
  mostrarTela("carregando");

  const formData = new FormData();
  formData.append("arquivo", arquivoSelecionado);

  try {
    const resposta = await fetch("/api/curriculo/analisar", {
      method: "POST",
      body: formData,
    });

    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => ({}));
      throw new Error(erro.detail || "Não foi possível processar o currículo.");
    }

    const dados = await resposta.json();
    sessionIdAtual = dados.session_id;
    renderizarResultados(dados);
    mostrarTela("resultados");
  } catch (erro) {
    mostrarTela("upload");
    mostrarErro(erro.message);
  } finally {
    setBuscando(false);
  }
});

btnExportar.addEventListener("click", () => {
  if (!sessionIdAtual) return;
  window.location.href = `/api/vagas/${sessionIdAtual}/exportar`;
});

btnNovaBusca.addEventListener("click", () => {
  arquivoSelecionado = null;
  sessionIdAtual = null;
  inputPdf.value = "";
  uploadLabel.textContent = "📄 Enviar currículo PDF";
  btnBuscar.disabled = true;
  mostrarTela("upload");
});

function mostrarTela(nome) {
  telaUpload.hidden = nome !== "upload";
  telaCarregando.hidden = nome !== "carregando";
  telaResultados.hidden = nome !== "resultados";
}

function setBuscando(isBuscando) {
  btnBuscar.disabled = isBuscando || !arquivoSelecionado;
  btnBuscarLabel.textContent = isBuscando ? "BUSCANDO..." : "ENCONTRAR VAGAS";
}

function mostrarErro(texto) {
  errorBox.textContent = texto;
  errorBox.hidden = false;
}

function esconderErro() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

function classeCompatibilidade(valor) {
  if (valor >= 70) return "compat-alta";
  if (valor >= 45) return "compat-media";
  return "compat-baixa";
}

function renderizarResultados(dados) {
  tituloResultados.textContent = `Encontramos ${dados.total_vagas} vaga${dados.total_vagas === 1 ? "" : "s"} para você`;
  listaVagas.innerHTML = "";

  if (dados.total_vagas === 0) {
    listaVagas.innerHTML = `<p class="lista-vagas__vazio">
      Não encontramos vagas compatíveis no momento. Tente novamente mais tarde
      ou revise as informações do seu currículo.
    </p>`;
    return;
  }

  dados.vagas.forEach((vaga) => {
    const card = document.createElement("div");
    card.className = "vaga-card";
    card.innerHTML = `
      <div class="vaga-info">
        <h3>${escapeHtml(vaga.cargo)}</h3>
        <div class="vaga-empresa">${escapeHtml(vaga.empresa)}</div>
        <div class="vaga-snippet">${escapeHtml(vaga.snippet || "")}</div>
      </div>
      <div class="vaga-lado-direito">
        <span class="compatibilidade ${classeCompatibilidade(vaga.compatibilidade)}">
          ${vaga.compatibilidade}% compatível
        </span>
        <a class="btn-candidatar" href="${vaga.link}" target="_blank" rel="noopener noreferrer">
          Candidatar-se
        </a>
      </div>
    `;
    listaVagas.appendChild(card);
  });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
