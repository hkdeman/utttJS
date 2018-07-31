const UTTT = require('@socialgorithm/ultimate-ttt').default;
const ME = require("@socialgorithm/ultimate-ttt/dist/model/constants").ME;
const OPPONENT = require("@socialgorithm/ultimate-ttt/dist/model/constants").OPPONENT;
const getCloseablePositions = require("./utils");

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
}

module.exports = GameLogic;
