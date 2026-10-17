const tasks = [
  {
    id: 4872,
    seconds: 78,
    brief: "对方突然说要冷静，担心关系变淡。",
    source: "聊天截图",
    summary:
      "对方突然说需要冷静，表示最近压力大、没法像以前一样照顾你，问你能否理解。",
    lines: [
      "我们是不是应该冷静一下？",
      "为什么突然这么说？",
      "我最近压力挺大的，可能没法像以前一样照顾你了",
      "是我哪里做得不好吗...",
      "你能理解我吗？",
    ],
  },
  {
    id: 4871,
    seconds: 165,
    brief: "女生回消息变慢，用户想知道是否继续主动。",
    source: "聊天截图",
    summary:
      "对方最近回复明显变慢，但没有明确拒绝。用户想判断现在是继续主动，还是先后撤。",
    lines: [
      "这周可能比较忙",
      "那我晚点再找你？",
      "嗯嗯，先这样吧",
      "你是不是不太想聊了",
      "没有，只是有点累",
    ],
  },
  {
    id: 4870,
    seconds: 270,
    brief: "吵架后对方只回一个表情，用户想破冰。",
    source: "聊天截图",
    summary:
      "两人前一天发生争执，用户道歉后对方只回复表情。用户想知道如何继续开口不显得纠缠。",
    lines: [
      "昨天我说话有点冲",
      "我不是故意让你难受",
      "嗯",
      "那我们还聊吗？",
      "...",
    ],
  },
  {
    id: 4869,
    seconds: 432,
    brief: "邀约被推迟，用户担心对方只是敷衍。",
    source: "聊天截图",
    summary:
      "用户提出周末见面，对方说再看时间。用户想判断这是否代表拒绝，以及下一句怎么接。",
    lines: [
      "周末要不要一起吃饭？",
      "我看看时间吧",
      "你最近是不是都挺忙",
      "是有点",
      "那我还约你吗？",
    ],
  },
  {
    id: 4868,
    seconds: 38,
    brief: "即将超时：对方说不想被安排，用户想解释。",
    source: "聊天截图",
    summary:
      "对方觉得用户总在安排她的选择。用户想解释自己的好意，但又怕越解释越像控制。",
    lines: [
      "你能不能别总替我决定",
      "我只是想帮你省点事",
      "但我会觉得很有压力",
      "我没这个意思",
      "我知道，但我不舒服",
    ],
  },
  {
    id: 4867,
    seconds: 52,
    brief: "即将超时：用户发长文后对方沉默。",
    source: "聊天截图",
    summary:
      "用户发了很多解释，对方没有继续回应。用户想知道现在是否应该补一句，还是停止输出。",
    lines: [
      "我发这些不是想逼你",
      "只是希望你能知道我的想法",
      "你看到了吗",
      "我有点不知道怎么回",
      "那我先不打扰你？",
    ],
  },
];

const state = {
  selectedId: tasks[0].id,
  filter: "all",
  chance: 12,
  today: 36,
  picked: 7,
  earned: 128,
  submitted: new Set(),
};

const els = {
  taskList: document.getElementById("taskList"),
  tabs: Array.from(document.querySelectorAll(".queue-tab")),
  refreshButton: document.getElementById("refreshButton"),
  filterButton: document.getElementById("filterButton"),
  currentTimer: document.getElementById("currentTimer"),
  taskTitle: document.getElementById("taskTitle"),
  taskSource: document.getElementById("taskSource"),
  taskReward: document.getElementById("taskReward"),
  taskSummary: document.getElementById("taskSummary"),
  maskStatus: document.getElementById("maskStatus"),
  answerInput: document.getElementById("answerInput"),
  answerForm: document.getElementById("answerForm"),
  submitButton: document.getElementById("submitButton"),
  charCount: document.getElementById("charCount"),
  answerState: document.getElementById("answerState"),
  toast: document.getElementById("toast"),
  chanceCount: document.getElementById("chanceCount"),
  todayCount: document.getElementById("todayCount"),
  pickedCount: document.getElementById("pickedCount"),
  earnedCount: document.getElementById("earnedCount"),
  onlineCount: document.getElementById("onlineCount"),
  fallbackStatus: document.getElementById("fallbackStatus"),
  reportButton: document.getElementById("reportButton"),
  chat: [
    document.getElementById("chatA"),
    document.getElementById("chatB"),
    document.getElementById("chatC"),
    document.getElementById("chatD"),
    document.getElementById("chatE"),
  ],
};

