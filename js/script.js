const form = document.getElementById("task-form");
const tasksContainer = document.getElementById("tasks-container");
const filtroArea = document.getElementById("filtro-area");
const filtroUrgencia = document.getElementById("filtro-urgencia");
const mensagemErro = document.getElementById("mensagem-erro");

let tarefas = [];

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const tarefa = {
    id: Date.now(),
    title: form.title.value.trim(),
    urgencia: form.urgencia.value,
    area: form.area.value,
    duration: form.duration.value,
    day: form.day.value,
    obs: form.obs.value,
    realizada: false,
  };

  if (!validarCampos(tarefa)) return;

  tarefas.push({ ...tarefa, duration: parseInt(tarefa.duration) });
  form.reset();
  mensagemErro.textContent = "";
  atualizarLista();
});

function validarCampos(tarefa) {
  if (
    !tarefa.title ||
    !tarefa.urgencia ||
    !tarefa.area ||
    !tarefa.duration ||
    !tarefa.day
  ) {
    mensagemErro.textContent =
      "⚠️ Por favor, preencha todos os campos obrigatórios.";
    return false;
  }

  if (isNaN(parseInt(tarefa.duration)) || parseInt(tarefa.duration) <= 0) {
    mensagemErro.textContent =
      "⚠️ A duração deve ser um número maior que zero.";
    return false;
  }

  return true;
}

// Atualiza a lista de tarefas exibidas
function atualizarLista() {
  tasksContainer.innerHTML = "";
  const area = filtroArea.value;
  const urgencia = filtroUrgencia.value;

  tarefas
    .filter(
      (t) =>
        (!area || t.area === area) && (!urgencia || t.urgencia === urgencia)
    )
    .sort((a, b) => {
      const prioridade = { Alta: 1, Média: 2, Baixa: 3 };
      return prioridade[a.urgencia] - prioridade[b.urgencia];
    })
    .forEach((tarefa) => {
      const div = document.createElement("div");
      div.className = "card task-card";
      div.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${tarefa.title}</h5>
          <p class="card-text"><strong>Urgência:</strong> ${tarefa.urgencia}</p>
          <p class="card-text"><strong>Área:</strong> ${tarefa.area}</p>
          <p class="card-text"><strong>Duração:</strong> ${tarefa.duration} min</p>
          <p class="card-text"><strong>Data:</strong> ${tarefa.day}</p>
          <p class="card-text"><strong>Obs:</strong> ${tarefa.obs}</p>
          <button class="btn btn-success btn-sm" onclick="marcarRealizada(${tarefa.id})">Feita</button>
          <button class="btn btn-warning btn-sm" onclick="editarTarefa(${tarefa.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="excluirTarefa(${tarefa.id})">Excluir</button>
        </div>
      `;
      tasksContainer.appendChild(div);
    });
}

filtroArea.addEventListener("change", atualizarLista);
filtroUrgencia.addEventListener("change", atualizarLista);

function marcarRealizada(id) {
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa) tarefa.realizada = true;
}

// Editar tarefa: carrega os dados no formulário e exclui a antiga
function editarTarefa(id) {
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa) {
    form.title.value = tarefa.title;
    form.urgencia.value = tarefa.urgencia;
    form.area.value = tarefa.area;
    form.duration.value = tarefa.duration;
    form.day.value = tarefa.day;
    form.obs.value = tarefa.obs;
    excluirTarefa(id);
  }
}

// Excluir tarefa pelo id
function excluirTarefa(id) {
  tarefas = tarefas.filter((t) => t.id !== id);
  atualizarLista();
}

// Reagenda tarefas não realizadas com data anterior a hoje para o dia seguinte
function reagendarTarefas() {
  const hoje = new Date().toISOString().split("T")[0];
  tarefas.forEach((tarefa) => {
    if (!tarefa.realizada && tarefa.day < hoje) {
      const novaData = new Date();
      novaData.setDate(novaData.getDate() + 1);
      tarefa.day = novaData.toISOString().split("T")[0];
    }
  });
  atualizarLista();
}

setInterval(reagendarTarefas, 10000);

// Exporta as tarefas filtradas para PDF
async function exportarPDF() {
  const jsPDF = window.jspdf.jsPDF;
  const doc = new jsPDF();

  let y = 10;
  tarefas.forEach((t, i) => {
    doc.text(`Tarefa ${i + 1}: ${t.title}`, 10, y);
    doc.text(
      `Urgência: ${t.urgencia} | Área: ${t.area} | Duração: ${t.duration} min`,
      10,
      y + 10
    );
    doc.text(`Data: ${t.day}`, 10, y + 20);
    doc.text(`Obs: ${t.obs}`, 10, y + 30);
    y += 45;
  });

  doc.save("planner.pdf");
}

// Edição inline com eventos delegados
tasksContainer.addEventListener("click", (e) => {
  const target = e.target;

  // Botão Excluir
  if (target.classList.contains("btn-danger")) {
    const card = target.closest(".task-card");
    if (!card) return;
    // Pegar ID da tarefa pelo título (não ideal, mas funciona aqui)
    const titulo = card.querySelector(".card-title").textContent;
    const tarefa = tarefas.find((t) => t.title === titulo);
    if (tarefa) {
      excluirTarefa(tarefa.id);
    }
  }

  // Botão Feita
  if (target.classList.contains("btn-success")) {
    const card = target.closest(".task-card");
    if (!card) return;
    const titulo = card.querySelector(".card-title").textContent;
    const tarefa = tarefas.find((t) => t.title === titulo);
    if (tarefa) {
      marcarRealizada(tarefa.id);
      target.disabled = true;
      target.textContent = "Feita";
      card.style.opacity = "0.6";
    }
  }

  // Botão Editar (abre o formulário com os dados)
  if (target.classList.contains("btn-warning")) {
    const card = target.closest(".task-card");
    if (!card) return;
    const titulo = card.querySelector(".card-title").textContent;
    const tarefa = tarefas.find((t) => t.title === titulo);
    if (tarefa) {
      editarTarefa(tarefa.id);
    }
  }
});
