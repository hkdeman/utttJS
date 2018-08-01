const tf = require('./tf');


UCBCONSTANT = 5

// let parse = function(board){
//     let grid = [];
//     for(let gridX=0; gridX<3;gridX++) {
//         for(let gridY=0; gridY<3;gridY++) {
//             let subGrid = [];
//             for(let subGridX=0; subGridX<3;subGridX++) {
//                 for(let subGridY=0; subGridY<3;subGridY++) {
//                     let value = board[gridX][gridY].board[subGridX][subGridY].player;
//                     subGrid.push(value!= undefined ? value : 0);
//                 }
//             }
//             grid.push(subGrid);
//         }
//     }
//     return grid;
// }

let Turns = { X: 1, O: 2, Empty: 0 };
let GameStates = { WIN: 1, LOSE: -1, DRAW: 0.5, NOT_DONE: 0 };
let current_milli_seconds = function () { return Date.now(); };
let WINPOSSES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
let switchTurns = function (turn) { if (turn == Turns.X) return Turns.O; else if (turn == Turns.O) return Turns.X; return Turns.Empty; };
let getAllIndexes = function (arr, val) { let indexes = []; i = -1; while ((i = arr.indexOf(val, i + 1)) != -1) indexes.push(i); return indexes; };
let discreteToMoves = { 0: [0, 0], 1: [0, 1], 2: [0, 2], 3: [1, 0], 4: [1, 1], 5: [1, 2], 6: [2, 0], 7: [2, 1], 8: [2, 2] };
let movesToDiscrete = { "0,0": 0, "0,1": 1, "0,2": 2, "1,0": 3, "1,1": 4, "1,2": 5, "2,0": 6, "2,1": 7, "2,2": 8 };
let cloneBoard = function (board) { return board.map(function (arr) { return arr.slice(); }); }

class Node {
    constructor(parent, turn, move) {
        this.parent = parent;
        this.turn = turn;
        this.move = move;
        this.children = [];
        this.wins = 0;
        this.visits = 0;
        this.isGameOver = false;
        this.isDesirable = false;
    }

    getMove() { return this.move; }
    getParent() { return this.parent; }
    getTurn() { return this.turn; }
    getIsGameOver() { return this.isGameOver; }
    getChildren() { return this.children; }
    getWins() { return this.wins; }
    getVisits() { return this.visits; }
    getUCBValue() { return (this.wins / this.visits) + Math.sqrt(UCBCONSTANT * Math.log(this.parent.getVisits() / this.visits)); }
    setGameOver() { this.isGameOver = true; this.setAsDesirable(1); }
    getScore() { return this.wins / this.visits; }
    getString() { return this.move.toString(); }
    addChild(move) { let child = new Node(this, switchTurns(this.turn), move); this.children.push(child); return child; }
    smallBoardWon() { this.setAsDesirable(0.5); }
    setAsDesirable(value, CONST = 1) { if (!this.isDesirable) { this.wins += value * CONST; this.isDesirable = true; } this.visits = 1; }
    updateStats(gameState) {
        if (gameState == GameStates.WIN) this.wins += 1;
        else if (gameState == GameStates.LOSE) this.wins -= 1;
        else if (gameState == GameStates.DRAW) this.wins += 0.5;
        this.visits += 1;
    }
}

class Tree {
    constructor(turn) {
        this.root = new Node(null, turn, null);
    }
    setRoot(node) { this.root = node; }
    getRoot() { return this.root; }
}

class TicTacToe {
    constructor(grid) {
        this.grid = grid;
        this.winner = null;
    }

    getGridAsList() { return this.grid; }
    getWinner() { return this.winner; }
    getPositions(player) { return getAllIndexes(this.grid, player); }
    getFreePositions() { return !this.didSomeoneWin() ? this.getPositions(0) : []; }
    isBoardFull() { return this.getFreePositions().length == 0; }

    move(turn, pos) {
        if (this.grid[pos] == 0 && !this.isGameDone()) {
            this.grid[pos] = turn;
            return true;
        }
        return false;
    }

    didWin(player) {
        let won = false;
        WINPOSSES.forEach(poses => {
            let contains = true;
            poses.forEach(pos => {
                if (player.indexOf(pos) == -1) contains = false;
            });
            if (contains) {
                won = true;
                return;
            }
        });
        return won;
    }

    didSomeoneWin() {
        let xPos = this.getPositions(1); // Turns.X
        let oPos = this.getPositions(2); // Turns.O

        let xWin = this.didWin(xPos);
        let oWin = this.didWin(oPos);

        if (xWin || oWin) return true;
        return false;
    }

    isGameDone() {
        let xPos = this.getPositions(1); // Turns.X
        let oPos = this.getPositions(2); // Turns.O

        let xWin = this.didWin(xPos);
        let oWin = this.didWin(oPos);

        if (xWin) { this.winner = 1; return true; }
        else if (oWin) { this.winner = 2; return true; }
        else if (this.isBoardFull()) return true;
        return false;
    }
}

class UltimateTicTacToe {
    constructor(givenBoard, lastTurn) {
        this.board = [];
        givenBoard.forEach(grid => {
            this.board.push(new TicTacToe(grid))
        });
        this.winner = null;
        this.lastTurn = lastTurn;
        this.previousMove = null;
    }

