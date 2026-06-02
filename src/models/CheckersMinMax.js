import { ColorTypes, MinMaxPoints, PieceTypes } from "../Constants";
import CheckersHelper from "./CheckersHelper";
import { TurnInfo } from "./TurnInfo";

export default class CheckersMinMax {

    static globalOutputList = [];

    static getMMTurnMovementsPoints(pieces, originalPosition, ppm, whiteIsNext, deep, backtrack, tracePoints="", deepOriginal) {
        // obtem pontos
        let points = CheckersMinMax.getTurnMovementsPoints(pieces, originalPosition, ppm);
        let oldType = pieces[originalPosition].type;
        let backupPieces = []; // backup das pecas capturadas
        for (let position of ppm.piecesCaptured) {
            backupPieces.push(pieces[position]);
        }
        let newBacktrack = backtrack + ((whiteIsNext ? "W" : "B") + ppm.formatMovement());
        CheckersMinMax.applyTurnMoviments(pieces, originalPosition, ppm);
        let rtn = CheckersMinMax.negamax(pieces, !whiteIsNext, deep - 1, deepOriginal, newBacktrack, tracePoints + points + (!whiteIsNext?" - ":" + "));
        points -= rtn[2]
        CheckersMinMax.unapplyTurnMoviments(pieces, originalPosition, ppm, backupPieces, oldType);
        return [points, rtn[3], rtn[4]];
    }

    /**
     * Retorna a melhor peca e seu melhor movimento fazendo essa avaliacao de modo recursivo em até {@value deep} niveis.
     * Se o nivel da avaliacao buscado for 0 retorna 0 como o valor do minimax nesse estágio.
     * Se no estagio encontrado nao houverem mais movimentos possiveis um valor muito negativo é retornado. (isso é possivel?)
     * 
     * @param {*} pieces 
     * @param {*} whiteIsNext 
     * @param {*} deep 
     * @param {*} deepOriginal 
     * @returns 
     */
    static negamax(pieces, whiteIsNext, deep, deepOriginal=9999, backtrack="", tracePoints = "") {
        if (deep === 0) {
            return [null, null, 0, backtrack, tracePoints + "0"];
        }
        let turnInfo = new TurnInfo(whiteIsNext, pieces, null);
        if (!turnInfo.existsPossibleMove()) {
            return [null, null, - MinMaxPoints.IMPOSSIBILITY_MORE_MOVES, backtrack, tracePoints + "0"];
        }
        let points = 0;
        let maxPoints = null;
        let bestPpm = null;
        let bestPosition = null;
        let ffBacktrack = null;
        let ffTracePoints = null;
        if (deep === deepOriginal) {
            CheckersMinMax.globalOutputList = [];
        }
        // issues to think:
        // - piecesPossibleMoves <- entidades desconectadas... sempre novas
        // - pieces - > Piece <- mesma inicial <- "se perde" na remoção <- não remover... bolar outra coisa
        let letterTurn = whiteIsNext ? "W" : "B";
        for (let position = 0; position < turnInfo.piecesPossibleMoves.length; position++) {
            if (turnInfo.piecesPossibleMoves[position]) {
                for (let piecePossibleMove of turnInfo.piecesPossibleMoves[position]) {
                    let rtn = CheckersMinMax.getMMTurnMovementsPoints(pieces, position, piecePossibleMove, whiteIsNext, deep, backtrack, tracePoints, deepOriginal);
                    points = rtn[0]
                    if (maxPoints === null || points > maxPoints) {
                        maxPoints = points;
                        ffBacktrack = rtn[1];
                        ffTracePoints = rtn[2];
                        bestPosition = position;
                        bestPpm = piecePossibleMove;
                        if (deep === 1) {
                            CheckersMinMax.globalOutputList.push({"deep" : deep, "deepOriginal" : deepOriginal, "maxPoints" : maxPoints, 
                                "movement": letterTurn + piecePossibleMove.formatMovement(),
                                 "backtrack": backtrack, "tracePoints":tracePoints, "traceBkSubTotais": CheckersHelper.traceBkSubTotais(tracePoints + maxPoints)});
                        }
                    }
                }
            }
        }
        if (deep === deepOriginal) {
            console.log(CheckersMinMax.globalOutputList);
            console.log(CheckersHelper.sortBySubTotais(CheckersMinMax.globalOutputList));
            console.log("negamax-> deep=" + deep + "; deepOriginal=" + deepOriginal + "; maxPoints=" + maxPoints + "; bestPosition=" + letterTurn + bestPpm.formatMovement() +"; ffBacktrack=" + ffBacktrack +"; " + ffTracePoints)
            return [bestPosition, bestPpm, maxPoints, ffBacktrack, ffTracePoints];
        }
        return [bestPosition, bestPpm, maxPoints, ffBacktrack, ffTracePoints];
    }

