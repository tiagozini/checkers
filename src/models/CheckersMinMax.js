import { ColorTypes, MinMaxPoints, PieceTypes } from "../Constants";
import CheckersHelper from "./CheckersHelper";
import { Piece } from "./Piece";
import { TurnInfo } from "./TurnInfo";

export default class CheckersMinMax {

    static getMMTurnMovementsPoints(pieces, originalPosition, ppm, whiteIsNext, deep) {
        let points = CheckersMinMax.getTurnMovementsPoints(pieces, originalPosition, ppm);
        const piecesCapturedType =
            CheckersHelper.getPieces(pieces, ppm.piecesCaptured).map(
                (p) => p.type);
        let oldType = pieces[originalPosition].type;
        CheckersMinMax.applyTurnMoviments(pieces, originalPosition, ppm);
        points += 0 - CheckersMinMax.negamax(pieces, !whiteIsNext, deep - 1);
        CheckersMinMax.unapplyTurnMoviments(pieces, originalPosition, ppm,
            piecesCapturedType, oldType);
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
        for (let posicao = 0; posicao < turnInfo.piecesPossibleMoves.length; posicao++) {
            if (turnInfo.piecesPossibleMoves[posicao]) {
                points = 0;
                for (let piecePossibleMoves of turnInfo.piecesPossibleMoves[posicao]) {
                    points = CheckersMinMax.getMMTurnMovementsPoints(pieces, posicao,
                        piecePossibleMoves, whiteIsNext, deep);
                    if (maxPoints === null || points > maxPoints) {
                        maxPoints = points;
                        bestPosition = posicao;
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
        for (let posicao of ppm.piecesCaptured) {
            pieces[posicao] = null;
        }
        const newPosition = ppm.moves[ppm.moves.length - 1];
        if (CheckersHelper.canPutTheCrown(piece, newPosition)) {
            piece.type = PieceTypes.KING;
        }
        pieces[newPosition] = piece;
    }

    static unapplyTurnMoviments(pieces, originalPosition, ppm, piecesCapturedType,
        oldType) {
        let currentPosition = ppm.moves[ppm.moves.length - 1];
        let piece = pieces[currentPosition];
        piece.type = oldType;
        let enemyColor = piece.color === ColorTypes.WHITE ? ColorTypes.BLACK : ColorTypes.WHITE;
        pieces[originalPosition] = piece;
        if (ppm.piecesCaptured) {
            for (let i = 0; i < ppm.piecesCaptured.length; i++) {
                pieces[ppm.piecesCaptured[i]] = new Piece(enemyColor, piecesCapturedType[i]);
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