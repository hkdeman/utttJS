const _column = (board, n) => board.map(x => x[n]);
const _columns = (board) => board.map((_, index) => _column(board, index));
/* \ */
const _majorDiagonal = (board) => board.map((row, index) => row[index]);

/* / */
const _minorDiagonal = (board) => board.map((row, index) => row[row.length - 1 - index]);

function getWinningPosition(cells, playerNo) {
    let playerScore = 0;
    for (let i = 0; i < cells.length; ++i) {
        playerScore += cells[i].player == playerNo;
    }

    // It is a winning position if the last cell is empty
    if (playerScore == cells.length - 1)
    {
        return cells.filter((cell) => !cell.isPlayed())[0]
    }
    return null
}

/**
 * finds positions that are ready to close (2 in  arow) for player
 * @param board
 * @param playerNo
 */
function getCloseablePositions(board, playerNo) {
    return [].concat(
        // Iterate rows/cols
        board.map(row => getWinningPosition(row, playerNo)),
        _columns(board).map(column => getWinningPosition(column, playerNo)),
        // Iterate diagonals
        getWinningPosition(_majorDiagonal(board), playerNo),
        getWinningPosition(_minorDiagonal(board), playerNo)
    ).filter(Boolean);
}

module.exports = getCloseablePositions;