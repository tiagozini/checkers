import { ColorTypes, MinMaxPoints, PieceTypes, PriorizerStrategy } from "../Constants";
import CheckersHelper from "./CheckersHelper";
import { TurnInfo } from "./TurnInfo";

export default class CheckersMinMaxV2 {

    static globalOutputList = [];
    static globalBestList = [];
    static INFINITY_POS = 999999;
    static INFINITY_NEG = -999999;
    static getMMTurnMovementsPoints(pieces, originalPosition, ppm, minimizar, deep, deepOriginal, priorizerStrategy, alfa, beta) {
        // obtem pontos
        let oldType = pieces[originalPosition].type;
        let backupPieces = []; // backup das pecas capturadas
        for (let position of ppm.piecesCaptured) {
            backupPieces.push(pieces[position]);
        }
        CheckersMinMaxV2.applyTurnMoviments(pieces, originalPosition, ppm);
        let rtn = CheckersMinMaxV2.negamax(pieces, !minimizar, deep - 1, deepOriginal, priorizerStrategy, alfa, beta);
        CheckersMinMaxV2.unapplyTurnMoviments(pieces, originalPosition, ppm, backupPieces, oldType);
        return rtn;
    }

    static avaliar(pieces) {
        let total = 0.0;
        for (let position = 0; position < pieces.length; position++) {
            if (pieces[position] != null) {
                total += (pieces[position].type === PieceTypes.MAN ? 1.0 : 1.75) * (pieces[position].color === ColorTypes.BLACK ? 1 : -1); 
            }
        }
        //console.log("avaliar: " + total);
        return total;
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
     * @param {*} backtrack 
     * @param {*} tracePoints 
     * @param {*} priorizerStrategy 
     * @param {*} alfa 
     * @param {*} beta 
     * @returns [maxPoint, bestPpm]
     */
    static negamax(pieces, minimizar, deep, deepOriginal=9999, priorizerStrategy = PriorizerStrategy.STANDARD, alfa=CheckersMinMaxV2.INFINITY_NEG, beta=CheckersMinMaxV2.INFINITY_POS) {
        if (deep === 0) {
            return [this.avaliar(pieces), null]
        }
        let turnInfo = new TurnInfo(minimizar, pieces, null);
        if (!turnInfo.existsPossibleMove()) {
            return [(minimizar ? 1 : -1) * MinMaxPoints.IMPOSSIBILITY_MORE_MOVES, null];
        }
        let bestPpm = null;
        if (minimizar) {
            let minPoints = CheckersMinMaxV2.INFINITY_POS;            
            for (let position = 0; position < turnInfo.piecesPossibleMoves.length; position++) {
                if (turnInfo.piecesPossibleMoves[position]) {
                    for (let piecePossibleMove of turnInfo.piecesPossibleMoves[position]) {
                        let rtn = CheckersMinMaxV2.getMMTurnMovementsPoints(pieces, position, piecePossibleMove, minimizar, deep, deepOriginal, priorizerStrategy, alfa, beta);
                        let points = rtn[0];
                        if (minPoints === null || points < minPoints) {
                            minPoints = points;
                            bestPpm = piecePossibleMove;
                        }
                        beta = Math.min(beta, points)
                        if (beta !== CheckersMinMaxV2.INFINITY_POS && alfa!== CheckersMinMaxV2.INFINITY_NEG) {
                            //console.log("Analisado: beta("+beta+") <= alfa("+alfa+")")
                        }                        
                        if (beta <= alfa) {
                            console.log("corte: beta("+beta+") <= alfa("+alfa+")")
                            break // Poda a árvore (corte alfa)                    
                        }
                    }
                }
            }
            return [minPoints, bestPpm];            
        } else {
            let maxPoints = CheckersMinMaxV2.INFINITY_NEG;                
            for (let position = 0; position < turnInfo.piecesPossibleMoves.length; position++) {
                if (turnInfo.piecesPossibleMoves[position]) {
                    for (let piecePossibleMove of turnInfo.piecesPossibleMoves[position]) {
                        let rtn = CheckersMinMaxV2.getMMTurnMovementsPoints(pieces, position, piecePossibleMove, minimizar, deep, deepOriginal, priorizerStrategy, alfa, beta);
                        let points = rtn[0];
                        if (maxPoints === null || points > maxPoints) {
                            maxPoints = points;
                            bestPpm = piecePossibleMove;
                        }
                        alfa = Math.max(alfa, points)
                        if (beta !== CheckersMinMaxV2.INFINITY_POS && alfa!== CheckersMinMaxV2.INFINITY_NEG) {
                            //console.log("Analisado: beta("+beta+") <= alfa("+alfa+")")
                        }
                        if (beta <= alfa) {
                            console.log("corte: beta("+beta+") <= alfa("+alfa+")")
                            break // Poda a árvore (corte alfa)                    
                        }
                    }
                }
            }
            return [maxPoints, bestPpm];            
        }

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