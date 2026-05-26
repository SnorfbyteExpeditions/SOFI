const sceneEl = document.getElementById("scene");
const playerEl = document.getElementById("player");
const actionLineEl = document.getElementById("action-line");
const inventoryListEl = document.getElementById("inventory-list");
const verbButtons = Array.from(document.querySelectorAll(".verb"));
const hotspotButtons = Array.from(document.querySelectorAll(".hotspot"));
const rootStyle = document.documentElement.style;

const verbLabels = {
  walk: "Walk to",
  look: "Look at",
  talk: "Talk to",
  pickup: "Pick up",
  use: "Use",
  debug: "Debug",
};

const state = {
  selectedVerb: "walk",
  selectedInventory: null,
  hoverTarget: null,
  message: "",
  inventory: [],
  flags: {
    duckCollected: false,
    mentorHintUnlocked: false,
    kioskFixed: false,
  },
};

const targets = {
  mentor: {
    name: "Tewo",
    walkTo: { left: 20, bottom: 15 },
    verbs: {
      walk() {
        setMessage("You walk over to Tewo.");
      },
      look() {
        setMessage("Tewo looks highly employable.");
      },
      talk() {
        if (state.flags.duckCollected) {
          state.flags.mentorHintUnlocked = true;
          setMessage("Tewo says: Debug the kiosk with the duck.");
          return;
        }

        setMessage("Tewo says: Find a rubber duck first.");
      },
      pickup() {
        setMessage("Better not pick up your mentor.");
      },
      use() {
        if (state.selectedInventory) {
          setMessage(`Using ${state.selectedInventory} on Tewo feels wrong.`);
          return;
        }

        setMessage("Use what on Tewo?");
      },
      debug() {
        setMessage("No bugs found. Only sarcasm.");
      },
    },
  },
  kiosk: {
    name: "kiosk terminal",
    walkTo: { left: 78, bottom: 16 },
    verbs: {
      walk() {
        setMessage("You walk to the kiosk terminal.");
      },
      look() {
        if (state.flags.kioskFixed) {
          setMessage("The screen says: BUILD PASSED.");
          return;
        }

        setMessage("A broken campus kiosk terminal.");
      },
      talk() {
        setMessage("The terminal refuses conversation.");
      },
      pickup() {
        setMessage("It is far too heavy.");
      },
      use() {
        if (!state.selectedInventory) {
          setMessage("Use what with the kiosk terminal?");
          return;
        }

        if (state.selectedInventory === "Rubber Duck" && !state.flags.mentorHintUnlocked) {
          setMessage("Maybe ask Tewo first.");
          return;
        }

        if (state.selectedInventory === "Rubber Duck") {
          setMessage("Try DEBUG, not USE.");
          return;
        }

        setMessage(`That does not help the kiosk.`);
      },
      debug() {
        if (state.flags.kioskFixed) {
          setMessage("The kiosk is already fixed.");
          return;
        }

        if (!hasInventoryItem("Rubber Duck")) {
          setMessage("You need a rubber duck.");
          return;
        }

        if (!state.flags.mentorHintUnlocked) {
          setMessage("You need better debugging advice.");
          return;
        }

        state.flags.kioskFixed = true;
        addInventoryItem("Access Badge");
        setMessage("The kiosk is fixed. It spits out an Access Badge.");
      },
    },
  },
  duck: {
    name: "rubber duck",
    walkTo: { left: 63, bottom: 14 },
    verbs: {
      walk() {
        setMessage("You walk to the rubber duck.");
      },
      look() {
        setMessage("A noble rubber duck.");
      },
      talk() {
        setMessage("The duck listens quietly.");
      },
      pickup() {
        if (state.flags.duckCollected) {
          setMessage("You already picked up the duck.");
          return;
        }

        state.flags.duckCollected = true;
        addInventoryItem("Rubber Duck");
        disableTarget("duck");
        setMessage("You pick up the rubber duck.");
      },
      use() {
        setMessage("Pick it up first.");
      },
      debug() {
        setMessage("The duck is bug free.");
      },
    },
  },
};

verbButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectVerb(button.dataset.verb);
  });
});

hotspotButtons.forEach((button) => {
  const key = button.dataset.target;
  const target = targets[key];

  button.addEventListener("mouseenter", () => {
    state.hoverTarget = target.name;
    renderActionLine();
  });

  button.addEventListener("mouseleave", () => {
    state.hoverTarget = null;
    renderActionLine();
  });

  button.addEventListener("focus", () => {
    state.hoverTarget = target.name;
    renderActionLine();
  });

  button.addEventListener("blur", () => {
    state.hoverTarget = null;
    renderActionLine();
  });

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    interactWithTarget(key);
  });
});

