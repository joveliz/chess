import {ChessPiece, ChessGame, canvas, SQ_WIDTH, SQ_HEIGHT, SQ_LETTERS, CURRENT_PLAYER, TURN_NUMBER, startGame, initialBoard, isCheck, getBoard, handleCheckAndMate, nextColor, setHalfMoves} from './chess.js';

var ai = true

const COLOR_PALETTE = {
    sq_color: '#f1f5ed',
    sq_highlight: 'rgb(252, 252, 3)',
    sq_highlight_check: 'rgb(235, 58, 52)',
    sq_highlight_moves: 'rgba(252, 246, 50, 0.4)',
    sq_highlight_last_move: 'rgb(58, 215, 23)'
}

const aiText = document.getElementById('ai-text')

function uciToMove(game, uci) {
    if (uci == "None") {
        return
    }
    const piece = uci.substring(0, 2)
    const piece_letter = piece.substring(0,1)
    let pieceX = 0
    let pieceY = 0
    const move = uci.substring(2,4)
    const move_letter = move.substring(0,1)
    let moveX = 0
    let moveY = 0

    for (let i=0; i<SQ_LETTERS.length; i++) {
        if (SQ_LETTERS[i] == piece_letter) {
            pieceX = i
        }
    }
    moveY = 8 - parseInt(move.substring(1,2))

    for (let i=0; i<SQ_LETTERS.length; i++) {
        if (SQ_LETTERS[i] == move_letter) {
            moveX = i
        }
    }
    pieceY = 8 - parseInt(piece.substring(1,2))

    clickHandler(game, pieceX, pieceY)
    clickHandler(game, moveX, moveY)
}

function makeAIMove(game, fen) {
    canvas.removeEventListener('click', eventListener)
    aiText.innerText = ' (AI thinking...)'
    const body = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fen: fen }),
      };
    
    fetch('https://joveliz.pythonanywhere.com/getmove', body)
      .then(response => {
        return response.json()
      })
      .then(aimove => {
        uciToMove(game, aimove['move'])
        aiText.innerText = ''
        canvas.addEventListener('click', eventListener)
      })
      .catch((e) => {
        aiText.innerText = ' (AI error!)'
        canvas.addEventListener('click', eventListener)
    })
}

function eventListener(e) {
    const boardPosX = Math.floor(e.offsetX / SQ_WIDTH)
    const boardPosY = Math.floor(e.offsetY / SQ_HEIGHT)

    clickHandler(newGame, boardPosX, boardPosY)
}

function promotionEventListener(e) {
    const boardPosX = Math.floor(e.offsetX / SQ_WIDTH)
    const boardPosY = Math.floor(e.offsetY / SQ_HEIGHT)

    promotionClickHandler(newGame, boardPosX, boardPosY)
}

function menuEventListener(e) {
    const x = e.offsetX
    const y = e.offsetY

    menuClickHandler(newGame, x, y)
}

function promote(game, piece) {
    let direction = -1
    if (piece.y === 0) {
        direction = 1
    }

    canvas.removeEventListener('click', eventListener)

    const x = piece.x
    const y = piece.y
    const color = piece.color
    const possible = ['q', 'r', 'b', 'n']

    game.promotion_pieces = []

    for (let i=0; i<possible.length; i++) {      
        const new_option = new ChessPiece(color, possible[i], x, y + (i * direction))
        game.promotion_pieces.push(new_option)
        game.drawSquare(new_option.x, new_option.y, game.color_palette.sq_highlight)
        new_option.draw()
    }

    if ((ai) && (CURRENT_PLAYER == 'b')) {
        promotionClickHandler(game, x, y)

    } else {
        canvas.addEventListener('click', promotionEventListener)
    }
}

