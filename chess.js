const canvas = document.getElementById('canvas')
const c = canvas.getContext('2d')

/* INITIAL SETTINGS */
// board dimensions
const WIDTH = 600
const HEIGHT = 600

// board square dimensions
const SQ_WIDTH = WIDTH / 8
const SQ_HEIGHT = HEIGHT / 8

// empty board array
const EMPTY_BOARD = Array.from(Array(8), () => Array(8).fill(false))

// set html canvas size to board dimensions
canvas.width = WIDTH
canvas.height = HEIGHT

// set initial player: 'w' for white, 'b' for black
let CURRENT_PLAYER = 'w'

// keeping track of currently selected piece
let CURRENT_PIECE = false

// available moves for chess pieces
const MOVES = {
    bp: [{x: 0, y: 1, type: 'm'},{x: -1, y: 1, type: 'a'},{x: 1, y: 1, type: 'a'}],
    wp: [{x: 0, y: -1, type: 'm'},{x: -1, y: -1, type: 'a'},{x: 1, y: -1, type: 'a'}],
    r: [{x: 0, y: -1, type: 'n'},{x: 0, y: 1, type: 'n'}, {x: 1, y: 0, type: 'n'}, {x: -1, y: 0, type: 'n'}],
    b: [{x: -1, y: -1, type: 'n'},{x: -1, y: 1, type: 'n'}, {x: 1, y: 1, type: 'n'}, {x: 1, y: -1, type: 'n'}],
    n: [{x: -1, y: -2, type: 'c'},{x: -1, y: 2, type: 'c'}, {x: -2, y: -1, type: 'c'}, {x: -2, y: 1, type: 'c'},
        {x: 1, y: -2, type: 'c'},{x: 1, y: 2, type: 'c'}, {x: 2, y: -1, type: 'c'}, {x: 2, y: 1, type: 'c'}],
    q: [{x: 0, y: -1, type: 'n'},{x: 0, y: 1, type: 'n'}, {x: 1, y: 0, type: 'n'}, {x: -1, y: 0, type: 'n'},
        {x: -1, y: -1, type: 'n'},{x: -1, y: 1, type: 'n'}, {x: 1, y: 1, type: 'n'}, {x: 1, y: -1, type: 'n'}],
    k: [{x: 0, y: -1, type: 'c'},{x: 0, y: 1, type: 'c'}, {x: 1, y: 0, type: 'c'}, {x: -1, y: 0, type: 'c'},
        {x: -1, y: -1, type: 'c'},{x: -1, y: 1, type: 'c'}, {x: 1, y: 1, type: 'c'}, {x: 1, y: -1, type: 'c'},
        {x: -2, y: 0, type: 't'}, {x: 2, y: 0, type: 't'}],
}

// chess board move history
//let MOVE_HISTORY = []

/* LOADING SPRITES */
// chess piece images directory
const IMG_DIR = './assets/default/'
const IMG_FILES = {
    bp: 'bp.png',
    br: 'br.png',
    bn: 'bn.png',
    bb: 'bb.png',
    bq: 'bq.png',
    bk: 'bk.png',
    wp: 'wp.png',
    wr: 'wr.png',
    wn: 'wn.png',
    wb: 'wb.png',
    wq: 'wq.png',
    wk: 'wk.png',
}
const IMAGES = {}

// load assets before drawing the chess board on screen
function loadImages() {
    count = 0
    total = Object.keys(IMG_FILES).length
    console.log(`Loading assets... ${Math.round(count)}%`)
    for (const key in IMG_FILES) {
        const img = new Image()
        img.src = IMG_DIR + IMG_FILES[key]
        img.onload = (e) => {
            IMAGES[key] = img
            count += 1
            console.log(`Loading assets... ${Math.round(100 * count / total)}%`)
            if (count == total) {
                board.drawBoard()
            }
        }
    }
}

/* UTIL FUNCTIONS */
// util function to determine next color (i.e: whose turn it is)
function nextColor(color) {
    if (color == 'w') {
        return 'b'
    }
    else {
        return 'w'
    }
}

// util to determine if move is within bounds of chess board
function isWithinBounds(x, y) {
    if ((x > -1) && (x < 8)) {
        if ((y > -1) && (y < 8)) {
            const CURRENT_PIECE = board.getPieceAt(x,y)
            if ((CURRENT_PIECE) && (CURRENT_PIECE.color == CURRENT_PLAYER)) {
                return false
            }
            return true
        }
    }
    return false
}

// util to determine if current king can castle
function isCastlingAvailable(x, y, direction) {
    const kingPos = {x: x, y: y}
    const dir = direction / 2

    if (!board.getPieceAt(kingPos.x + dir, kingPos.y)) {
        if (dir > 0) {
            const rook = board.getPieceAt(kingPos.x + (3 * dir), kingPos.y)
            if ((rook != false)
                && (rook.type == 'r')
                && (rook.getPreviousPos() == null)) {
                    return true
            }
        }
        else {
            if (!board.getPieceAt(kingPos.x + (3 * dir), kingPos.y)) {
                const rook = board.getPieceAt(kingPos.x + (4 * dir), kingPos.y)
                if ((rook != false)
                    && (rook.type == 'r')
                    && (rook.getPreviousPos() == null)) {
                        return true
                }
            }
        }
    }
    return false
}

