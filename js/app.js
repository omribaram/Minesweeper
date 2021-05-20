'use strict'

// Prevents default context menu on right click
const noRightClick = document.querySelector('table');
noRightClick.addEventListener('contextmenu', el => el.preventDefault());

// Definition of constants throughout the game
const MINE = '💣';
const FLAG = '🚩';
const SMILE_NORMAL = '😃';
const SMILE_LOST = '😖';
const SMILE_WON = '😎';
const HINT = '💡';
const LIFE = '❤️';
const EL_STOPWATCH = document.querySelector('.stopwatch');
const EL_MINES = document.querySelector('.unmarked-bombs');
const EL_MOOD = document.querySelector('.mood');
const BTN_SAFECLICK = document.querySelector('.safe-click');
const BTN_MANUALMINES = document.querySelector('.manual-mines');
const EL_BESTSCORE = document.querySelector('.best-score');

var gManualMines = [];
var gIsManualMine;
var gBoard;
var gLevel;
var gGame;
var gUnmarkedMines;
var gHints;
var gLives;
var gSafeClicksCount;
var gUndoMoves; //!! TODO !!

function initGame(size = gLevel.SIZE, mines = gLevel.MINES) {
    gUndoMoves = [];
    gLevel = { SIZE: size, MINES: mines }; // set/reset game level
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0, firstClick: true }; // set/reset game parameters
    buildBoard(); // construct the matrix
    gHints = resetHints(); // set/reset game hints
    gLives = resetLives(); // set/reset lives
    gUnmarkedMines = gLevel.MINES; // set/reset unmarked mines count on board
    renderBoard(gBoard); // render the board as HTML
    clearStopwatch(); // initialize the stopwatch
    gSafeClicksCount = 3;
    BTN_SAFECLICK.childNodes[1].innerText = gSafeClicksCount;
    BTN_MANUALMINES.disabled = false;
    BTN_SAFECLICK.disabled = false;
    BTN_MANUALMINES.childNodes[1].innerText = gLevel.MINES;
    EL_MOOD.innerText = SMILE_NORMAL; // initialize the HTML mood element
    EL_BESTSCORE.innerText = (!localStorage.getItem(`bestScore-level-${gLevel.SIZE}`)) ? 'You haven\'t won this level yet.' : localStorage.getItem(`bestScore-level-${gLevel.SIZE}`);
}

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

function cellClicked(elCell, i, j) {
    if (gGame.firstClick) {
        if (!minesPlacement(elCell, i, j)) return;
    }

    if (gHints[0].isUnderHint) {
        if (gBoard[i][j].isShown) return;
        var negs = getNegs({ i: i, j: j });
        negs.push({ i: i, j: j });
        for (var i = 0; i < negs.length; i++) {
            elCell = document.querySelector(`[data-idx='${negs[i].i},${negs[i].j}']`);
            renderCell('add', elCell, '.content', '', 'hint');
        }
        setTimeout(() => {
            for (var i = 0; i < negs.length; i++) {
                elCell = document.querySelector(`[data-idx='${negs[i].i},${negs[i].j}']`);
                renderCell('remove', elCell, '.content', '', 'hint');
            }
        }, 1000);
        gHints[0].isUnderHint = false;
        return;
    }

    if (gGame.isOn) { // Check to see if game is still running
        if (!gBoard[i][j].isShown) {
            if (!gBoard[i][j].isMarked) {
                if (gBoard[i][j].isMine) { // Check if bomb and if live remaining and perform accordingly
                    if (gLives.length === 1) {
                        renderCell('add', document.querySelector(`[data-life-id='1']`), '', 'used', '')
                        renderCell('add', elCell, '.content', 'shown-clicked-mine', 'shown');
                        // renderCell('add', elCell, '', 'clicked-mine', '')
                        gameLoss(gBoard);
                    } else {
                        renderCell('add', document.querySelector(`[data-life-id='${gLives.length}']`), '', 'used', '')
                        gLives[gLives.length - 1].isUsed = true;
                        gLives.pop();
                        renderCell('add', elCell, '.content', 'safe-click', 'shown');
                        document.querySelector('table').style.pointerEvents = 'none';
                        setTimeout(() => {
                            renderCell('remove', elCell, '.content', 'safe-click', 'shown');
                            document.querySelector('table').style.pointerEvents = 'auto';
                        }, 1000);
                    }
                } else {
                    expandShow(gBoard, elCell, i, j); // If it's not a bomb, open negs recursively
                    checkGameOver(gBoard); // Checks if game was won
                }
            }
        }
    }
}

