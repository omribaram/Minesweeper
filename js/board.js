'use strict'

var gBoard;
var gIsManualMine;
var gStopwatchInterval;

function buildBoard() {
    gBoard = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        gBoard[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            gBoard[i].push({ minesAroundCount: 0, isShown: false, isMine: false, isMarked: false });
        }
    }
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board[0].length; j++) {
            strHTML += `\t<td data-idx="${i},${j}" oncontextmenu="cellMarked(this,${i},${j})" onclick="cellClicked(this,${i},${j})">\n\t</td>\n`;
            strHTML += '';
        }
        strHTML += '</tr>\n';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;
    EL_MINES.innerText = gUnmarkedMines;
    EL_STOPWATCH.innerText = 0;
}

function renderCell(i, j, op, elCell, clsSpan, clsTd) {
    if (gBoard[i][j].isShown || (!gBoard[i][j].isShown && clsSpan) || (!gBoard[i][j].isShown && clsTd)) {
        if (op === 'flag') {
            elCell.innerHTML = `<span class="flagged">${FLAG}</span>\n`;
            elCell.childNodes[0].classList.toggle(clsSpan);
            return
        }

        if (op === 'remove') {
            if (clsSpan) elCell.innerHTML = ``;
            if (clsTd) elCell.classList.remove(clsTd);
            return
        }

        switch (gBoard[i][j].isMine) {
            case true:
                elCell.innerHTML = `<span class="content">${MINE}</span>\n`;
                elCell.childNodes[0].classList.add(clsSpan);
                break;
            case false:
                if (!gBoard[i][j].isMarked) {
                    elCell.innerHTML = `<span class="content num${gBoard[i][j].minesAroundCount}">${gBoard[i][j].minesAroundCount}</span>\n`;
                    if (clsSpan) elCell.childNodes[0].classList.add(clsSpan);
                }
                break;
        }
        if (clsTd) elCell.classList.toggle(clsTd);
    }
}

function minesPlacement(elCell, i, j) {
    if (gIsManualMine) {
        if (gManualMines.length <= gLevel.MINES) {
            // check to see if already mined
            if (gManualMines.findIndex(idx => (idx.i === i) && (idx.j === j)) === -1) gManualMines.push({ i: i, j: j });
            else return
            BTN_MANUALMINES.classList.add('active');
            renderCell(i, j, '', elCell, '', 'shown-manual-mine');
            BTN_MANUALMINES.childNodes[1].innerText = gLevel.MINES - gManualMines.length + ' left';
            if (gManualMines.length === gLevel.MINES) {
                gIsManualMine = false;
                gGame.firstClick = false;
                placeMinesManually(gManualMines);
                setMinesNegsCount(gBoard); // update matrix with mines negs count
                startStopwatch();
                BTN_MANUALMINES.childNodes[1].innerText = 'Play!';
                BTN_MANUALMINES.disabled = true;
                return false
            } else return false
        }
    } else {
        placeMinesAuto({ i: i, j: j }); // place mines randomly
        setMinesNegsCount(gBoard); // update matrix with mines negs count
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
    var count = 1;
    while (count <= gLevel.MINES) {
        loc = { i: getRandomInt(0, gBoard.length - 1), j: getRandomInt(0, gBoard[0].length - 1) };
        if ((frstClickIdx) && (loc.i === frstClickIdx.i && loc.j === frstClickIdx.j) || (gBoard[loc.i][loc.j].isMine)) continue;
        gBoard[loc.i][loc.j].isMine = true;
        count++;
    }
}

function placeMinesManually(mines) {
    if (!gGame.firstClick && !mines) return;
    if (gIsManualMine) return;
    if (!gIsManualMine && gGame.firstClick) {
        gIsManualMine = true;
        BTN_MANUALMINES.childNodes[1].innerText += ' left';
    } else {
        for (var idx = gManualMines.length; idx > 0; idx--) {
            var mineIdx = gManualMines[idx - 1];
            var elCell = document.querySelector(`[data-idx='${mineIdx.i},${mineIdx.j}']`);
            gBoard[mineIdx.i][mineIdx.j].isMine = true;
            renderCell(mineIdx.i, mineIdx.j, 'remove', elCell, '', 'shown-manual-mine');
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