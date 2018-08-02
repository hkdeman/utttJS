const UTTT = require('@socialgorithm/ultimate-ttt').default;
const ME = require("@socialgorithm/ultimate-ttt/dist/model/constants").ME;
const OPPONENT = require("@socialgorithm/ultimate-ttt/dist/model/constants").OPPONENT;
const getCloseablePositions = require("./utils");

UCBCONSTANT = 1.5;

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
    smallBoardWon() { this.setAsDesirable(0.55); }
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

class MCTS {
    constructor(board, lastTurn, turn = Turns.X, timeout = 100, before = 5) {
        this.turn = turn;
        this.board = board;
        this.clonedBoard = null;
        this.mct = null;
        this.timeout = timeout;
        this.before = before;
        this.lastTurn = lastTurn;
        this.depth = 0;
    }

    run() {
        if (this.mct == null) this.mct = new Tree(switchTurns(this.turn));
        else {
            let children = this.mct.getRoot().getChildren();
            if (children.length != 0) {
                let contained = false;
                let node = children[0];
                children.forEach(childNode => {
                    let cNM = childNode.getMove();
                    let cPM = this.clonedBoard.getPreviousMove();
                    if (cNM[0] == cPM[0] && cNM[1] == cPM[1]) {
                        contained = true;
                        node = childNode;
                    }
                    if (contained) this.mct.setRoot(node);
                    else this.mct = new Tree(switchTurns(this.turn));
                });
            } else this.mct = new Tree(switchTurns(this.turn));
        }

        let startTime = current_milli_seconds();
        while (current_milli_seconds() - startTime < this.timeout - this.before) {
            let newBoard = cloneBoard(this.board);
            this.clonedBoard = new UltimateTicTacToe(newBoard, this.lastTurn);
            this.rollOut(this.expansion(this.selection(this.mct.getRoot())));
        }
        return this.chooseBestNextMove();
    }

    selection(node) {
        while (this.clonedBoard.getFreePositions().length == node.getChildren().length && node.getChildren().length != 0) {
            node = this.selectUCBChild(node.getChildren());
            this.playClonedBoard(node.getMove(), node.getTurn());
        }
        return node;
    }

    expansion(node) {
        let nextMove = null;
        let won = this.clonedBoard.isGameDone();
        if (won) node.setGameOver();
        else {
            let poses = this.clonedBoard.getFreePositions();
            for (let i = 0; i < poses.length; i++) {
                let move = poses[i];
                let contained = false;
                node.getChildren().forEach(child => {
                    let childMove = child.getMove();
                    if (childMove[0] == move[0] && childMove[1] == move[1]) contained = true;
                });

                if (!contained) {
                    nextMove = move;
                    break;
                }
            };
            node = node.addChild(nextMove);
            this.depth += 1;
            this.playClonedBoard(nextMove, node.getTurn());
        }
        return node;
    }

    rollOut(node) {
        let currSimTurn = switchTurns(node.getTurn());

        while (!this.clonedBoard.isGameDone()) {
            let moves = this.clonedBoard.getFreePositions();
            let move = moves[Math.floor(Math.random() * moves.length)];
            this.playClonedBoard(move, currSimTurn);
            currSimTurn = switchTurns(currSimTurn);
        }
        if (this.clonedBoard.getWinner() == null) this.backpropogate(GameStates.DRAW, node);
        else this.backpropogate(node.getTurn() == currSimTurn ? GameStates.LOSE : GameStates.WIN, node);
    }

    backpropogate(gameState, node) {
        let index = 0;
        while (true) {
            if (gameState == GameStates.DRAW) node.updateStats(gameState);
            else if (index % 2 == 0) node.updateStats(gameState);
            else node.updateStats(gameState == GameStates.WIN ? GameStates.LOSE : GameStates.WIN);
            node = node.getParent();
            if (node == null) break;
            index += 1;
        }
    }

    selectUCBChild(nodes) {
        let bestNode = nodes[0];
        nodes.forEach(node => {
            if (node.getUCBValue() > bestNode.getUCBValue()) bestNode = node;
        });
        return bestNode;
    }

    playClonedBoard(move, turn) { this.clonedBoard.move(turn, move[0], move[1]); }
    getDepth() { return this.depth; }

    chooseBestNextMove() {
        let children = this.mct.getRoot().getChildren();
        let bestScore = children[0].getScore();
        let bestMove = children[0].getMove();
        children.forEach(child => {
            if (child.getScore() > bestScore) {
                bestMove = child.getMove();
                bestScore = child.getScore();
            }
        });
        return bestMove;
    }

}

let ttt = new Tree(null);
let uttt = new UltimateTicTacToe([[]],null);


//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////


class GameLogic {
    constructor(player, size = 3) {
        if (!player || player < ME || player > OPPONENT) {
            throw new Error('Invalid player');
        }

        this.size = size;
        this.player = player;
        this.opponent = 1 - player;
    }

    /* ----- Required methods ----- */

    init() {
        this.game = new UTTT(this.size);
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
        this.index = 0;
    }

