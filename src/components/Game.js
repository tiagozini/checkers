import React from 'react';
import { Piece } from '../models/Piece';
import { PiecePossibleMoves } from '../models/PiecePossibleMoves';
import { PositionedPiece } from '../models/PositionedPiece';
import { Board } from './Board';

import {
    ColorTypes, PieceTypes, PossibleMoveType, PlayerNames, DiagonalTypes,
    GameDefintions, GameMode, DraggableCapability
} from '../Constants';
import { TurnInfo } from '../models/TurnInfo';

export class Game extends React.Component {

    constructor(props) {
        super(props);
        this.DIAGONAL_TYPES_LIST = [DiagonalTypes.LEFT_DOWN, DiagonalTypes.LEFT_UP,
        DiagonalTypes.RIGHT_DOWN, DiagonalTypes.RIGHT_UP];
        this.state = this.mountInitialState(GameMode.AGAINST_COMPUTER);
        this.possibleMoves = [];
        this.turnInfo = new TurnInfo(ColorTypes.WHITE)
        for (let i = 0; i < GameDefintions.NUM_ROWS; i++) {
            this.possibleMoves.push(null);
        }

        this.handleMovePiece = this.handleMovePiece.bind(this);
        this.handleCanMovePiece = this.handleCanMovePiece.bind(this);
        this.handleCanDragPiece = this.handleCanDragPiece.bind(this);
        this.getManMoves = this.getManMoves.bind(this);
        this.getManCaptureMoves = this.getManCaptureMoves.bind(this);
        this.canManCaptures = this.canManCaptures.bind(this);
        this.getKingCaptureMoves = this.getKingCaptureMoves.bind(this);
        this.getKingNonCaptureMoves = this.getKingNonCaptureMoves.bind(this);
        this.updatePossibleMoves = this.updatePossibleMoves.bind(this);
        this.getPosition = this.getPosition.bind(this);
        this.getXAndY = this.getXAndY.bind(this);
        this.isThePieceTurn = this.isThePieceTurn.bind(this);
        this.filterMovesWithMaxCapturedPieces = this.filterMovesWithMaxCapturedPieces.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.resetPossibleMoves = this.resetPossibleMoves.bind(this);
        this.handleGameModeChange = this.handleGameModeChange.bind(this);
        this.doComputerPlay = this.doComputerPlay.bind(this);
    }

    restartGame() {
        let gameMode = document.getElementById("gameMode").value;
        this.setState(this.mountInitialState(gameMode));
        this.turnInfo = new TurnInfo(ColorTypes.WHITE)
        this.resetPossibleMoves();
    }

    handleGameModeChange(e) {
        let value = e.target.value;
        this.setState({ ...this.state, gameMode: value });
        this.restartGame();
    }

    resetPossibleMoves() {
        this.possibleMoves = [];
        for (let i = 0; i < GameDefintions.NUM_ROWS; i++) {
            this.possibleMoves.push(null);
        }
    }

    mountInitialState(gameMode) {
        const pieces = [];
        for (let i = 0; i < GameDefintions.NUM_ROWS; i++) {
            const lineNumberRest = Math.trunc((i) / GameDefintions.NUM_ROWS_BY_LINE);
            const even = ((lineNumberRest + i) % 2) === 0;
            if (i >= 0 && i < 24 && !even) {
                pieces.push(new Piece(ColorTypes.WHITE, PieceTypes.MAN));
            } else if (i >= 40 && i < GameDefintions.NUM_ROWS && !even) {
                pieces.push(new Piece(ColorTypes.BLACK, PieceTypes.MAN));
            } else {
                pieces.push(null);
            }
        }
        return {
            whiteIsNext: true,
            pieces: pieces,
            whitesCount: 12,
            blacksCount: 12,
            count: 1,
            gameMode: gameMode
        }
    }

    getPosition(x, y) {
        return y * GameDefintions.NUM_ROWS_BY_LINE + x;
    }

    getXAndY(position) {
        return [position % GameDefintions.NUM_ROWS_BY_LINE, Math.trunc(position / GameDefintions.NUM_ROWS_BY_LINE)];
    }

