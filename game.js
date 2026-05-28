const sceneEl = document.getElementById("scene");
const sceneBackgroundEl = document.querySelector(".scene-background");
const playerEl = document.getElementById("player");
const actionLineEl = document.getElementById("action-line");
const inventoryListEl = document.getElementById("inventory-list");
const verbButtons = Array.from(document.querySelectorAll(".verb"));
const hotspotButtons = Array.from(document.querySelectorAll(".hotspot"));
const rootStyle = document.documentElement.style;
const SCENE_NATIVE_WIDTH = 320;
const SCENE_NATIVE_HEIGHT = 144;
let pendingInteractionTimer = null;

const verbLabels = {
  walk: "Walk to",
  look: "Look at",
  talk: "Talk to",
  pickup: "Pick up",
  use: "Use",
  debug: "Debug",
};

const state = {
  currentSceneId: "campusExterior",
  playerPosition: { left: 152, bottom: 15 },
  selectedVerb: "walk",
  selectedInventory: null,
  hoverTarget: null,
  hoverExitText: "",
  message: "",
  inventory: [],
  flags: {
    duckCollected: false,
    mentorHintUnlocked: false,
    kioskFixed: false,
  },
};

const scenes = {
  campusExterior: {
    id: "campusExterior",
    name: "Code Temple",
    background: "images/DomusBothnica_pixelated.png",
    walkMessage: "You walk across the street, trying to look like you totally belong in this codebase.",
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 15,
    },
    hotspots: {
      mentor: {
        target: "mentor",
        label: "Tewo",
        rect: { left: 24, bottom: 12, width: 10, height: 30 },
        walkTo: { left: 27, bottom: 15 },
      },
      duck: {
        target: "duck",
        label: "rubber duck",
        rect: { left: 188, bottom: 15, width: 16, height: 12 },
        walkTo: { left: 190, bottom: 15 },
        hiddenWhen: "duckCollected",
      },
      kiosk: {
        target: "kiosk",
        label: "kiosk terminal",
        rect: { left: 248, bottom: 14, width: 38, height: 60 },
        walkTo: { left: 261, bottom: 15 },
      },
    },
    exits: {
      left: {
        edge: "left",
        destinationSceneId: "sauna",
        destinationSpawn: { left: 286, bottom: 15 },
        walkTo: { left: 10, bottom: 15 },
        triggerWidth: 12,
        message: "You arrive to the Hotfix sauna.",
      },
      hqentrance: {
        rect: { left: 12, bottom: 30, width: 10, height: 15 },
        destinationSceneId: "aula",
        destinationSpawn: { left: 12, bottom: 0 },
        walkTo: { left: 10, bottom: 15 },
        hoverText: "Enter Wapice HQ",
        message: "You arrive in this temple of code.",
      },
    },
  },
  aula: {
    id: "aula",
    name: "Lobby",
    background: "images/HqLobby.png",
    walkMessage: "You walk across the street, trying to look like you totally belong in this codebase.",
    playerScale: 3,
    playerSpawn: { left: 152, bottom: 10 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 10,
    },
    hotspots: {
      peter: {
        target: "peter",
        label: "Peter the Code Guardian",
        rect: { left: 195, bottom: 92, width: 20, height: 20 },
        walkTo: { left: 20, bottom: 15 },
      },
    },
    exits: {
      outside: {
        edge: "left",
        destinationSceneId: "campusExterior",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 10, bottom: 15 },
        triggerWidth: 24,
        message: "You go back outside.",
      },
      pastPeter: {
        edge: "right",
        destinationSceneId: "eastCorridor",
        destinationSpawn: { left: 250, bottom: 20 },
        walkTo: { left: 200, bottom: 15 },
        triggerWidth: 24,
        message: "You walk past Peter.",
      },
    },
  },
  eastCorridor: {
    id: "eastCorridor",
    name: "Ominous Corridor",
    background: "images/HqCoffeeroom.png",
    walkMessage: "You walk past Peter and find yourself at a junction",
    playerScale: 2,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 15,
    },
    hotspots: {    },
    exits: {
      coffeeMachine: {
        rect: { left: 220, bottom: 75, width: 30, height: 75 },
        destinationSceneId: "coffeeMachine",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 10, bottom: 15 },
        triggerWidth: 24,
        hoverText: "The Coffee Machine",
        message: "You go to the coffee machine.",
      },
      jukkabrosRoom: {
        rect: { left: 250, bottom: 75, width: 50, height: 60 },
        destinationSceneId: "jukkaBrosOffice",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 150, bottom: 100 },
        triggerWidth: 24,
        hoverText: "JukkaBros' office",
        message: "You enter the domain of JukkaBros",
      },
      southCorridor: {
        rect: { left: 300, bottom: 100, width: 20, height: 50 },
        destinationSceneId: "southCorridor",
        destinationSpawn: { left: 100, bottom: 20 },
        walkTo: { left: 170, bottom: 70 },
        triggerWidth: 24,
        hoverText: "The South Side Corridor",
        message: "You go towards the south corridor.",
      },
    },
  },
  southCorridor: {
    id: "southCorridor",
    name: "Corridor with lots of doors",
    background: "images/HqSouthCorridor.png",
    walkMessage: "You walk along this ominous corridor",
    playerScale: 3,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 40,
      maxLeft: 100,
      fixedBottom: 15,
    },
    hotspots: {
      // peter: {
      //   target: "peter",
      //   label: "Peter the Code Guardian",
      //   rect: { left: 195, bottom: 92, width: 20, height: 20 },
      //   walkTo: { left: 20, bottom: 15 },
      // },
    },
    exits: {
      balcony: {
        rect: { left: 170, bottom: 80, width: 30, height: 60 },
        destinationSceneId: "balcony",
        destinationSpawn: { left: 100, bottom: 30 },
        walkTo: { left: 70, bottom: 100 },
        triggerWidth: 24,
        message: "You towards the balcony.",
        hoverText: "The Wapice HQ Balcony(tm)",
      },
      jukkabrosRoom: {
        edge: "left",
        destinationSceneId: "jukkaBrosOffice",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 150, bottom: 100 },
        triggerWidth: 24,
        hoverText: "JukkaBros' office",
        message: "You enter the domain of JukkaBros",
      },
      eastCorridor: {
        edge: "right",
        destinationSceneId: "eastCorridor",
        destinationSpawn: { left: 250, bottom: 20 },
        walkTo: { left: 60, bottom: 15 },
        triggerWidth: 24,
        hoverText: "Towards the lobby",
        message: "You walk back towards the lobby.",
      },
    },
  },
  jukkaBrosOffice: {
    id: "jukkaBrosOffice",
    name: "Bow before the Steward of Wapice",
    background: "images/HqJukkaBrosOffice.png",
    walkMessage: "You walk in awe before the mighty JukkaBros",
    playerScale: 4,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 15,
    },
    hotspots: {
    },
    exits: {
      eastCorridor: {
        edge: "right",
        destinationSceneId: "eastCorridor",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 100, bottom: 15 },
        triggerWidth: 24,
        message: "You walk back towards the lobby.",
      },
    }
  },
  officeLandscape: {
    id: "officeLandscape",
    name: "An empty office landscape",
    background: "images/HqOfficeLandscape.png",
    walkMessage: "You walk along this ominous corridor",
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 15,
    },
    hotspots: {},
    exits: {
      balcony: {
        edge: "left",
        destinationSceneId: "balcony",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 10, bottom: 15 },
        triggerWidth: 24,
        message: "You walk around on the balcony.",
      },
      },
  },
  balcony: {
    id: "balcony",
    name: "The Awesome Wapice HQ Balcony(tm)",
    background: "images/balconyAnimation.gif",
    walkMessage: "You walk and look at the amazing views",
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 15,
    },
    hotspots: {
    },
    exits: {
      eastCorridor: {
        edge: "bottom",
        destinationSceneId: "eastCorridor",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 100, bottom: 15 },
        triggerWidth: 24,
        message: "You walk back towards the lobby.",
      },
    }
  },
  sauna: {
    id: "sauna",
    name: "Hotfix Sauna",
    background: "images/KonttoriSauna.png",
    walkMessage: "The distant sound of seagulls mixes with someone debugging in Swedish.",
    playerSpawn: { left: 286, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 15,
    },
    hotspots: {},
    exits: {
      right: {
        edge: "right",
        destinationSceneId: "campusExterior",
        destinationSpawn: { left: 16, bottom: 15 },
        walkTo: { left: 298, bottom: 15 },
        triggerWidth: 24,
        message: "You arrive at the Code Temple.",
      },
      secretDoor: {
        rect: { left: 119, bottom: 18, width: 15, height: 96 },
        destinationSceneId: "saunaInterior",
        destinationSpawn: { left: 34, bottom: 15 },
        walkTo: { left: 110, bottom: 15 },
        hoverText: "Enter Hotfix sauna",
        message: "You slip through a hidden door behind the spruce.",
      },
    },
  },
  saunaInterior: {
    id: "saunaInterior",
    name: "Sauna Interior",
    background: "images/saunaInterior.gif",
    playerScale: 3,
    playerBottomOffset: -45,
    walkMessage: "I can't tell if he's guru meditating... or waiting for a software update.",
    playerSpawn: { left: 34, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 250,
      fixedBottom: 15,
    },
    hotspots: {
      benchGuy: {
        target: "benchGuy",
        label: "Sauna Guru",
        rect: { left: 110, bottom: 58, width: 36, height: 56 },
        walkTo: { left: 120, bottom: 15 },
      },
    },
    exits: {
      left: {
        edge: "left",
        destinationSceneId: "sauna",
        destinationSpawn: { left: 152, bottom: 15 },
        walkTo: { left: 10, bottom: 15 },
        triggerWidth: 24,
        message: "You step back out into the sauna yard.",
      },
    },
  },
};

