'use strict'

var gBoard;

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