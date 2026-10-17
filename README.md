# Tic Tac Toe

[![CI](https://github.com/Hussain356/Tic-Tac-Toe_Game/actions/workflows/ci.yml/badge.svg)](https://github.com/Hussain356/Tic-Tac-Toe_Game/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-blue)

A modern Tic Tac Toe game you can play against a friend or the computer, with best-of-N matches and a live scoreboard. Built with plain HTML, CSS, and JavaScript, no frameworks or build step.

| Setup | Match |
|---|---|
| ![Setup screen](docs/setup.png) | ![Game screen](docs/game.png) |

## Features

- **Two modes:** play a friend on the same device, or play the computer
- **Three computer levels:**
  - **Easy:** random moves
  - **Medium:** wins when it can and blocks your wins, but can be tricked
  - **Hard:** perfect play using the minimax algorithm, so it never loses
- **Choose your side:** play as X or O against the computer
- **Best-of matches:** best of 1, 3, 5, or 7 rounds. The first player to win the majority of rounds takes the match
- **Live scoreboard:** round wins, draws, and progress dots toward the match win
- **All-time record:** matches won are saved in your browser (with a reset button)
- **Fair play:** the starting player alternates every round, and drawn rounds are replayed
- **Polished UI:** animated marks, highlighted winning line, responsive layout, keyboard and screen-reader friendly, respects reduced-motion settings

## Play

No install needed. Download or clone the project and open `index.html` in a browser.

```sh
git clone https://github.com/Hussain356/Tic-Tac-Toe_Game.git
cd Tic-Tac-Toe_Game
# then open index.html
```

## Tests

The game logic lives in `logic.js`, separate from the interface, so it can be tested in Node (version 18 or newer, no dependencies):

```sh
npm test
```

The tests check all 8 winning lines, the easy and medium computer, the best-of-N scoring rules, and that the hard computer **never loses** by trying every possible human move.

## Project Structure

```
index.html     Page layout (setup screen, game screen, result dialog)
style.css      Styling and animations
logic.js       Game rules, computer players (easy, medium, hard), match scoring
script.js      Interface: rendering, clicks, game flow, saved stats
test/          Unit tests for logic.js
```

## How the Hard Computer Works

It uses **minimax**: it plays out every possible continuation of the game, assumes you always make your best move, and picks the move with the best guaranteed outcome. Faster wins and slower losses score higher. When several moves are equally good it chooses randomly, so games feel different each time.

## Ideas for Next Steps

- Online multiplayer
- Custom player names
- Larger boards (4x4, 5x5)

## License

[MIT](LICENSE)

## Author

Hussain Mansoor, Software Engineering student, Karachi