state.playerPosition = { ...scenes[state.currentSceneId].playerSpawn };

const targets = {
  mentor: {
    name: "Tewo",
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
  benchGuy: {
    name: "Sauna Guru",
    verbs: {
      walk() {
        setMessage("You approach the Sauna Guru respectfully.");
      },
      look() {
        setMessage("He stares into the steam like it contains production logs.");
      },
      talk() {
        setMessage("The Sauna Guru murmurs: Silence is just debugging without a keyboard.");
      },
      pickup() {
        setMessage("You are not strong enough to lift his aura.");
      },
      use() {
        setMessage("That would interrupt an important enlightenment sprint.");
      },
      debug() {
        setMessage("He says: First, reproduce the problem. Then breathe.");
      },
    },
  },
  peter: {
    name: "Peter the Code Guardian",
    verbs: {
      walk() {
        setMessage("You walk over to Peter.");
      },
      look() {
        setMessage("Peter looks at you, wondering");
      },
      talk() {
        if (state.flags.kioskFixed) {
          setMessage("Peter says: Oh, hi! Come on in.");
          return;
        }

        setMessage("Peter says: Do you have an appointment?");
      },
      pickup() {
        setMessage("Peter doesn't want to be picked up.");
      },
      use() {
        if (state.selectedInventory) {
          setMessage(`Using ${state.selectedInventory} on Peter feels wrong.`);
          return;
        }

        setMessage("Use what on Peter?");
      },
      debug() {
        setMessage("No bugs found. Only sarcasm.");
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

  const scenePoint = getScenePoint(event);

  if (state.selectedVerb === "walk") {
    const exit = getSceneExitAtPoint(scenePoint);

    if (exit) {
      queueSceneExit(exit);
      return;
    }
  }

  clearPendingInteraction();
  movePlayerToPoint(scenePoint.left);

  if (state.selectedVerb === "walk") {
    setMessage(getCurrentScene().walkMessage);
    renderActionLine();
    return;
  }

  if (state.selectedVerb === "use" && state.selectedInventory) {
    setMessage(`Use ${state.selectedInventory} with what?`);
    renderActionLine();
    return;
  }

  setMessage(`${verbLabels[state.selectedVerb]} what?`);
  renderActionLine();
});

sceneEl.addEventListener("mousemove", (event) => {
  if (event.target.closest(".hotspot")) {
    state.hoverExitText = "";
    return;
  }

  const exit = getSceneExitAtPoint(getScenePoint(event));
  state.hoverExitText = exit?.hoverText ?? "";
  renderActionLine();
});

sceneEl.addEventListener("mouseleave", () => {
  state.hoverExitText = "";
  renderActionLine();
});

renderInventory();
renderScene();
renderActionLine();
updateGameScale();

window.addEventListener("resize", updateGameScale);

function selectVerb(verb) {
  clearPendingInteraction();
  state.selectedVerb = verb;
  state.message = "";

  verbButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.verb === verb);
  });

  renderActionLine();
}

