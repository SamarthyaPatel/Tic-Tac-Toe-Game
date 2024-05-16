const SYMBOL = {
    'X': `<svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="animated-entry">
    <line x1="10" y1="10" x2="90" y2="90" stroke="#003366" stroke-width="10" stroke-linecap="butt"/>
    <line x1="90" y1="10" x2="10" y2="90" stroke="#003366" stroke-width="10" stroke-linecap="butt"/>
    </svg>`,
    'O': `<svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="animated-entry">
    <circle cx="50" cy="50" r="40" stroke="#FF6600" stroke-width="10" fill="none"/>
    </svg>`
}

const peer = new Peer();
let conn;
let myId;
let opponentId;
let currentPlayer = 'X';
let mySymbol;
var board = Array(9).fill(null);
var waitingProcess = false;

let rematchData = null;

peer.on('open', id => {
    myId = id;
    document.getElementById('my-peer-id').textContent = id;
});

peer.on('connection', connection => {
    conn = connection;
    opponentId = connection.peer;
    conn.on('data', handleData);
    displayConnectionMessage();
    mySymbol = 'X'; // Assume the first player is 'X'
    currentPlayer = 'X';
    updateTurnMessage();
});




async function copyPeerID() {    
    navigator.clipboard.writeText(document.getElementById("my-peer-id").textContent);

    document.getElementById("info").classList.add("fade-in");
    await sleep(3000);
    document.getElementById("info").classList.remove("fade-in");
    document.getElementById("info").classList.add("fade-out");
    await sleep(500);
    document.getElementById("info").classList.remove("fade-out");    
}

function isEmpty(element) {    return element && element.innerHTML.trim() === ""    }

function isFull() {    return board.every(cell => cell !== null)    }

function sleep(ms) {    return new Promise(resolve => setTimeout(resolve, ms))    }

function drawWinningLine(combination) {
    const board = document.getElementById('board');
    const rect = board.getBoundingClientRect();
    const cell = document.getElementById("cell-1").getBoundingClientRect();
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('winning-line');
    line.id = "svg-line";

    const [start, middle, end] = combination;
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    if (start == 0 && end == 2 || start == 3 && end == 5 || start == 6 && end == 8) {
        startX = (start % 3) * cell.height + 10;
        startY = Math.floor(start / 3) * cell.height + (cell.height/2);
        endX = (end % 3) * cell.height + (cell.height);
        endY = Math.floor(end / 3) * cell.height + (cell.height/2);

    } else if (start == 0 && end == 6 || start == 1 && end == 7 || start == 2 && end == 8) {
        startX = (start % 3) * cell.height + (cell.height/2);
        startY = Math.floor(start / 3) * cell.height + 10;
        endX = (end % 3) * cell.height + (cell.height/2);
        endY = Math.floor(end / 3) * cell.height + (cell.height);

    } else if (start == 0) {
        startX = (start % 3) * cell.height + 10;
        startY = Math.floor(start / 3) * cell.height + 10;
        endX = (end % 3) * cell.height + (cell.height);
        endY = Math.floor(end / 3) * cell.height + (cell.height);
    } else {
        startX = (start % 3) * cell.height + (cell.height);
        startY = Math.floor(start / 3) * cell.height + 10;
        endX = (end % 3) * cell.height + 10;
        endY = Math.floor(end / 3) * cell.height + (cell.height);
    }
    
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);

    const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgOverlay.style.position = 'absolute';
    svgOverlay.style.top = rect.top;
    svgOverlay.style.left = rect.left;
    svgOverlay.style.width = '100%';
    svgOverlay.style.height = '100%';
    svgOverlay.style.pointerEvents = 'none'; // So the SVG does not interfere with clicks
    svgOverlay.appendChild(line);
    board.appendChild(svgOverlay);
}

async function checkForWin(board) {
    const winningCombinations = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal from top-left
        [2, 4, 6]  // Diagonal from top-right
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            await sleep(400);
            isGameOver = true;
            drawWinningLine(combination);
            await sleep(900);
            displayWinnerBanner(board[a]);
            return combination;
        } else {
            if(isFull()) {
                //Draw match
                console.log("Board => ", board)
                document.getElementById("confusedJetha").style.display = "inline-block";
                document.getElementById("winner-banner").style.display = "block";
                document.getElementById("note").innerHTML = "Oh no, that's a draw.";
                document.getElementById("modal").style.backgroundColor = "#7B68EE";
            }
        }
    }
    return null;
}



function resetGame() {
    for (let i = 0; i < 9; i ++) {
        document.getElementById(`cell-${i}`).innerHTML = "";
    }
    
    const svg = document.getElementById("svg-line");
    if (svg) {
        svg.parentNode.removeChild(svg);
    }

    board = Array(9).fill(null);

    document.getElementById("winner-banner").style.display = "none";
    document.getElementById("confusedJetha").style.display = "none";
    document.getElementById("happyJetha").style.display = "none";
    document.getElementById("sadJetha").style.display = "none";

    sendNotificationToPlay();
}