function clickHandler(game, boardPosX, boardPosY) {
    if (!game.current_piece) {
        const piece = game.getPieceAt(boardPosX, boardPosY)

        if (piece && (piece.color === CURRENT_PLAYER)) {
            piece.setAvailableMoves(game.board)
            game.setCurrentPiece(piece)
            game.highlightSquare(piece.x, piece.y)
            game.highlightMoves(piece.available_moves)
        }

    } else {
        const available_move = game.current_piece.isAvailableMove(boardPosX, boardPosY)

        if (available_move) {
            const is_castling_move = available_move.type === 't'
            const is_en_passant_move = available_move.type === 'e'
            const is_currently_in_check = isCheck(game.board, CURRENT_PLAYER)
            const new_board = getBoard(game.board, [{ x: game.current_piece.x, y: game.current_piece.y}, available_move])
            const will_be_in_check = isCheck(new_board, CURRENT_PLAYER)

            if (will_be_in_check) {
                console.log('invalid move! (would put you in check)')
            } else if (is_castling_move && is_currently_in_check) {
                console.log('invalid move! (cannot castle while in check)')
            } else {
                let captured_piece = game.makeMove(boardPosX, boardPosY, game.current_piece)
                
                if (is_en_passant_move) {
                    let y_dir = 1
                    if (CURRENT_PLAYER == 'b') {
                        y_dir = -1
                    }
                    captured_piece = game.getPieceAt(boardPosX, boardPosY + y_dir)
                    game.setPieceAt(boardPosX, boardPosY + y_dir, false)
                }

                if (captured_piece) {
                    game.addCapturedPiece(captured_piece)
                }

                if (is_castling_move) {
                    const prev_pos = game.last_move[0]
                    game.castlingMove(prev_pos.x, prev_pos.y)
                }
                
                const is_next_player_in_check = isCheck(game.board, nextColor(CURRENT_PLAYER))
                if (TURN_NUMBER < 201) {
                    game.addToMoveHistory(captured_piece, is_next_player_in_check, is_castling_move)
                }

                if ((captured_piece) || (game.current_piece.type == 'p')) {
                    setHalfMoves(0)
                } else {
                    setHalfMoves(1)
                }

                const is_promotion_available = game.checkForPromotion()
                if (is_promotion_available) {
                    promote(game, is_promotion_available)
                    return
                }

                game.nextPlayer()
            }
        }

        game.setCurrentPiece(false)
        game.drawBoard()
        game.highlightLastMove()

        handleCheckAndMate(game, CURRENT_PLAYER, gameOver)

        if ((ai) && CURRENT_PLAYER == 'b') {
            makeAIMove(game, game.getFEN()) 
        }
    }
}

function promotionClickHandler(game, boardPosX, boardPosY) {
    for (const piece of game.promotion_pieces) {
        if ((boardPosX === piece.x) && (boardPosY === piece.y)) {
            const position = game.promotion_pieces[0]
            piece.setCurrentPos(position.x, position.y)
            game.setPieceAt(position.x, position.y, piece)

            game.nextPlayer()
            game.setCurrentPiece(false)
            game.drawBoard()
            game.highlightLastMove()

            handleCheckAndMate(game, CURRENT_PLAYER, gameOver)

            canvas.addEventListener('click', eventListener)
            canvas.removeEventListener('click', promotionEventListener)
        }
    }
    
    if ((ai) && CURRENT_PLAYER == 'b') {
        makeAIMove(game, game.getFEN()) 
    }
}

function menuClickHandler(game, x, y) {
    if ((x >= 100) && (x <= canvas.width - 100)) {
        if ((y >= 100) && (y <= 250)) {
            ai = true
            game.drawBoard()
            canvas.addEventListener('click', eventListener)
            canvas.removeEventListener('click', menuEventListener)
        }
        if ((y >= 350) && (y <= 500)) {
            ai = false
            game.drawBoard()
            canvas.addEventListener('click', eventListener)
            canvas.removeEventListener('click', menuEventListener)
        }
    }
}

function gameOver() {
    ai = false
    console.log('game over.')
    canvas.removeEventListener('click', eventListener)
    canvas.removeEventListener('click', promotionEventListener)
}

function runGame(game) {
    canvas.addEventListener('click', menuEventListener)
    startGame(game)
}

// initialize new board and start game
const newGame = new ChessGame(initialBoard(), COLOR_PALETTE)
runGame(newGame)