function interactWithTarget(key) {
  const hotspot = getCurrentScene().hotspots[key];

  if (!hotspot) {
    return;
  }

  queueInteraction(key, hotspot.walkTo, state.selectedVerb, state.selectedInventory);
}

function renderActionLine() {
  if (state.hoverTarget) {
    actionLineEl.textContent = buildCommandText(state.hoverTarget);
    return;
  }

  if (state.hoverExitText) {
    actionLineEl.textContent = state.hoverExitText;
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
      clearPendingInteraction();
      state.selectedInventory = state.selectedInventory === button.dataset.item ? null : button.dataset.item;
      state.message = "";
      renderInventory();
      renderActionLine();
    });
  });
}

function renderScene() {
  const scene = getCurrentScene();

  sceneBackgroundEl.src = scene.background;
  sceneBackgroundEl.alt = "";
  sceneEl.setAttribute("aria-label", scene.name);
  playerEl.style.transform = `scale(${scene.playerScale ?? 1})`;

  hotspotButtons.forEach((button) => {
    const hotspot = scene.hotspots[button.dataset.target];

    if (!hotspot) {
      button.hidden = true;
      return;
    }

    const isHidden = hotspot.hiddenWhen ? Boolean(state.flags[hotspot.hiddenWhen]) : false;
    button.hidden = isHidden;

    if (isHidden) {
      return;
    }

    button.style.left = `${hotspot.rect.left}px`;
    button.style.bottom = `${hotspot.rect.bottom}px`;
    button.style.width = `${hotspot.rect.width}px`;
    button.style.height = `${hotspot.rect.height}px`;
  });

  movePlayer(state.playerPosition);
}