sceneEl.addEventListener("click", (event) => {
  if (event.target.closest(".hotspot")) {
    return;
  }

  movePlayerToPoint(event);

  if (state.selectedVerb === "walk") {
    setMessage("You walk across the street, trying to look like you totally belong in this codebase.");
    return;
  }

  if (state.selectedVerb === "use" && state.selectedInventory) {
    setMessage(`Use ${state.selectedInventory} with what?`);
    return;
  }

  setMessage(`${verbLabels[state.selectedVerb]} what?`);
});

renderInventory();
renderActionLine();
updateGameScale();

window.addEventListener("resize", updateGameScale);

function selectVerb(verb) {
  state.selectedVerb = verb;
  state.message = "";

  verbButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.verb === verb);
  });

  renderActionLine();
}

function interactWithTarget(key) {
  const target = targets[key];
  movePlayer(target.walkTo);
  target.verbs[state.selectedVerb]();
  renderInventory();
  renderActionLine();
}

function renderActionLine() {
  if (state.hoverTarget) {
    actionLineEl.textContent = buildCommandText(state.hoverTarget);
    return;
  }

  if (state.message) {
    actionLineEl.textContent = state.message;
    return;
  }

  actionLineEl.textContent = buildCommandText();
}

function buildCommandText(targetName = "") {
  if (state.selectedVerb === "use" && state.selectedInventory && targetName) {
    return `Use ${state.selectedInventory} with ${targetName}`;
  }

  if (state.selectedVerb === "use" && state.selectedInventory) {
    return `Use ${state.selectedInventory} with`;
  }

  return targetName ? `${verbLabels[state.selectedVerb]} ${targetName}` : verbLabels[state.selectedVerb];
}

function setMessage(text) {
  state.message = text;
}

function addInventoryItem(itemName) {
  if (state.inventory.includes(itemName)) {
    return;
  }

  state.inventory.push(itemName);
}

function hasInventoryItem(itemName) {
  return state.inventory.includes(itemName);
}

function renderInventory() {
  if (state.inventory.length === 0) {
    inventoryListEl.innerHTML = '<li class="inventory-empty">Empty</li>';
    return;
  }

  inventoryListEl.innerHTML = state.inventory
    .map((item) => {
      const selectedClass = state.selectedInventory === item ? " is-selected" : "";
      return `<li><button class="inventory-item${selectedClass}" type="button" data-item="${item}">${item}</button></li>`;
    })
    .join("");

  inventoryListEl.querySelectorAll(".inventory-item").forEach((button) => {
    button.addEventListener("mouseenter", () => {
      state.hoverTarget = button.dataset.item;
      renderActionLine();
    });

    button.addEventListener("mouseleave", () => {
      state.hoverTarget = null;
      renderActionLine();
    });

    button.addEventListener("focus", () => {
      state.hoverTarget = button.dataset.item;
      renderActionLine();
    });

    button.addEventListener("blur", () => {
      state.hoverTarget = null;
      renderActionLine();
    });

    button.addEventListener("click", () => {
      state.selectedInventory = state.selectedInventory === button.dataset.item ? null : button.dataset.item;
      state.message = "";
      renderInventory();
      renderActionLine();
    });
  });
}

function movePlayer(position) {
  playerEl.style.left = `${position.left}px`;
  playerEl.style.bottom = `${position.bottom}px`;
}

function movePlayerToPoint(event) {
  const rect = sceneEl.getBoundingClientRect();
  const left = ((event.clientX - rect.left) / rect.width) * 320;
  const bottom = ((rect.bottom - event.clientY) / rect.height) * 144;
  movePlayer({
    left: clamp(Math.round(left) - 6, 10, 298),
    bottom: clamp(Math.round(bottom) - 18, 12, 30),
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function disableTarget(key) {
  const button = document.querySelector(`[data-target="${key}"]`);

  if (!button) {
    return;
  }

  button.disabled = true;
  button.style.display = "none";
}

function updateGameScale() {
  const scale = Math.max(1, Math.floor(Math.min((window.innerWidth - 16) / 320, (window.innerHeight - 16) / 240)));
  rootStyle.setProperty("--game-scale", String(scale));
}
