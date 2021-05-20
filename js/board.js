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

function renderCell(op, el1, el2, clsName1, clsName2) {
    if (op === 'add') {
        if (clsName1) el1.classList.add(clsName1);
        if (el2) el1.querySelector(el2).classList.add(clsName2);
    } else if (op === 'remove') {
        if (clsName1) el1.classList.remove(clsName1);
        if (el2) el1.querySelector(el2).classList.remove(clsName2);
    } else if (op === 'html') {
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[0].length; j++) {
                var currCell = document.querySelector(`[data-idx='${i},${j}']`);
                switch (gBoard[i][j].isMine) {
                    case true:
                        currCell.innerHTML = `<span class="content">${MINE}</span>\n<span class="flagged">${FLAG}</span>\n`;
                        break;
                    case false:
                        currCell.innerHTML = `<span class="content">${gBoard[i][j].minesAroundCount}</span>\n<span class="flagged">${FLAG}</span>\n`
                        break;
                }
            }
        }
    }
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
    var count = 1;
    while (count <= gLevel.MINES) {
        loc = { i: getRandomInt(0, gBoard.length - 1), j: getRandomInt(0, gBoard[0].length - 1) };
        if ((frstClickIdx) && (loc.i === frstClickIdx.i && loc.j === frstClickIdx.j) || (gBoard[loc.i][loc.j].isMine)) continue;
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