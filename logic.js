/*
 * Game logic for Tic Tac Toe: no DOM code here, so it can be tested in Node.
 * Board = array of 9 cells, each null, "X" or "O" (index 0 = top-left, 8 = bottom-right).
 */
(function (root) {
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];

  const other = (player) => (player === 'X' ? 'O' : 'X');

  /** Returns { player, line } if someone has three in a row, otherwise null. */
  function getWinner(board) {
    for (const line of LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { player: board[a], line };
      }
    }
    return null;
  }

  const isFull = (board) => board.every((cell) => cell !== null);
  const emptyCells = (board) => board.flatMap((cell, i) => (cell === null ? [i] : []));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  /* ---------- Computer players ---------- */

  /** Easy: any random free cell. */
  function easyMove(board) {
    return pick(emptyCells(board));
  }

  /** Cell that would complete a line for `player`, or null. */
  function findCompletingCell(board, player) {
    for (const line of LINES) {
      const cells = line.map((i) => board[i]);
      if (cells.filter((c) => c === player).length === 2 && cells.includes(null)) {
        return line[cells.indexOf(null)];
      }
    }
    return null;
  }

  /** Medium: wins if it can, blocks if it must, otherwise leans toward the center. */
  function mediumMove(board, me) {
    const win = findCompletingCell(board, me);
    if (win !== null) return win;
    const block = findCompletingCell(board, other(me));
    if (block !== null) return block;
    if (board[4] === null && Math.random() < 0.7) return 4;
    return pick(emptyCells(board));
  }

  /** Minimax score from the computer's point of view (faster wins score higher). */
  function minimax(board, turn, me, depth) {
    const winner = getWinner(board);
    if (winner) return winner.player === me ? 10 - depth : depth - 10;
    if (isFull(board)) return 0;

    const scores = emptyCells(board).map((i) => {
      board[i] = turn;
      const score = minimax(board, other(turn), me, depth + 1);
      board[i] = null;
      return score;
    });
    return turn === me ? Math.max(...scores) : Math.min(...scores);
  }

  /** Hard: perfect play. It never loses, and picks randomly among equally good moves. */
  function hardMove(board, me) {
    const free = emptyCells(board);
    if (free.length === 9) return pick([0, 2, 4, 6, 8]); // every opening move draws, so skip the search

    let bestScore = -Infinity;
    let bestMoves = [];
    for (const i of free) {
      board[i] = me;
      const score = minimax(board, other(me), me, 1);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [i];
      } else if (score === bestScore) {
        bestMoves.push(i);
      }
    }
    return pick(bestMoves);
  }

  function getComputerMove(board, me, difficulty) {
    if (difficulty === 'hard') return hardMove(board, me);
    if (difficulty === 'medium') return mediumMove(board, me);
    return easyMove(board);
  }

  /* ---------- Best-of-N match scoring ---------- */

  /** First to this many round wins takes the match (best of 5 -> 3). */
  const winsNeeded = (bestOf) => Math.ceil(bestOf / 2);

  function createMatch(bestOf) {
    return { bestOf, target: winsNeeded(bestOf), scores: { X: 0, O: 0, draws: 0 }, winner: null };
  }

  const roundsPlayed = (match) => match.scores.X + match.scores.O + match.scores.draws;

  /** X starts round 1, then the starting player alternates every round. */
  const starterForRound = (roundNumber) => (roundNumber % 2 === 1 ? 'X' : 'O');

  /** Record a round result ("X", "O" or "draw"). Drawn rounds are replayed. */
  function recordRound(match, result) {
    if (match.winner) return match;
    if (result === 'draw') {
      match.scores.draws += 1;
    } else {
      match.scores[result] += 1;
      if (match.scores[result] >= match.target) match.winner = result;
    }
    return match;
  }

  const api = {
    LINES, other, getWinner, isFull, emptyCells,
    easyMove, mediumMove, hardMove, getComputerMove,
    winsNeeded, createMatch, roundsPlayed, starterForRound, recordRound,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TicTacToeLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
