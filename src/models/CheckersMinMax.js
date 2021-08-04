import { ColorTypes, MinMaxPoints, PieceTypes } from "../Constants";
import CheckersHelper from "./CheckersHelper";
import { TurnInfo } from "./TurnInfo";

export default class CheckersMinMax {

    static getMMTurnMovementsPoints(pieces, originalPosition, ppm, whiteIsNext, deep) {
        let points = CheckersMinMax.getTurnMovementsPoints(pieces, originalPosition, ppm);
        let oldType = pieces[originalPosition].type;
        let backupPieces = [];
        for (let position of ppm.piecesCaptured) {
            backupPieces.push(pieces[position]);
        }
        CheckersMinMax.applyTurnMoviments(pieces, originalPosition, ppm);
        points += 0 - CheckersMinMax.negamax(pieces, !whiteIsNext, deep - 1);
        CheckersMinMax.unapplyTurnMoviments(pieces, originalPosition, ppm,
            backupPieces, oldType);
        return points;
    }

    static negamax(pieces, whiteIsNext, deep, deepOriginal) {
        if (deep === 0) {
            return 0;
        }
        let turnInfo = new TurnInfo(whiteIsNext, pieces, null);
        if (!turnInfo.existsPossibleMove()) {
            return - MinMaxPoints.IMPOSSIBILITY_MORE_MOVES;
        }
        let points = 0;
        let maxPoints = null;
        let bestPpm = null;
        let bestPosition = null;
        // issues to think:
        // - piecesPossibleMoves <- entidades desconectadas... sempre novas
        // - pieces - > Piece <- mesma inicial <- "se perde" na remoção <- não remover... bolar outra coisa
        for (let position = 0; position < turnInfo.piecesPossibleMoves.length; position++) {
            if (turnInfo.piecesPossibleMoves[position]) {
                for (let piecePossibleMoves of turnInfo.piecesPossibleMoves[position]) {
                    points = CheckersMinMax.getMMTurnMovementsPoints(pieces, position,
                        piecePossibleMoves, whiteIsNext, deep);
                    if (maxPoints === null || points > maxPoints) {
                        maxPoints = points;
                        bestPosition = position;
                        bestPpm = piecePossibleMoves;
                    }
                }
            }
        }
        if (deep === deepOriginal) {
            return [bestPosition, bestPpm];
        }
        return maxPoints;
    }

    static applyTurnMoviments(pieces, originalPosition, ppm) {
        let piece = pieces[originalPosition];
        pieces[originalPosition] = null;
        for (let position of ppm.piecesCaptured) {
            pieces[position] = null;
        }
        const newPosition = ppm.moves[ppm.moves.length - 1];
        if (CheckersHelper.canPutTheCrown(piece, newPosition)) {
            piece.type = PieceTypes.KING;
        }
        pieces[newPosition] = piece;
    }

    static unapplyTurnMoviments(pieces, originalPosition, ppm, backupPieces,
        oldType) {
        let currentPosition = ppm.moves[ppm.moves.length - 1];
        let piece = pieces[currentPosition];
        piece.type = oldType;
        pieces[originalPosition] = piece;
        if (ppm.piecesCaptured) {
            for (let i = 0; i < ppm.piecesCaptured.length; i++) {
                pieces[ppm.piecesCaptured[i]] = backupPieces[i];
            }
        }
        pieces[currentPosition] = null;
    }

    static getTurnMovementsPoints(pieces, originalPosition, ppm) {

        let originalPiece = pieces[originalPosition];
        let points = 0;
        const numPiecesCaptured = ppm.piecesCaptured.length;
        for (let piecePosition of ppm.piecesCaptured) {
            points += pieces[piecePosition].type === PieceTypes.KING ?
                MinMaxPoints.CAPTURE_KING : MinMaxPoints.CAPUTRE_MAN;
        }
        points += ppm.moves.length * (originalPiece.type === PieceTypes.KING ? MinMaxPoints.MOVE_KING
            : MinMaxPoints.MOVE_MAN);
        const [whitesCount, blacksCount] = CheckersHelper.getTotalPiecesForColor(pieces);
        if (originalPiece.color === ColorTypes.WHITE && (blacksCount - numPiecesCaptured) === 0) {
            points += MinMaxPoints.ELIMINATE_LAST_PIECE;
        }
        if (originalPiece.color === ColorTypes.BLACK && (whitesCount - numPiecesCaptured) === 0) {
            points += MinMaxPoints.ELIMINATE_LAST_PIECE;
        }
        if (CheckersHelper.canPutTheCrown(originalPiece, ppm.moves[ppm.moves.length - 1])) {
            points += MinMaxPoints.BECAME_KING;
        }

        return points;
    }

}