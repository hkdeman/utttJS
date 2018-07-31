const UTTT = require('@socialgorithm/ultimate-ttt').default;
const ME = require("@socialgorithm/ultimate-ttt/dist/model/constants").ME;
const OPPONENT = require("@socialgorithm/ultimate-ttt/dist/model/constants").OPPONENT;

class GameLogic {
    constructor(player, size = 3){
        if(!player || player < ME || player > OPPONENT){
            throw new Error('Invalid player');
        }

        this.size = size;
        this.player = player;
        this.opponent = 1 - player;

        this.init();
    }

  /* ----- Required methods ----- */

    init(){
        this.game = new UTTT(this.size);
    }

    addOpponentMove(board, move) {
        try {
            this.game = this.game.addOpponentMove(board, move);
        } catch (e) {
            console.error('-------------------------------');
            console.error("\n"+'AddOpponentMove: Game probably already over when adding', board, move, e);
            console.error("\n"+this.game.prettyPrint());
            console.error("\n"+this.game.stateBoard.prettyPrint(true));
            console.error('-------------------------------');
            throw new Error(e);
        }
    }

    addMove(board, move){
        try {
            this.game = this.game.addMyMove(board, move);
        } catch (e) {
            console.error('-------------------------------');
            console.error("\n"+'AddMyMove: Game probably already over when adding', board, move, e);
            console.error("\n"+this.game.prettyPrint());
            console.error("\n"+this.game.stateBoard.prettyPrint(true));
            console.error('-------------------------------');
            throw new Error(e);
        }
    }

    getMove(){
        const boardCoords = this.chooseBoard();
        const board = this.game.board[boardCoords[0]][boardCoords[1]];
        const move = this.findPosition(board);

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
}

module.exports = GameLogic;