const sceneEl = document.getElementById("scene");
const sceneBackgroundEl = document.querySelector(".scene-background");
const introAudioEl = document.getElementById("intro-audio");
const gameAudioEl = document.getElementById("game-audio");
const introStartButtonEl = document.getElementById("intro-start-button");
const introPreludeEl = document.getElementById("intro-prelude");
const introMainSceneEl = document.getElementById("intro-main-scene");
const introTitleEl = document.querySelector(".intro-title");
const playerEl = document.getElementById("player");
const actionLineEl = document.getElementById("action-line");
const petersHead = document.getElementById("peters-head");
const inventoryListEl = document.getElementById("inventory-list");
const introOverlayEl = document.getElementById("intro-overlay");
const introTextEl = document.getElementById("intro-text");
const devHelpOverlayEl = document.getElementById("dev-help-overlay");
const dialoguePanelEl = document.getElementById("dialogue-panel");
const dialogueChoicesEl = document.getElementById("dialogue-choices");
const gameWindowEl = document.getElementById("game-window");
const verbButtons = Array.from(document.querySelectorAll(".verb"));
const hotspotButtons = Array.from(document.querySelectorAll(".hotspot"));
const rootStyle = document.documentElement.style;
const SCENE_NATIVE_WIDTH = 320;
const SCENE_NATIVE_HEIGHT = 144;
let pendingInteractionTimer = null;
let introCompleted = false;
let introActivated = false;
let introSequenceStarted = false;
let introVisualsVisible = false;
let introPreludeTimer = null;
let introTimers = [];
let introExitTimer = null;
let dialogueTimers = [];

if (introOverlayEl) {
  document.body.classList.add("is-intro-active");
  introOverlayEl.addEventListener("click", handleIntroAdvance);
  introOverlayEl.addEventListener("keydown", handleIntroKeydown);
  document.addEventListener("pointerdown", handleIntroAdvance, true);
  document.addEventListener("keydown", handleIntroKeydown, true);
}

if (introAudioEl) {
  introAudioEl.volume = 1;
  logIntroAudioState("audio-init");
  introAudioEl.addEventListener("loadeddata", handleIntroAudioReady);
  introAudioEl.addEventListener("canplaythrough", handleIntroAudioReady);
  introAudioEl.addEventListener("error", handleIntroAudioError);
}

if (gameAudioEl) {
  gameAudioEl.volume = 0.35;
  gameAudioEl.muted = true;
}

if (introStartButtonEl) {
  introStartButtonEl.addEventListener("click", handleIntroStartButtonClick);
}

document.addEventListener("keydown", handleDeveloperKeydown);

const verbLabels = {
  walk: "Walk to",
  look: "Look at",
  talk: "Talk to",
  pickup: "Pick up",
  use: "Use",
  debug: "Debug",
};

const introLineVisibleDuration = 6000;
const introLineGapDuration = 1500;
const introPreludeDuration = 5000;
const introPreludeFadeDuration = 500;
const introTitleLineIndex = 2;
const introPreludeStages = [
  "images/WapiceLogo.png",
  "images/leapoffateproductions.png",
];
const introLines = [
  "Deep in the Quark",
  "The Island of Fire",
  "TM (c) 2026 All Rights Reserved",
  "Created and Designed by Johan A, Johan S and Tomas I",
  "Written and Programmed by ChatGPT-4",
  "Background Art by Johan S and ChatGPT",
  "Animation by nobody",
  "Original Music by Michael Land...",
  "...Barney Jones and Andy Newell of earwax productions...",
  "...and Patrick Mundy",
  "Produced by Wapice and Leap of Fate productions (Lassi Niemistö)",
  "Special thanks to Leison Café...",
  "Rubber ducks...",
  "The person who said it's a quick hackathon project",
];

const state = {
  currentSceneId: "campusExterior",
  playerPosition: { left: 152, bottom: 15 },
  selectedVerb: "walk",
  selectedInventory: null,
  hoverTarget: null,
  hoverExitText: "",
  devHelpMode: false,
  devHelpPoint: null,
  message: "",
  inventory: [],
  dialogue: {
    active: false,
    text: "",
    choices: [],
  },
  flags: {
    duckCollected: false,
    mentorHintUnlocked: false,
    centaurFixed: false,
    debuggingBranchUnlocked: false,
  },
};