    getY(position) {
        return Math.trunc(position / GameDefintions.NUM_ROWS_BY_LINE);
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

    getManCaptureMoves(positionedPiece, moves, piecesCaptured) {
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
                && piecesCaptured.filter((positionCaptured) =>
                    positionCaptured === enemyPosition).length === 0) {
                upperMoves.push(
                    this.getManCaptureMoves(positionedPiece,
                        moves.concat(enemyPositionMoreOne),
                        piecesCaptured.concat(enemyPosition))
                );
            }
        }
        let ppmList = [];
        if (upperMoves.length === 0 && moves.length > 0) {
            ppmList.push(new PiecePossibleMoves(moves, piecesCaptured));
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

    getKingDiagonalCaptureMoves(xFrom, yFrom, opositeColor, size, diagonalType, piecesCaptured) {
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
                && piecesCaptured.filter((p) => p === enemyPosition).length === 0
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

    getKingCaptureMoves(positionedPiece, moves, piecesCaptured) {
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
                        size, diagonalType, piecesCaptured);
                for (let pos of newMovesPositions) {
                    upperMoves.push(this.getKingCaptureMoves(positionedPiece,
                        moves.concat(pos), piecesCaptured.concat(enemyPosition)));
                }
            }
        }
        let arr = [];
        if (upperMoves.length === 0 && moves.length > 0) {
            arr.push(new PiecePossibleMoves(moves, piecesCaptured));
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

    handleCanMovePiece(positionedPiece, dropPosition) {
        this.turnInfo.updateOriginalPosition(positionedPiece);
        const originalPosition = this.turnInfo.originalPosition;
        if (this.turnInfo.piecesPossibleMoves[originalPosition] != null) {
            for (let p of this.turnInfo.piecesPossibleMoves[originalPosition]) {
                if (p.moves[this.turnInfo.currentStep - 1] === dropPosition) {
                    return PossibleMoveType.LAST_MOVE;
                }
            }
        }
        return PossibleMoveType.NO_MOVE;
    }

    existsPossibleMove(color) {
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            const piece = this.state.pieces[position];
            if (piece != null && piece.color === color) {
                if (this.turnInfo.currentStep === 1 && this.turnInfo.piecesPossibleMoves[position]) {
                    return true;
                }
                for (let position2 = 0; position2 < GameDefintions.NUM_ROWS; position2++) {
                    if (
                        this.turnInfo.piecesPossibleMoves[position2]) {
                        for (let ppm of this.turnInfo.piecesPossibleMoves[position2]) {
                            if (ppm.moves.length >= this.turnInfo.currentStep &&
                                this.turnInfo.currentStep > 1 &&
                                ppm.moves[this.turnInfo.currentStep - 2] === position) {
                                return true;
                            }
                        }
                    }
                }
                //if (this.turnInfo.piecesPossibleMoves[position].length > 0) {
                //   return true;
                // }
            }
        }
        return false;
    }

