const Logic = window.TicTacToeLogic;

const MARKS = {
  X: '<svg class="mark x" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="100" d="M25 25L75 75"/><path pathLength="100" d="M75 25L25 75"/></svg>',
  O: '<svg class="mark o" viewBox="0 0 100 100" aria-hidden="true"><circle pathLength="100" cx="50" cy="50" r="28"/></svg>',
};
const STATS_KEY = 'tic-tac-toe-stats-v1';
const COMPUTER_DELAY = [450, 800]; // ms the computer "thinks"

const $ = (id) => document.getElementById(id);
const els = {
  setup: $('setup'), setupForm: $('setup-form'), cpuOptions: $('cpu-options'), bestHint: $('best-hint'),
  alltimePvc: $('alltime-pvc'), alltimePvp: $('alltime-pvp'), resetStats: $('reset-stats'),
  game: $('game'), matchInfo: $('match-info'), board: $('board'), status: $('status'),
  nameX: $('name-x'), nameO: $('name-o'), valueX: $('value-x'), valueO: $('value-o'), valueDraws: $('value-draws'),
  pipsX: $('pips-x'), pipsO: $('pips-o'), scoreX: $('score-x'), scoreO: $('score-o'),
  nextRound: $('next-round'), restart: $('restart'), menu: $('menu'),
  dialog: $('result-dialog'), resultTitle: $('result-title'), resultText: $('result-text'),
  playAgain: $('play-again'), dialogMenu: $('dialog-menu'),
};

let settings = { mode: 'pvc', difficulty: 'medium', human: 'X', bestOf: 3 };
let match, board, current, winLine, roundOver, computerTimer;

/* ---------- Saved stats (browser storage, optional) ---------- */

function loadStats() {
  const empty = { pvc: { won: 0, lost: 0 }, pvp: { p1: 0, p2: 0 } };
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(STATS_KEY)) };
  } catch {
    return empty;
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable: stats just won't persist */
  }
}

function renderStats() {
  const { pvc, pvp } = loadStats();
  els.alltimePvc.textContent = `vs Computer: You ${pvc.won} - ${pvc.lost} Computer`;
  els.alltimePvp.textContent = `2 Players: Player 1 ${pvp.p1} - ${pvp.p2} Player 2`;
}

function recordMatchResult() {
  const stats = loadStats();
  if (settings.mode === 'pvc') {
    stats.pvc[match.winner === settings.human ? 'won' : 'lost'] += 1;
  } else {
    stats.pvp[match.winner === 'X' ? 'p1' : 'p2'] += 1;
  }
  saveStats(stats);
}

/* ---------- Names and text ---------- */

function nameOf(symbol) {
  if (settings.mode === 'pvc') return symbol === settings.human ? 'You' : 'Computer';
  return symbol === 'X' ? 'Player 1' : 'Player 2';
}

const isComputerTurn = () => settings.mode === 'pvc' && current !== settings.human;

function statusText() {
  if (roundOver) return '';
  if (isComputerTurn()) return 'Computer is thinking...';
  if (settings.mode === 'pvc') return `Your turn (${current})`;
  return `${nameOf(current)}'s turn (${current})`;
}

/* ---------- Rendering ---------- */

function renderPips(container, wins) {
  container.replaceChildren();
  for (let i = 0; i < match.target; i++) {
    const pip = document.createElement('span');
    pip.className = i < wins ? 'pip on' : 'pip';
    container.append(pip);
  }
}

function renderScoreboard() {
  els.nameX.textContent = `${nameOf('X')} (X)`;
  els.nameO.textContent = `${nameOf('O')} (O)`;
  els.valueX.textContent = match.scores.X;
  els.valueO.textContent = match.scores.O;
  els.valueDraws.textContent = match.scores.draws;
  renderPips(els.pipsX, match.scores.X);
  renderPips(els.pipsO, match.scores.O);

  const playing = !roundOver && !match.winner;
  els.scoreX.classList.toggle('active', playing && current === 'X');
  els.scoreO.classList.toggle('active', playing && current === 'O');
}

function renderBoard() {
  const locked = roundOver || isComputerTurn();
  [...els.board.children].forEach((cell, i) => {
    const mark = board[i];
    cell.innerHTML = mark ? MARKS[mark] : ''; // MARKS are fixed strings, not user input
    cell.disabled = locked || mark !== null;
    cell.classList.toggle('win', winLine.includes(i));
    cell.style.color = winLine.includes(i) ? `var(--${mark.toLowerCase()})` : '';
    const row = Math.floor(i / 3) + 1;
    const col = (i % 3) + 1;
    cell.setAttribute('aria-label', `Row ${row}, column ${col}, ${mark || 'empty'}`);
  });
}