    /**
     * Reseta pecas capturadas, colocando valor null
     * Reseta a posicao original da peca
     * Posiciona a peca na sua nova posicao, a ultima do seu movimento.
     * @param {*} pieces 
     * @param {*} originalPosition 
     * @param {*} ppm 
     */
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

    /**
     * Obtem a peca em sua posicao final resetando o seu tipo original e posicionando ela em sua posicao original
     * Reseta a posicao atual(nova posicao)
     * Cada peca capturada é reposicionada a partir do backup das pecas originais
     * @param {*} pieces 
     * @param {*} originalPosition 
     * @param {*} ppm 
     * @param {*} backupPieces 
     * @param {*} oldType 
     */
    static unapplyTurnMoviments(pieces, originalPosition, ppm, backupPieces, oldType) {
        let currentPosition = ppm.getLastMovePosition();
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

    /**
     * Calcula a pontuacao da jogada.
     * A pontuação é feita considerando que:
     * - cada peça capturada conta 15 pontos se for KING ou 10 pontos se for MAN
     * - cada peça movida na joga 2 pontos se for KING ou 1 se for MAN
     * - Se a ultima peça for eliminada na jogada a pontuacao somada é 1000
     * - Se na jogada se a peça se tornar KING a pontuacao é 20
     * @param {*} pieces peças presentes em cada posição do tabuileiro
     * @param {*} originalPosition posição da peça
     * @param {*} piecePossibleMoves movimentos e capturas possiveis a partir da peça
     * @returns pontuacao resultante da escolha da peça
     */
    static getTurnMovementsPoints(pieces, originalPosition, piecePossibleMoves) {
        let originalPiece = pieces[originalPosition];
        let points = 0;
        const numPiecesCaptured = piecePossibleMoves.piecesCaptured.length;
        for (let piecePosition of piecePossibleMoves.piecesCaptured) {
            points += pieces[piecePosition].type === PieceTypes.KING ?
                MinMaxPoints.CAPTURE_KING : MinMaxPoints.CAPUTRE_MAN;
        }
        points += piecePossibleMoves.moves.length * (originalPiece.type === PieceTypes.KING ? MinMaxPoints.MOVE_KING
            : MinMaxPoints.MOVE_MAN);
        const [whitesCount, blacksCount] = CheckersHelper.getTotalPiecesForColor(pieces);
        if (originalPiece.color === ColorTypes.WHITE && (blacksCount - numPiecesCaptured) === 0) {
            points += MinMaxPoints.ELIMINATE_LAST_PIECE;
        }
        if (originalPiece.color === ColorTypes.BLACK && (whitesCount - numPiecesCaptured) === 0) {
            points += MinMaxPoints.ELIMINATE_LAST_PIECE;
        }
        if (CheckersHelper.canPutTheCrown(originalPiece, piecePossibleMoves.moves[piecePossibleMoves.moves.length - 1])) {
            points += MinMaxPoints.BECAME_KING;
        }
        return points;
    }

}