const scenes = {
  campusExterior: {
    id: "campusExterior",
    name: "Code Temple",
    background: "images/scenes/DomusBothnica_pixelated.png",
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
        label: "Petri",
        rect: { left: 24, bottom: 8, width: 12, height: 36 },
        walkTo: { left: 27, bottom: 15 },
      },
      duck: {
        target: "duck",
        label: "rubber duck",
        rect: { left: 188, bottom: 15, width: 16, height: 12 },
        walkTo: { left: 190, bottom: 15 },
        hiddenWhen: "duckCollected",
      },
      centaur: {
        target: "centaur",
        label: "centaur",
        rect: { left: 213, bottom: -16, width: 76, height: 120 },
        walkTo: { left: 226, bottom: -15 },
      },
    },
    exits: {
      left: {
        edge: "left",
        destinationSceneId: "sauna",
        destinationSpawn: { left: 286, bottom: 15 },
        walkTo: { left: 10, bottom: 15 },
        triggerWidth: 12,
        hoverText: "The Hotfix sauna",
        message: "You arrive to the Hotfix sauna.",
      },
      hqentrance: {
        rect: { left: 12, bottom: 30, width: 10, height: 15 },
        destinationSceneId: "aula",
        destinationSpawn: { left: 12, bottom: 0 },
        walkTo: { left: 10, bottom: 15 },
        hoverText: "Enter Wapice™ HQ",
        message: "You arrive in this temple of code. Peter the Code Guardian hears you looks up from behind his screens. (work in progress, don't judge me!)",
      },
    },
  },
  coffeeRoom: {
    id: "coffeeRoom",
    name: "The Java God",
    background: "images/scenes/Breakroom.png",
    walkMessage: "You stand in front of the coffee machine. If only you knew how to operate it",
    playerScale: 6,
    playerBottomOffset: -70,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 100,
      maxLeft: 200,
      fixedBottom: 15,
    },
    hotspots: { },
    exits: {
      left: {
        edge: "left",
        destinationSceneId: "southCorridor",
        destinationSpawn: { left: 170, bottom: 15 },
        walkTo: { left: 10, bottom: 15 },
        triggerWidth: 12,
        hoverText: "Give up",
        message: "You mosey on towards the balcony.",
      },
      right: {
        edge: "right",
        destinationSceneId: "eastCorridor",
        destinationSpawn: { left: 250, bottom: 20 },
        walkTo: { left: 300, bottom: 15 },
        triggerWidth: 50,
        hoverText: "Give in",
        message: "You go back towards the lobby.",
      },
    },
  },
  aula: {
    id: "aula",
    name: "Lobby",
    background: "images/scenes/HqLobby.png",
    walkMessage: "You cautiously make your way past the front desk.",
    playerScale: 3,
    playerSpawn: { left: 152, bottom: 10 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 0,
    },
    hotspots: {
      peter: {
        target: "peter",
        label: "Peter the Code Guardian",
        rect: { left: 195, bottom: SCENE_NATIVE_HEIGHT -92, width: 20, height: 20 },
        walkTo: { left: 20, bottom: 15 },
      },
    },
    exits: {
      outside: {
        edge: "left",
        destinationSceneId: "campusExterior",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 10, bottom: 0 },
        triggerWidth: 24,
        hoverText: "Get outta here",
        message: "You go back outside.",
      },
      pastPeter: {
        edge: "right",
        destinationSceneId: "eastCorridor",
        destinationSpawn: { left: 250, bottom: 20 },
        walkTo: { left: 280, bottom: 0 },
        triggerWidth: 24,
        hoverText: "The inner sanctum",
        message: "You walk past Peter.",
        requiredInventoryItem: "Access Badge",
        blockedMessage: "You need an Access Badge",
      },
    },
  },
  eastCorridor: {
    id: "eastCorridor",
    name: "Ominous Corridor",
    background: "images/scenes/HqCoffeeroom.png",
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
      coffeeRoom: {
        rect: { left: 95, bottom: 50, width: 55, height: 75 },
        destinationSceneId: "coffeeRoom",
        destinationSpawn: { left: 100, bottom: 15 },
        walkTo: { left: 100, bottom: 15 },
        triggerWidth: 24,
        hoverText: "The Coffee Machine",
        message: "You go to the coffee machine.",
      },
      jukkabrosRoom: {
        rect: { left: 250, bottom: 75, width: 50, height: 60 },
        destinationSceneId: "jukkaBrosOffice",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 280, bottom: 85 },
        triggerWidth: 24,
        hoverText: "JukkaBros' office",
        message: "You enter the domain of JukkaBros",
      },
      southCorridor: {
        rect: { left: 300, bottom: 70, width: 20, height: 80 },
        destinationSceneId: "southCorridor",
        destinationSpawn: { left: 170, bottom: 15 },
        walkTo: { left: 300, bottom: 70 },
        triggerWidth: 24,
        hoverText: "The South Side Corridor",
        message: "You go towards the south corridor.",
      },
      aula: {
        rect: { left: 200, bottom: 0, width: 100, height: 20 },
        destinationSceneId: "aula",
        destinationSpawn: { left: 260, bottom: 0 },
        walkTo: { left: 260, bottom: 0 },
        triggerWidth: 24,
        hoverText: "The aula",
        message: "You go back to the aula.",
      },
    },
  },
  southCorridor: {
    id: "southCorridor",
    name: "Corridor with lots of doors",
    background: "images/scenes/HqSouthCorridor.png",
    walkMessage: "You walk along this ominous corridor",
    playerScale: 3,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 130,
      maxLeft: 185,
      fixedBottom: 15,
    },
    hotspots: {},
    exits: {
      balcony: {
        rect: { left: 160, bottom: 80, width: 20, height: 35 },
        destinationSceneId: "balcony",
        destinationSpawn: { left: 120, bottom: 22 },
        walkTo: { left: 170, bottom: 80 },
        triggerWidth: 24,
        message: "You towards the balcony.",
        hoverText: "The Wapice™ HQ Balcony™",
      },
      officeLandscape: {
        rect: { left: 185, bottom: 80, width: 20, height: 35 },
        destinationSceneId: "officeLandscape",
        destinationSpawn: { left: 120, bottom: 30 },
        walkTo: { left: 170, bottom: 80 },
        triggerWidth: 24,
        hoverText: "More office space",
        message: "You wander into the innermost depths of Wapice HQ™.",
      },
      jukkabrosRoom: {
        edge: "left",
        destinationSceneId: "jukkaBrosOffice",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 0, bottom: 0 },
        triggerWidth: 24,
        hoverText: "JukkaBros' office",
        message: "You enter the domain of JukkaBros",
      },
      marketingRoom: {
        rect: { left: 120, bottom: 40, width: 20, height: 80 },
        destinationSceneId: "marketingRoom",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 150, bottom: 100 },
        triggerWidth: 24,
        hoverText: "Wapice™ Marketing",
        message: "Whoa! would you look at that view!",
      },
      eastCorridor: {
        edge: "right",
        destinationSceneId: "eastCorridor",
        destinationSpawn: { left: 250, bottom: 20 },
        walkTo: { left: 290, bottom: 0 },
        triggerWidth: 24,
        hoverText: "Towards the lobby",
        message: "You walk back towards the lobby.",
      },
    },
  },
  jukkaBrosOffice: {
    id: "jukkaBrosOffice",
    name: "Bow before the Steward of Wapice™",
    background: "images/scenes/HqJukkaBrosOffice.png",
    walkMessage: "You stand in the presence of the mighty JukkaBros",
    playerScale: 4,
    playerBottomOffset: -45,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 20,
    },
    hotspots: {
      jukkabros: {
        target: "jukkabros",
        label: "Johan",
        rect: { left: 140, bottom: 3, width: 45, height: 80 },
        walkTo: { left: 120, bottom: 15 },
        visibleWhen: "debuggingBranchUnlocked",
      }
    },
    exits: {
      eastCorridor: {
        edge: "right",
        destinationSceneId: "eastCorridor",
        destinationSpawn: { left: 250, bottom: 20 },
        walkTo: { left: 250, bottom: 20 },
        triggerWidth: 24,
        hoverText: "Towards the lobby",
        message: "You walk back towards the lobby.",
      },
    }
  },
  marketingRoom: {
    id: "marketingRoom",
    name: "Anssi's and Kaisa's Room",
    background: "images/scenes/MarketingRoom.png",
    walkMessage: "Whoa, marketing kicks ass!",
    playerScale: 3,
    playerBottomOffset: -25,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 15,
    },
    hotspots: {
      anssi: {
        target: "anssi",
        label: "Anssi",
        rect: { left: 140, bottom: 28, width: 28, height: 60 },
        walkTo: { left: 120, bottom: 15 },
      }
    },
    exits: {
      eastCorridor: {
        edge: "right",
        destinationSceneId: "southCorridor",
        destinationSpawn: { left: 12, bottom: 20 },
        walkTo: { left: 100, bottom: 15 },
        triggerWidth: 24,
        message: "You walk back out to the corridor.",
      },
    }
  },
  officeLandscape: {
    id: "officeLandscape",
    name: "An empty office landscape",
    background: "images/scenes/HqOfficeLandscape.png",
    walkMessage: "You all but get lost in this maze of cubicles.",
    playerScale: 2,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 10,
      maxLeft: 298,
      fixedBottom: 30,
    },
    hotspots: {},
    exits: {
      balcony: {
        edge: "left",
        destinationSceneId: "balcony",
        destinationSpawn: { left: 120, bottom: 22 },
        walkTo: { left: 0, bottom: 20 },
        triggerWidth: 24,
        hoverText: "The Wapice HQ Balcony™",
        message: "You walk around on the balcony.",
      },
      southCorridor: {
        rect: { left: 0, bottom: 0, width: 320, height: 24 },
        destinationSceneId: "southCorridor",
        destinationSpawn: { left: 170, bottom: 15 },
        walkTo: { left: 170, bottom: 15 },
        triggerWidth: 24,
        hoverText: "The South Side Corridor",
        message: "You go towards the south corridor.",
      },
    },
  },
  balcony: {
    id: "balcony",
    name: "The Awesome Wapice™ HQ Balcony™",
    background: "images/scenes/balconyAnimation.gif",
    walkMessage: "You walk and look at the amazing views",
    playerScale: 2,
    playerSpawn: { left: 152, bottom: 15 },
    playerBounds: {
      minLeft: 115,
      maxLeft: 185,
      fixedBottom: 22,
    },
    hotspots: {
    },
    exits: {
      southCorridor: {
        rect: { left: 180, bottom: 30, width: 30, height: 70 },
        destinationSceneId: "southCorridor",
        destinationSpawn: { left: 170, bottom: 15 },
        walkTo: { left: 190, bottom: 30 },
        triggerWidth: 24,
        hoverText: "Inside",
        message: "You return to the harsh, cold reality of the office.",
      },
    }
  },
  sauna: {
    id: "sauna",
    name: "Hotfix Sauna",
    background: "images/scenes/KonttoriSauna.png",
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
        hoverText: "Back to the Code Temple",
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
    background: "images/scenes/saunaInterior.gif",
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
        hoverText: "Back to the sauna yard",
        message: "You step back out into the sauna yard.",
      },
    },
  },
};