    handleMovePiece = (dragPosition, dropPosition) => {
        this.turnInfo.storeMove(dropPosition);
        let pieces = this.state.pieces.slice();
        pieces[dropPosition] = pieces[dragPosition];
        pieces[dragPosition] = null;
        let whiteIsNext = this.state.whiteIsNext;
        if (this.turnInfo.finished) {
            for (let p of this.turnInfo.capturedPiecePositions) {
                pieces[p] = null;
            }
            whiteIsNext = !this.state.whiteIsNext;
            if (this.canPutTheCrown(pieces[dropPosition], dropPosition)) {
                pieces[dropPosition].type = PieceTypes.KING;
            }
            const currentColor = whiteIsNext ? ColorTypes.WHITE : ColorTypes.BLACK;
            this.turnInfo = new TurnInfo(currentColor);
        }
        const [blacksCount, whitesCount] = this.getPieceQuantities(pieces);
        this.setState({
            ...this.state, pieces: pieces,
            count: this.state.count + 1,
            blacksCount: blacksCount,
            whitesCount: whitesCount,
            whiteIsNext: whiteIsNext
        });
        this.updatePossibleMoves();
        if (!whiteIsNext && this.state.gameMode === GameMode.AGAINST_COMPUTER) {
            this.doComputerPlay();
        }
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
            if (this.turnInfo.currentStep === 1) {
                if (this.possibleMoves[position] != null &&
                    this.possibleMoves[position].length > 0) {
                    return (!this.state.whiteIsNext &&
                        this.state.gameMode === GameMode.AGAINST_COMPUTER ?
                        DraggableCapability.COMPUTER_CAN : DraggableCapability.PLAYER_CAN);
                }
            } else {
                if (this.possibleMoves[this.turnInfo.originalPosition] != null &&
                    this.possibleMoves[this.turnInfo.originalPosition].length > 0) {
                    for (let pm of this.possibleMoves[this.turnInfo.originalPosition]) {
                        if (pm.moves.length >= this.turnInfo.currentStep &&
                            pm.moves[this.turnInfo.currentStep - 2] === positionedPiece.position) {
                            return (!this.state.whiteIsNext &&
                                this.state.gameMode === GameMode.AGAINST_COMPUTER ?
                                DraggableCapability.COMPUTER_CAN : DraggableCapability.PLAYER_CAN);

                        }
                    }
                }
            }
        }
        return DraggableCapability.CANNOT;
    }

    isThePieceTurn(piece) {
        return ((this.state.whiteIsNext && piece.color === ColorTypes.WHITE) ||
            (!this.state.whiteIsNext && piece.color === ColorTypes.BLACK));
    }

    filterMovesWithMaxCapturedPieces(maxCapturedPiecesPossible, possibleMoves) {
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (this.state.pieces[position] != null
                && possibleMoves[position] != null) {
                possibleMoves[position] = possibleMoves[position].filter((ppm) =>
                    (ppm.piecesCaptured.length === maxCapturedPiecesPossible)) || [];
            }
        }
        return possibleMoves;
    }

    updatePossibleMoves() {
        if (this.turnInfo.currentStep > 1) {
            this.possibleMoves = this.turnInfo.piecesPossibleMoves;
        } else {
            let possibleMoves = this.possibleMoves.slice();
            let maxCapturedPiecesPossible = 0;
            for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
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
            for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
                if (possibleMoves[position] != null) {
                    for (let ppm of possibleMoves[position]) {
                        maxCapturedPiecesPossible = Math.max(maxCapturedPiecesPossible,
                            ppm.piecesCaptured.length);
                    }
                }
            }
            if (maxCapturedPiecesPossible > 0) {
                possibleMoves = this.filterMovesWithMaxCapturedPieces(maxCapturedPiecesPossible,
                    possibleMoves);
            }
            this.possibleMoves = possibleMoves;
            this.turnInfo.updatePossibleMoves(possibleMoves.slice());
        }
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
        for (let i = 0; i < GameDefintions.NUM_ROWS; i++) {
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

    doComputerPlay() {
        let qtdTotal = 0;
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (this.turnInfo.piecesPossibleMoves[position]) {
                qtdTotal += this.turnInfo.piecesPossibleMoves[position].length
            }
        }
        let moveChosen = Math.trunc(Math.random(qtdTotal) * qtdTotal);
        let iPos = 0;
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (this.turnInfo.piecesPossibleMoves[position] != null) {
                for (let ppm of this.turnInfo.piecesPossibleMoves[position]) {
                    iPos += 1;
                    if (iPos === moveChosen + 1) {
                        setTimeout(() => {
                            let dragPosition = this.turnInfo.currentStep > 1 ?
                                ppm.moves[this.turnInfo.currentStep - 2] :
                                position;
                            this.handleMovePiece(dragPosition,
                                ppm.moves[this.turnInfo.currentStep - 1]);
                        }, 1500);
                        return;
                    }
                }
            }
        }
    }

    render() {
        this.updatePossibleMoves();
        const winner = this.getTheWinner();
        let status;

        if (winner) {
            status = <span>Winner: <b>{winner}</b></span>;
        } else {
            status = <span>Next player: <b>{this.state.whiteIsNext ? 'White' : 'Black'}</b></span>;
        }
        return (
            <div className="game">
                <div className="game-presentation">
                    <p>Welcome to Checkers game!</p>
                </div>
                <div className="game-board">
                    <Board
                        numRowsByLine={GameDefintions.NUM_ROWS_BY_LINE}
                        numRows={GameDefintions.NUM_ROWS}
                        handleCanMovePiece={this.handleCanMovePiece}
                        handleCanDragPiece={this.handleCanDragPiece}
                        handleMovePiece={this.handleMovePiece}
                        whiteIsNext={this.state.whiteIsNext}
                        pieces={this.state.pieces}
                        count={this.state.count}
                    />
                </div>
                <div className="game-info clearfix">
                    <p>{status}</p>
                    <p>Whites: {this.state.whitesCount}</p>
                    <p>Blacks: {this.state.blacksCount}</p>
                    <p><button onClick={this.restartGame}>Restart</button></p>
                    <p>Adversary:<br />
                        <select name="gameMode" id="gameMode" value={this.state.gameMode} onChange={this.handleGameModeChange}>
                            <option value={GameMode.ALONE}>Yourself</option>
                            <option value={GameMode.AGAINST_COMPUTER}>Computer</option>
                        </select>
                    </p>
                </div>
                <div className="game-footer clearfix">
                    <span>Criado por<br /><b>Tiago Peterlevitz Zini</b></span>
                    <span><b>&copy; 2021</b></span>
                    <span><a href="https://github.com/tiagozini" target="blank">tiagozini@github.com</a></span>
                </div>
            </div>
        );
    }
}
