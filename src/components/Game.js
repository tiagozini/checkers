import React from 'react';
import { Board } from './Board';
import { PiecePossibleMoves } from '../models/PiecePossibleMoves';
import { Piece } from '../models/Piece';
import { PieceDraggable } from '../models/PieceDraggable';

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

        this.handlePrepareNextPlay = this.handlePrepareNextPlay.bind(this);
        this.handleMovePiece = this.handleMovePiece.bind(this);
        this.handleCanMovePiece = this.handleCanMovePiece.bind(this);
        this.getMovesSimplePiece = this.getMovesSimplePiece.bind(this);
        this.getMovesTakePieces = this.getMovesTakePieces.bind(this);
        this.getDoubleMovesTakePieces = this.getDoubleMovesTakePieces.bind(this);
        this.handleCanDragPiece = this.handleCanDragPiece.bind(this);
        this.updatePossibleMoves = this.updatePossibleMoves.bind(this);
        this.mountInitialPieces = this.mountInitialPieces.bind(this);
        this.getPosition = this.getPosition.bind(this);
        this.getXAndY = this.getXAndY.bind(this);
        this.getDoubleNearMoves = this.getDoubleNearMoves.bind(this);
        this.isThePieceTurn = this.isThePieceTurn.bind(this);
        this.canSimplePieceTakePieces = this.canSimplePieceTakePieces.bind(this);
        this.isThePieceTurn = this.isThePieceTurn.bind(this);
        this.filterMovesWithMaxTakenPieces = this.filterMovesWithMaxTakenPieces.bind(this);
    }

    mountInitialPieces() {
        const pieces = [];
        for (let i = 0; i < this.NUM_ROWS; i++) {
            const lineNumberRest = Math.trunc((i) / this.NUM_ROWS_BY_LINE);
            const even = ((lineNumberRest + i) % 2) === 0;
            if (i >= 0 && i < 24 && !even) {
                pieces.push(new Piece(ColorTypes.WHITE, PieceTypes.SIMPLE));
            } else if (i >= 40 && i < this.NUM_ROWS && !even) {
                pieces.push(new Piece(ColorTypes.BLACK, PieceTypes.SIMPLE));
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

    getDiagonalSize(x, y, diagonalType) {
        const [dxLeft, dxRight, dyUp, dyDown] = [x, 7 - x, y, 7 - y];
        if (diagonalType == DiagonalTypes.LEFT_UP)
            return Math.min(dxLeft, dyUp);
        else if (diagonalType == DiagonalTypes.LEFT_DOWN)
            return Math.min(dxLeft, dyDown);
        else if (diagonalType == DiagonalTypes.RIGHT_UP)
            return Math.min(dxRight, dyUp);
        else if (diagonalType == DiagonalTypes.RIGHT_DOWN)
            return Math.min(dxRight, dyDown);
    }

    getMovesTakePieces(pieceDraggable, moves, piecesTaken) {
        const position = moves.length > 0 ? moves.slice(-1)[0] :
            this.getPosition(pieceDraggable.xFrom, pieceDraggable.yFrom);
        const [x, y] = this.getXAndY(position);
        let upperMoves = [];
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const [operationX, operationY] = this.getDiagonalOperations(diagonalType);
            const [enemyPosition, enemyPositionMoreOne] =
                [this.getPosition(x + operationX, y + operationY),
                this.getPosition(x + (2 * operationX), y +
                    (2 * operationY))];
            const size = this.getDiagonalSize(x, y, diagonalType);
            if (size > 1 && this.canTakePiece(enemyPosition,
                enemyPositionMoreOne, this.getOpositeColor(pieceDraggable.color))
                && piecesTaken.filter((positionTaken) =>
                    positionTaken == enemyPosition).length === 0) {
                upperMoves.push(
                    this.getMovesTakePieces(pieceDraggable,
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

    getDoubleNearMoves(position) {
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
        if (diagonalType == DiagonalTypes.LEFT_DOWN) {
            return [-1, +1];
        } else if (diagonalType == DiagonalTypes.RIGHT_DOWN) {
            return [+1, +1];
        } else if (diagonalType == DiagonalTypes.LEFT_UP) {
            return [-1, -1];
        } else if (diagonalType == DiagonalTypes.RIGHT_UP) {
            return [+1, -1];
        }
    }

    getOpositeColor(color) {
        return color == ColorTypes.WHITE ? ColorTypes.BLACK : ColorTypes.WHITE;
    }

    getDoubleDiagonalTakePiecesMoves(xFrom, yFrom, opositeColor, size, diagonalType, piecesTaken) {
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
                && piecesTaken.filter((p) => p === enemyPosition).length === 0
            ) {
                positionsMoved.push(pos);
            } else if (enemyPosition === null
                && this.state.pieces[this.getPosition(x, y)] != null) {
                if (this.canTakePiece(pos, posMoreOne, opositeColor)) {
                    enemyPosition = this.getPosition(x, y);
                } else {
                    break;
                }
            }
        }
        return [positionsMoved, enemyPosition];
    }

    getDoubleMovesTakePieces(pieceDraggable, moves, piecesTaken) {
        const position = moves.length > 0 ? moves.slice(-1)[0] :
            (pieceDraggable.xFrom + pieceDraggable.yFrom * this.NUM_ROWS_BY_LINE);
        const [xFrom, yFrom] = this.getXAndY(position);
        let upperMoves = [];
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const size = this.getDiagonalSize(xFrom, yFrom, diagonalType);
            if (size > 1) {
                const [newMovesPositions, enemyPosition] =
                    this.getDoubleDiagonalTakePiecesMoves(xFrom, yFrom,
                        this.getOpositeColor(pieceDraggable.color),
                        size, diagonalType, piecesTaken);
                for (let pos of newMovesPositions) {
                    upperMoves.push(this.getDoubleMovesTakePieces(pieceDraggable,
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

    canTakePiece(position1, position2, opositeColor) {
        return this.state.pieces[position1] != null
            && this.state.pieces[position2] === null
            && this.state.pieces[position1].color === opositeColor;
    }

    canSimplePieceTakePieces(pieceDraggable) {
        const [x, y] = [pieceDraggable.xFrom, pieceDraggable.yFrom];
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const [xOperation, yOperation] = this.getDiagonalOperations(diagonalType);
            if (this.getDiagonalSize(x, y, diagonalType) > 1
                && this.canTakePiece(this.getPosition(x + xOperation, y + yOperation),
                    this.getPosition(x + 2 * xOperation, y + 2 * yOperation),
                    this.getOpositeColor(pieceDraggable.color))
            ) {
                return true;
            }
        }
        return false;
    }

    getSimplePieceYOperation(pieceDraggable) {
        const y = pieceDraggable.yFrom;
        if (pieceDraggable.color === ColorTypes.WHITE && y + 1 <= 7) {
            return 1;
        } else if (pieceDraggable.color === ColorTypes.BLACK && (y - 1) >= 0) {
            return -1;
        }
        return null;
    }

    getMovesSimplePiece(pieceDraggable) {
        let ppmList = [];
        const [x, y] = [pieceDraggable.xFrom, pieceDraggable.yFrom];
        if (this.canSimplePieceTakePieces(pieceDraggable)) {
            let piecePossibleMoves = this.getMovesTakePieces(pieceDraggable, [], []);
            const maxSize = piecePossibleMoves.reduce(
                (prev, curr) =>
                    (prev.moves.length > curr.moves.length) ? prev : curr
            ).moves.length;
            return piecePossibleMoves.filter((pos) => pos.moves.length === maxSize);
        } else {
            let yOperation = this.getSimplePieceYOperation(pieceDraggable);
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

    getDoubleMovesPiece(pieceDraggable) {
        const position = pieceDraggable.xFrom + pieceDraggable.yFrom * this.NUM_ROWS_BY_LINE;
        let piecePossibleMoves = this.getDoubleMovesTakePieces(pieceDraggable, [], []);
        let canTakePieces = piecePossibleMoves.length > 0;

        if (canTakePieces) {
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
            let nearPositions = this.getDoubleNearMoves(position);
            return nearPositions.filter((ppms) =>
                this.state.pieces[ppms.moves.slice(-1)[0]] === null);
        }
    }

    handleCanMovePiece(pieceDraggable, xTo, yTo) {
        const position = this.getPosition(pieceDraggable.xFrom, pieceDraggable.yFrom);
        if (this.possibleMoves[position] != null) {
            for (let p of this.possibleMoves[position]) {
                const lastMove = p.moves.slice(-1)[0];
                if (lastMove === this.getPosition(xTo, yTo)) {
                    return PossibleMoveType.LAST_MOVE;
                }
            }
            for (let p of this.possibleMoves[position]) {
                const moves = p.moves.slice(0, p.moves.length - 1);
                for (let m of moves) {
                    if (m === this.getPosition(xTo, yTo)) {
                        return PossibleMoveType.PARTIAL_MOVE;
                    }
                }
            }
        }
        return PossibleMoveType.NO_MOVE;
    }

    checkMovePossibility(color) {
        for (let position = 0; position < this.NUM_ROWS; position++) {
            const piece = this.state.pieces[position];
            const [xFrom, yFrom] = this.getXAndY(position);
            if (piece != null && piece.color === color) {
                let pieceDraggable = new PieceDraggable(piece.color, piece.type, xFrom, yFrom);
                if (this.possibleMoves[position] == null) {
                    if (pieceDraggable.type === PieceTypes.SIMPLE)
                        this.possibleMoves[position] = this.getMovesSimplePiece(pieceDraggable);
                    else
                        this.possibleMoves[position] = this.getDoubleMovesPiece(pieceDraggable);
                }
                if (this.possibleMoves[position].length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    handleMovePiece(xFrom, yFrom, x, y) {
        const pieces = this.state.pieces.slice();
        const positionTarget = x + (y * this.NUM_ROWS_BY_LINE);
        const positionOrigin = xFrom + (yFrom * this.NUM_ROWS_BY_LINE);
        let pieceMoveChoose = null;
        for (let pm of this.possibleMoves[positionOrigin]) {
            if (pm.moves.slice(-1)[0] === positionTarget) {
                pieceMoveChoose = pm;
            }
        }
        for (let p of pieceMoveChoose.piecesTaken) {
            pieces[p] = null;
        }
        pieces[positionTarget] = pieces[positionOrigin];
        pieces[positionOrigin] = null;
        this.setState({ pieces: [], ...this.state }, () => {
            this.setState({
                pieces: pieces,
                count: this.state.count + 1
            })
        });
        this.handlePrepareNextPlay();
        this.putTheCrownIfNecessary(x, y);

    }

    putTheCrownIfNecessary(x, y) {
        const position = this.getPosition(x, + y);
        if ((this.state.pieces[position].color === ColorTypes.BLACK && y === 0) ||
            (this.state.pieces[position].color === ColorTypes.WHITE && y === 7)) {
            const pieces = this.state.pieces.slice();
            pieces[position].type = PieceTypes.DOUBLE;
            this.setState({
                pieces: pieces,
                count: this.state.count + 1
            });
        }
    }

    handleCanDragPiece(pieceDraggable) {
        if (pieceDraggable != null && (
            (this.state.whiteIsNext && ColorTypes.WHITE === pieceDraggable.color) ||
            (!this.state.whiteIsNext && ColorTypes.BLACK === pieceDraggable.color)
        )) {
            const position = this.getPosition(pieceDraggable.xFrom, pieceDraggable.yFrom);
            return this.possibleMoves[position] != null &&
                this.possibleMoves[position].length > 0;
        }
        return false;
    }

    isThePieceTurn(piece) {
        return ((this.state.whiteIsNext && piece.color == ColorTypes.WHITE) ||
            (!this.state.whiteIsNext && piece.color == ColorTypes.BLACK));
    }

    filterMovesWithMaxTakenPieces(maxTakenPiecesPossible, possibleMoves) {
        for (let position = 0; position < this.NUM_ROWS; position++) {
            if (this.state.pieces[position] != null
                && possibleMoves[position] != null) {
                possibleMoves[position] = possibleMoves[position].filter((ppm) =>
                    (ppm.piecesTaken.length == maxTakenPiecesPossible)) || [];
            }
        }
        return possibleMoves;
    }

    updatePossibleMoves() {
        let possibleMoves = this.possibleMoves.slice();
        let maxTakenPiecesPossible = 0;
        for (let position = 0; position < this.NUM_ROWS; position++) {
            const piece = this.state.pieces[position];
            const [xFrom, yFrom] = this.getXAndY(position);
            if (piece != null && this.isThePieceTurn(piece)) {
                let pieceDraggable = new PieceDraggable(piece.color, piece.type, xFrom, yFrom);
                possibleMoves[position] =
                    (pieceDraggable.type === PieceTypes.SIMPLE) ?
                        this.getMovesSimplePiece(pieceDraggable) :
                        this.getDoubleMovesPiece(pieceDraggable);
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

    handlePrepareNextPlay() {
        let blacksCount = 0;
        let whitesCount = 0;
        for (let piece of this.state.pieces.filter((p) => p != null)) {
            if (piece.color === ColorTypes.BLACK) {
                blacksCount++;
            } else if (piece.color === ColorTypes.WHITE) {
                whitesCount++;
            }
        }
        this.setState({
            ...this.state,
            whiteIsNext: !this.state.whiteIsNext,
            whitesCount: whitesCount,
            blacksCount: blacksCount
        });
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
        if (this.state.whiteIsNext && !this.checkMovePossibility(ColorTypes.WHITE)) {
            return PlayerNames.BLACK;
        } else if (!this.state.whiteIsNext && !this.checkMovePossibility(ColorTypes.BLACK)) {
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
                        whiteIsNext={this.state.whiteIsNext}
                        pieces={this.state.pieces}
                        handleMovePiece={this.handleMovePiece}
                        handleCanMovePiece={this.handleCanMovePiece}
                        handlePrepareNextPlay={this.handlePrepareNextPlay}
                        handleCanDragPiece={this.handleCanDragPiece}
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
