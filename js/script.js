// Seleciona elementos do DOM
const form = document.getElementById("task-form");
const tasksContainer = document.getElementById("tasks-container");
const filtroArea = document.getElementById("filtro-area");
const filtroUrgencia = document.getElementById("filtro-urgencia");
const filtroDia = document.getElementById("filtro-dia");
const mensagemErro = document.getElementById("mensagem-erro");
const resumoTarefas = document.getElementById("resumo-tarefas");

// Recupera tarefas salvas do localStorage ou inicia vazio
let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

// Salva a lista de tarefas no localStorage
const salvarTarefas = () => {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
};

// Valida campos do formulário
const validarCampos = (tarefa) => {
  if (
    !tarefa.title ||
    !tarefa.urgencia ||
    !tarefa.area ||
    !tarefa.startTime ||
    !tarefa.endTime ||
    !tarefa.day
  ) {
    mensagemErro.textContent = "⚠️ Preencha todos os campos obrigatórios.";
    return false;
  }

  if (tarefa.startTime >= tarefa.endTime) {
    mensagemErro.textContent = "⚠️ Hora de início deve ser menor que a de término.";
    return false;
  }

  mensagemErro.textContent = "";
  return true;
};

// Limpa os campos do formulário
const limparFormulario = () => {
  form.reset();
  mensagemErro.textContent = "";
};

// Cria visualmente o card da tarefa
const criarCardTarefa = (tarefa) => {
  const div = document.createElement("div");
  div.className = `task-card ${tarefa.urgencia} ${tarefa.realizada ? "realizada" : ""}`;
  div.setAttribute("tabindex", "0");
  div.setAttribute("aria-label", `Tarefa: ${tarefa.title}`);

  div.innerHTML = `
    <h3>${tarefa.title}</h3>
    <p><strong>Urgência:</strong> ${tarefa.urgencia}</p>
    <p><strong>Área:</strong> ${tarefa.area}</p>
    <p><strong>Início:</strong> ${tarefa.startTime}</p>
    <p><strong>Término:</strong> ${tarefa.endTime}</p>
    <p><strong>Data:</strong> ${tarefa.day}</p>
    <p><strong>Obs:</strong> ${tarefa.obs || "Nenhuma"}</p>
    <div>
      <button class="btn btn-success" ${tarefa.realizada ? "disabled" : ""}>Feita</button>
      <button class="btn btn-warning">Editar</button>
      <button class="btn btn-danger">Excluir</button>
    </div>
  `;

  const [btnFeita, btnEditar, btnExcluir] = div.querySelectorAll("button");

  btnFeita.addEventListener("click", () => marcarRealizada(tarefa.id));
  btnEditar.addEventListener("click", () => editarTarefa(tarefa.id));
  btnExcluir.addEventListener("click", () => excluirTarefa(tarefa.id));

  return div;
};

// Atualiza a exibição das tarefas
const atualizarLista = () => {
  tasksContainer.innerHTML = "";

  const tarefasFiltradas = tarefas
    .filter((t) => {
      const areaOk = !filtroArea.value || t.area === filtroArea.value;
      const urgenciaOk = !filtroUrgencia.value || t.urgencia === filtroUrgencia.value;
      const diaOk = !filtroDia.value || t.day === filtroDia.value;
      return areaOk && urgenciaOk && diaOk;
    })
    .sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      const prioridade = { Alta: 1, Média: 2, Baixa: 3 };
      return prioridade[a.urgencia] - prioridade[b.urgencia];
    });

  const pendentes = tarefasFiltradas.filter((t) => !t.realizada).length;
  resumoTarefas.textContent = `Mostrando ${tarefasFiltradas.length} tarefa(s). Pendentes: ${pendentes}.`;

  tarefasFiltradas.forEach((t) => {
    tasksContainer.appendChild(criarCardTarefa(t));
  });
};

// Marca tarefa como feita
const marcarRealizada = (id) => {
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa && !tarefa.realizada) {
    tarefa.realizada = true;
    salvarTarefas();
    atualizarLista();
  }
};

// Exclui tarefa pelo ID
const excluirTarefa = (id) => {
  tarefas = tarefas.filter((t) => t.id !== id);
  salvarTarefas();
  atualizarLista();
};

// Preenche o formulário com dados para edição
const editarTarefa = (id) => {
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa) {
    form.atividade.value = tarefa.title;
    form.urgencia.value = tarefa.urgencia;
    form.area.value = tarefa.area;
    form.horaInicio.value = tarefa.startTime;
    form.horaTermino.value = tarefa.endTime;
    form.dia.value = tarefa.day;
    form.observacoes.value = tarefa.obs;
    excluirTarefa(id);
  }
};

// Adiciona nova tarefa
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const novaTarefa = {
    id: Date.now(),
    title: form.atividade.value.trim(),
    urgencia: form.urgencia.value,
    area: form.area.value,
    startTime: form.horaInicio.value,
    endTime: form.horaTermino.value,
    day: form.dia.value,
    obs: form.observacoes.value.trim(),
    realizada: false,
  };

  if (!validarCampos(novaTarefa)) return;

  tarefas.push(novaTarefa);
  salvarTarefas();
  atualizarLista();
  limparFormulario();

  mensagemErro.textContent = "✅ Tarefa adicionada!";
  setTimeout(() => (mensagemErro.textContent = ""), 2500);
});

// Filtros atualizam a lista
[filtroArea, filtroUrgencia, filtroDia].forEach((el) =>
  el.addEventListener("change", atualizarLista)
);

// Apaga todas as tarefas
const limparTudo = () => {
  if (confirm("Deseja apagar TODAS as tarefas?")) {
    tarefas = [];
    salvarTarefas();
    atualizarLista();
  }
};

// Alterna o modo escuro
const toggleDarkMode = () => {
  document.body.classList.toggle("dark-mode");
};

// Exporta as tarefas para PDF (usando jsPDF via CDN)
const exportarPDF = () => {
  import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js").then((jsPDFModule) => {
    const { jsPDF } = jsPDFModule;
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("Tarefas Planejadas", 10, y);
    y += 10;

    tarefas.forEach((t, i) => {
      const texto = `${i + 1}. ${t.title} (${t.day}) - ${t.startTime} às ${t.endTime} - ${t.area} - ${t.urgencia}`;
      doc.setFontSize(10);
      doc.text(texto, 10, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save("tarefas.pdf");
  });
};

// Inicializa ao carregar a página
document.addEventListener("DOMContentLoaded", atualizarLista);
