import { GameDefintions, DiagonalTypes, ColorTypes, PieceTypes } from '../Constants';
import { PiecePossibleMoves } from './PiecePossibleMoves';
import { PositionedPiece } from './PositionedPiece';
import { Piece } from './Piece';

export default class CheckersHelper {
    static DIAGONAL_TYPES_LIST = [DiagonalTypes.LEFT_DOWN, DiagonalTypes.LEFT_UP,
    DiagonalTypes.RIGHT_DOWN, DiagonalTypes.RIGHT_UP];


    static isThePieceTurn(piece, whiteIsNext) {
        return ((whiteIsNext && piece.color === ColorTypes.WHITE) ||
            (!whiteIsNext && piece.color === ColorTypes.BLACK));
    }

    static getPosition(x, y) {
        return y * GameDefintions.NUM_ROWS_BY_LINE + x;
    }

    static getXAndY(position) {
        return [position % GameDefintions.NUM_ROWS_BY_LINE, Math.trunc(position / GameDefintions.NUM_ROWS_BY_LINE)];
    }

    static getXY(position) {
        return "" + 
            (position % GameDefintions.NUM_ROWS_BY_LINE) + 
            (
                Math.trunc(position / GameDefintions.NUM_ROWS_BY_LINE));
    }

    static getPositionFromXY(xy) {
        return Number.parseInt(xy[1]) * 8 + Number.parseInt(xy[0]);
    }

    static getY(position) {
        return Math.trunc(position / GameDefintions.NUM_ROWS_BY_LINE);
    }

