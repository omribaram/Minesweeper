'use-strict'

var gStopwatchInterval;

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
        STOPWATCH_EL.innerText = gGame.secsPassed;
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