function formatTime(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function selectedTask() {
  return tasks.find((task) => task.id === state.selectedId) || tasks[0];
}

function taskStatus(task) {
  if (state.submitted.has(task.id)) return "submitted";
  if (task.seconds <= 0) return "fallback";
  if (task.seconds <= 60) return "urgent";
  return "active";
}

function visibleTasks() {
  return tasks.filter((task) => {
    const status = taskStatus(task);
    if (state.filter === "active") return status === "active" || status === "urgent";
    if (state.filter === "urgent") return status === "urgent";
    return true;
  });
}

function renderQueue() {
  const items = visibleTasks();
  els.taskList.innerHTML = items
    .map((task) => {
      const status = taskStatus(task);
      const label =
        status === "submitted"
          ? "已提交"
          : status === "fallback"
            ? "AI 已兜底"
            : `剩 ${formatTime(task.seconds)}`;
      return `
        <button class="task-card ${task.id === state.selectedId ? "is-active" : ""} ${
          status === "fallback" ? "is-fallback" : ""
        }" type="button" data-task="${task.id}" aria-pressed="${task.id === state.selectedId}">
          <span class="task-top">
            <span>#${task.id}</span>
            <span class="task-time">${label}</span>
          </span>
          <span class="task-brief">${task.brief}</span>
          <span class="task-reward">
            <span>奖励</span>
            <span>参与 <strong>+1</strong></span>
            <span>被选中 <strong>+5</strong></span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderTask() {
  const task = selectedTask();
  const status = taskStatus(task);
  els.taskTitle.textContent = `#${task.id}`;
  els.currentTimer.textContent =
    status === "submitted"
      ? "已提交"
      : status === "fallback"
        ? "AI 已兜底"
        : `剩 ${formatTime(task.seconds)}`;
  els.taskSource.textContent = task.source;
  els.taskReward.textContent = "参与 +1 次，被选中 +5 次";
  els.taskSummary.textContent = task.summary;
  els.maskStatus.textContent = "已自动打码";
  els.chat.forEach((node, index) => {
    node.textContent = task.lines[index] || "";
  });

  const isClosed = status === "fallback" || status === "submitted";
  els.answerInput.disabled = isClosed;
  els.answerInput.value = state.submitted.has(task.id) ? els.answerInput.value : "";
  els.charCount.textContent = String(els.answerInput.value.length);
  els.submitButton.disabled = isClosed || els.answerInput.value.trim().length < 10;
  if (status === "submitted") {
    els.answerState.textContent = "已提交，参与 +1 次机会。等待提问者盲选；被选中再 +5 次。";
  } else if (status === "fallback") {
    els.answerState.textContent = "真人窗口已结束，小程序端已直接展示 AI 兜底答案。";
  } else {
    els.answerState.textContent = "AI 兜底已启动，真人窗口仍在倒计时。";
  }
}

function renderStats() {
  els.chanceCount.textContent = state.chance;
  els.todayCount.textContent = state.today;
  els.pickedCount.textContent = state.picked;
  els.earnedCount.textContent = state.earned;
}

function renderAll() {
  renderQueue();
  renderTask();
  renderStats();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2600);
}

els.taskList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-task]");
  if (!card) return;
  state.selectedId = Number(card.dataset.task);
  renderAll();
});

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.filter = tab.dataset.filter;
    els.tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    renderQueue();
  });
});

els.answerInput.addEventListener("input", () => {
  const length = els.answerInput.value.length;
  const status = taskStatus(selectedTask());
  els.charCount.textContent = String(length);
  els.submitButton.disabled =
    status === "fallback" || status === "submitted" || els.answerInput.value.trim().length < 10;
});

els.answerInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!els.submitButton.disabled) {
    event.preventDefault();
    els.answerForm.requestSubmit();
  }
});

els.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const task = selectedTask();
  if (taskStatus(task) === "fallback" || state.submitted.has(task.id)) return;
  const answer = els.answerInput.value.trim();
  if (answer.length < 10) {
    showToast("至少写 10 个字再提交。");
    return;
  }
  state.submitted.add(task.id);
  state.chance += 1;
  state.today += 1;
  state.earned += 1;
  showToast("已提交：参与答题 +1 次机会。");
  renderAll();
});

els.refreshButton.addEventListener("click", () => {
  tasks.forEach((task, index) => {
    if (!state.submitted.has(task.id) && task.seconds <= 0) {
      task.seconds = 95 + index * 42;
    }
  });
  showToast("任务池已刷新。");
  renderAll();
});

els.filterButton.addEventListener("click", () => {
  state.filter = state.filter === "urgent" ? "all" : "urgent";
  els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.filter === state.filter));
  renderQueue();
  showToast(state.filter === "urgent" ? "只看即将超时任务。" : "已显示全部任务。");
});

els.reportButton.addEventListener("click", () => {
  showToast("已标记给审核：未打码内容会暂停分发。");
});

window.setInterval(() => {
  let changed = false;
  tasks.forEach((task) => {
    if (!state.submitted.has(task.id) && task.seconds > 0) {
      task.seconds -= 1;
      changed = true;
    }
  });
  if (!changed) return;
  const task = selectedTask();
  els.currentTimer.textContent =
    taskStatus(task) === "fallback" ? "AI 已兜底" : `剩 ${formatTime(task.seconds)}`;
  renderQueue();
  if (taskStatus(task) === "fallback") renderTask();
}, 1000);

window.setInterval(() => {
  const next = 1200 + Math.floor(Math.random() * 80);
  els.onlineCount.textContent = next.toLocaleString("en-US");
}, 6000);

renderAll();
