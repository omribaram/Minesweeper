'use-strict'

var gStopwatchInterval;
var gUndoMoves;
var gUndoMovesCount;

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

function findMoveLastIdx() {
    for (var i = gUndoMoves.length - 1; i >= 0; i--) {
        if (gUndoMoves[i].toString().includes('flag') || gUndoMoves[i] === 'move') {
            return i
        }
    }
}

function undoMoves() {
    if (!gGame.isOn) return
    if (gUndoMoves.length <= 0) return

    if (gUndoMoves[gUndoMoves.length - 1] !== 'move') {
        var elCell = document.querySelector(`[data-idx="${gUndoMoves[gUndoMoves.length-2].i},${gUndoMoves[gUndoMoves.length-2].j}"]`);
        cellMarked(elCell, gUndoMoves[gUndoMoves.length - 2].i, gUndoMoves[gUndoMoves.length - 2].j)
        return;
    }

    gUndoMoves.pop();

    var moves = (findMoveLastIdx()) ? gUndoMoves.splice(findMoveLastIdx() + 1, ((gUndoMoves.length) - findMoveLastIdx()) - 1) : gUndoMoves.splice(0, gUndoMoves.length);
    console.log(moves);
    for (var i = moves.length - 1; i >= 0; i--) {

        var elCell = document.querySelector(`[data-idx="${moves[i].i},${moves[i].j}"]`);

        if (gBoard[moves[i].i][moves[i].j].isShown) {
            gGame.shownCount--;
            gBoard[moves[i].i][moves[i].j].isShown = false
        }

        if (gBoard[moves[i].i][moves[i].j].isMine) {
            document.querySelector(`[data-life-id='${gLivesCount+1}']`).classList.remove('used');
            gLivesCount++;
        }

        if (gSafeClicksCount > 0 && getSafeLoc(gBoard)) {
            BTN_SAFECLICK.innerHTML = `Safe Clicks: <span>${gSafeClicksCount}</span>`;
            BTN_SAFECLICK.disabled = false;
        }

        if (gBoard[moves[i].i][moves[i].j].minesAroundCount > 0) renderCell(moves[i].i, moves[i].j, 'remove', elCell, 'shown', 'shown');
        else renderCell(moves[i].i, moves[i].j, 'remove', elCell, '', 'shown-expanded');
    }
    gUndoMovesCount--;
    BTN_UNDO.childNodes[1].innerText = gUndoMovesCount;
}

function resetHints() {
    var hints = [{ isUnderHint: false }];
    for (var i = 0; i <= 2; i++) {
        var elHint = document.querySelector(`[data-hint-id='${i+1}']`);
        hints.push({ id: i + 1, isUsed: false });
        elHint.classList.add('unused');
    }
    return hints;
}

function resetLives() {
    for (var i = 0; i <= 2; i++) {
        var elLife = document.querySelector(`[data-life-id='${i+1}']`);
        elLife.classList.remove('used');
    }
    return 3;
}