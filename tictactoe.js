var canvas = document.getElementById("board");
var ctxt = canvas.getContext("2d");
var gridPadding = 50;
var squareSize = 100;
var boardSize = 3;
var drawWidth = gridPadding*2 + boardSize*squareSize;
var drawHeight = gridPadding*2 + boardSize*squareSize;
canvas.width = drawWidth;
canvas.height = drawHeight;


var clickFunction = function() { };
var moveFunction = function() { };
var keyFunction = function() { };
canvas.addEventListener('click', function(ev){ clickFunction(ev); });
canvas.addEventListener('mousemove', function(ev){ moveFunction(ev); });
document.body.addEventListener('keydown', function(ev) { keyFunction(ev); });

var letterO = new Image();
var letterX = new Image();
letterO.src = "letterO.png";
letterX.src = "letterX.png";
letterO.onload = activateAfterLoad;
letterX.onload = activateAfterLoad;

function activateAfterLoad() {
    if(letterO.complete && letterX.complete) {
        updateBoardState([]);
    }
}

function clearBoard() {
    ctxt.fillStyle = "rgb(255,255,255)";
    ctxt.fillRect(0,0,drawWidth,drawHeight);
}

// moves is just the list of moves made so far, in order starting with
// Player 1's first move. updateBoardState sets the page to show the
// current board state, and also sets up events for user interaction.
function updateBoardState(moves) {
    // Player number for the current turn
    var turn = (moves.length % 2) ? 2 : 1;
    var winner = checkWinner(moves);

    clearBoard();
    drawUi(turn, winner);
    drawBoardBack();
    drawMoves(moves);
    setEventListeners(moves, turn, winner);
}

// Check if either player has three-in-a-row. Return will be 0 (no
// winner) 1 (player 1 wins) 2 (player 2 wins) or 3 (draw)
function checkWinner(moves) {
    function checkRow(row, moves) {
        for(var ii = 0; ii < row.length; ii++) {
            if(moves.indexOf(row[ii]) == -1) return false;
        }
        return true;
    }
    function xrow(ii) {
        var row = [];
        for(var jj = 0; jj < boardSize; jj++) {
            row.push(ii + boardSize*jj);
        }
        return row;
    }
    function yrow(ii) {
        var row = [];
        for(var jj = 0; jj < boardSize; jj++) {
            row.push(jj + boardSize*ii);
        }
        return row;
    }
    function diagRight() {
        var row = [];
        for(var ii = 0; ii < boardSize; ii++) {
            row.push(ii + boardSize*ii);
        }
        return row;
    }
    function diagLeft() {
        var row = [];
        for(var ii = 0; ii < boardSize; ii++) {
            row.push((boardSize - 1) - ii + boardSize*ii);
        }
        return row;
    }

    function checkPlayer(moves) {
        for(var ii = 0; ii < boardSize; ii++) {
            if(checkRow(xrow(ii), moves)) return true;
            if(checkRow(yrow(ii), moves)) return true;
        }
        return checkRow(diagRight(), moves) || checkRow(diagLeft(), moves);
    }
    if(checkPlayer(moves.filter(function(x,ii) { return ii % 2 == 0; }))) {
        return 1;
    }
    if(checkPlayer(moves.filter(function(x,ii) { return ii % 2 == 1; }))) {
        return 2;
    }
    if(moves.length === boardSize*boardSize) {
        return 3;
    }
    return 0;
}

// Draw the message saying whose turn it is, and who has won if
// there is a winner.
function drawUi(turn, winner) {
    function drawAt(text, x, y, opacity) {
        ctxt.fillStyle = 'rgba(30,30,30,' + opacity + ')';
        ctxt.font = 'italic 20px serif';
        ctxt.textBaseline = 'bottom';
        ctxt.fillText(text, x, y);
    }
    if(winner !== 0) {
        var text;
        if(winner === 1) text = "Winner: Player A";
        if(winner === 2) text = "Winner: Player B";
        if(winner === 3) text = "Draw";
        drawAt(text, gridPadding + squareSize, 30, 1);
    } else {
        drawAt('Player A (X)', 30, 30, turn === 1 ? 1 : 0.5);
        drawAt('Player B (O)', drawWidth - 150, 30, turn === 2 ? 1 : 0.5);
    }

    ctxt.fillStyle = 'rgb(30,30,30)';
    ctxt.font = 'italic 16px serif';
    ctxt.textBaseline = 'bottom';
    ctxt.fillText('Press "u" to undo a move', gridPadding + squareSize, drawHeight - 20);
}

