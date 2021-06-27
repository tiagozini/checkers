import React from 'react';
import { Piece } from '../models/Piece';
import { PiecePossibleMoves } from '../models/PiecePossibleMoves';
import { PositionedPiece } from '../models/PositionedPiece';
import { Board } from './Board';

import { ColorTypes, PieceTypes, PossibleMoveType, PlayerNames, DiagonalTypes } from '../Constants';

export class Game extends React.Component {

    constructor(props) {
        super(props);
        this.NUM_ROWS_BY_LINE = 8;
        this.NUM_ROWS = this.NUM_ROWS_BY_LINE * this.NUM_ROWS_BY_LINE;
        this.DIAGONAL_TYPES_LIST = [DiagonalTypes.LEFT_DOWN, DiagonalTypes.LEFT_UP,
        DiagonalTypes.RIGHT_DOWN, DiagonalTypes.RIGHT_UP];
        this.state = {
            whiteIsNext: true,
            pieces: this.mountInitialPieces(),
            whitesCount: 12,
            blacksCount: 12,
            count: 1
        };
        this.possibleMoves = [];
        for (let i = 0; i < this.NUM_ROWS; i++) {
            this.possibleMoves.push(null);
        }

        this.handleMovePiece = this.handleMovePiece.bind(this);
        this.handleCanMovePiece = this.handleCanMovePiece.bind(this);
        this.getManMoves = this.getManMoves.bind(this);
        this.getManCaptureMoves = this.getManCaptureMoves.bind(this);
        this.getKingCaptureMoves = this.getKingCaptureMoves.bind(this);
        this.handleCanDragPiece = this.handleCanDragPiece.bind(this);
        this.updatePossibleMoves = this.updatePossibleMoves.bind(this);
        this.mountInitialPieces = this.mountInitialPieces.bind(this);
        this.getPosition = this.getPosition.bind(this);
        this.getXAndY = this.getXAndY.bind(this);
        this.getKingNonCaptureMoves = this.getKingNonCaptureMoves.bind(this);
        this.isThePieceTurn = this.isThePieceTurn.bind(this);
        this.canManCaptures = this.canManCaptures.bind(this);
        this.isThePieceTurn = this.isThePieceTurn.bind(this);
        this.filterMovesWithMaxTakenPieces = this.filterMovesWithMaxTakenPieces.bind(this);
    }

    mountInitialPieces() {
        const pieces = [];
        for (let i = 0; i < this.NUM_ROWS; i++) {
            const lineNumberRest = Math.trunc((i) / this.NUM_ROWS_BY_LINE);
            const even = ((lineNumberRest + i) % 2) === 0;
            if (i >= 0 && i < 24 && !even) {
                pieces.push(new Piece(ColorTypes.WHITE, PieceTypes.MAN));
            } else if (i >= 40 && i < this.NUM_ROWS && !even) {
                pieces.push(new Piece(ColorTypes.BLACK, PieceTypes.MAN));
            } else {
                pieces.push(null);
            }
        }
        return pieces;
    }

    getPosition(x, y) {
        return y * this.NUM_ROWS_BY_LINE + x;
    }

    getXAndY(position) {
        return [position % this.NUM_ROWS_BY_LINE, Math.trunc(position / this.NUM_ROWS_BY_LINE)];
    }

    getY(position) {
        return Math.trunc(position / this.NUM_ROWS_BY_LINE);
    }

    getDiagonalSize(x, y, diagonalType) {
        const [dxLeft, dxRight, dyUp, dyDown] = [x, 7 - x, y, 7 - y];
        if (diagonalType === DiagonalTypes.LEFT_UP)
            return Math.min(dxLeft, dyUp);
        else if (diagonalType === DiagonalTypes.LEFT_DOWN)
            return Math.min(dxLeft, dyDown);
        else if (diagonalType === DiagonalTypes.RIGHT_UP)
            return Math.min(dxRight, dyUp);
        else if (diagonalType === DiagonalTypes.RIGHT_DOWN)
            return Math.min(dxRight, dyDown);
    }