    getLastTurn() { return this.lastTurn; }
    getPreviousMove() { return this.previousMove; }
    getBoard() { return this.board; }
    getWinner() { return this.winner; }
    getGridToMove() { return this.lastTurn; }
    getSubBoard(boardPos) { return this.board[boardPos]; }

    isBoardFull() {
        let full = true;
        this.board.forEach(ttt => {
            if (!ttt.isGameDone()) {
                full = false;
                return false;
            }
        });
        return full;
    }

    getBoardAsList() {
        let tempArr = [];
        this.board.forEach(ttt => { tempArr.push(ttt.getGridAsList()); })
        return tempArr;
    }

    getBoardAs1DList() {
        let tempArr = [];
        this.board.forEach(ttt => { tempArr.push.apply(tempArr, ttt.getGridAsList()); })
        return tempArr;
    }

    getFreePositions() {
        let freeMoves = [];
        if (this.lastTurn == null) {
            this.board.forEach((ttt, index) => {
                ttt.getFreePositions().forEach((pos) => {
                    freeMoves.push([index, pos]);
                });
            });
        } else {
            // if (this.board[this.lastTurn].isGameDone()) {
            //     this.board.forEach((ttt,index)=> {
            //         ttt.getFreePositions().forEach((pos)=> {
            //             freeMoves.push([index,pos]);
            //         });
            //     });
            // } else {
            this.board[this.lastTurn].getFreePositions().forEach((pos) => {
                freeMoves.push([this.lastTurn, pos]);
            });
        }
        return freeMoves;
    }

    getPositions(player) {
        let positions = [];
        this.board.forEach((ttt, index) => {
            if (ttt.isGameDone() && ttt.getWinner() == player) positions.push(index);
        });
        return positions;
    }

    move(turn, grid, pos) {
        if (this.lastTurn == null) {
            if (this.board[grid].move(turn, pos)) {
                this.lastTurn = !this.board[pos].isGameDone() ? pos : null;
                this.previousMove = [grid, pos];
                return true;
            }
            return false;
        } else if (grid == this.lastTurn) {
            if (this.board[grid].move(turn, pos)) {
                this.lastTurn = !this.board[pos].isGameDone() ? pos : null;
                this.previousMove = [grid, pos];
                return true;
            }
            return false;
        }
        return false;
    }

    didWin(player) {
        let won = false;
        WINPOSSES.forEach(poses => {
            let contains = true;
            poses.forEach(pos => {
                if (player.indexOf(pos) == -1) contains = false;
            })
            if (contains) {
                won = true;
                return false;
            }
        });
        return won;
    }

    isGameDone() {
        let xPos = this.getPositions(1); // Turns.X
        let oPos = this.getPositions(2); // Turns.O
        let xWin = this.didWin(xPos);
        let oWin = this.didWin(oPos);

        if (xWin) { this.winner = 1; return true; }
        else if (oWin) { this.winner = 2; return true; }
        else if (this.isBoardFull()) return true;
        return false;
    }
}

// let testBoard = [
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [1, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0, 0, 0, 0, 0],
// ];

function playRandomGame(qval=0.9, stretch=1) {
    this.mainBoard = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    let uttt = new UltimateTicTacToe(this.mainBoard);
    let feature = [];
    let turn = Math.floor(Math.random()*2)+1;
    while (!uttt.isGameDone()) {
        let oldBoard = uttt.getBoardAs1DList();
        let moves = uttt.getFreePositions();
        let move = moves[Math.floor(Math.random()*moves.length)];
        uttt.move(turn, move[0], move[1]);
        turn = switchTurns(turn);
        let newBoard = uttt.getBoardAs1DList();
        oldBoard.push.apply(oldBoard,newBoard);
        feature.push(oldBoard);
    }

    let winner = uttt.getWinner();
    let label = [];
    for(let i=feature.length-1;i>=0;i--) {
        let winVal = Math.pow(qval,i)*stretch;
        switch(winner) {
            case null:
                label.push([0.5*winVal,0.5*winVal]);
                break;
            case 1:
                label.push([winVal,0]);
                break;
            case 2:
                label.push([0,winVal]);
        }
    }
    return [feature, label];
}



function getModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, inputShape: [162,], activation: 'relu'}));
    model.add(tf.layers.dense({ units: 256, activation: 'relu'}));
    model.add(tf.layers.dense({ units: 128, activation: 'relu'}));
    model.add(tf.layers.dense({ units: 2, activation: 'softmax'}));
    model.compile({ optimizer: 'rmsprop', loss: 'categoricalCrossentropy', metrics:['accuracy']});

    return model;
}


async function train(games=10) {
    let model = getModel();
    let features = [];
    let labels = [];
    for (let i=0;i<games;i++) {
        let g = playRandomGame();
        features.push.apply(features,g[0]);
        labels.push.apply(labels,g[1]);
    }

    let xs = tf.tensor2d(features, [features.length, 162]);
    let ys = tf.tensor2d(labels, [labels.length, 2]);
    let now = current_milli_seconds();    
    let history = model.fit(xs,ys).then(()=> {
        console.log(current_milli_seconds()-now);
        console.log(model.model.history);
        // model.save('file:///tmp/uttt').then(()=> {
        //     console.log("Model saved in tmp/uttt");
        // });
    });
}

train()