// get moving position of king and teleports rook next to it
function castlingMove(x, y, direction) {
    const kingPos = {x: x, y: y}
    const dir = direction / 2

    if (dir > 0) {
        const rook = board.getPieceAt(7, kingPos.y)
        board.setPieceAt(7, kingPos.y, false)
        rook.setCurrentPos(kingPos.x - dir, kingPos.y)
        board.setPieceAt(kingPos.x - dir, kingPos.y, rook)
    } else{
        const rook = board.getPieceAt(0, kingPos.y)
        board.setPieceAt(0, kingPos.y, false)
        rook.setCurrentPos(kingPos.x - dir, kingPos.y)
        board.setPieceAt(kingPos.x - dir, kingPos.y, rook)
    }
}

// util to set default starting chess board
function initialBoard() {
    // creating array of white pawns
    const wp_row = Array(8)
    for (let i=0; i<wp_row.length; i++) {
        wp_row[i] = new ChessPiece('w', 'p', i, 6)
    }

    // creating array of black pawns
    const bp_row = Array(8)
    for (let i=0; i<wp_row.length; i++) {
        bp_row[i] = new ChessPiece('b', 'p', i, 1)
    }

    // instantiate a new board with initial set array
    const initial_set = bp_row.concat(wp_row).concat([new ChessPiece('b', 'r', 0, 0), new ChessPiece('b', 'r', 7, 0),
                                                    new ChessPiece('w', 'r', 0, 7), new ChessPiece('w', 'r', 7, 7),
                                                    new ChessPiece('b', 'n', 1, 0), new ChessPiece('b', 'n', 6, 0),
                                                    new ChessPiece('w', 'n', 1, 7), new ChessPiece('w', 'n', 6, 7),
                                                    new ChessPiece('b', 'b', 2, 0), new ChessPiece('b', 'b', 5, 0),
                                                    new ChessPiece('w', 'b', 2, 7), new ChessPiece('w', 'b', 5, 7),
                                                    new ChessPiece('b', 'q', 3, 0), new ChessPiece('b', 'k', 4, 0),
                                                    new ChessPiece('w', 'q', 3, 7), new ChessPiece('w', 'k', 4, 7),])


    return initial_set
}

/* CLASSES */
// class for chess piece
class ChessPiece {
    constructor(color, type, x, y) {
        this.color = color
        this.type = type
        this.x = x
        this.y = y
        this.previous_pos = null
        this.available_moves = []
    }

    getPreviousPos() {
        return this.previous_pos
    }

    setPreviousPos(x, y) {
        this.previous_pos = {x: x, y: y}
    }

    setCurrentPos(x, y) {
        this.x = x
        this.y = y
    }

    updatePos(newX, newY) {
        this.setPreviousPos(this.x, this.y)
        this.setCurrentPos(newX, newY)
        CURRENT_PLAYER = nextColor(CURRENT_PLAYER)
        // MOVE_HISTORY.push(`${this.color}${this.type} to x: ${this.x}, y: ${this.y}`)
    }

    getAvailableMoves() {
        const moveSet = MOVES[this.type == 'p' ? `${this.color}${this.type}` : this.type]
        this.available_moves = []
        for (let i=0; i < moveSet.length; i++) {
            let newMove = {x: this.x + moveSet[i].x, y: this.y + moveSet[i].y, type: moveSet[i].type}

            if (isWithinBounds(newMove.x, newMove.y)) {

                switch(moveSet[i].type) {
                    case 'c':
                        this.available_moves.push(newMove)
                        break
                    case 'm':
                        if (!board.getPieceAt(newMove.x, newMove.y)) {
                            this.available_moves.push(newMove)
                            if (this.previous_pos == null) {
                                newMove = {x: newMove.x, y: newMove.y + moveSet[i].y}
                                if (!board.getPieceAt(newMove.x, newMove.y)){
                                    this.available_moves.push(newMove)
                                }
                            }
                        }
                        break
                    case 'a':
                        if ((board.getPieceAt(newMove.x, newMove.y)) &&
                            (board.getPieceAt(newMove.x, newMove.y).color == nextColor(CURRENT_PLAYER))) {
    
                            this.available_moves.push(newMove)
                        }
                        break
                    case 'n':
                        this.available_moves.push(newMove)
    
                        while(!board.getPieceAt(newMove.x, newMove.y)) {
                            newMove = {x: newMove.x + moveSet[i].x, y: newMove.y + moveSet[i].y}
                            if (isWithinBounds(newMove.x, newMove.y)) {
                                this.available_moves.push(newMove)
                            } else {
                                break
                            }
                        }
                        break
                    case 't':
                        if ((this.getPreviousPos() == null)
                            && (isCastlingAvailable(this.x, this.y, moveSet[i].x))) {
                            this.available_moves.push(newMove)
                        }
                        break
                    default:
                        console.log('INVALID MOVE.type')
                }
            }
        }
    }