state.playerPosition = { ...scenes[state.currentSceneId].playerSpawn };

const targets = {
  mentor: {
    name: "Petri",
    verbs: {
      walk() {
        setMessage("You walk over to Petri.");
      },
      look() {
        setMessage("Petri looks highly employable.");
      },
      talk() {
        if (state.flags.duckCollected) {
          state.flags.mentorHintUnlocked = true;
          setMessage("Petri says: Debug the centaur with the duck.");
          return;
        }

        setMessage("Petri says: Find a rubber duck first.");
      },
      pickup() {
        setMessage("Better not pick up your mentor.");
      },
      use() {
        if (state.selectedInventory) {
          setMessage(`Using ${state.selectedInventory} on Petri feels wrong.`);
          return;
        }

        setMessage("Use what on Petri?");
      },
      debug() {
        setMessage("No bugs found. Only sarcasm.");
      },
    },
  },
  centaur: {
    name: "centaur",
    verbs: {
      walk() {
        setMessage("You walk to the centaur.");
      },
      look() {
        if (state.flags.centaurFixed) {
          setMessage("The screen says: BUILD PASSED.");
          return;
        }

        setMessage("A broken campus centaur.");
      },
      talk() {
        setMessage("The terminal refuses conversation.");
      },
      pickup() {
        setMessage("It is far too heavy.");
      },
      use() {
        if (!state.selectedInventory) {
          setMessage("Use what with the centaur?");
          return;
        }

        if (state.selectedInventory === "Rubber Duck" && !state.flags.mentorHintUnlocked) {
          setMessage("Maybe ask Petri first.");
          return;
        }

        if (state.selectedInventory === "Rubber Duck") {
          setMessage("Try DEBUG, not USE.");
          return;
        }

        setMessage(`That does not help the centaur.`);
      },
      debug() {
        if (state.flags.centaurFixed) {
          setMessage("The centaur is already fixed.");
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

        state.flags.centaurFixed = true;
        addInventoryItem("Access Badge");
        setMessage("The centaur is fixed. It spits out an Access Badge.");
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
        startSaunaGuruDialogue();
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
  jukkaBros: {
    name: "JukkaBros",
    verbs: {
      walk() {
        setMessage("You walk toward JukkaBros.");
      },
      look() {
        setMessage("JukkaBros is waiting for the right moment to appear.");
      },
      talk() {
        setMessage("Not yet.");
      },
      pickup() {
        setMessage("That would be a bad idea.");
      },
      use() {
        setMessage("That does not help.");
      },
      debug() {
        setMessage("No bugs found. Only anticipation.");
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
        if (state.flags.centaurFixed) {
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
  anssi: {
    name: "Anssi the Marketing Guy",
    verbs: {
      walk() {
        setMessage("You walk over to Anssi.");
      },
      look() {
        setMessage("Anssi smiles at you");
      },
      talk() {
        setMessage("Anssi says: Marketing is awesome!");
      },
      pickup() {
        setMessage("Come on dude, don't do that");
      },
      use() {
        if (state.selectedInventory) {
          setMessage(`Using ${state.selectedInventory} on Anssi gives him a marketing related idea.`);
          return;
        }

        setMessage("Use what on Anssi?");
      },
      debug() {
        setMessage("No bugs in marketing.");
      },
    },
  },
  jukkabros: {
    name: "Johan the Shop Steward",
    verbs: {
      walk() {
        setMessage("You walk over to Johan.");
      },
      look() {
        setMessage("Wow! This guy is awesome!");
      },
      talk() {
        setMessage("Johan says: Hi there!");
      },
      pickup() {
        setMessage("Alone? Haah! Good luck with that!");
      },
      use() {
        if (state.selectedInventory) {
          setMessage(`Using ${state.selectedInventory} on Johan does not seem very wise.`);
          return;
        }

        setMessage("Use what on Johan?");
      },
      debug() {
        setMessage("Johan is bug free.");
      },
    },
  },
};

verbButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (isDialogueActive()) {
      return;
    }

    selectVerb(button.dataset.verb);
  });
});

hotspotButtons.forEach((button) => {
  const key = button.dataset.target;
  const target = targets[key];

  button.addEventListener("mouseenter", () => {
    if (isDialogueActive()) {
      return;
    }

    state.hoverTarget = target.name;
    renderActionLine();
  });

  button.addEventListener("mouseleave", () => {
    if (isDialogueActive()) {
      return;
    }

    state.hoverTarget = null;
    renderActionLine();
  });

  button.addEventListener("focus", () => {
    if (isDialogueActive()) {
      return;
    }

    state.hoverTarget = target.name;
    renderActionLine();
  });

  button.addEventListener("blur", () => {
    if (isDialogueActive()) {
      return;
    }

    state.hoverTarget = null;
    renderActionLine();
  });

  button.addEventListener("click", (event) => {
    event.stopPropagation();

    if (isDialogueActive()) {
      return;
    }

    interactWithTarget(key);
  });
});

sceneEl.addEventListener("click", (event) => {
  if (isDialogueActive()) {
    return;
  }

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
  if (isDialogueActive()) {
    sceneEl.style.cursor = "default";
    return;
  }

  state.devHelpPoint = getScenePoint(event);
  renderDevHelpOverlay();

  if (event.target.closest(".hotspot")) {
    state.hoverExitText = "";
    sceneEl.style.cursor = "default";
    return;
  }

  const exit = getSceneExitAtPoint(state.devHelpPoint);
  state.hoverExitText = exit?.hoverText ?? "";
  sceneEl.style.cursor = exit ? "pointer" : "default";
  renderActionLine();
});

sceneEl.addEventListener("mouseleave", () => {
  state.hoverExitText = "";
  state.devHelpPoint = null;
  sceneEl.style.cursor = "default";
  renderDevHelpOverlay();
  renderActionLine();
});

renderInventory();
renderScene();
renderActionLine();
updateGameScale();

if (!introAudioEl) {
  startIntroSequence();
} else if (introAudioEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
  handleIntroAudioReady();
}

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

function handleDeveloperKeydown(event) {
  if (event.key !== "F3" || !introCompleted) {
    return;
  }

  event.preventDefault();
  state.devHelpMode = !state.devHelpMode;

  if (!state.devHelpMode) {
    state.devHelpPoint = null;
  }

  renderDevHelpOverlay();
}

function interactWithTarget(key) {
  const hotspot = getCurrentScene().hotspots[key];

  if (!hotspot) {
    return;
  }

  queueInteraction(key, hotspot.walkTo, state.selectedVerb, state.selectedInventory);
}

function renderActionLine() {
  if (state.dialogue.active) {
    actionLineEl.textContent = state.dialogue.text;
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

  if (state.hoverTarget) {
    actionLineEl.textContent = buildCommandText(state.hoverTarget);
    return;
  }

  actionLineEl.textContent = buildCommandText();
}

function renderDevHelpOverlay() {
  if (!devHelpOverlayEl) {
    return;
  }

  const point = state.devHelpPoint;

  if (!state.devHelpMode || !point) {
    devHelpOverlayEl.hidden = true;
    return;
  }

  devHelpOverlayEl.hidden = false;
  devHelpOverlayEl.textContent = `x: ${Math.round(point.left)}  y: ${Math.round(point.bottom)}`;
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

function isDialogueActive() {
  return state.dialogue.active;
}

function clearDialogueTimers() {
  while (dialogueTimers.length > 0) {
    window.clearTimeout(dialogueTimers.pop());
  }
}

function closeDialogue(preserveMessage = true) {
  clearDialogueTimers();

  const finalText = state.dialogue.text;
  state.dialogue.active = false;
  state.dialogue.text = "";
  state.dialogue.choices = [];
  state.hoverTarget = null;
  state.hoverExitText = "";

  if (preserveMessage && finalText) {
    state.message = finalText;
  }

  syncDialogueLock();
  renderDialoguePanel();
  renderActionLine();
}

function renderDialoguePanel() {
  if (!dialoguePanelEl || !dialogueChoicesEl) {
    return;
  }

  if (!state.dialogue.active || state.dialogue.choices.length === 0) {
    dialoguePanelEl.hidden = true;
    dialogueChoicesEl.innerHTML = "";
    return;
  }

  dialoguePanelEl.hidden = false;

  dialogueChoicesEl.innerHTML = state.dialogue.choices
    .map((choice, index) => `<button class="dialogue-choice" type="button" data-choice="${index}">${choice.label}</button>`)
    .join("");

  dialogueChoicesEl.querySelectorAll(".dialogue-choice").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = state.dialogue.choices[Number(button.dataset.choice)];

      if (!choice) {
        return;
      }

      choice.onSelect();
    });
  });
}

function startSaunaGuruDialogue() {
  clearPendingInteraction();
  clearDialogueTimers();

  state.message = "";
  state.hoverTarget = null;
  state.hoverExitText = "";
  state.dialogue.active = true;
  state.dialogue.text = "Ah… I sensed your bugs before you even entered the steam.";
  state.dialogue.choices = [];

  syncDialogueLock();
  renderDialoguePanel();
  renderActionLine();

  dialogueTimers.push(window.setTimeout(() => {
    if (!state.dialogue.active) {
      return;
    }

    state.dialogue.text = "Tell me… what have you broken?";
    state.dialogue.choices = [
      {
        label: "I wouldn’t call it broken… more like unexpectedly permanent.",
        onSelect: () => handleSaunaGuruChoice(1),
      },
      {
        label: "Everything. I broke everything.",
        onSelect: () => handleSaunaGuruChoice(2),
      },
      {
        label: "Nothing. It stopped working completely on its own.",
        onSelect: () => handleSaunaGuruChoice(3),
      },
    ];

    renderDialoguePanel();
    renderActionLine();
  }, 5000));
}

function handleSaunaGuruChoice(choiceId) {
  if (!state.dialogue.active) {
    return;
  }

  clearDialogueTimers();
  state.dialogue.choices = [];
  renderDialoguePanel();

  if (choiceId === 1) {
    state.dialogue.text = "Ahh… you cling to illusion. Many have tried to rename their bugs… none have escaped them.";
    renderActionLine();

    dialogueTimers.push(window.setTimeout(() => {
      state.dialogue.text = "A thing given a better name is still broken. Until you accept this… your code will resist you.";
      renderActionLine();

      dialogueTimers.push(window.setTimeout(() => {
        closeDialogue(true);
      }, 5000));
    }, 5000));
    return;
  }

  if (choiceId === 2) {
    state.dialogue.text = "Good… very good.";
    renderActionLine();

    dialogueTimers.push(window.setTimeout(() => {
      state.flags.debuggingBranchUnlocked = true;
      addInventoryItem("Debugging Branch");
      state.dialogue.text = "Take this. The Debugging Branch. When the code burns… you will know where to look.";
      renderInventory();
      renderScene();
      renderActionLine();

      dialogueTimers.push(window.setTimeout(() => {
        closeDialogue(true);
      }, 5000));
    }, 5000));
    return;
  }

  state.dialogue.text = "Ah… the ancient art of blaming the void.";
  renderActionLine();

  dialogueTimers.push(window.setTimeout(() => {
    state.dialogue.text = "Systems do not fail alone. There is always… a Johan somewhere.";
    renderActionLine();

    dialogueTimers.push(window.setTimeout(() => {
      state.dialogue.text = "Return when you are ready to take responsibility.";
      renderActionLine();

      dialogueTimers.push(window.setTimeout(() => {
        closeDialogue(true);
      }, 5000));
    }, 5000));
  }, 5000));
}

function addInventoryItem(itemName) {
  if (state.inventory.includes(itemName)) {
    return;
  }

  state.inventory.push(itemName);
}

function syncDialogueLock() {
  if (!gameWindowEl) {
    return;
  }

  gameWindowEl.classList.toggle("is-dialogue-locked", state.dialogue.active);

  verbButtons.forEach((button) => {
    button.disabled = state.dialogue.active;
  });

  hotspotButtons.forEach((button) => {
    button.disabled = state.dialogue.active;
  });

  inventoryListEl.querySelectorAll(".inventory-item").forEach((button) => {
    button.disabled = state.dialogue.active;
  });
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
    button.disabled = state.dialogue.active;

    button.addEventListener("mouseenter", () => {
      if (isDialogueActive()) {
        return;
      }

      state.hoverTarget = button.dataset.item;
      renderActionLine();
    });

    button.addEventListener("mouseleave", () => {
      if (isDialogueActive()) {
        return;
      }

      state.hoverTarget = null;
      renderActionLine();
    });

    button.addEventListener("focus", () => {
      if (isDialogueActive()) {
        return;
      }

      state.hoverTarget = button.dataset.item;
      renderActionLine();
    });

    button.addEventListener("blur", () => {
      if (isDialogueActive()) {
        return;
      }

      state.hoverTarget = null;
      renderActionLine();
    });

    button.addEventListener("click", () => {
      if (isDialogueActive()) {
        return;
      }

      clearPendingInteraction();
      state.selectedInventory = state.selectedInventory === button.dataset.item ? null : button.dataset.item;
      state.message = "";
      renderInventory();
      renderActionLine();
    });
  });

  syncDialogueLock();
}