function celebrateWinner() {
    // Configure confetti settings
    const confettiConfig = {
        particleCount: 100,
        spread: 160,
        origin: { y: 0.6 }
    };
    // Create confetti
    window.confetti(confettiConfig);
}

async function displayConnectionMessage() {
    document.getElementById("check").classList.add("fade-in");
    await sleep(3000);
    document.getElementById("check").classList.remove("fade-in");
    document.getElementById("check").classList.add("fade-out");
    await sleep(500);
    document.getElementById("check").classList.remove("fade-out");
}

async function displaySamePlayerError() {
    document.getElementById("danger-note").textContent = "Connection failed! Enter opponent's ID.";
    document.getElementById("danger").classList.add("fade-in");
    await sleep(3000);
    document.getElementById("danger").classList.remove("fade-in");
    document.getElementById("danger").classList.add("fade-out");
    await sleep(500);
    document.getElementById("danger").classList.remove("fade-out");
}

async function displayCellOccupiedWarning() {
    document.getElementById("warning").classList.add("fade-in");
    await sleep(4000);
    document.getElementById("warning").classList.remove("fade-in");
    document.getElementById("warning").classList.add("fade-out");
    await sleep(1000);
    document.getElementById("warning").classList.remove("fade-out");
}

function displayWinnerBanner(winner) {
    if (mySymbol === winner) {
        celebrateWinner();
        document.getElementById("status").style.textAlign = "center";
        document.getElementById("status").textContent = "Game Over!";
        document.getElementById("modal").style.backgroundColor = "#2E8B57";
        document.getElementById("winner-banner").style.display = "block";
        document.getElementById("note").innerHTML = "A hallo, You Won!";
        document.getElementById("happyJetha").style.display = "inline-block";
    } else {
        document.getElementById("status").style.textAlign = "center";
        document.getElementById("status").textContent = "Game Over!";
        document.getElementById("winner-banner").style.display = "block";
        document.getElementById("note").innerHTML = "Arara, You lost!";
        document.getElementById("modal").style.backgroundColor = "#DC143C"; 
        document.getElementById("sadJetha").style.display = "inline-block";
    }
}







function sendNotificationToPlay() {
    
    if(rematchData) {
        conn.send({ type: 'accepted', requester: rematchData.requester, receiver: rematchData.receiver });
        // console.log("Accepted by ", rematchData.receiver);
        waitingProcess = false;
        updateTurnMessage();
    } else {
        conn.send({ type: 'rematch', requester: myId, receiver: opponentId });
        // console.log("Request from ", myId);
        waitingProcess = true;
        displayWaitingStatus();
    }
}

async function displayWaitingStatus() {
    document.getElementById("status").style.textAlign = "left";
        
    while(waitingProcess) {
        document.getElementById("status").textContent = "Waiting.";
        await sleep(900);
        document.getElementById("status").textContent = "Waiting..";
        await sleep(900);
        document.getElementById("status").textContent = "Waiting...";
        await sleep(900);
        document.getElementById("status").textContent = "Waiting....";
        await sleep(900);
    }

    updateTurnMessage();
}

function connect() {
    const peerId = document.getElementById('peer-id').value;
    if(myId !== peerId) {
        conn = peer.connect(peerId);
    } else {
        displaySamePlayerError();
    }
    conn.on('open', () => {
        opponentId = peerId;
        displayConnectionMessage();
        mySymbol = 'O'; // Assume the second player is 'O'
        currentPlayer = 'X';
        updateTurnMessage();
    });
    conn.on('data', handleData);
}

function handleData(data) {

    if (data.type === 'move') {
        updateBoard(data.index, data.player);
        currentPlayer = data.player === 'X' ? 'O' : 'X';
        updateTurnMessage();
    }

    if (data.type === 'rematch') {
        rematchData = data;
        console.log("Rematch from ", data.requester);
    }

    if (data.type === 'accepted') {
        waitingProcess = false;
        updateTurnMessage();
    }
    
}

function makeMove(index, player = mySymbol, emit = true) {
    if (board[index] === null) {
        if (player === currentPlayer && mySymbol === currentPlayer) {
            updateBoard(index, player);
            if (emit && conn) {
                conn.send({ type: 'move', index, player });
            }
            currentPlayer = player === 'X' ? 'O' : 'X';
            updateTurnMessage();
        }
    } else {
        displayCellOccupiedWarning();
    }
}

function updateBoard(index, player) {
    board[index] = player;
    document.getElementById(`cell-${index}`).innerHTML = SYMBOL[player];
    checkForWin(board);
}

function updateTurnMessage() {
    if(!isFull()) {
        if (currentPlayer === mySymbol) {
            document.getElementById("status").style.textAlign = "right";
            document.getElementById("status").textContent = "Your turn!";
        } else {
            document.getElementById("status").style.textAlign = "left";
            document.getElementById("status").textContent = "Opponent's turn!";
        }
    } else {
        document.getElementById("status").style.textAlign = "center";
        document.getElementById("status").textContent = "Game Over!";
    }
}