    isAvailableMove(x, y) {
        if ((x == this.x) && (y == this.y)) {
            return false
        }
        for (let i=0; i<this.available_moves.length; i++) {
            if ((x == this.available_moves[i].x) && 
                (y == this.available_moves[i].y)) {
                    // check if is castling move (move.type = 't') and move rook along king's move
                    if (this.available_moves[i].type == 't') {
                        castlingMove(x, y, x - this.x)
                    }
                    return true
            }
        }
        console.log('INVALID MOVE')
        return false
    }

    draw() {
        c.drawImage(IMAGES[`${this.color}${this.type}`], (this.x * SQ_WIDTH) + (SQ_WIDTH / 10), (this.y * SQ_HEIGHT) + (SQ_HEIGHT / 10),
        SQ_WIDTH * 0.8, SQ_HEIGHT * 0.8)
    }
}

// class for the chess board
class ChessBoard {
    constructor(pieces) {
        this.sq_color = '#baaca2'
        this.sq_highlight = 'rgb(93, 179, 59)'
        this.sq_highlight_moves = 'rgba(245, 252, 28, 0.3)'
        this.sq_highlight_last_move = 'rgba(5, 113, 176, 0.8)'
        this.board = EMPTY_BOARD
        this.last_move = null
        this._init(pieces)
    }

    _init(pieces) {
        for (let i=0; i < pieces.length; i++) {
            this.setPieceAt(pieces[i].x, pieces[i].y, pieces[i])
        }
    }

    _nextSqColor(color) {
        if (color == '#baaca2') {
            return '#542807'
        }
        else {
            return '#baaca2'
        }
    }

    _drawSquare(x, y) {
        c.fillStyle = this.sq_color
        c.fillRect(x * SQ_WIDTH, y * SQ_HEIGHT, SQ_WIDTH, SQ_HEIGHT)
    }

    getPieceAt(x, y) {
        return this.board[y][x]
    }

    setPieceAt(x, y, piece) {
        this.board[y][x] = piece
    }

    setLastMove(move) {
        this.last_move = move
    }

    highlightSquare(x, y, color=this.sq_highlight) {
        c.fillStyle = color
        c.fillRect(x * SQ_WIDTH, y * SQ_HEIGHT, SQ_WIDTH, SQ_HEIGHT)
        if (this.getPieceAt(x, y)) {
            this.board[y][x].draw()
        }
    }

    highlightMoves(moves) {
        for (let i=0; i<moves.length; i++) {
            this.highlightSquare(moves[i].x, moves[i].y, this.sq_highlight_moves)
        }
    }

    highlightLastMove() {
        if (this.last_move == null) {
            return false
        }

        this.highlightSquare(this.last_move[0].x, this.last_move[0].y, this.sq_highlight_last_move)
        this.highlightSquare(this.last_move[1].x, this.last_move[1].y, this.sq_highlight_last_move)
    }

    drawBoard() {
        for (let i = 0; i < 8; i++) {
            this.sq_color = this._nextSqColor(this.sq_color)
            for (let j = 0; j < 8; j++) {
                this.sq_color = this._nextSqColor(this.sq_color)
                this._drawSquare(j, i)
                if (this.board[i][j] !== false) {
                    this.board[i][j].draw()
                }
            }
        }
    }
}

/* SELECT & MOVE PIECE LOGIC */
// below is the logic for clicking and dropping pieces across the board

canvas.addEventListener('click', (e) => {
    let boardPosX = Math.floor(e.offsetX/SQ_WIDTH)
    let boardPosY = Math.floor(e.offsetY/SQ_HEIGHT)

    if (!CURRENT_PIECE) {
        if ((board.getPieceAt(boardPosX, boardPosY))
            && (board.getPieceAt(boardPosX, boardPosY).color == CURRENT_PLAYER)) {

            CURRENT_PIECE = board.getPieceAt(boardPosX, boardPosY)
            CURRENT_PIECE.getAvailableMoves()
            board.highlightSquare(CURRENT_PIECE.x, CURRENT_PIECE.y)
            board.highlightMoves(CURRENT_PIECE.available_moves)
        }
    } else{
        if (CURRENT_PIECE.isAvailableMove(boardPosX, boardPosY)) {
            board.setPieceAt(CURRENT_PIECE.x, CURRENT_PIECE.y, false)
            board.setLastMove([{x: CURRENT_PIECE.x, y: CURRENT_PIECE.y},
                                {x: boardPosX, y: boardPosY}])
            CURRENT_PIECE.updatePos(boardPosX, boardPosY)
            board.setPieceAt(boardPosX, boardPosY, CURRENT_PIECE)
        }

        board.drawBoard()
        board.highlightLastMove()
        CURRENT_PIECE = false
    }
})

/* START GAME */
// load images and run the game
const board = new ChessBoard(initialBoard())
loadImages()