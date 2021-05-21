'use-strict'

var gManualMines = [];

// Returns the negs idxs for each called idx
function getNegs(idx, hint) {
    var rowIdx = idx.i;
    var colIdx = idx.j;
    var negs = [];
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard.length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            if (hint && gBoard[i][j].isShown) continue
            negs.push({ i: i, j: j });
        }
    }
    return negs;
}

function startStopwatch() {
    gStopwatchInterval = setInterval(function() {
        gGame.secsPassed++;
        EL_STOPWATCH.innerText = gGame.secsPassed;
    }, 1000)
}

function clearStopwatch() {
    clearInterval(gStopwatchInterval);
    gStopwatchInterval = null;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a safe location which is not a mine
function getSafeLoc(board) {
    var locs = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (!board[i][j].isMine && !board[i][j].isShown) locs.push({ i: i, j: j });
        }
    }
    return locs[getRandomInt(0, locs.length - 1)];
}