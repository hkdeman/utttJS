UCBCONSTANT = 5

let parse = function(board){
    let grid = [];
    // board.forEach(subBoard => {
    //     subBoard.forEach((row) => {

    //     });
    // });
    return grid;
}


let Turns = { X:1, O:2, Empty: 0};
let GameStates = { WIN: 1, LOSE:-1, DRAW: 0.5, NOT_DONE: 0};
let Move = function(row, col) { return {row: row, col:col}};
let current_milli_seconds = function() { return Date.now(); };
let WINPOSSES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let switchTurns = function (turn) { if (turn==Turns.X) return Turns.O; else if(turn==Turns.O) return Turns.X; return Turns.Empty;}
let getAllIndexes = function(arr,val) { let indexes = []; i = -1; while ((i=arr.indexOf(val,i+1))!=-1) indexes.push(i); return indexes; }
let discreteToMoves = { 0:Move(0,0), 1:Move(0,1), 2:Move(0,2), 3:Move(1,0), 4:Move(1,1), 5:Move(1,2), 6:Move(2,0), 7:Move(2,1),8:Move(2,2)};
let movesToDiscrete = {"[0,0]":0,"[0,1]":1,"[0,2]":2,"[1,0]":3,"[1,1]":4,"[1,2]":5,"[2,0]":6,"[2,1]":7,"[2,2]":8};

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
    getUCBValue() { return (this.wins/this.visits) + Math.sqrt(UCBCONSTANT*Math.log(this.parent.getVisits() / this.visits)); }
    setGameOver() { this.isGameOver = true; this.setAsDesirable(1); }
    getScore() { return this.wins/this.visits; }
    getString() { return this.move.toString(); }
    addChild(move) { let child = Node(this, switchTurns(this.turn), move); this.children.push(child); return child; }
    smallBoardWon() { this.setAsDesirable(0.5); }
    setAsDesirable(value, CONST=1) { if(!this.isDesirable) { this.wins+=value*CONST; this.isDesirable=true;} this.visits=1;}
    updateStats(gameState) { 
        if(gameState == GameStates.WIN) this.wins+=1; 
        else if(gameState==GameStates.LOSE) this.wins-=1; 
        else if(gameState == GameStates.DRAW) this.wins+=0.5;
        this.visits+=1;
    }
}

class Tree {
    constructor(turn) {
         this.root = Node(null, turn, null);
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
    getPositions() { return getAllIndexes(this.grid,0); } // get all Turns.Empty locations
    getFreePositions() { return !this.didSomeoneWin() ? this.getPositions() : []; }
    isBoardFull() { return this.getFreePositions().length == 0; }

    move(turn, pos) {
        if(this.grid[pos]==0 && !this.isGameDone()) {
            this.grid[pos] = turn;
            return true;
        }
        return false;
    }

    didWin(player) {
        WINPOSSES.forEach(pos => {
            if(pos.every(function(val) { return player.indexOf(val) >=0;})) {
                return true;
            }
        });
        return false;
    }

    didSomeoneWin() {
        let xPos = this.getPositions(1); // Turns.X
        let oPos = this.getPositions(2); // Turns.O
        
        let xWin = this.didWin(xPos);
        let oWin = this.didWin(oPos);

        if(xWin || oWin) return true;
        return false;
    }

    isGameDone() {
        let xPos = this.getPositions(1); // Turns.X
        let oPos = this.getPositions(2); // Turns.O
        
        let xWin = this.didWin(xPos);
        let oWin = this.didWin(oPos);

        if(xWin) { this.winner = 1; return true; }
        else if(oWin) { this.winner = 2; return true; }
        else if(this.isBoardFull()) return true;
        return false;
    }
}

class UltimateTicTacToe {
    constructor(board, lastTurn) {
        this.board = [];
        board.forEach(grid=> {
            this.board.push(TicTacToe(grid))
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
         this.board.forEach(ttt=> {
            if(!ttt.isGameDone()) return false;
         });
         return true;
    }
    
    getBoardAsList() {
        let tempArr = [];
        this.board.forEach(ttt=> { tempArr.push(ttt.getGridAsList()); })
        return tempArr;
    }

    getFreePositions() {
        let freeMoves = [];
        if(this.lastTurn == null) {
            this.board.forEach((ttt,index)=> {
                ttt.getFreePositions().forEach((pos)=> {
                    freeMoves.push([index,pos]);
                });
            });
        } else {
            if (this.board[this.lastTurn].isGameDone()) {
                this.board.forEach((ttt,index)=> {
                    ttt.getFreePositions().forEach((pos)=> {
                        freeMoves.push([index,pos]);
                    });
                });
            } else {
                this.board[this.lastTurn].forEach((pos)=> {
                    freeMoves.push([this.lastTurn,pos]);
                });
            }
        }
        return freeMoves;
    }

    getPositions(player) {
        let positions = [];
        this.board.forEach((ttt, index) => {
            if(ttt.isGameDone() && ttt.getWinner() == player) positions.push(index);
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
        WINPOSSES.forEach(pos => {
            if(pos.every(function(val) { return player.indexOf(val) >=0;})) {
                return true;
            }
        });
        return false;
    }

    isGameDone() {
        let xPos = this.getPositions(1); // Turns.X
        let oPos = this.getPositions(2); // Turns.O
        
        let xWin = this.didWin(xPos);
        let oWin = this.didWin(oPos);

        if(xWin) { this.winner = 1; return true; }
        else if(oWin) { this.winner = 2; return true; }
        else if(this.isBoardFull()) return true;
        return false;
    }
}

class MCTS {
    
}