function renderScene() {
  const scene = getCurrentScene();

  sceneEl.style.cursor = "default";
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

    const isHidden = (hotspot.hiddenWhen ? Boolean(state.flags[hotspot.hiddenWhen]) : false)
      || (hotspot.visibleWhen ? !Boolean(state.flags[hotspot.visibleWhen]) : false);
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

  if (scene.id === "aula") {
    peterPopsUp();
  }

  renderDevHelpOverlay();
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
  closeDialogue(false);
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
  if (exit.requiredInventoryItem && !hasInventoryItem(exit.requiredInventoryItem)) {
    setMessage(exit.blockedMessage ?? `You need a ${exit.requiredInventoryItem}`);
    renderActionLine();
    return;
  }

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

function startIntroSequence() {
  if (introSequenceStarted || !introOverlayEl || !introTextEl || !introActivated) {
    return;
  }

  introSequenceStarted = true;

  startIntroPreludeSequence(0);
}

function handleIntroAudioReady() {
  if (!introAudioEl || introCompleted || !introActivated) {
    return;
  }

  logIntroAudioState("audio-ready");
}

function handleIntroAudioError() {
  if (introAudioEl) {
    introAudioEl.muted = false;
  }

  logIntroAudioState("audio-error");
}

function startIntroAudioPlayback() {
  if (!introAudioEl || introCompleted) {
    return;
  }

  introAudioEl.volume = 1;
  introAudioEl.muted = false;
  logIntroAudioState("audio-play-attempt-unmuted");

  const audioPlayPromise = introAudioEl.play();
  if (audioPlayPromise?.catch) {
    audioPlayPromise.catch(() => {
      // Playback is started from a user gesture; log if Edge still blocks it.
      logIntroAudioState("audio-play-rejected");
    });
  }
}

function logIntroAudioState(label) {
  if (!introAudioEl) {
    return;
  }

  console.log(`[intro-audio] ${label}`, {
    muted: introAudioEl.muted,
    paused: introAudioEl.paused,
    readyState: introAudioEl.readyState,
    currentTime: introAudioEl.currentTime,
    volume: introAudioEl.volume,
  });
}

function startIntroPreludeSequence(stageIndex) {
  if (!introPreludeEl) {
    startMainIntroSequence();
    return;
  }

  const stageSrc = introPreludeStages[stageIndex];

  if (!stageSrc) {
    fadeOutPrelude(() => {
      startMainIntroSequence();
    });
    return;
  }

  introVisualsVisible = true;
  introPreludeEl.src = stageSrc;

  if (stageIndex === 1) {
    startIntroAudioPlayback();
  }

  window.requestAnimationFrame(() => {
    introPreludeEl.classList.add("is-visible");
  });

  introPreludeTimer = window.setTimeout(() => {
    introPreludeEl.classList.remove("is-visible");
    introPreludeTimer = window.setTimeout(() => {
      startIntroPreludeSequence(stageIndex + 1);
    }, introPreludeFadeDuration);
  }, introPreludeDuration - introPreludeFadeDuration);
}

function fadeOutPrelude(callback) {
  if (!introPreludeEl) {
    callback();
    return;
  }

  introPreludeEl.classList.remove("is-visible");

  introPreludeTimer = window.setTimeout(() => {
    callback();
  }, introPreludeFadeDuration);
}

function startMainIntroSequence() {
  if (!introTextEl) {
    return;
  }

  introVisualsVisible = true;

  if (introPreludeEl) {
    introPreludeEl.classList.remove("is-visible");
  }

  if (introMainSceneEl) {
    window.requestAnimationFrame(() => {
      introMainSceneEl.classList.add("is-visible");
    });
  }

  if (introPreludeTimer !== null) {
    window.clearTimeout(introPreludeTimer);
    introPreludeTimer = null;
  }

  let delay = 1100;

  introLines.forEach((lineText, index) => {
    introTimers.push(window.setTimeout(() => {
      introTextEl.textContent = lineText;
      introTextEl.classList.add("is-visible");

      if (introTitleEl && index === introTitleLineIndex) {
        introTitleEl.classList.add("is-visible");
      }
    }, delay));

    introTimers.push(window.setTimeout(() => {
      introTextEl.classList.remove("is-visible");
    }, delay + introLineVisibleDuration));

    delay += introLineVisibleDuration + introLineGapDuration;
  });

  introExitTimer = window.setTimeout(() => {
    finishIntro();
  }, delay + 200);
}

function handleIntroAdvance() {
  if (introCompleted || !introActivated) {
    return;
  }

  finishIntro();
}

function handleIntroKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  if (introCompleted || !introActivated) {
    return;
  }

  finishIntro();
}

