window.World = {
  scene: null, camera: null, renderer: null, clock: null,
  state: {
    started: false, fragments: 0, totalFragments: 3,
    currentZone: -1, zonesDone: [false, false, false],
    finaleShown: false, dialogueActive: false,
    collected: [], obstacles: [], particles: []
  },
  playerPos: null,
  playerRot: 0,
  keys: { fwd: false, back: false, left: false, right: false, sprint: false, jump: false },
  mouseDown: false, mouseDX: 0, mouseDY: 0
};
