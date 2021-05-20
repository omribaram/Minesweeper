'use-strict'

var gStopwatchInterval;
var gManualMines = [];
var gIsManualMine;

// Returns the negs idxs for each called idx
function getNegs(idx) {
    var rowIdx = idx.i;
    var colIdx = idx.j;
    var negs = [];
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard.length - 1) continue
            if (i === rowIdx && j === colIdx) continue
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

function minesPlacement(elCell, i, j) {
    if (gIsManualMine) {
        if (gManualMines.length <= gLevel.MINES) {
            // check to see if already mined
            if (gManualMines.findIndex(idx => (idx.i === i) && (idx.j === j)) === -1) gManualMines.push({ i: i, j: j });
            else return
            BTN_MANUALMINES.classList.add('active');
            renderCell('add', elCell, '', 'shown-manual-mine', '');
            BTN_MANUALMINES.childNodes[1].innerText = gLevel.MINES - gManualMines.length;
            setTimeout(() => {
                renderCell('remove', elCell, '', 'shown-manual-mine', '');
            }, 500);
            if (gManualMines.length === gLevel.MINES) {
                placeMinesManually();
                setMinesNegsCount(gBoard); // update matrix with mines negs count
                renderCell('html', '', '', '', '');
                startStopwatch();
                gGame.firstClick = false;
                BTN_MANUALMINES.childNodes[1].innerText = '0';
                BTN_MANUALMINES.disabled = true;
                return false
            } else return false
        }
    } else {
        placeMinesAuto({ i: i, j: j }); // place mines randomly
        setMinesNegsCount(gBoard); // update matrix with mines negs count
        renderCell('html', '', '', '', '');
        startStopwatch();
        gGame.firstClick = false;
        BTN_MANUALMINES.disabled = true;
        return true
    }
}

// Place mines on board randomly as per the amount of defined gLevel
// If there's a mine at location already, repeats...
function placeMinesAuto(frstClickIdx) {
    var loc;
    var count = 0;
    while (count < gLevel.MINES) {
        loc = { i: getRandomInt(0, gBoard.length - 1), j: getRandomInt(0, gBoard[0].length - 1) };
        if ((frstClickIdx) && (loc.i === frstClickIdx.i) && (loc.j === frstClickIdx.j)) continue;
        gBoard[loc.i][loc.j].isMine = true;
        count++;
    }
}

function placeMinesManually() {
    if (!gGame.firstClick) return;
    if (!gIsManualMine) gIsManualMine = true;
    else {
        for (var idx = gManualMines.length; idx > 0; idx--) {
            var mineIdx = gManualMines[idx - 1];
            gBoard[mineIdx.i][mineIdx.j].isMine = true;
            gManualMines.pop();
        }
        gIsManualMine = false;
    }
}

function setMinesNegsCount(board) {
    var negsMinesCount;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            negsMinesCount = 0;
            if (!board[i][j].isMine) {
                var negs = getNegs({ i: i, j: j }); // Gets the negs of checked idx and iterates through it
                for (var idx = 0; idx < negs.length; idx++) {
                    if (board[negs[idx].i][negs[idx].j].isMine) negsMinesCount++;
                }
                board[i][j].minesAroundCount = negsMinesCount;
            }
        }
    }
}