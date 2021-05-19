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
const STOPWATCH_EL = document.querySelector('.stopwatch');
const MINES_EL = document.querySelector('.unmarked-bombs');
const LIVES_EL = document.querySelector('.lives-count');
const MOOD_EL = document.querySelector('.mood');

var gBoard;
var gLevel;
var gGame;
var gUnmarkedMines;
var gLivesCount;
var gHints;

function initGame(size = gLevel.SIZE, mines = gLevel.MINES) {
    gLevel = { SIZE: size, MINES: mines }; // set/reset game level
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0, firstClick: true }; // set/reset game parameters
    buildBoard(); // construct the matrix
    gHints = resetHints(); // set/reset game hints
    gUnmarkedMines = gLevel.MINES; // set/reset unmarked mines on board
    gLivesCount = 3; // set/reset lives
    placeMines(); // place mines randomly                                   //TODO
    setMinesNegsCount(gBoard); // update matrix with mines negs count       //place the mines after click
    renderBoard(gBoard); // render the board as HTML
    clearStopwatch(); // initialize the stopwatch
    MOOD_EL.innerText = SMILE_NORMAL; // initialize the HTML mood element
    LIVES_EL.innerText = gLivesCount; // initialize the HTML lives count element
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
            var currCell = board[i][j];
            strHTML += `\t<td data-idx="${i},${j}" oncontextmenu="cellMarked(this,${i},${j})" onclick="cellClicked(this,${i},${j})">\n`;
            switch (currCell.isMine) {
                case true:
                    strHTML += `<span class="content">${MINE}</span>\n
                                <span class="flagged">${FLAG}</span>\n`;
                    break;
                case false:
                    strHTML += `<span class="content">${currCell.minesAroundCount}</span>\n
                                <span class="flagged">${FLAG}</span>\n`
                    break;
            }
            strHTML += '\t</td>\n';
        }
        strHTML += '</tr>\n';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;
    MINES_EL.innerText = gUnmarkedMines;
    STOPWATCH_EL.innerText = 0;
}

function cellClicked(elCell, i, j) {

    if (gGame.firstClick) { // If this is the first click of the game, initiate the stopwatch
        startStopwatch();
        gGame.firstClick = false;
    }

    if (gHints[0].isUnderHint) {
        elCell.querySelector('.content').classList.add('hint');
        setTimeout(() => {
            elCell.querySelector('.content').classList.remove('hint');
            gHints[0].isUnderHint = false;
        }, 1000)
        return;
    }

    if (gGame.isOn) { // Check to see if game is still running
        if (!gBoard[i][j].isShown) {
            if (!gBoard[i][j].isMarked) {
                if (gBoard[i][j].isMine) { // Check if bomb and if live remaining and perform accordingly
                    if (gLivesCount === 1) {
                        LIVES_EL.innerText = 0;
                        elCell.classList.add('clicked-mine');
                        gameLoss(gBoard);
                    } else {
                        gLivesCount--;
                        LIVES_EL.innerText = gLivesCount;
                        elCell.classList.add('shown', 'clicked-mine');
                        elCell.querySelector('.content').classList.add('shown');
                        gBoard[i][j].isMarked = true;
                        checkGameOver(gBoard);
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
                    elCell.classList.add('shown');
                    elCell.querySelector('.content').classList.add('shown');
                } else {
                    elCell.classList.add('shown-expanded');
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
    if (gGame.firstClick) { // If this is the first click of the game, initiate the stopwatch
        startStopwatch();
        gGame.firstClick = false;
    }
    if (gGame.isOn) { // Check to see if game is still running
        if (gBoard[i][j].isShown) return; // If a shown cell was clicked, exit
        if (!gBoard[i][j].isMarked && gUnmarkedMines > 0) { // if there are still unmarked bombs left, continue
            gBoard[i][j].isMarked = true;
            elCell.querySelector('.flagged').classList.add('shown');
            gUnmarkedMines--;
            checkGameOver(gBoard);
        } else if (gBoard[i][j].isMarked) { // in case of a marked cell, unmark it
            gBoard[i][j].isMarked = false;
            elCell.querySelector('.flagged').classList.remove('shown');
            gUnmarkedMines++;
        }
    }
    MINES_EL.innerText = gUnmarkedMines;
}

function gameLoss(board) {
    clearInterval(gStopwatchInterval); // stop the stopwatch
    gGame.isOn = false; // stop the game
    for (var i = 0; i < board.length; i++) { // show all remaining bombs
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine && !board[i][j].isMarked) {
                var elCell = document.querySelector(`[data-idx="${i},${j}"]`);
                elCell.classList.add('shown');
                elCell.querySelector('.content').classList.add('shown');
            }
        }
    }
    MOOD_EL.innerText = SMILE_LOST;
}

function gameWon(board) {
    clearInterval(gStopwatchInterval); // stop the stopwatch
    gGame.isOn = false; // stop the game
    MOOD_EL.innerText = SMILE_WON;
}

// check if any unmarked bombs or any unshown cells left, in case no, game was won
function checkGameOver(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine && !board[i][j].isMarked) return;
            if (!board[i][j].isMine && !board[i][j].isShown) return;
        }
    }
    gameWon();
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

// Place mines on board randomly as per the amount of defined gLevel
// If there's a mine at location already, repeats...
function placeMines() {
    var location;
    var count = 0;
    while (count < gLevel.MINES) {
        location = { i: getRandomInt(0, gBoard.length - 1), j: getRandomInt(0, gBoard[0].length - 1) };
        if (gBoard[location.i][location.j].isMine) continue;
        gBoard[location.i][location.j].isMine = true;
        count++;
    }
}

function useHint(elHint) {
    var hintId = elHint.dataset.id;
    if (gHints[0].isUnderHint || gHints[hintId].isUsed) return
    gHints[0].isUnderHint = true;
    gHints[hintId].isUsed = true
    elHint.classList.remove('unshown');
}

function resetHints() {
    var hints = [{ isUnderHint: false }];
    for (var i = 0; i <= 2; i++) {
        var elHint = document.querySelector(`[data-id='${i+1}']`);
        hints.push({ id: i + 1, isUsed: false });
        elHint.classList.add('unshown')
    }
    return hints;
}