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

var moves
var gLevel;
var gGame;
var gUnmarkedMines;
var gHints;
var gLivesCount;
var gSafeClicksCount;
var gUndoMoves;

function initGame(size = gLevel.SIZE, mines = gLevel.MINES) {
    gUndoMoves = []; // set/reset undo moves array
    gLevel = { SIZE: size, MINES: mines }; // set/reset game level
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0, firstClick: true }; // set/reset game parameters
    buildBoard(); // construct the matrix
    gHints = resetHints(); // set/reset game hints
    gLivesCount = resetLives();
    gUnmarkedMines = gLevel.MINES; // set/reset unmarked mines count on board
    renderBoard(gBoard); // render the empty board as HTML
    gIsManualMine = false // resets manual mine
    gManualMines = [];
    clearStopwatch(); // initialize the stopwatch
    gSafeClicksCount = 3; // initialize the safe clicks, manual mines and mood variables and elements in DOM:
    BTN_SAFECLICK.innerHTML = `Safe Clicks: <span>${gSafeClicksCount}</span>`;
    BTN_MANUALMINES.disabled = false;
    BTN_SAFECLICK.disabled = false;
    BTN_MANUALMINES.childNodes[1].innerText = gLevel.MINES;
    EL_MOOD.innerText = SMILE_NORMAL;
    EL_BESTSCORE.innerText = (!localStorage.getItem(`bestScore-level-${gLevel.SIZE}`)) ? 'You haven\'t won this level yet.' : localStorage.getItem(`bestScore-level-${gLevel.SIZE}`);
}

function cellClicked(elCell, i, j) {
    if (gGame.firstClick) {
        if (!minesPlacement(elCell, i, j)) return; // check to see if user is under manual mines placement
    }

    if (gHints[0].isUnderHint) { // check to see if user is under hint click
        if (gBoard[i][j].isShown) return;
        var negs = getNegs({ i: i, j: j }, 1);
        negs.push({ i: i, j: j });
        for (var i = 0; i < negs.length; i++) {
            elCell = document.querySelector(`[data-idx='${negs[i].i},${negs[i].j}']`);
            renderCell(negs[i].i, negs[i].j, '', elCell, 'hinted', '');
        }
        setTimeout(() => {
            for (var i = 0; i < negs.length; i++) {
                elCell = document.querySelector(`[data-idx='${negs[i].i},${negs[i].j}']`);
                renderCell(negs[i].i, negs[i].j, 'remove', elCell, 'hinted', '');
            }
        }, 1000);
        gHints[0].isUnderHint = false;
        return;
    }

    if (gGame.isOn) { // Check to see if game is still running
        if (!gBoard[i][j].isShown) {
            if (!gBoard[i][j].isMarked) {
                if (gBoard[i][j].isMine) { // Check if bomb and if live remaining and perform accordingly
                    if (gLivesCount === 1) {
                        document.querySelector(`[data-life-id='1']`).classList.add('used');
                        renderCell(i, j, '', elCell, 'shown', 'shown-clicked-mine');
                        gUndoMoves.push({ i: i, j: j });
                        gUndoMoves.push('move');
                        gameLoss(gBoard);
                    } else {
                        document.querySelector(`[data-life-id='${gLivesCount}']`).classList.add('used');
                        gLivesCount--;
                        renderCell(i, j, '', elCell, 'shown', 'safe-click');
                        document.querySelector('table').style.pointerEvents = 'none';
                        gUndoMoves.push({ i: i, j: j });
                        gUndoMoves.push('move');
                        setTimeout(() => {
                            renderCell(i, j, 'remove', elCell, 'shown', 'safe-click');
                            document.querySelector('table').style.pointerEvents = 'auto';
                        }, 1000);
                    }
                } else {
                    expandShow(gBoard, elCell, i, j); // If it's not a bomb, open negs recursively
                    gUndoMoves.push('move');
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
                gUndoMoves.push({ i: i, j: j });
                board[i][j].isShown = true;
                gGame.shownCount++;
                if (board[i][j].minesAroundCount > 0) { // if the cell has negs mines, don't open them
                    renderCell(i, j, '', elCell, 'shown', '');
                } else {
                    renderCell(i, j, '', elCell, '', 'shown-expanded');
                    var negs = getNegs({ i: i, j: j });
                    for (var idx = 0; idx < negs.length; idx++) {
                        var neg = negs[idx];
                        if (!board[neg.i][neg.j].isMarked && !board[neg.i][neg.j].isShown) { // if the neg is not marked and not shown, recurse
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
            gUnmarkedMines--;
            gUndoMoves.push({ i: i, j: j });
            gUndoMoves.push('move');
            renderCell(i, j, 'flag', elCell, 'shown', '')
            checkGameOver(gBoard);
        } else if (gBoard[i][j].isMarked) { // in case of a marked cell, unmark it
            gBoard[i][j].isMarked = false;
            gGame.markedCount--;
            gUnmarkedMines++;
            renderCell(i, j, 'remove', elCell, 'shown', '')
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
                renderCell(i, j, '', elCell, 'shown', 'shown');
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
    if (gIsManualMine) return;
    if (gSafeClicksCount === 0) return
    if (gGame.firstClick) minesPlacement();
    var loc = getSafeLoc(gBoard);
    if (!loc) {
        BTN_SAFECLICK.innerHTML = 'None safe';
        BTN_SAFECLICK.disabled = true;
        return;
    }
    var elCell = document.querySelector(`[data-idx='${loc.i},${loc.j}']`);
    renderCell(loc.i, loc.j, '', elCell, '', 'safe-click');
    gSafeClicksCount--;
    BTN_SAFECLICK.childNodes[1].innerText = gSafeClicksCount;
    if (gSafeClicksCount === 0) BTN_SAFECLICK.disabled = true;
    setTimeout(() => {
        renderCell(loc.i, loc.j, 'remove', elCell, '', 'safe-click');
    }, 2000);
}

function useHint(elHint) {
    if (gIsManualMine) return;
    var hintIdx = elHint.dataset.hintId;
    if (gHints[0].isUnderHint || gHints[hintIdx].isUsed) return
    gHints[0].isUnderHint = true;
    gHints[hintIdx].isUsed = true
    elHint.classList.remove('unused');
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

function undoMoves() {
    if (!gGame.isOn) return
    gUndoMoves.pop();
    var moves = (gUndoMoves.lastIndexOf('move') !== -1) ? gUndoMoves.splice(gUndoMoves.lastIndexOf('move') + 1, (gUndoMoves.length) - gUndoMoves.lastIndexOf('move')) : gUndoMoves.splice(0, gUndoMoves.length);
    for (var i = moves.length - 1; i >= 0; i--) {

        var elCell = document.querySelector(`[data-idx="${moves[i].i},${moves[i].j}"]`);

        if (gBoard[moves[i].i][moves[i].j].isMarked) {
            cellMarked(elCell, moves[i].i, moves[i].j)
            return;
        }

        if (gBoard[moves[i].i][moves[i].j].isShown) {
            gGame.shownCount--;
            gBoard[moves[i].i][moves[i].j].isShown = false
        }

        if (gBoard[moves[i].i][moves[i].j].isMine) {
            document.querySelector(`[data-life-id='${gLivesCount+1}']`).classList.remove('used');
            gLivesCount++;
        }

        if (gBoard[moves[i].i][moves[i].j].minesAroundCount > 0) renderCell(moves[i].i, moves[i].j, 'remove', elCell, 'shown', 'shown');
        else renderCell(moves[i].i, moves[i].j, 'remove', elCell, '', 'shown-expanded');
    }
}