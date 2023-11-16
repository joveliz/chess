import {ChessPiece, ChessGame, SQ_WIDTH, SQ_HEIGHT, CURRENT_PLAYER, TURN_NUMBER, startGame, initialBoard, isCheck, getBoard, handleCheckAndMate, nextColor, setHalfMoves} from './chess.js';

const COLOR_PALETTE = {
    sq_color: '#f1f5ed',
    sq_highlight: 'rgb(252, 252, 3)',
    sq_highlight_check: 'rgb(235, 58, 52)',
    sq_highlight_moves: 'rgba(252, 246, 50, 0.4)',
    sq_highlight_last_move: 'rgba(5, 113, 176, 0.8)'
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

    canvas.addEventListener('click', promotionEventListener)
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
                console.log(game.getFEN())
            }
        }

        game.setCurrentPiece(false)
        game.drawBoard()

        handleCheckAndMate(game, CURRENT_PLAYER, gameOver)
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
            console.log(game.getFEN())

            handleCheckAndMate(game, CURRENT_PLAYER, gameOver)

            canvas.addEventListener('click', eventListener)
            canvas.removeEventListener('click', promotionEventListener)
        }
    }
}

function gameOver() {
    console.log('game over.')
    canvas.removeEventListener('click', eventListener)
    canvas.removeEventListener('click', promotionEventListener)
}

// initialize new board and start game
const newGame = new ChessGame(initialBoard(), COLOR_PALETTE)
startGame(newGame)
canvas.addEventListener('click', eventListener)