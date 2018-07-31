const readline = require('readline');
// Random player implementation
const GameLogic = require('./src/defensive/logic');

/**
 * Random client implementation of the UTTT Game
 */

function input() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Load player's code
  let player = new GameLogic(1);

  rl.on('line', function (input) {
    const parts = input.split(' ');
    const action = parts[0];

    let next, move, coords;

    switch (action) {
      case 'init':
        player.init();
        break;
      case 'move':
        try {
          coords = player.getMove();
          player.addMove(coords.board, coords.move);
          writeMove(coords);
        } catch(e) {
          console.error('Player Error: Failed to get a move', e);
        }
        break;
      case 'opponent':
        // the move will be in the format x,y;x,y
        // where the first pair are the board's coordinates
        // and the second one are the move's coordinates
        next = parts[1].split(';');
        const boardCoords = next[0].split(',').map((coord) => parseInt(coord, 10));
        const moveCoords = next[1].split(',').map((coord) => parseInt(coord, 10));
        player.addOpponentMove(
          [
            boardCoords[0],
            boardCoords[1]
          ],
          [
            moveCoords[0],
            moveCoords[1]
          ]
        );
        if (!player.game.isFinished()) {
          coords = player.getMove();
          player.addMove(coords.board, coords.move);
          writeMove(coords);
        }
        break;
    }
  });
}

function writeMove(coords) {
  const move = coords.board[0] + ',' + coords.board[1] + ';' +
    coords.move[0] + ',' + coords.move[1];
  write(move);
}

function player() {
  input();
}

function write(output) {
  if (output) {
    console.log(output);
  }
}

player();