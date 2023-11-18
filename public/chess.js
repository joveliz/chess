const canvas = document.getElementById('canvas')
const c = canvas.getContext('2d')

const DIV_MENU = document.getElementById('div-menu')
const DIV_HISTORY = document.getElementById('div-history')

const WIDTH = 600
const HEIGHT = 600

const SQ_WIDTH = WIDTH / 8
const SQ_HEIGHT = HEIGHT / 8

canvas.width = WIDTH
canvas.height = HEIGHT

DIV_MENU.style.width = `${WIDTH/2}px`
DIV_MENU.style.height = `${HEIGHT}px`

var CURRENT_PLAYER = 'w'

var TURN_NUMBER = 1

var HALF_MOVES = 0


const SQ_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const SQ_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8]

const MOVES = {
    bp: [{x: 0, y: 1, type: 'm'},{x: -1, y: 1, type: 'a'},{x: 1, y: 1, type: 'a'},{x: -1, y: 1, type: 'e'},{x: 1, y: 1, type: 'e'}],
    wp: [{x: 0, y: -1, type: 'm'},{x: -1, y: -1, type: 'a'},{x: 1, y: -1, type: 'a'},{x: -1, y: -1, type: 'e'},{x: 1, y: -1, type: 'e'}],
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

const IMG_DIR = './assets/default/'

const IMAGES = {}

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

function drawMenuScreen() {
    c.clearRect(0, 0, WIDTH, HEIGHT)

    c.fillStyle = 'white'
    c.fillRect(100, 100, WIDTH - 200, 150)
    c.fillRect(100, 350, WIDTH - 200, 150)

    c.font = "48px arial"
    c.fillStyle = 'rgb(45, 45, 45)'
    c.fillText("vs. AI", 235, 190)
    c.fillText("vs. Player", 190, 445)
}

function startGame() {
    let count = 0
    const total = Object.keys(IMG_FILES).length
    console.log(`Loading assets... ${Math.round(count)}%`)
    for (const key in IMG_FILES) {
        const img = new Image()
        img.onload = () => {
            IMAGES[key] = img
            count += 1
            console.log(`Loading assets... ${Math.round(100 * count / total)}%`)
            if (count == total) {
                drawMenuScreen()
            }
        }
        img.src = IMG_DIR + IMG_FILES[key]
    }
}

function nextColor(color) {
    if (color == 'w') {
        return 'b'
    } else {
        return 'w'
    }
}

function initialBoard() {
    const w_pawn_row = Array(8)
    for (let i=0; i<w_pawn_row.length; i++) {
        w_pawn_row[i] = new ChessPiece('w', 'p', i, 6)
    }

    const b_pawn_row = Array(8)
    for (let i=0; i<b_pawn_row.length; i++) {
        b_pawn_row[i] = new ChessPiece('b', 'p', i, 1)
    }

    const w_other_row = [new ChessPiece('w', 'r', 0, 7), new ChessPiece('w', 'n', 1, 7), new ChessPiece('w', 'b', 2, 7), new ChessPiece('w', 'q', 3, 7), new ChessPiece('w', 'k', 4, 7), new ChessPiece('w', 'b', 5, 7), new ChessPiece('w', 'n', 6, 7), new ChessPiece('w', 'r', 7, 7),]

    const b_other_row = [new ChessPiece('b', 'r', 0, 0), new ChessPiece('b', 'n', 1, 0), new ChessPiece('b', 'b', 2, 0), new ChessPiece('b', 'q', 3, 0), new ChessPiece('b', 'k', 4, 0), new ChessPiece('b', 'b', 5, 0), new ChessPiece('b', 'n', 6, 0), new ChessPiece('b', 'r', 7, 0),]

    const initial_board = 
        [b_other_row,
        b_pawn_row,
        Array(8).fill(false),
        Array(8).fill(false),
        Array(8).fill(false),
        Array(8).fill(false),
        w_pawn_row,
        w_other_row]

    return initial_board
}

function isWithinBounds(x, y) {
    if ((x > -1) && (x < 8)) {
        if ((y > -1) && (y < 8)) {
            return true
        }
    }
    return false
}

function isDifferentPieceColor(board, color, x, y) {
    const SELECTED_PIECE = board[y][x]
    if ((SELECTED_PIECE) && (SELECTED_PIECE.color == color)) {
        return false
    }
    return true
}

function getBoard(board, move) {
    let new_board = [];
    for (let y =0; y<8; y++) {
        let new_row = [];
        for(let x =0; x<8; x++) {
            const piece = board[y][x] 
            if (piece) {
                const new_piece = new ChessPiece(piece.color, piece.type, x, y)
                new_piece.setMoveCounter(piece.move_counter.n, piece.move_counter.turn)
                new_row.push(new_piece);
            } else {
                new_row.push(false);
            };
        };
        new_board.push(new_row);
    };

    const x0 = move[0].x
    const y0 = move[0].y
    const x1 = move[1].x
    const y1 = move[1].y

    const current_piece = new_board[y0][x0]
    current_piece.setCurrentPos(x1, y1)
    current_piece.setMoveCounter(current_piece.move_counter.n + 1, TURN_NUMBER)

    new_board[y0][x0] = false
    new_board[y1][x1] = current_piece

    return new_board
}

function isCheck(board, color) {
    const other_color_pieces = []
    let king = null

    for (const row of board) {
        for (const piece of row) {
            if (piece && (piece.color !== color)) {
                other_color_pieces.push(piece)
            }
            if (piece && (piece.type === 'k') && (piece.color === color)) {
                king = piece
            }
        }
    }

    for (const piece of other_color_pieces) {
        const available_moves = piece.getAvailableMoves(board)
        for (const move of available_moves) {
            if ((move.x === king.x) && (move.y === king.y)) {
                return true
            }
        }
    }
    return false
}

function isMate(board, color) {
    const this_color_pieces = []

    for (const row of board) {
        for (const piece of row) {
            if (piece && (piece.color === color)) {
                this_color_pieces.push(piece)
            }
        }
    }

    for (const piece of this_color_pieces) {
        const available_moves = piece.getAvailableMoves(board)
        for (const move of available_moves) {
            const new_board = getBoard(board, [{x: piece.x, y: piece.y}, move])
            const is_mate = isCheck(new_board, color)

            if (!is_mate) {
                return false
            }
        }
    }
    return true
}

function handleCheckAndMate(game, color, fun) {
    const is_in_check = isCheck(game.board, color)

    if (is_in_check) {
        const check_pos = game.last_move[1]
        const check_king = game.kings[CURRENT_PLAYER]
        game.highlightCheck(check_pos.x, check_pos.y)
        game.highlightCheck(check_king.x, check_king.y)

        const is_mate = isMate(game.board, color)
        if (is_mate) {
            fun()
        }
    }

}

function isCastlingAvailable(board, king, direction) {
    const dir = direction / 2

    if (!board[king.y][king.x + dir]) {
        if (dir > 0) {
            const rook = board[king.y][king.x + (3 * dir)]
            if ((rook)
                && (rook.type == 'r')
                && (rook.move_counter.n == 0)) {
                    return true
            }
        }
        else {
            if (!board[king.y][king.x + (3 * dir)]) {
                const rook = board[king.y][king.x + (4 * dir)]
                if ((rook)
                    && (rook.type == 'r')
                    && (rook.move_counter.n == 0)) {
                        return true
                }
            }
        }
    }
    return false
}

function setHalfMoves(number) {
    if (number == 1) {
        HALF_MOVES += 1
    } else {
        HALF_MOVES = 0
    }
}

class ChessPiece {
    constructor(color, type, x, y) {
        this.color = color
        this.type = type
        this.x = x
        this.y = y
        this.move_counter = {n: 0, turn: false}
        this.available_moves = []
    }

    setCurrentPos(x, y) {
        this.x = x
        this.y = y
    }

    setMoveCounter(n, turn) {
        this.move_counter = {n: n, turn: turn}
    }

    isAvailableMove(x, y) {
        if ((x == this.x) && (y == this.y)) {
            return false
        }
        for (const move of this.available_moves) {
            if ((x == move.x) && 
                (y == move.y)) {

                return move
            }
        }
        return false
    }

    getAvailableMoves(board) {
        const move_set = MOVES[this.type == 'p' ? `${this.color}${this.type}` : this.type]
        const available_moves = []

        for (const move of move_set) {

            let new_move = {
                x: this.x + move.x,
                y: this.y + move.y,
                type: move.type,
            }
            let is_within_bounds = isWithinBounds(new_move.x, new_move.y)

            if (!is_within_bounds) {
                continue
            }
            
            let is_different_piece_color = isDifferentPieceColor(board, this.color, new_move.x, new_move.y)

            if (is_different_piece_color) {
                switch(new_move.type) {
                    case 'c':
                        available_moves.push(new_move)
                        break
                    case 'm':
                        if (!board[new_move.y][new_move.x]) {
                            available_moves.push(new_move)
                            if (this.move_counter.n == 0) {
                                new_move = {
                                    x: new_move.x,
                                    y: new_move.y + move.y,
                                    type: new_move.type
                                }
                                if (!board[new_move.y][new_move.x]){
                                    available_moves.push(new_move)
                                }
                            }
                        }
                        break
                    case 'a':
                        const opponent_piece = board[new_move.y][new_move.x]
                        if (opponent_piece && (opponent_piece.color == nextColor(this.color))) {
                            available_moves.push(new_move)
                        }
                        break
                    case 'n':
                        available_moves.push(new_move)
    
                        while(!board[new_move.y][new_move.x]) {
                            new_move = {
                                x: new_move.x + move.x,
                                y: new_move.y + move.y,
                                type: new_move.type
                            }
                            is_within_bounds = isWithinBounds(new_move.x, new_move.y)
                            if (!is_within_bounds) {
                                break
                            }
                            is_different_piece_color = isDifferentPieceColor(board, this.color, new_move.x, new_move.y)
                            if (is_different_piece_color) {
                                available_moves.push(new_move)
                            } else {
                                break
                            }
                        }
                        break
                    case 't':
                        if ((this.move_counter.n == 0) && (isCastlingAvailable(board, this, move.x))) {
                            available_moves.push(new_move)
                        }
                        break
                    case 'e':
                        let row_number = 3
                        if (this.color === 'b') {
                            row_number = 4
                        }
                        if (this.y === row_number) {
                            const next_sq = board[row_number][new_move.x]
                            if (next_sq && (next_sq.type == 'p') && (next_sq.move_counter.n == 1) && (next_sq.move_counter.turn == TURN_NUMBER - (this.color === 'w'? 1 : 0))) {
                                available_moves.push(new_move)
                            }
                        }
                        break
                    default:
                        console.log('INVALID MOVE.type')
                }
            }
        }

        return available_moves
    }

    setAvailableMoves(board) {
        this.available_moves = this.getAvailableMoves(board)
    }

    draw() {
        c.drawImage(IMAGES[`${this.color}${this.type}`], 
            (this.x * SQ_WIDTH) + (SQ_WIDTH / 10), (this.y * SQ_HEIGHT) + (SQ_HEIGHT / 10),
            SQ_WIDTH * 0.8, SQ_HEIGHT * 0.8)
    }
}

class ChessGame {
    constructor(board, color_palette) {
        this.color_palette = color_palette
        this.board = board
        this.current_piece = false
        this.last_move = null
        this.kings = {b: null, w: null}
        this.captured_pieces = {b: [], w: []}
        this.promotion_pieces = []
        this.castling_rights = 'KQkq'
        this.init(board)
    }

    init(board) {
        for (const row of board) {
            for (const piece of row) {
                if (piece && (piece.type === 'k')) {
                    this.kings[piece.color] = piece
                }
            }
        }
    }

    nextSqColor(color) {
        if (color == '#f1f5ed') {
            return 'black'
        }
        else {
            return '#f1f5ed'
        }
    }

    drawSquare(x, y, color=this.color_palette.sq_color) {
        if (color == 'black') {
            c.clearRect((x * SQ_WIDTH), (y * SQ_HEIGHT), SQ_WIDTH, SQ_HEIGHT)
            return
        }
        c.fillStyle = color
        c.fillRect((x * SQ_WIDTH), (y * SQ_HEIGHT), SQ_WIDTH, SQ_HEIGHT)
    }

    drawCharacter(x, y, character) {
        const posX = x * SQ_WIDTH
        const posY = y * SQ_HEIGHT
        let offsetX = 0.05 * SQ_WIDTH
        let offsetY = 0.2 * SQ_HEIGHT

        if (isNaN(character)) {
            offsetX = 0.85 * SQ_WIDTH
            offsetY = 0.95 * SQ_HEIGHT
        }

        c.font = "12px arial"
        c.fillStyle = this.nextSqColor(this.color_palette.sq_color)
        c.fillText(`${character}`, posX + offsetX, posY + offsetY)
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

    setCurrentPiece(piece) {
        this.current_piece = piece
    }

    nextPlayer() {
        CURRENT_PLAYER = nextColor(CURRENT_PLAYER)
    }

    getFEN() {
        let fen_string = ''
        let row_count = 0

        for (const row of this.board) {
            let row_string = ''
            let empty_count = 0
            let square_count = 0
            for (const square of row) {
                square_count += 1
                if (square == false) {
                    empty_count += 1
                    if ((square_count == 8) && (empty_count > 0)) {
                        row_string = row_string + `${empty_count}`
                    }
                } else {
                    if (empty_count > 0) {
                        row_string = row_string + `${empty_count}`
                        empty_count = 0
                    }
                    row_string = row_string + `${square.color == 'w' ? square.type.toUpperCase() : square.type}`
                }
            }
            row_count += 1
            fen_string = fen_string + row_string + `${row_count < 8 ? '/' : ' '}`
        }

        fen_string = fen_string + `${CURRENT_PLAYER} ` + this.castling_rights + ' - ' + `${HALF_MOVES} ` + `${TURN_NUMBER}`

        return fen_string
    }

    updateCastlingRights(color) {
        if (this.castling_rights.length < 2) {
            return
        }
        if (this.castling_rights.length == 2) {
            this.castling_rights = '-'
        } else {
            if (color == 'b') {
                this.castling_rights = 'KQ'
            } else {
                this.castling_rights = 'kq'
            }
        }
    }

    makeMove(x, y, piece) {
        const prev_pos = {x: piece.x, y: piece.y}
        const captured_piece = this.getPieceAt(x, y)

        piece.setCurrentPos(x, y)
        piece.setMoveCounter(piece.move_counter.n + 1, TURN_NUMBER)
        this.setPieceAt(x, y, piece)
        this.setPieceAt(prev_pos.x, prev_pos.y, false)
        this.setLastMove([prev_pos, {x: piece.x, y: piece.y}])

        return captured_piece
    }

    addCapturedPiece(piece) {
        this.captured_pieces[piece.color].push(piece)
    }

    addToMoveHistory(captured=false, check=false, castling=false) {
        const piece = this.current_piece
        let text = ''
        if(!castling) {
            text = `${piece.type === 'p' ? captured ? SQ_LETTERS[this.last_move[0].x] : '' : piece.type.toUpperCase()}${captured ? 'x' : ''}${SQ_LETTERS[piece.x]}${SQ_NUMBERS[7-piece.y]}${check ? '+' : ''}`
        } else {
            text = `${piece.x > 4 ? '0-0' : '0-0-0'}`
        }
        if (piece.color == 'w') {
            const p_element = document.createElement('p')
            const p_text = document.createTextNode(`${TURN_NUMBER}. ${text}`)
            p_element.appendChild(p_text)
            DIV_HISTORY.appendChild(p_element)
        } else {
            DIV_HISTORY.lastChild.textContent = DIV_HISTORY.lastChild.textContent + `... ${text}`
            TURN_NUMBER += 1
        }
    }

    checkForPromotion() {
        for (const piece of this.board[0]) {
            if (piece && (piece.type === 'p')) {
                return piece
            }
        }

        for (const piece of this.board[7]) {
            if (piece && (piece.type === 'p')) {
                return piece
            }
        }
        return false
    }

    highlightSquare(x, y, color=this.color_palette.sq_highlight) {
        c.fillStyle = color
        c.fillRect(x * SQ_WIDTH, y * SQ_HEIGHT, SQ_WIDTH, SQ_HEIGHT)
        if (this.getPieceAt(x, y)) {
            this.board[y][x].draw()
        }
    }

    highlightMoves(moves) {
        for (let i=0; i<moves.length; i++) {
            this.highlightSquare(moves[i].x, moves[i].y, this.color_palette.sq_highlight_moves)
        }
    }

    highlightLastMove() {
        if (this.last_move == null) {
            return false
        }

        this.highlightSquare(this.last_move[0].x, this.last_move[0].y, this.color_palette.sq_highlight_last_move)
        this.highlightSquare(this.last_move[1].x, this.last_move[1].y, this.color_palette.sq_highlight_last_move)
    }

    highlightCheck(x, y) {
        this.highlightSquare(x, y, this.color_palette.sq_highlight_check)
    }

    castlingMove(kingPrevPosX, kingPrevPosY) {
        const dir = this.current_piece.x > 4 ? 1 : -1
        const rookColumn = dir > 0 ? 7 : 0

        const rook = this.getPieceAt(rookColumn, kingPrevPosY)
        const color = rook.color
        this.setPieceAt(rookColumn, kingPrevPosY, false)
        rook.setCurrentPos(kingPrevPosX + dir, kingPrevPosY)
        this.setPieceAt(kingPrevPosX + dir, kingPrevPosY, rook)

        this.updateCastlingRights(color)
    }

    drawBoard() {
        for (let i = 0; i < 8; i++) {
            this.color_palette.sq_color = this.nextSqColor(this.color_palette.sq_color)
            for (let j = 0; j < 8; j++) {
                this.color_palette.sq_color = this.nextSqColor(this.color_palette.sq_color)
                this.drawSquare(j, i)

                if (i == 7) {
                    this.drawCharacter(j, i, SQ_LETTERS[j])
                }

                if (j == 0) {
                    this.drawCharacter(j, i, SQ_NUMBERS[7 - i])
                }

                if (this.board[i][j]) {
                    this.board[i][j].draw()
                }
            }
        }
    }
}

export {ChessPiece, ChessGame, canvas, SQ_WIDTH, SQ_HEIGHT, SQ_LETTERS, CURRENT_PLAYER, TURN_NUMBER, startGame, initialBoard, isCheck, getBoard, handleCheckAndMate, nextColor, setHalfMoves}