function drawBoardBack() {
    function drawLine(x1, y1, x2, y2) {
        ctxt.strokeStyle = "rgb(30,30,30)";
        ctxt.lineWidth = 3;
        ctxt.beginPath();
        ctxt.moveTo(x1, y1);
        ctxt.lineTo(x2, y2);
        ctxt.stroke();
    }
    for(var ii = 1; ii < boardSize; ii++) {
        // Horizontal line ii squares from top
        drawLine(gridPadding, gridPadding + ii*squareSize, drawWidth - gridPadding, gridPadding + ii*squareSize);
        // Vertical line ii squares from left
        drawLine(gridPadding + ii*squareSize, gridPadding, gridPadding + ii*squareSize, drawHeight - gridPadding);
    }
}

function drawMoves(moves) {
    moves.map(function(move, ii) {
        if(ii % 2) drawO(move, 1);
        else drawX(move, 1);
    });
}

function setEventListeners(moves, turn, winner) {
    keyFunction = function(ev) {
        console.log(ev.keyCode);
        if(ev.keyCode === 85) {
            // 'u' - undo
            moves.pop();
            updateBoardState(moves);
        }
    }

    // If there is already a winner, only undo is allowed
    if(winner !== 0) {
        clickFunction = function(){};
        moveFunction = function(){};
        return;
    }


    clickFunction = function(ev) {
        var grid = coordsToGrid(ev.offsetX, ev.offsetY);
        if(grid !== undefined && moves.indexOf(grid) === -1) {
            moves.push(grid);
            updateBoardState(moves);
        }
    }

    // Here we're keeping track of where we last had a hover event, so
    // that we can clear the previous "X" or "O" indicator. This is so
    // that we don't have to redraw the whole board and UI. A more
    // general solution is to make a seperate canvas and use
    // compositing, so that we can restore a pristine state, but this
    // is simple enough for the present case.
    var prevGrid = undefined;
    moveFunction = function(ev) {
        var grid = coordsToGrid(ev.offsetX, ev.offsetY);
        if(grid !== prevGrid && prevGrid !== undefined) {
            clearGrid(prevGrid);
            prevGrid = undefined;
        }
        if(grid !== undefined && moves.indexOf(grid) === -1 && grid !== prevGrid) {
            if(turn === 1) {
                drawX(grid, 0.5);
            } else {
                drawO(grid, 0.5);
            }
            prevGrid = grid;
        }
    }
}

function gridToCoords(n) {
    var nx = n % boardSize, ny = Math.floor(n / boardSize);
    return {
        x: gridPadding + nx * squareSize,
        y: gridPadding + ny * squareSize
    }
}

function coordsToGrid(x, y) {
    var nx = Math.floor((x - gridPadding) / squareSize)
      , ny = Math.floor((y - gridPadding) / squareSize);
    if(nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) {
        return undefined;
    }
    return ny*boardSize + nx;
}

function drawX(grid, opacity) {
    ctxt.globalAlpha = opacity;
    var coords = gridToCoords(grid);
    ctxt.drawImage(letterX, coords.x+15, coords.y+15);
    ctxt.globalAlpha = 1;
}

function drawO(grid, opacity) {
    ctxt.globalAlpha = opacity;
    var coords = gridToCoords(grid);
    ctxt.drawImage(letterO, coords.x+15, coords.y+15);
    ctxt.globalAlpha = 1;
}

function clearGrid(grid) {
    // Clear an 'X' or 'O' from the grid
    var coords = gridToCoords(grid);
    ctxt.fillStyle = "rgb(255,255,255)";
    ctxt.fillRect(coords.x + 10, coords.y + 10, squareSize - 20, squareSize - 20);
}