function handleIntroStartButtonClick(event) {
  event.stopPropagation();

  if (introActivated) {
    return;
  }

  introActivated = true;

  if (introStartButtonEl) {
    introStartButtonEl.classList.add("is-hidden");
  }

  startGameAudioPlayback();
  startIntroSequence();
}

function finishIntro() {
  if (introCompleted || !introOverlayEl) {
    return;
  }

  introCompleted = true;
  introVisualsVisible = false;
  clearIntroTimers();
  logIntroAudioState("audio-finish");
  if (introAudioEl) {
    introAudioEl.pause();
    introAudioEl.currentTime = 0;
  }

  if (gameAudioEl) {
    gameAudioEl.currentTime = 0;
    gameAudioEl.muted = false;
    const gamePlayPromise = gameAudioEl.play();
    if (gamePlayPromise?.catch) {
      gamePlayPromise.catch(() => {
        console.log("[game-audio] play rejected", {
          muted: gameAudioEl.muted,
          paused: gameAudioEl.paused,
          readyState: gameAudioEl.readyState,
          currentTime: gameAudioEl.currentTime,
          volume: gameAudioEl.volume,
        });
      });
    }
  }

  introOverlayEl.removeEventListener("pointerdown", handleIntroAdvance);
  introOverlayEl.removeEventListener("click", handleIntroAdvance);
  introOverlayEl.removeEventListener("keydown", handleIntroKeydown);
  document.removeEventListener("pointerdown", handleIntroAdvance, true);
  document.removeEventListener("keydown", handleIntroKeydown, true);
  document.body.classList.remove("is-intro-active");
  document.body.classList.remove("is-intro-exiting");
  introOverlayEl.remove();
}

function clearIntroTimers() {
  if (introPreludeTimer !== null) {
    window.clearTimeout(introPreludeTimer);
    introPreludeTimer = null;
  }

  introTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  introTimers = [];

  if (introExitTimer !== null) {
    window.clearTimeout(introExitTimer);
    introExitTimer = null;
  }
}

function startGameAudioPlayback() {
  if (!gameAudioEl || introCompleted) {
    return;
  }

  gameAudioEl.muted = true;
  gameAudioEl.volume = 0.35;

  const gamePlayPromise = gameAudioEl.play();
  if (gamePlayPromise?.catch) {
    gamePlayPromise.catch(() => {
      console.log("[game-audio] play rejected", {
        muted: gameAudioEl.muted,
        paused: gameAudioEl.paused,
        readyState: gameAudioEl.readyState,
        currentTime: gameAudioEl.currentTime,
        volume: gameAudioEl.volume,
      });
    });
  }
}
function peterPopsUp() {
  let y = 45;
  
  const movePeter = setInterval(() => {
    y--;

    if (y > 25) {
      petersHead.style.top = y + "px";
    } else {
      clearInterval(movePeter);
    }
  }, 250);
}