    addOpponentMove(board, move) {
        try {
            this.game = this.game.addOpponentMove(board, move);
            let parsedBoard = movesToDiscrete[board.toString()];
            let parsedMove = movesToDiscrete[move.toString()];
            this.mainBoard[parsedBoard][parsedMove] = 2;
            this.index++;
        } catch (e) {
            console.error('-------------------------------');
            console.error("\n" + 'AddOpponentMove: Game probably already over when adding', board, move, e);
            console.error("\n" + this.game.prettyPrint());
            console.error("\n" + this.game.stateBoard.prettyPrint(true));
            console.error('-------------------------------');
            throw new Error(e);
        }
    }

    addMove(board, move) {
        try {
            this.game = this.game.addMyMove(board, move);
            let parsedBoard = movesToDiscrete[board.toString()];
            let parsedMove = movesToDiscrete[move.toString()];
            this.mainBoard[parsedBoard][parsedMove] = 1;
            this.index++;
        } catch (e) {
            console.error('-------------------------------');
            console.error("\n" + 'AddMyMove: Game probably already over when adding', board, move, e);
            console.error("\n" + this.game.prettyPrint());
            console.error("\n" + this.game.stateBoard.prettyPrint(true));
            console.error('-------------------------------');
            throw new Error(e);
        }
    }

    getMove() {
        if(this.index < 6) {
            return this.getMoveFirst();
        } else if (this.index < 25) {
            return this.getDefenseBot();
        } else {
            return this.getMCTSBot();
        }
    }

    getMCTSBot() {
        let lastTurn = this.game.nextBoard;
        if (lastTurn != undefined) {
            lastTurn = movesToDiscrete[lastTurn.toString()];
        } else {
            lastTurn = null;
        }

        let mcts = new MCTS(this.mainBoard, lastTurn);
        let move = mcts.run();
        return {
            board: discreteToMoves[move[0]],
            move: discreteToMoves[move[1]]
        };
    }

    getDefenseBot(){
        if (this.index==0) return {board: [1,1], move:[1,1]};
        const validBoards = this.game.getValidBoards();
        /**
         * Try to find either winning or losing positions
         * These are when you/opponent have 2 in a row and there's one unoccupied place
         * Algo prefers moving there first and then falls back to the first available position
         */
        const weightedMoves = validBoards.map((boardCoords) => {
            const board = this.game.board[boardCoords[0]][boardCoords[1]].board;

            const opponentWinningPositions = getCloseablePositions(board, this.opponent);
            if (opponentWinningPositions.length > 0) {
                return {
                    board: boardCoords,
                    move: opponentWinningPositions[0].coordinates
                };
            }

            const myWinningPositions = getCloseablePositions(board, this.player);
            if (myWinningPositions.length > 0) {
                return {
                    board: boardCoords,
                    move: myWinningPositions[0].coordinates
                }
            }
            return null
        }).filter(move => move != null);

        if (weightedMoves.length > 0) {
            return weightedMoves[0]
        }

        //fall back to the first available logic
        const board = this.game.board[validBoards[0][0]][validBoards[0][1]];

        return {
            board: validBoards[0],
            move: this.findPosition(board)
        };
    }

  /* ---- Non required methods ----- */
    /**
     * Get a random position to play in a board
     * @param board Board identifier [row, col]
     * @returns {[number,number]} Position coordinates [row, col]
     */
    findPosition(board) {
        if (board.isFull() || board.isFinished()) {
            console.error('This board is full/finished', board);
            console.error(board.prettyPrint());
            return;
        }
        const validMoves = board.getValidMoves();
        if (validMoves.length === 0) {
            // this case should never happen :)
            throw new Error('Error: There are no moves available on this board');
        }

        // return validMoves[Math.floor(Math.random() * validMoves.length)];
        return validMoves[0];
    }

    getMoveFirst(){
        const boardCoords = this.chooseBoard();
        const board = this.game.board[boardCoords[0]][boardCoords[1]];
        const move = this.findPositionFirst(board);

        return {
            board: boardCoords,
            move: move
        };
    }

  /* ---- Non required methods ----- */

    /**
     * Choose a valid board to play in
     * @returns {[number,number]} Board identifier [row, col]
     */
    chooseBoard() {
        let board = this.game.nextBoard || [0, 0];

        if(!this.game.board[board[0]][board[1]].isFinished()){
            return board;
        }

        const validBoards = this.game.getValidBoards();
        if (validBoards.length === 0) {
            // this case should never happen :)
            console.error("\n" + this.game.prettyPrint());
            console.error("\n" + this.game.stateBoard.prettyPrint(true));
            throw new Error('Error: There are no boards available to play');
        }

        return validBoards[0];
    }

    /**
     * Get a random position to play in a board
     * @param board Board identifier [row, col]
     * @returns {[number,number]} Position coordinates [row, col]
     */
    findPositionFirst(board) {
        if (board.isFull() || board.isFinished()) {
            console.error('This board is full/finished', board);
            console.error(board.prettyPrint());
            return;
        }
        const validMoves = board.getValidMoves();
        if (validMoves.length === 0) {
            // this case should never happen :)
            throw new Error('Error: There are no moves available on this board');
        }

        // return validMoves[Math.floor(Math.random() * validMoves.length)];
        return validMoves[0];
    }

}

module.exports = GameLogic;