function render() {
  renderScoreboard();
  renderBoard();
  els.matchInfo.textContent =
    `Best of ${match.bestOf} · First to ${match.target} wins · Round ${Logic.roundsPlayed(match) + (roundOver ? 0 : 1)}`;
  if (!roundOver) els.status.textContent = statusText();
  els.nextRound.hidden = !(roundOver && !match.winner);
}

/* ---------- Game flow ---------- */

function buildBoard() {
  els.board.replaceChildren();
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.addEventListener('click', () => onCellClick(i));
    els.board.append(cell);
  }
}

function startMatch() {
  clearTimeout(computerTimer);
  match = Logic.createMatch(settings.bestOf);
  startRound();
}

function startRound() {
  clearTimeout(computerTimer);
  board = Array(9).fill(null);
  winLine = [];
  roundOver = false;
  current = Logic.starterForRound(Logic.roundsPlayed(match) + 1);
  render();
  if (isComputerTurn()) scheduleComputerMove();
}

function scheduleComputerMove() {
  const [min, max] = COMPUTER_DELAY;
  computerTimer = setTimeout(() => {
    place(Logic.getComputerMove(board, current, settings.difficulty));
  }, min + Math.random() * (max - min));
}

function onCellClick(i) {
  if (roundOver || board[i] !== null || isComputerTurn()) return;
  place(i);
}

function place(i) {
  board[i] = current;
  const winner = Logic.getWinner(board);
  if (winner) return endRound(winner.player, winner.line);
  if (Logic.isFull(board)) return endRound('draw', []);

  current = Logic.other(current);
  render();
  if (isComputerTurn()) scheduleComputerMove();
}

function endRound(result, line) {
  roundOver = true;
  winLine = line;
  Logic.recordRound(match, result);

  if (result === 'draw') {
    els.status.textContent = "It's a draw! This round will be replayed.";
  } else if (settings.mode === 'pvc') {
    els.status.textContent = result === settings.human ? 'You win this round!' : 'Computer wins this round.';
  } else {
    els.status.textContent = `${nameOf(result)} wins this round!`;
  }
  render();

  if (match.winner) {
    recordMatchResult();
    setTimeout(showMatchResult, 900);
  } else {
    els.nextRound.focus();
  }
}

function showMatchResult() {
  const { X, O, draws } = match.scores;
  if (settings.mode === 'pvc') {
    els.resultTitle.textContent = match.winner === settings.human ? 'You win the match!' : 'Computer wins the match';
  } else {
    els.resultTitle.textContent = `${nameOf(match.winner)} wins the match!`;
  }
  els.resultText.textContent =
    `Final score: ${nameOf('X')} ${X} - ${O} ${nameOf('O')}` + (draws ? ` (${draws} draw${draws > 1 ? 's' : ''})` : '');
  els.dialog.showModal();
  els.playAgain.focus();
}

function showSetup() {
  clearTimeout(computerTimer);
  if (els.dialog.open) els.dialog.close();
  els.game.hidden = true;
  els.setup.hidden = false;
  renderStats();
}

/* ---------- Setup form ---------- */

function readSettings() {
  const data = new FormData(els.setupForm);
  settings = {
    mode: data.get('mode'),
    difficulty: data.get('difficulty'),
    human: data.get('side'),
    bestOf: Number(data.get('bestOf')),
  };
  els.cpuOptions.hidden = settings.mode !== 'pvc';
  const target = Logic.winsNeeded(settings.bestOf);
  els.bestHint.textContent =
    `First to ${target} round win${target > 1 ? 's' : ''} takes the match. Drawn rounds are replayed.`;
}

els.setupForm.addEventListener('change', readSettings);
els.setupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  readSettings();
  els.setup.hidden = true;
  els.game.hidden = false;
  startMatch();
});

els.nextRound.addEventListener('click', startRound);
els.restart.addEventListener('click', startMatch);
els.menu.addEventListener('click', showSetup);
els.playAgain.addEventListener('click', () => {
  els.dialog.close();
  startMatch();
});
els.dialogMenu.addEventListener('click', showSetup);
els.resetStats.addEventListener('click', () => {
  saveStats({ pvc: { won: 0, lost: 0 }, pvp: { p1: 0, p2: 0 } });
  renderStats();
});

buildBoard();
readSettings();
renderStats();
