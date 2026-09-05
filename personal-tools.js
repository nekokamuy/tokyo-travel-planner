(() => {
  const STORAGE_KEY = "tokyo-trip-personal-tools-v1";
  const reminderForm = document.querySelector("[data-reminder-form]");
  const reminderList = document.querySelector("[data-reminder-list]");
  const reminderCount = document.querySelector("[data-reminder-count]");
  const createListForm = document.querySelector("[data-create-list-form]");
  const customLists = document.querySelector("[data-custom-lists]");
  const listCount = document.querySelector("[data-list-count]");
  const saveStatus = document.querySelector("[data-save-status]");
  const updateNotice = document.querySelector("[data-update-notice]");
  const updateNow = document.querySelector("[data-update-now]");
  const openLists = new Set();
  let statusTimer;

  function makeId() {
    return (
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
  }

  function readData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (
        saved?.version === 1 &&
        Array.isArray(saved.reminders) &&
        Array.isArray(saved.lists)
      )
        return saved;
    } catch {
      /* Start with an empty data set if saved data is unavailable. */
    }
    return { version: 1, reminders: [], lists: [] };
  }

  let data = readData();

  function showSaved() {
    window.clearTimeout(statusTimer);
    saveStatus.textContent = "已保存在這台裝置";
    saveStatus.hidden = false;
    statusTimer = window.setTimeout(() => {
      saveStatus.hidden = true;
    }, 1600);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      showSaved();
    } catch {
      saveStatus.textContent = "無法保存，請確認瀏覽器儲存設定";
      saveStatus.hidden = false;
    }
  }

  function actionButton(label, className, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `quiet-button ${className || ""}`.trim();
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function editText(current, label, maxLength) {
    const value = window.prompt(label, current);
    if (value === null) return null;
    return value.trim().slice(0, maxLength) || null;
  }

  function renderReminders() {
    reminderList.replaceChildren();
    const pending = data.reminders.filter((item) => !item.completed).length;
    reminderCount.textContent = data.reminders.length
      ? `${pending} 項未完成`
      : "";

    if (!data.reminders.length) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "目前沒有重要備忘。";
      reminderList.append(empty);
      return;
    }

    [...data.reminders]
      .sort((a, b) => Number(a.completed) - Number(b.completed))
      .forEach((item) => {
        const row = document.createElement("li");
        row.classList.toggle("is-complete", item.completed);
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;
        checkbox.setAttribute("aria-label", `完成：${item.text}`);
        checkbox.addEventListener("change", () => {
          item.completed = checkbox.checked;
          save();
          renderReminders();
        });
        const text = document.createElement("span");
        text.className = "item-text";
        text.textContent = item.text;
        const actions = document.createElement("span");
        actions.className = "item-actions";
        actions.append(
          actionButton("編輯", "", () => {
            const next = editText(item.text, "修改備忘內容", 160);
            if (!next) return;
            item.text = next;
            save();
            renderReminders();
          }),
          actionButton("刪除", "delete-button", () => {
            if (!window.confirm(`確定要刪除重要備忘「${item.text}」嗎？`))
              return;
            data.reminders = data.reminders.filter(
              (entry) => entry.id !== item.id,
            );
            save();
            renderReminders();
          }),
        );
        row.append(checkbox, text, actions);
        reminderList.append(row);
      });
  }

  function renderItem(list, item) {
    const row = document.createElement("li");
    row.classList.toggle(
      "is-complete",
      list.type === "checklist" && item.completed,
    );
    if (list.type === "checklist") {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.setAttribute("aria-label", `完成：${item.text}`);
      checkbox.addEventListener("change", () => {
        item.completed = checkbox.checked;
        save();
        renderLists();
      });
      row.append(checkbox);
    } else {
      const marker = document.createElement("span");
      marker.className = "plain-marker";
      marker.textContent = "•";
      row.append(marker);
    }
    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = item.text;
    const actions = document.createElement("span");
    actions.className = "item-actions";
    actions.append(
      actionButton("編輯", "", () => {
        const next = editText(item.text, "修改清單項目", 160);
        if (!next) return;
        item.text = next;
        save();
        renderLists();
      }),
      actionButton("刪除", "delete-button", () => {
        if (!window.confirm(`確定要刪除清單項目「${item.text}」嗎？`))
          return;
        list.items = list.items.filter((entry) => entry.id !== item.id);
        save();
        renderLists();
      }),
    );
    row.append(text, actions);
    return row;
  }

  function renderLists() {
    customLists.replaceChildren();
    listCount.textContent = data.lists.length
      ? `${data.lists.length} 張清單`
      : "";
    if (!data.lists.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "尚未建立清單，可從下方新增第一張。";
      customLists.append(empty);
      return;
    }

    data.lists.forEach((list) => {
      const card = document.createElement("details");
      card.className = "custom-list";
      card.open = openLists.has(list.id) || !openLists.size;
      card.addEventListener("toggle", () =>
        card.open ? openLists.add(list.id) : openLists.delete(list.id),
      );
      const summary = document.createElement("summary");
      const title = document.createElement("span");
      title.className = "list-title";
      title.textContent = list.title;
      const type = document.createElement("span");
      type.className = "list-type";
      type.textContent = list.type === "checklist" ? "可勾選" : "一般清單";
      summary.append(title, type);
      const body = document.createElement("div");
      body.className = "list-body";
      const toolbar = document.createElement("div");
      toolbar.className = "list-toolbar";
      toolbar.append(
        actionButton("重新命名", "", () => {
          const next = editText(list.title, "修改清單名稱", 60);
          if (!next) return;
          list.title = next;
          save();
          renderLists();
        }),
        actionButton(
          list.type === "checklist" ? "改為一般清單" : "改為可勾選清單",
          "",
          () => {
            list.type = list.type === "checklist" ? "plain" : "checklist";
            openLists.add(list.id);
            save();
            renderLists();
          },
        ),
        actionButton("刪除清單", "delete-button", () => {
          if (!window.confirm(`確定刪除「${list.title}」及其中所有項目？`))
            return;
          data.lists = data.lists.filter((entry) => entry.id !== list.id);
          openLists.delete(list.id);
          save();
          renderLists();
        }),
      );
      const itemForm = document.createElement("form");
      itemForm.className = "item-form";
      const itemFormLabel = document.createElement("span");
      itemFormLabel.className = "add-form-label";
      itemFormLabel.textContent = "新增項目";
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 160;
      input.required = true;
      input.placeholder = "新增清單項目…";
      input.setAttribute("aria-label", `新增至${list.title}`);
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.textContent = "新增";
      itemForm.append(itemFormLabel, input, submit);
      itemForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        list.items.push({ id: makeId(), text, completed: false });
        openLists.add(list.id);
        save();
        renderLists();
      });
      const items = document.createElement("ul");
      items.className = "editable-list";
      if (list.items.length) {
        const visibleItems =
          list.type === "checklist"
            ? [...list.items].sort(
                (a, b) => Number(a.completed) - Number(b.completed),
              )
            : list.items;
        visibleItems.forEach((item) => items.append(renderItem(list, item)));
      } else {
        const empty = document.createElement("li");
        empty.className = "empty-state";
        empty.textContent = "這張清單還沒有項目。";
        items.append(empty);
      }
      body.append(items, itemForm, toolbar);
      card.append(summary, body);
      customLists.append(card);
    });
  }

  reminderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = reminderForm.elements.reminder;
    const text = input.value.trim();
    if (!text) return;
    data.reminders.push({ id: makeId(), text, completed: false });
    input.value = "";
    save();
    renderReminders();
    input.focus();
  });

  createListForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(createListForm);
    const title = String(formData.get("title") || "").trim();
    const type = formData.get("type") === "plain" ? "plain" : "checklist";
    if (!title) return;
    const list = { id: makeId(), title, type, items: [] };
    data.lists.push(list);
    openLists.clear();
    openLists.add(list.id);
    createListForm.reset();
    save();
    renderLists();
  });

  renderReminders();
  renderLists();

  updateNow.addEventListener("click", () => {
    updateNow.disabled = true;
    updateNow.textContent = "更新中…";
    window.location.reload();
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "UPDATE_READY") updateNotice.hidden = false;
    });
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          "./service-worker.js",
        );
        registration.update();
      } catch {
        /* The tools remain available without offline caching. */
      }
    });
  }
})();