// Expends negs recursively
function expandShow(board, elCell, i, j) {
    if (!board[i][j].isShown) {
        if (!board[i][j].isMarked) {
            if (!board[i][j].isMine) {
                board[i][j].isShown = true;
                gGame.shownCount++;
                if (board[i][j].minesAroundCount > 0) {
                    renderCell('add', elCell, '.content', 'shown', 'shown');
                } else {
                    renderCell('add', elCell, '', 'shown-expanded', '');
                    var negs = getNegs({ i: i, j: j });
                    for (var idx = 0; idx < negs.length; idx++) {
                        var neg = negs[idx];
                        if (!board[neg.i][neg.j].isMarked && !board[neg.i][neg.j].isShown) {
                            elCell = document.querySelector(`[data-idx="${neg.i},${neg.j}"]`);
                            expandShow(board, elCell, neg.i, neg.j);
                        }
                    }
                }
            }
        }
    }
}

function cellMarked(elCell, i, j) {
    if (gIsManualMine) return;

    if (gGame.firstClick) minesPlacement(elCell, i, j);

    if (gGame.isOn) { // Check to see if game is still running
        if (gBoard[i][j].isShown) return; // If a shown cell was clicked, exit
        if (!gBoard[i][j].isMarked && gUnmarkedMines > 0) { // if there are still unmarked bombs left, continue
            gBoard[i][j].isMarked = true;
            gGame.markedCount++;
            renderCell('add', elCell, '.flagged', '', 'shown')
            gUnmarkedMines--;
            checkGameOver(gBoard);
        } else if (gBoard[i][j].isMarked) { // in case of a marked cell, unmark it
            gBoard[i][j].isMarked = false;
            gGame.markedCount--;
            renderCell('remove', elCell, '.flagged', '', 'shown')
            gUnmarkedMines++;
        }
    }
    EL_MINES.innerText = gUnmarkedMines;
}

// check if any unmarked bombs or any unshown cells left, in case no, game was won
function checkGameOver(board) {
    if (gGame.shownCount === gLevel.SIZE ** 2) {
        gameLoss(gBoard);
        return
    }

    if ((gLevel.SIZE ** 2 === (gGame.shownCount + gGame.markedCount)) && gGame.markedCount !== gLevel.MINES) {
        gameLoss(gBoard);
        return
    }

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine && !board[i][j].isMarked) return;
            if (!board[i][j].isMine && !board[i][j].isShown) return;
        }
    }
    gameWon();
}

function gameLoss(board) {
    clearInterval(gStopwatchInterval); // stop the stopwatch
    gGame.isOn = false; // stop the game
    for (var i = 0; i < board.length; i++) { // show all remaining bombs
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine && !board[i][j].isMarked) {
                var elCell = document.querySelector(`[data-idx="${i},${j}"]`);
                renderCell('add', elCell, '.content', 'shown', 'shown');
            }
        }
    }
    EL_MOOD.innerText = SMILE_LOST;
    BTN_SAFECLICK.disabled = true;
}

function gameWon(board) {
    clearInterval(gStopwatchInterval); // stop the stopwatch
    gGame.isOn = false; // stop the game
    EL_MOOD.innerText = SMILE_WON;
    BTN_SAFECLICK.disabled = true;
    var bestScore = localStorage.getItem(`bestScore-level-${gLevel.SIZE}`);
    if (gGame.secsPassed < bestScore || !bestScore) {
        localStorage.setItem(`bestScore-level-${gLevel.SIZE}`, gGame.secsPassed);
        EL_BESTSCORE.innerText = localStorage.getItem(`bestScore-level-${gLevel.SIZE}`);
    }
}

function useSafeClick() {
    if (gSafeClicksCount === 0) return
    if (gGame.firstClick) minesPlacement();
    var loc = getSafeLoc(gBoard);
    if (!loc) {
        BTN_SAFECLICK.childNodes[1].innerText = '0';
        BTN_SAFECLICK.disabled = true;
        return;
    }
    var elCell = document.querySelector(`[data-idx='${loc.i},${loc.j}']`);
    renderCell('add', elCell, '', 'safe-click', '');
    gSafeClicksCount--;
    BTN_SAFECLICK.childNodes[1].innerText = gSafeClicksCount;
    if (gSafeClicksCount === 0) BTN_SAFECLICK.disabled = true;
    setTimeout(() => {
        renderCell('remove', elCell, '', 'safe-click', '');
    }, 2000);
}

function useHint(elHint) {
    var hintIdx = elHint.dataset.hintId;
    if (gHints[0].isUnderHint || gHints[hintIdx].isUsed) return
    gHints[0].isUnderHint = true;
    gHints[hintIdx].isUsed = true
    renderCell('remove', elHint, '', 'unused', '');
}

function resetHints() {
    var hints = [{ isUnderHint: false }];
    for (var i = 0; i <= 2; i++) {
        var elHint = document.querySelector(`[data-hint-id='${i+1}']`);
        hints.push({ id: i + 1, isUsed: false });
        renderCell('add', elHint, '', 'unused', '');
    }
    return hints;
}

function resetLives() {
    var lives = [];
    for (var i = 0; i <= 2; i++) {
        var elLife = document.querySelector(`[data-life-id='${i+1}']`);
        lives.push({ id: i + 1, isUsed: false });
        renderCell('remove', elLife, '', 'used', '');
    }
    return lives;
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