    static getDiagonalSize(x, y, diagonalType) {
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

    static getManCaptureMoves(positionedPiece, moves, pieceCapturedPositions, pieces) {
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
                enemyPositionMoreOne,
                this.getOpositeColor(positionedPiece.color),
                pieces)
                && pieceCapturedPositions.filter((positionCaptured) =>
                    positionCaptured === enemyPosition).length === 0) {
                upperMoves.push(
                    this.getManCaptureMoves(positionedPiece,
                        moves.concat(enemyPositionMoreOne),
                        pieceCapturedPositions.concat(enemyPosition),
                        pieces)
                );
            }
        }
        let ppmList = [];
        if (upperMoves.length === 0 && moves.length > 0) {
            let pieceCapturedTypes = pieces.filter(function(element, index, array) {
                 return pieceCapturedPositions.includes(index);
                }).map(e => e.type);
            ppmList.push(new PiecePossibleMoves(positionedPiece.position, moves, pieceCapturedPositions, pieceCapturedTypes, positionedPiece.type));
        } else {
            for (let moveItens of upperMoves) {
                for (let miniMove of moveItens) {
                    ppmList.push(miniMove);
                }
            }
        }
        return ppmList;
    }

    static getKingNonCaptureMoves(position, pieces) {
        const [xFrom, yFrom] = this.getXAndY(position);
        let positions = [];
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const size = this.getDiagonalSize(xFrom, yFrom, diagonalType);
            const [operationX, operationY] = this.getDiagonalOperations(diagonalType);
            if (size > 0) {
                for (let i = 1; i <= size; i++) {
                    const [x, y] = [xFrom + operationX * i, yFrom + operationY * i];
                    if (pieces[this.getPosition(x, y)] != null)
                        break;
                    else
                        positions.push(this.getPosition(x, y));
                }
            }
        }
        return positions.map((p) => new PiecePossibleMoves(position, [p], [], [], p.type));
    }

    static getDiagonalOperations(diagonalType) {
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

    static getOpositeColor(color) {
        return color === ColorTypes.WHITE ? ColorTypes.BLACK : ColorTypes.WHITE;
    }

    static getKingDiagonalCaptureMoves(xFrom, yFrom, opositeColor, size,
        diagonalType, piecesCaptured, pieces) {
        let enemyPosition = null;
        let positionsMoved = [];
        let [operationX, operationY] =
            this.getDiagonalOperations(diagonalType);
        for (let i = 1; i <= size; i++) {
            const [x, y] = [xFrom + operationX * i, yFrom + operationY * i];
            const [pos, posMoreOne] = [this.getPosition(x, y),
            this.getPosition(x + operationX, y + operationY)]
            if (enemyPosition != null && pieces[pos] != null) {
                break;
            } else if (enemyPosition != null
                && pieces[pos] === null
                // eslint-disable-next-line
                && piecesCaptured.filter((p) => p === enemyPosition).length === 0
            ) {
                positionsMoved.push(pos);
            } else if (enemyPosition === null
                && pieces[this.getPosition(x, y)] != null) {
                if (this.canCapture(pos, posMoreOne, opositeColor, pieces)) {
                    enemyPosition = this.getPosition(x, y);
                } else {
                    break;
                }
            }
        }
        return [positionsMoved, enemyPosition];
    }

    static getKingCaptureMoves(positionedPiece, moves, pieceCapturedPositions, pieces) {
        const position = moves.length > 0 ? moves.slice(-1)[0] : positionedPiece.position;
        const [xFrom, yFrom] = this.getXAndY(position);
        let upperMoves = [];
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const size = this.getDiagonalSize(xFrom, yFrom, diagonalType);
            if (size > 1) {
                const [newMovesPositions, enemyPosition] =
                    this.getKingDiagonalCaptureMoves(xFrom, yFrom,
                        this.getOpositeColor(positionedPiece.color),
                        size, diagonalType, pieceCapturedPositions, pieces);
                for (let pos of newMovesPositions) {
                    upperMoves.push(this.getKingCaptureMoves(positionedPiece,
                        moves.concat(pos), pieceCapturedPositions.concat(enemyPosition),
                        pieces));
                }
            }
        }
        let arr = [];
        if (upperMoves.length === 0 && moves.length > 0) {
            let pieceCapturedTypes = pieces.filter((element, index, array) => pieceCapturedPositions.includes(index)).map(e => e.type);               
            arr.push(new PiecePossibleMoves(positionedPiece.position, moves, pieceCapturedPositions, pieceCapturedTypes, positionedPiece.type));
        } else {
            for (let moveItens of upperMoves) {
                for (let miniMove of moveItens) {
                    arr.push(miniMove);
                }
            }
        }
        return arr;
    }

    /**
     * FIXME - Entender essa logica
     * @param {*} position1 
     * @param {*} position2 
     * @param {*} opositeColor 
     * @param {*} pieces 
     * @returns 
     */
    static canCapture(position1, position2, opositeColor, pieces) {
        return pieces[position1] != null
            && pieces[position2] === null
            && pieces[position1].color === opositeColor;
    }

    /**
     * Valida se existe captura possivel a partir de uma peça especifica.
     * FIXME - Entender essa logica
     * @param {*} positionedPiece 
     * @param {*} pieces 
     * @returns 
     */
    static canManCaptures(positionedPiece, pieces) {
        const [x, y] = this.getXAndY(positionedPiece.position);
        for (let diagonalType of this.DIAGONAL_TYPES_LIST) {
            const [xOperation, yOperation] = this.getDiagonalOperations(diagonalType);
            if (this.getDiagonalSize(x, y, diagonalType) > 1
                && this.canCapture(this.getPosition(x + xOperation, y + yOperation),
                    this.getPosition(x + 2 * xOperation, y + 2 * yOperation),
                    this.getOpositeColor(positionedPiece.color),
                    pieces)
            ) {
                return true;
            }
        }
        return false;
    }

    static getManYOperation(positionedPiece) {
        const y = this.getY(positionedPiece.position);
        if (positionedPiece.color === ColorTypes.WHITE && y + 1 <= 7) {
            return 1;
        } else if (positionedPiece.color === ColorTypes.BLACK && (y - 1) >= 0) {
            return -1;
        }
        return null;
    }

    /**
     * Retorna os movimentos possiveis a partir de uma peca posicionada e as pecas que seriam capturadas nesses movimentos.
     * 
     * @param {*} positionedPiece 
     * @param {*} pieces 
     * @returns 
     */
    static getManMoves(positionedPiece, pieces) {
        let ppmList = [];
        const [x, y] = this.getXAndY(positionedPiece.position);
        // movimentos de captura
        if (this.canManCaptures(positionedPiece, pieces)) {
            let piecePossibleMoves = this.getManCaptureMoves(positionedPiece, [], [], pieces);
            const maxSize = piecePossibleMoves.reduce(
                (prev, curr) =>
                    (prev.moves.length > curr.moves.length) ? prev : curr
            ).moves.length;
            return piecePossibleMoves.filter((pos) => pos.moves.length === maxSize);
            // movimentos normais
        } else {
            let yOperation = this.getManYOperation(positionedPiece);
            // valida a esquerda e a direita para cima ou para baixo, dependendo do tipo de peca
            for (let xPart of [x - 1, x + 1]) {
                const lastPosition = this.getPosition(xPart, y + yOperation);
                // ve se movimento excede os limites laterais e se o destino nao tem uma peca nele
                if (xPart >= 0 && xPart <= 7 && yOperation != null && pieces[lastPosition] === null) {
                    ppmList.push(new PiecePossibleMoves(positionedPiece.position, [lastPosition], [], [], positionedPiece.type));
                }
            }
        }
        return ppmList;
    }

    static getKingMoves(positionedPiece, pieces) {
        const position = positionedPiece.position;
        let piecePossibleMoves = this.getKingCaptureMoves(positionedPiece, [], [], pieces);
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
            let nearPositions = this.getKingNonCaptureMoves(position, pieces);
            return nearPositions.filter((ppms) =>
                pieces[ppms.moves.slice(-1)[0]] === null);
        }
    }

    static getTotalPiecesForColor = (pieces) => {
        let whitesCount = 0;
        let blacksCount = 0;
        for (let piece of pieces.filter((p) => p != null)) {
            if (piece.color === ColorTypes.BLACK) {
                blacksCount++;
            } else if (piece.color === ColorTypes.WHITE) {
                whitesCount++;
            }
        }
        return [whitesCount, blacksCount];
    }

    static mountInitialPieces() {
        let pieces = [];
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
        return pieces;
    }

    static filterMovesWithMaxCapturedPieces(maxCapturedPiecesPossible, possibleMoves, pieces) {
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (pieces[position] != null
                && possibleMoves[position] != null) {
                possibleMoves[position] = possibleMoves[position].filter((ppm) =>
                    (ppm.piecesCaptured.length === maxCapturedPiecesPossible)) || [];
            }
        }
        return possibleMoves;
    }

    /**
     * Cria uma lista com uma entrada para cada peca ocupada por um objeto null ou uma lista de possiveis movimentos.
     * Entradas de movimentos validos sao transformadas em null ou conjunto vazio se nao tiverem o numero maximo da capturas possiveis
     * no caso de existirem capturas.
     * @param {*} pieces 
     * @param {*} whiteIsNext 
     * @returns 
     */
    static getPossibleMoves(pieces, whiteIsNext) {
        let possibleMoves = [];
        let maxCapturedPiecesPossible = 0;
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            const piece = pieces[position];
            if (piece != null && this.isThePieceTurn(piece, whiteIsNext)) {
                let positionedPiece = new PositionedPiece(piece.color, piece.type, position);
                possibleMoves.push(positionedPiece.type === PieceTypes.MAN ?
                        CheckersHelper.getManMoves(positionedPiece, pieces) :
                        CheckersHelper.getKingMoves(positionedPiece, pieces)
                );
            } else {
                possibleMoves.push(null);
            }
        }
        for (let position = 0; position < GameDefintions.NUM_ROWS; position++) {
            if (possibleMoves[position] != null) {
                for (let ppm of possibleMoves[position]) {
                    maxCapturedPiecesPossible = Math.max(maxCapturedPiecesPossible, ppm.piecesCaptured.length);
                }
            }
        }
        if (maxCapturedPiecesPossible > 0) {
            possibleMoves = this.filterMovesWithMaxCapturedPieces(maxCapturedPiecesPossible, possibleMoves, pieces);
        }
        return possibleMoves;
    }

    static canPutTheCrown(piece, position) {
        const y = CheckersHelper.getY(position);
        return (((piece.color === ColorTypes.BLACK && y === 0) ||
            (piece.color === ColorTypes.WHITE && y === 7)) &&
            piece.type !== PieceTypes.KING);
    }

    static canDragPiece(turnInfo, positionedPiece) {
        if (positionedPiece === null || turnInfo.playerColor !== positionedPiece.color) {
            return false;
        }
        const position = positionedPiece.position;
        if (turnInfo.currentStep === 1) {
            return (turnInfo.piecesPossibleMoves[position] != null &&
                turnInfo.piecesPossibleMoves[position].length > 0);
        }
        if (turnInfo.piecesPossibleMoves[turnInfo.originalPosition] != null &&
            turnInfo.piecesPossibleMoves[turnInfo.originalPosition].length > 0) {
            for (let pm of turnInfo.piecesPossibleMoves[turnInfo.originalPosition]) {
                if (pm.moves.length >= turnInfo.currentStep &&
                    pm.moves[turnInfo.currentStep - 2] === positionedPiece.position) {
                    return true;
                }
            }
        }
        return false;
    }

    static canDoMove(turnInfo, dropPosition) {
        if (turnInfo.piecesPossibleMoves[turnInfo.originalPosition] === null) {
            return false;
        }
        for (let p of turnInfo.piecesPossibleMoves[turnInfo.originalPosition]) {
            if (p.moves[turnInfo.currentStep - 1] === dropPosition) {
                if (turnInfo.currentStep === 1) {
                    return true;
                }
                let achou = true;
                for (let i = 0; i < turnInfo.currentStep - 1; i++) {
                    if (p.moves[i] !== turnInfo.movesChosen[i]) {
                        achou = false;
                    }
                }
                if (achou) {
                    return true;
                }
            }
        }
        return false;
    }

    static getPiecesSubList(pieces, positions) {
        let piecesSubList = [];
        for (let position of positions) {
            piecesSubList.push(pieces[position]);
        }
        return piecesSubList;
    }
    
    static traceBkSubTotais(traceBack) {
        let parts = traceBack.split(/\s[+-]\s/);    
        let subtotais = [];
        for (let i =0; i < parts.length; i++) {
            let subtotal = 0;
            for (let j=i; j < parts.length; j++) {
                subtotal = subtotal + (parts[j] * ((j-i) % 2 === 0 ? 1 : -1));
            }
            subtotais.push(subtotal);
        }
        return subtotais;
    }

    static sortBySubTotais(outputs) {
        return outputs.sort(function(a, b) {
            let aTotais = a["traceBkSubTotais"];
            let bTotais = b["traceBkSubTotais"];
            if (aTotais[0] !== bTotais[0])
                return aTotais[0] < bTotais[0] ? 1 : -1;
            if (aTotais[1] !== bTotais[1])
                return aTotais[1] < bTotais[1] ? 1 : -1;  
            if (aTotais[2] !== bTotais[2])
                return aTotais[2] < bTotais[2] ? 1 : -1;
            if (aTotais[3] !== bTotais[3])
                return aTotais[3] < bTotais[3] ? 1 : -1;
            if (aTotais[4] !== bTotais[4])
                return aTotais[4] < bTotais[4] ? 1 : -1;                                                                   
            if (aTotais[5] !== bTotais[5])
                return aTotais[5] < bTotais[5] ? 1 : -1;              
            return 0;                       
        });

    }

    static updatePieceInUndoPlay(pieces, ppm, whiteIsNext) {
        const dropPosition = ppm.getLastMovePosition();
        pieces[ppm.originalPosition] = pieces[dropPosition];
        pieces[ppm.originalPosition].type = ppm.originalType;
        pieces[dropPosition] = null;
        const opositeColor = whiteIsNext ? ColorTypes.BLACK : ColorTypes.WHITE;
        for (let i = 0 ; i < ppm.piecesCaptured.length; i++) {
            pieces[ppm.piecesCaptured[i]] = new Piece(opositeColor, ppm.piecesCapturedTypes[i]);
        }
    }    

    static updatePiecesInTheTurnEnd(pieces, originalPosition, ppm) {
        const dropPosition = ppm.getLastMovePosition();
        pieces[dropPosition] = pieces[originalPosition];
        pieces[originalPosition] = null;
        for (let p of ppm.piecesCaptured) {
            pieces[p] = null;
        }
        if (CheckersHelper.canPutTheCrown(pieces[dropPosition], dropPosition)) {
            pieces[dropPosition].type = PieceTypes.KING;
        }
    }

    static getPiecesCapturedType(piecePossibleMoves, pieces) {
        var types = [];
        for (let i = 0; i < piecePossibleMoves.getPiecesCapturedPosition().length; i++) {
            var position = piecePossibleMoves.getPiecesCapturedPosition()[i];
            var piece = pieces[position];
            types.push(piece.type);
        }
        return types;
    }
}