    getManCaptureMoves(positionedPiece, moves, piecesTaken) {
        const position = moves.length > 0 ? moves.slice(-1)[0] :
            positionedPiece.position;
        const [x, y] = this.getXAndY(position);
        let upperMoves = [];
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const [operationX, operationY] = this.getDiagonalOperations(diagonalType);
            const [enemyPosition, enemyPositionMoreOne] =
                [this.getPosition(x + operationX, y + operationY),
                this.getPosition(x + (2 * operationX), y +
                    (2 * operationY))];
            const size = this.getDiagonalSize(x, y, diagonalType);
            if (size > 1 && this.canCapture(enemyPosition,
                enemyPositionMoreOne, this.getOpositeColor(positionedPiece.color))
                && piecesTaken.filter((positionTaken) =>
                    positionTaken === enemyPosition).length === 0) {
                upperMoves.push(
                    this.getManCaptureMoves(positionedPiece,
                        moves.concat(enemyPositionMoreOne),
                        piecesTaken.concat(enemyPosition))
                );
            }
        }
        let ppmList = [];
        if (upperMoves.length === 0 && moves.length > 0) {
            ppmList.push(new PiecePossibleMoves(moves, piecesTaken));
        } else {
            for (let moveItens of upperMoves) {
                for (let miniMove of moveItens) {
                    ppmList.push(miniMove);
                }
            }
        }
        return ppmList;
    }

    getKingNonCaptureMoves(position) {
        const [xFrom, yFrom] = this.getXAndY(position);
        let positions = [];
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const size = this.getDiagonalSize(xFrom, yFrom, diagonalType);
            const [operationX, operationY] = this.getDiagonalOperations(diagonalType);
            if (size > 0) {
                for (let i = 1; i <= size; i++) {
                    const [x, y] = [xFrom + operationX * i, yFrom + operationY * i];
                    if (this.state.pieces[this.getPosition(x, y)] != null)
                        break;
                    else
                        positions.push(this.getPosition(x, y));
                }
            }
        }
        return positions.map((p) => new PiecePossibleMoves([p], []));
    }

    getDiagonalOperations(diagonalType) {
        if (diagonalType === DiagonalTypes.LEFT_DOWN) {
            return [-1, +1];
        } else if (diagonalType === DiagonalTypes.RIGHT_DOWN) {
            return [+1, +1];
        } else if (diagonalType === DiagonalTypes.LEFT_UP) {
            return [-1, -1];
        } else if (diagonalType === DiagonalTypes.RIGHT_UP) {
            return [+1, -1];
        }
    }

    getOpositeColor(color) {
        return color === ColorTypes.WHITE ? ColorTypes.BLACK : ColorTypes.WHITE;
    }

    getKingDiagonalCaptureMoves(xFrom, yFrom, opositeColor, size, diagonalType, piecesTaken) {
        let enemyPosition = null;
        let positionsMoved = [];
        let [operationX, operationY] =
            this.getDiagonalOperations(diagonalType);
        for (let i = 1; i <= size; i++) {
            const [x, y] = [xFrom + operationX * i, yFrom + operationY * i];
            const [pos, posMoreOne] = [this.getPosition(x, y),
            this.getPosition(x + operationX, y + operationY)]
            if (enemyPosition != null && this.state.pieces[pos] != null) {
                break;
            } else if (enemyPosition != null
                && this.state.pieces[pos] === null
                // eslint-disable-next-line
                && piecesTaken.filter((p) => p === enemyPosition).length === 0
            ) {
                positionsMoved.push(pos);
            } else if (enemyPosition === null
                && this.state.pieces[this.getPosition(x, y)] != null) {
                if (this.canCapture(pos, posMoreOne, opositeColor)) {
                    enemyPosition = this.getPosition(x, y);
                } else {
                    break;
                }
            }
        }
        return [positionsMoved, enemyPosition];
    }

    getKingCaptureMoves(positionedPiece, moves, piecesTaken) {
        const position = moves.length > 0 ? moves.slice(-1)[0] :
            positionedPiece.position;
        const [xFrom, yFrom] = this.getXAndY(position);
        let upperMoves = [];
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const size = this.getDiagonalSize(xFrom, yFrom, diagonalType);
            if (size > 1) {
                const [newMovesPositions, enemyPosition] =
                    this.getKingDiagonalCaptureMoves(xFrom, yFrom,
                        this.getOpositeColor(positionedPiece.color),
                        size, diagonalType, piecesTaken);
                for (let pos of newMovesPositions) {
                    upperMoves.push(this.getKingCaptureMoves(positionedPiece,
                        moves.concat(pos), piecesTaken.concat(enemyPosition)));
                }
            }
        }
        let arr = [];
        if (upperMoves.length === 0 && moves.length > 0) {
            arr.push(new PiecePossibleMoves(moves, piecesTaken));
        } else {
            for (let moveItens of upperMoves) {
                for (let miniMove of moveItens) {
                    arr.push(miniMove);
                }
            }
        }
        return arr;
    }

    canCapture(position1, position2, opositeColor) {
        return this.state.pieces[position1] != null
            && this.state.pieces[position2] === null
            && this.state.pieces[position1].color === opositeColor;
    }

    canManCaptures(positionedPiece) {
        const [x, y] = this.getXAndY(positionedPiece.position);
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const [xOperation, yOperation] = this.getDiagonalOperations(diagonalType);
            if (this.getDiagonalSize(x, y, diagonalType) > 1
                && this.canCapture(this.getPosition(x + xOperation, y + yOperation),
                    this.getPosition(x + 2 * xOperation, y + 2 * yOperation),
                    this.getOpositeColor(positionedPiece.color))
            ) {
                return true;
            }
        }
        return false;
    }

    getManYOperation(positionedPiece) {
        const y = this.getY(positionedPiece.position);
        if (positionedPiece.color === ColorTypes.WHITE && y + 1 <= 7) {
            return 1;
        } else if (positionedPiece.color === ColorTypes.BLACK && (y - 1) >= 0) {
            return -1;
        }
        return null;
    }

    getManMoves(positionedPiece) {
        let ppmList = [];
        const [x, y] = this.getXAndY(positionedPiece.position);
        if (this.canManCaptures(positionedPiece)) {
            let piecePossibleMoves = this.getManCaptureMoves(positionedPiece, [], []);
            const maxSize = piecePossibleMoves.reduce(
                (prev, curr) =>
                    (prev.moves.length > curr.moves.length) ? prev : curr
            ).moves.length;
            return piecePossibleMoves.filter((pos) => pos.moves.length === maxSize);
        } else {
            let yOperation = this.getManYOperation(positionedPiece);
            for (let xPart of [x - 1, x + 1]) {
                const lastPosition = this.getPosition(xPart, y + yOperation);
                if (xPart >= 0 && xPart <= 7 && yOperation != null &&
                    this.state.pieces[lastPosition] === null) {
                    ppmList.push(new PiecePossibleMoves([lastPosition], []));
                }
            }
        }
        return ppmList;
    }

    getKingMoves(positionedPiece) {
        const position = positionedPiece.position;
        let piecePossibleMoves = this.getKingCaptureMoves(positionedPiece, [], []);
        let canCaptures = piecePossibleMoves.length > 0;

        if (canCaptures) {
            let biggerSize = 0;
            let positions = [];

            for (let pmps of piecePossibleMoves) {
                if (pmps.moves.length > biggerSize) {
                    biggerSize = pmps.moves.length;
                }
            }
            for (let pmps of piecePossibleMoves) {
                if (pmps.moves.length === biggerSize) {
                    positions.push(pmps);
                }
            }
            return positions;
        } else {
            let nearPositions = this.getKingNonCaptureMoves(position);
            return nearPositions.filter((ppms) =>
                this.state.pieces[ppms.moves.slice(-1)[0]] === null);
        }
    }

    handleCanMovePiece(positionedPiece, targetPosition) {
        const position = positionedPiece.position;
        if (this.possibleMoves[position] != null) {
            for (let p of this.possibleMoves[position]) {
                const lastMove = p.moves.slice(-1)[0];
                if (lastMove === targetPosition) {
                    return PossibleMoveType.LAST_MOVE;
                }
            }
            for (let p of this.possibleMoves[position]) {
                const moves = p.moves.slice(0, p.moves.length - 1);
                for (let m of moves) {
                    if (m === targetPosition) {
                        return PossibleMoveType.PARTIAL_MOVE;
                    }
                }
            }
        }
        return PossibleMoveType.NO_MOVE;
    }

    existsPossibleMove(color) {
        for (let position = 0; position < this.NUM_ROWS; position++) {
            const piece = this.state.pieces[position];
            if (piece != null && piece.color === color) {
                let positionedPiece = new PositionedPiece(piece.color, piece.type, position);
                if (this.possibleMoves[position] == null) {
                    if (positionedPiece.type === PieceTypes.MAN)
                        this.possibleMoves[position] = this.getManMoves(positionedPiece);
                    else
                        this.possibleMoves[position] = this.getKingMoves(positionedPiece);
                }
                if (this.possibleMoves[position].length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    handleMovePiece = (originalPosition, targetPosition) => {
        let pieces = this.state.pieces.slice();
        let pieceMoveChoose = null;
        for (let pm of this.possibleMoves[originalPosition]) {
            if (pm.moves.slice(-1)[0] === targetPosition) {
                pieceMoveChoose = pm;
            }
        }
        for (let p of pieceMoveChoose.piecesTaken) {
            pieces[p] = null;
        }
        pieces[targetPosition] = pieces[originalPosition];
        pieces[originalPosition] = null;
        if (this.canPutTheCrown(pieces[targetPosition], targetPosition)) {
            pieces[targetPosition].type = PieceTypes.KING;            
        }
        const [blacksCount, whitesCount] = this.getPieceQuantities(pieces);
        const whiteIsNext = !this.state.whiteIsNext;
        this.setState({
            ...this.state, pieces: pieces,
            count: this.state.count + 1,
            blacksCount: blacksCount,
            whitesCount: whitesCount,
            whiteIsNext: whiteIsNext
        })        
    }

    canPutTheCrown(piece, position) {
        const y = this.getY(position);
        return (((piece.color === ColorTypes.BLACK && y === 0) ||
            (piece.color === ColorTypes.WHITE && y === 7)) &&
            piece.type !== PieceTypes.KING);                
    }

    handleCanDragPiece(positionedPiece) {
        if (positionedPiece != null && (
            (this.state.whiteIsNext && ColorTypes.WHITE === positionedPiece.color) ||
            (!this.state.whiteIsNext && ColorTypes.BLACK === positionedPiece.color)
        )) {
            const position = positionedPiece.position;
            return this.possibleMoves[position] != null &&
                this.possibleMoves[position].length > 0;
        }
        return false;
    }

    isThePieceTurn(piece) {
        return ((this.state.whiteIsNext && piece.color === ColorTypes.WHITE) ||
            (!this.state.whiteIsNext && piece.color === ColorTypes.BLACK));
    }

    filterMovesWithMaxTakenPieces(maxTakenPiecesPossible, possibleMoves) {
        for (let position = 0; position < this.NUM_ROWS; position++) {
            if (this.state.pieces[position] != null
                && possibleMoves[position] != null) {
                possibleMoves[position] = possibleMoves[position].filter((ppm) =>
                    (ppm.piecesTaken.length === maxTakenPiecesPossible)) || [];
            }
        }
        return possibleMoves;
    }

    updatePossibleMoves() {
        let possibleMoves = this.possibleMoves.slice();
        let maxTakenPiecesPossible = 0;
        for (let position = 0; position < this.NUM_ROWS; position++) {
            const piece = this.state.pieces[position];
            if (piece != null && this.isThePieceTurn(piece)) {
                let positionedPiece = new PositionedPiece(piece.color, piece.type, position);
                possibleMoves[position] =
                    (positionedPiece.type === PieceTypes.MAN) ?
                        this.getManMoves(positionedPiece) :
                        this.getKingMoves(positionedPiece);
            } else {
                possibleMoves[position] = null;
            }
        }
        for (let position = 0; position < this.NUM_ROWS; position++) {
            if (possibleMoves[position] != null) {
                for (let ppm of possibleMoves[position]) {
                    maxTakenPiecesPossible = Math.max(maxTakenPiecesPossible,
                        ppm.piecesTaken.length);
                }
            }
        }
        if (maxTakenPiecesPossible > 0) {
            possibleMoves = this.filterMovesWithMaxTakenPieces(maxTakenPiecesPossible,
                possibleMoves);
        }
        this.possibleMoves = possibleMoves;
    }

    getPieceQuantities = (pieces) => {
        let blacksCount = 0;
        let whitesCount = 0;
        for (let piece of pieces.filter((p) => p != null)) {
            if (piece.color === ColorTypes.BLACK) {
                blacksCount++;
            } else if (piece.color === ColorTypes.WHITE) {
                whitesCount++;
            }
        }
        return [blacksCount, whitesCount];
    }

    getTheWinner() {
        let whitesCount = 0;
        let blacksCount = 0;
        for (let i = 0; i < this.NUM_ROWS; i++) {
            if (this.state.pieces[i] != null) {
                if (this.state.pieces[i].color === ColorTypes.WHITE) {
                    whitesCount++;
                } else if (this.state.pieces[i].color === ColorTypes.BLACK) {
                    blacksCount++;
                }
            }
        }
        if (blacksCount === 0) {
            return PlayerNames.WHITE;
        }
        if (whitesCount === 0) {
            return PlayerNames.BLACK;
        }
        if (this.state.whiteIsNext && !this.existsPossibleMove(ColorTypes.WHITE)) {
            return PlayerNames.BLACK;
        } else if (!this.state.whiteIsNext && !this.existsPossibleMove(ColorTypes.BLACK)) {
            return PlayerNames.WHITE;
        }
    }

    render() {
        this.updatePossibleMoves();
        const winner = this.getTheWinner();
        let status;

        if (winner) {
            status = 'Winner: ' + winner;
        } else {
            status = 'Next player: ' + (this.state.whiteIsNext ? 'White' : 'Black');
        }
        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        numRowsByLine={this.NUM_ROWS_BY_LINE}
                        numRows={this.NUM_ROWS}
                        handleCanMovePiece={this.handleCanMovePiece}
                        handleCanDragPiece={this.handleCanDragPiece}
                        handleMovePiece={this.handleMovePiece}
                        whiteIsNext={this.state.whiteIsNext}
                        pieces={this.state.pieces}
                        count={this.state.count}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <p>Whites: {this.state.whitesCount}</p>
                    <p>Blacks: {this.state.blacksCount}</p>
                </div>
            </div>
        );
    }
}
