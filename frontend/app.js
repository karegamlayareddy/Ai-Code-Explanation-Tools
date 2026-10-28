const $ = (selector) => document.querySelector(selector);
const languageSelect = $("#language");
const codeInput = $("#code-input");
const explainButton = $("#explain-button");
const output = $("#output");
const outputBadge = $("#output-badge");
const historyList = $("#history-list");
const toast = $("#toast");

const EXAMPLES = {
  c: `#include <stdio.h>\nint main() {\n    int score = 95;\n    if (score >= 50) {\n        printf("You passed!");\n    }\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int number = 7;\n    if (number % 2 == 0) {\n        cout << "Even";\n    } else {\n        cout << "Odd";\n    }\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        int total = 0;\n        for (int i = 1; i <= 5; i++) {\n            total += i;\n        }\n        System.out.println(total);\n    }\n}`,
  python: `total = 0\nfor number in range(1, 6):\n    total += number\nprint(total)`,
  javascript: `const scores = [70, 85, 92];\nlet total = 0;\nfor (const score of scores) {\n    total += score;\n}\nconsole.log(total);`
};

let toastTimer;
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
function getBrowserId() {
  let id = localStorage.getItem("codeclarity-browser-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("codeclarity-browser-id", id);
  }
  return id;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function updateLineCount() {
  const text = codeInput.value;
  $("#line-count").textContent = `${text ? text.split("\n").length : 0} lines`;
}
function renderExplanation(result) {
  output.replaceChildren();
  outputBadge.textContent = "Analysis complete";
  outputBadge.classList.add("ready");

  const summary = document.createElement("div");
  summary.className = "summary-card";
  const summaryTitle = document.createElement("h4");
  summaryTitle.textContent = "In plain language";
  const summaryText = document.createElement("p");
  summaryText.textContent = result.summary;
  summary.append(summaryTitle, summaryText);
  output.append(summary);

  const title = document.createElement("h4");
  title.className = "breakdown-title";
  title.textContent = "Line-by-line breakdown";
  output.append(title);

  const list = document.createElement("div");
  list.className = "breakdown-list";
  result.lines.forEach((line) => {
    const card = document.createElement("article");
    card.className = "line-card";
    const top = document.createElement("div");
    top.className = "line-top";
    const number = document.createElement("span");
    number.className = "line-number";
    number.textContent = String(line.lineNumber).padStart(2, "0");
    const code = document.createElement("code");
    code.className = "line-code";
    code.textContent = line.code || "(blank line)";
    top.append(number, code);
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = line.category;
    const explanation = document.createElement("div");
    explanation.className = "line-explanation";
    explanation.textContent = line.explanation;
    card.append(top, tag, explanation);
    list.append(card);
  });
  output.append(list);

  const tips = document.createElement("div");
  tips.className = "tips";
  const tipsTitle = document.createElement("h4");
  tipsTitle.textContent = "Learning tips";
  const tipsList = document.createElement("ul");
  result.tips.forEach((tip) => {
    const item = document.createElement("li");
    item.textContent = tip;
    tipsList.append(item);
  });
  tips.append(tipsTitle, tipsList);
  output.append(tips);
}
function renderEmpty(message) {
  output.replaceChildren();
  outputBadge.textContent = "Waiting for code";
  outputBadge.classList.remove("ready");
  const state = document.createElement("div");
  state.className = "empty-state";
  const icon = document.createElement("div");
  icon.className = "empty-icon";
  icon.textContent = "✧";
  const title = document.createElement("h4");
  title.textContent = "Your explanation will appear here";
  const description = document.createElement("p");
  description.textContent = message;
  state.append(icon, title, description);
  output.append(state);
}
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Browser-Id": getBrowserId(),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
async function explainCode() {
  const code = codeInput.value.trim();
  if (!code) {
    showToast("Please paste some code first.", true);
    codeInput.focus();
    return;
  }
  explainButton.disabled = true;
  explainButton.textContent = "Analyzing code…";
  outputBadge.textContent = "Working…";
  try {
    const data = await api("/api/analysis", {
      method: "POST",
      body: JSON.stringify({ language: languageSelect.value, code })
    });
    renderExplanation(data.analysis);
    await loadHistory();
    showToast("Explanation created and saved.");
  } catch (error) {
    renderEmpty(error.message);
    outputBadge.textContent = "Could not analyze";
    showToast(error.message, true);
  } finally {
    explainButton.disabled = false;
    explainButton.innerHTML = "<span>✦</span> Explain code <span aria-hidden=\"true\">→</span>";
  }
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
async function loadHistory() {
  try {
    const data = await api("/api/history");
    historyList.replaceChildren();
    if (!data.items.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty";
      empty.textContent = "Your saved explanations will show up here after you analyze code.";
      historyList.append(empty);
      return;
    }
    data.items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "history-card";
      const head = document.createElement("div");
      head.className = "history-card-head";
      const lang = document.createElement("span");
      lang.className = "language-tag";
      lang.textContent = item.language.toUpperCase();
      const date = document.createElement("span");
      date.className = "history-date";
      date.textContent = formatDate(item.created_at);
      head.append(lang, date);
      const title = document.createElement("h3");
      title.textContent = item.title || "Untitled code snippet";
      const summary = document.createElement("p");
      summary.textContent = item.summary;
      const actions = document.createElement("div");
      actions.className = "history-actions";
      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.textContent = "Open again";
      openButton.addEventListener("click", () => {
        languageSelect.value = item.language;
        codeInput.value = item.code;
        updateLineCount();
        renderExplanation(item.analysis);
        $("#explainer").scrollIntoView({ behavior: "smooth" });
      });
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", async () => {
        if (!window.confirm("Delete this saved explanation?")) return;
        try {
          await api(`/api/history/${encodeURIComponent(item.id)}`, { method: "DELETE" });
          await loadHistory();
          showToast("Saved explanation deleted.");
        } catch (error) {
          showToast(error.message, true);
        }
      });
      actions.append(openButton, deleteButton);
      card.append(head, title, summary, actions);
      historyList.append(card);
    });
  } catch (error) {
    historyList.replaceChildren();
    const message = document.createElement("div");
    message.className = "history-empty";
    message.textContent = `History could not be loaded: ${error.message}`;
    historyList.append(message);
  }
}
$("#load-example").addEventListener("click", () => {
  codeInput.value = EXAMPLES[languageSelect.value];
  updateLineCount();
  codeInput.focus();
});
languageSelect.addEventListener("change", () => {
  if (!codeInput.value.trim()) {
    codeInput.value = EXAMPLES[languageSelect.value];
    updateLineCount();
  }
});
codeInput.addEventListener("input", updateLineCount);
explainButton.addEventListener("click", explainCode);
$("#refresh-history").addEventListener("click", loadHistory);
codeInput.value = EXAMPLES.c;
updateLineCount();
loadHistory();