function movePlayer(position) {
  const scene = getCurrentScene();
  const distance = Math.abs(position.left - state.playerPosition.left);
  const duration = clamp(Math.round((distance / 180) * 1000), 150, 900);

  playerEl.style.setProperty("--walk-duration", `${duration}ms`);
  state.playerPosition = { ...position };
  playerEl.style.left = `${position.left}px`;
  playerEl.style.bottom = `${position.bottom + (scene.playerBottomOffset ?? 0)}px`;

  return duration;
}

function movePlayerToPoint(left) {
  const scene = getCurrentScene();

  movePlayer({
    left: clamp(Math.round(left) - 6, scene.playerBounds.minLeft, scene.playerBounds.maxLeft),
    bottom: scene.playerBounds.fixedBottom,
  });
}

function getScenePoint(event) {
  const rect = sceneEl.getBoundingClientRect();

  return {
    left: ((event.clientX - rect.left) / rect.width) * SCENE_NATIVE_WIDTH,
    bottom: ((rect.bottom - event.clientY) / rect.height) * SCENE_NATIVE_HEIGHT,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function disableTarget(key) {
  const hotspot = getCurrentScene().hotspots[key];

  if (!hotspot?.hiddenWhen) {
    return;
  }

  state.flags[hotspot.hiddenWhen] = true;
  renderScene();
}

function updateGameScale() {
  const scale = Math.max(1, Math.floor(Math.min((window.innerWidth - 16) / 320, (window.innerHeight - 16) / 240)));
  rootStyle.setProperty("--game-scale", String(scale));
}

function getCurrentScene() {
  return scenes[state.currentSceneId];
}

function getSceneExitAtPoint(scenePoint) {
  const exits = Object.values(getCurrentScene().exits ?? {});

  return exits.find((exit) => isPointInsideExit(scenePoint, exit)) ?? null;
}

function isPointInsideExit(scenePoint, exit) {
  if (exit.rect) {
    return isPointInsideRect(scenePoint, exit.rect);
  }

  if (exit.edge === "left") {
    return scenePoint.left <= exit.triggerWidth;
  }

  if (exit.edge === "right") {
    return scenePoint.left >= SCENE_NATIVE_WIDTH - exit.triggerWidth;
  }

  return false;
}

function isPointInsideRect(scenePoint, rect) {
  return scenePoint.left >= rect.left
    && scenePoint.left <= rect.left + rect.width
    && scenePoint.bottom >= rect.bottom
    && scenePoint.bottom <= rect.bottom + rect.height;
}

function switchScene(sceneId, playerPosition, message = "") {
  clearPendingInteraction();
  state.currentSceneId = sceneId;
  state.playerPosition = { ...playerPosition };
  state.hoverTarget = null;
  state.hoverExitText = "";
  state.message = message;

  renderScene();
  renderActionLine();
}

function queueInteraction(key, position, verb, inventoryItem) {
  const isAlreadyThere = state.playerPosition.left === position.left && state.playerPosition.bottom === position.bottom;
  const duration = movePlayer(position);

  clearPendingInteraction();

  if (verb === "walk") {
    targets[key].verbs.walk();
    renderActionLine();
    return;
  }

  if (isAlreadyThere) {
    runInteraction(key, verb, inventoryItem);
    return;
  }

  pendingInteractionTimer = window.setTimeout(() => {
    pendingInteractionTimer = null;
    runInteraction(key, verb, inventoryItem);
  }, duration);
}

function queueSceneExit(exit) {
  const isAlreadyThere = state.playerPosition.left === exit.walkTo.left && state.playerPosition.bottom === exit.walkTo.bottom;
  const duration = movePlayer(exit.walkTo);

  clearPendingInteraction();

  if (isAlreadyThere) {
    switchScene(exit.destinationSceneId, exit.destinationSpawn, exit.message);
    return;
  }

  pendingInteractionTimer = window.setTimeout(() => {
    pendingInteractionTimer = null;
    switchScene(exit.destinationSceneId, exit.destinationSpawn, exit.message);
  }, duration);
}

function runInteraction(key, verb, inventoryItem) {
  const target = targets[key];
  const previousVerb = state.selectedVerb;
  const previousInventory = state.selectedInventory;

  state.selectedVerb = verb;
  state.selectedInventory = inventoryItem;

  target.verbs[verb]();
  state.selectedVerb = previousVerb;
  state.selectedInventory = previousInventory;

  renderInventory();
  renderScene();
  renderActionLine();
}

function clearPendingInteraction() {
  if (pendingInteractionTimer === null) {
    return;
  }

  window.clearTimeout(pendingInteractionTimer);
  pendingInteractionTimer = null;
}
