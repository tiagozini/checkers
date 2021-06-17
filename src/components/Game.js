import React from 'react';
import { Board } from './Board';
import { PiecePossibleMoves } from '../models/PiecePossibleMoves';

import { ColorTypes, PieceTypes, PossibleMoveType } from '../Constants';

export class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            whiteIsNext : true,
            pieces : this.mountInitialPieces(),
            whitesCount: 12,
            blacksCount: 12,
            count: 1
        };        
        this.possibleMoves = [];
        for(let i = 0; i < 64; i++) {
            this.possibleMoves.push(null);
        }

        this.handlePrepareNextPlay = this.handlePrepareNextPlay.bind(this);
        this.handleMovePiece = this.handleMovePiece.bind(this);
        this.handleCanMovePiece = this.handleCanMovePiece.bind(this);
        this.getMovesSimplePiece = this.getMovesSimplePiece.bind(this);
        this.getMovesTakePieces = this.getMovesTakePieces.bind(this);
        this.getDoubleMovesTakePieces = this.getDoubleMovesTakePieces.bind(this);
    }    

    clearPossibleMoves() {
        for(let i = 0; i < 64; i++) {
            this.possibleMoves[i] = null;
        }        
    }

    mountInitialPieces() {
        const pieces = [];
        for(let i = 0; i < 64; i++) {
            const lineNumberRest = Math.trunc((i) / 8);
            const even = ((lineNumberRest + i) % 2) === 0;
            if (i >= 0 && i < 24 && !even) {
                pieces.push(
                    {
                        color: ColorTypes.WHITE,
                        type : PieceTypes.SIMPLE
                    }
                );
            } else if (i >= 40 && i < 64 && !even) {
                pieces.push(
                    {
                        color: ColorTypes.BLACK,
                        type : PieceTypes.SIMPLE
                    }
                );
            } else {
                pieces.push(null);
            }
        }
        return pieces;
    }

    getPosition(x,  y) {
        return y * 8 + x;
    }

    getMovesTakePieces(item, moves, piecesTaked) {
        const position = moves.length > 0 ? moves.slice(-1)[0] : 
            (item.xFrom + item.yFrom*  8);
        const [x, y] = [position % 8, Math.trunc(position /8)];
        const [dxleft, dxright, dyup, dydown] = [x, 7 - x , y , 7 - y];
        const [dLeftUp, dLeftDown, dRightUp, dRightDown] = [
            Math.min(dxleft, dyup),
            Math.min(dxleft, dydown),
            Math.min(dxright, dyup),
            Math.min(dxright, dydown)
        ];
        const [dLeftUpMv1, dLeftDownMv1, dRightUpMv1, dRightDownMv1,
            dLeftUpMv2, dLeftDownMv2, dRightUpMv2, dRightDownMv2] = [
                this.getPosition(x-1, y-1), this.getPosition(x-1, y+1), 
                this.getPosition(x+1, y-1), this.getPosition(x+1, y+1),
                this.getPosition(x-2, y-2), this.getPosition(x-2, y+2), 
                this.getPosition(x+2, y-2), this.getPosition(x+2, y+2),                
            ];
        const opositeColor = 
            item.color === ColorTypes.BLACK ? ColorTypes.WHITE : 
                ColorTypes.BLACK;
        let upperMoves = [];
        if (dLeftUp > 1 
            && this.canTakePiece(dLeftUpMv1, dLeftUpMv2, opositeColor)
            && piecesTaked.filter( (positionTaked) => 
                positionTaked === dLeftUpMv1).length === 0) {
                upperMoves.push(
                    this.getMovesTakePieces(item, 
                    moves.concat(dLeftUpMv2),
                    piecesTaked.concat(dLeftUpMv1))
                );
        }
        if (dLeftDown > 1 
            && this.canTakePiece(dLeftDownMv1, dLeftDownMv2, opositeColor)            
            && piecesTaked.filter( (positionTaked) => 
                positionTaked === dLeftDownMv1).length === 0) {        
                upperMoves.push(
                    this.getMovesTakePieces(item,
                        moves.concat(dLeftDownMv2),                        
                        piecesTaked.concat(dLeftDownMv1))
                );
        }
        if (dRightUp > 1 
            && this.canTakePiece(dRightUpMv1, dRightUpMv2, opositeColor)
            && piecesTaked.filter( (positionTaked) => 
                positionTaked === dRightUpMv1).length === 0) {
                upperMoves.push(
                    this.getMovesTakePieces(item,
                    moves.concat(dRightUpMv2),   
                    piecesTaked.concat(dRightUpMv1))
                );
        }
        if (dRightDown > 1 
            && this.canTakePiece(dRightDownMv1, dRightDownMv2, opositeColor)
            && piecesTaked.filter( (positionTaked) => 
                positionTaked === dRightDownMv1).length === 0) {
                upperMoves.push(
                    this.getMovesTakePieces(item, 
                        moves.concat(dRightDownMv2),   
                        piecesTaked.concat(dRightDownMv1))
                );
        }
        let arr = [];
        if (upperMoves.length === 0) {
            if (moves.length > 0) {
                arr.push(new PiecePossibleMoves(moves, piecesTaked));
            }
        } else {
            for(let moveItens of upperMoves) {
                for(let miniMove of moveItens) {                
                    arr.push(miniMove);
                }
            }
        }
        return arr;
    }

    getDoubleNearMoves(position, dLeftUp, dLeftDown, dRightUp, dRightDown) {
        const [xFrom, yFrom] = [position % 8, Math.trunc(position / 8)];
        let positions = [];
        if(dLeftDown>0) {
            for(let i = 1; i <= dLeftDown; i++) {
                const [x,y] = [xFrom - i, yFrom + i];
                if (this.state.pieces[this.getPosition(x,y)] != null)
                    break;
                else 
                    positions.push(this.getPosition(x,y));
            }
        }
        if(dLeftUp > 0) {
            for(let i = 1; i <= dLeftUp; i++) {
                const [x,y] = [xFrom - i, yFrom - i];
                if (this.state.pieces[this.getPosition(x,y)] != null)
                    break;
                else 
                    positions.push(this.getPosition(x,y));
            }
        } 
        if (dRightUp > 0) {
            for(let i = 1; i <= dRightUp; i++) {
                const [x,y] = [xFrom + i, yFrom - i];
                if (this.state.pieces[this.getPosition(x,y)] != null)
                    break;
                else 
                    positions.push(this.getPosition(x,y));
            }
        }
        if (dRightDown > 0) {
            for(let i = 1; i <= dRightDown; i++) {
                const [x,y] = [xFrom + i, yFrom + i];
                if (this.state.pieces[this.getPosition(x,y)] != null)
                    break;
                else 
                    positions.push(this.getPosition(x,y));
            }            
        }         

        return positions.map( (p) => new PiecePossibleMoves([p], []) );
    }

    getDoubleMovesTakePieces(item, moves, piecesTaked) {
        const position = moves.length > 0 ? moves.slice(-1)[0] : 
            (item.xFrom + item.yFrom*  8);
        const [xFrom, yFrom] = [position % 8, Math.trunc(position /8)];
        const [dxleft, dxright, dyup, dydown] = [xFrom, 7 - xFrom , yFrom , 7 - yFrom];
        const [dLeftUp, dLeftDown, dRightUp, dRightDown] = [
            Math.min(dxleft, dyup),
            Math.min(dxleft, dydown),
            Math.min(dxright, dyup),
            Math.min(dxright, dydown)
        ];
        const opositeColor = 
            item.color === ColorTypes.BLACK ? ColorTypes.WHITE : 
                ColorTypes.BLACK;
        let upperMoves = [];
        let targetPosition = null;      

        if(dLeftDown>1) {      
            targetPosition = null;      
            for(let i = 1; i <= dLeftDown; i++) {
                const [x,y] = [xFrom - i, yFrom + i];
                const [pos, posMaisUm] = [this.getPosition(x,y), this.getPosition(x - 1, y +1)]
                if (targetPosition != null && this.state.pieces[pos] != null) {
                    break;
                } else if (targetPosition != null && this.state.pieces[pos] === null
                    && piecesTaked.filter( (p) => p === targetPosition).length === 0
                ) {
                    upperMoves.push(this.getDoubleMovesTakePieces(item, 
                        moves.concat(pos), piecesTaked.concat(targetPosition)));
                } else if (targetPosition === null
                    && this.state.pieces[this.getPosition(x,y)] != null) {
                        if (this.canTakePiece(pos, posMaisUm, opositeColor)) {
                            targetPosition = this.getPosition(x,y);
                        } else {
                            break;
                        }
                }                            
            }                
        }
        if(dLeftUp > 1) {
            targetPosition = null;      
            for(let i = 1; i <= dLeftUp; i++) {
                const [x,y] = [xFrom - i, yFrom - i];
                const [pos, posMaisUm] = [this.getPosition(x,y), 
                    this.getPosition(x - 1, y - 1)]
                if (targetPosition != null && this.state.pieces[pos] != null) {
                    break;                    
                } else if (targetPosition != null && this.state.pieces[pos] === null
                    && piecesTaked.filter( (p) => p === targetPosition).length === 0
                ) {
                    upperMoves.push(this.getDoubleMovesTakePieces(item, 
                        moves.concat(pos), piecesTaked.concat(targetPosition)));
                } else if (targetPosition === null
                    && this.state.pieces[this.getPosition(x,y)] != null) {
                        if (this.canTakePiece(pos, posMaisUm, opositeColor)) {
                            targetPosition = this.getPosition(x,y);
                        } else {
                            break;
                        }
                }                            
            }
        } 
        if (dRightUp > 1) {
            targetPosition = null;      
            for(let i = 1; i <= dRightUp; i++) {
                const [x,y] = [xFrom + i, yFrom - i];
                const [pos, posMaisUm] = [this.getPosition(x,y), this.getPosition(x + 1, y - 1)]
                if (targetPosition != null && this.state.pieces[pos] != null) {
                    break;                
                } else if (targetPosition != null && this.state.pieces[pos] === null
                    && piecesTaked.filter( (p) => p === targetPosition).length === 0
                ) {
                    upperMoves.push(this.getDoubleMovesTakePieces(item, 
                        moves.concat(pos), piecesTaked.concat(targetPosition)));
                } else if (targetPosition === null
                    && this.state.pieces[this.getPosition(x,y)] != null) {
                        if(this.canTakePiece(pos, posMaisUm, opositeColor)) {
                            targetPosition = this.getPosition(x,y);
                        } else {
                            break;
                        }
                }                
            }
        }
        if (dRightDown > 1) {
            targetPosition = null;      
            for(let i = 1; i <= dRightDown; i++) {
                const [x,y] = [xFrom + i, yFrom + i];
                const [pos, posMaisUm] = [this.getPosition(x,y), this.getPosition(x + 1, y + 1)]
                if (targetPosition != null && this.state.pieces[pos] != null) {
                    break;
                } else if (targetPosition != null && this.state.pieces[pos] === null
                    && piecesTaked.filter( (p) => p === targetPosition).length === 0
                ) {
                    upperMoves.push(this.getDoubleMovesTakePieces(item, 
                        moves.concat(pos), piecesTaked.concat(targetPosition)));
                } else if (targetPosition === null
                    && this.state.pieces[this.getPosition(x,y)] != null) {
                        if (this.canTakePiece(pos, posMaisUm, opositeColor)) {
                            targetPosition = this.getPosition(x,y);
                        } else {
                            break;
                        }
                }                                           
            }  
        }
        let arr = [];
        if (upperMoves.length === 0) {
            if (moves.length > 0) {
                arr.push(new PiecePossibleMoves(moves, piecesTaked));
            }
        } else {
            for(let moveItens of upperMoves) {
                for(let miniMove of moveItens) {                
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

    getMovesSimplePiece(item) {
        const position = item.xFrom + item.yFrom*8;
        const [x, y] = [position % 8, Math.trunc(position /8)];
        const [dxleft, dxright, dyup, dydown] = [x, 7 - x , y , 7 - y];
        const [dLeftUp, dLeftDown, dRightUp, dRightDown] = [
            Math.min(dxleft, dyup),
            Math.min(dxleft, dydown),
            Math.min(dxright, dyup),
            Math.min(dxright, dydown)
        ];
        const opositeColor = item.color === ColorTypes.BLACK ? ColorTypes.WHITE : 
            ColorTypes.BLACK;
        let canTakePieces = false;
        if (dLeftUp > 1 
            && this.canTakePiece(this.getPosition(x-1, y-1), 
            this.getPosition(x-2, y-2), opositeColor)) {
                canTakePieces = true;
        } else if (dLeftDown > 1 
            && this.canTakePiece(this.getPosition(x-1, y+1), 
            this.getPosition(x-2, y+2), opositeColor)) {        
                canTakePieces = true;        
        } else if (dRightUp > 1 
            && this.canTakePiece(this.getPosition(x+1, y-1), 
            this.getPosition(x+2, y-2), opositeColor)) {
                canTakePieces = true;
        } else if (dRightDown > 1 
            && this.canTakePiece(this.getPosition(x+1, y+1), 
            this.getPosition(x+2, y+2), opositeColor)) {
                canTakePieces = true;
        }        
        if (canTakePieces) {
            let piecePossibleMoves = this.getMovesTakePieces(item, [], []);
            let biggerSize = 0;
            for (let pmps of piecePossibleMoves) {
                if (pmps.moves.length > biggerSize) {
                    biggerSize = pmps.moves.length;
                }
            }
            let positions = [];
            for (let pmps of piecePossibleMoves) {
                if (pmps.moves.length === biggerSize) {
                    positions.push(pmps);
                }                
            }          
            return positions;  
        } else  {        
            let nearPositions = [];
            if (item.color === ColorTypes.WHITE) {
                if (x-1 >= 0 && y + 1 <= 7) {
                    nearPositions.push(
                        new PiecePossibleMoves( [this.getPosition(x-1, y+1)], []));
                } 
                if ((x+1) <= 7 && y + 1 <= 7) {
                    nearPositions.push(
                        new PiecePossibleMoves( [this.getPosition(x+1, y+1)], []));
                }  
            } else {
                if ((x-1) >= 0 && (y - 1) >= 0) {
                    nearPositions.push(
                        new PiecePossibleMoves( [this.getPosition(x-1, y-1)], []));
                } 
                if ((x+1) <= 7 && (y - 1) >= 0) {
                    nearPositions.push(
                        new PiecePossibleMoves( [this.getPosition(x+1, y-1)], []));
                }                  
            }
            return nearPositions.filter( 
                (ppms) => this.state.pieces[ppms.moves.slice(-1)[0]] === null);            
        }
    }

    getDoubleMovesPiece(item) {
        const position = item.xFrom + item.yFrom*8;
        const [x, y] = [position % 8, Math.trunc(position /8)];
        const [dxLeft, dxRight, dyUp, dyDown] = [x, 7 - x , y , 7 - y];
        const [dLeftUp, dLeftDown, dRightUp, dRightDown] = [
            Math.min(dxLeft, dyUp),
            Math.min(dxLeft, dyDown),
            Math.min(dxRight, dyUp),
            Math.min(dxRight, dyDown)
        ];
        let piecePossibleMoves = this.getDoubleMovesTakePieces(item, [], []);
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
        } else  {        
            let nearPositions = this.getDoubleNearMoves(position, dLeftUp, dLeftDown, dRightUp, dRightDown);
            return nearPositions.filter((ppms) => 
                this.state.pieces[ppms.moves.slice(-1)[0]] === null);            
        }
    }

    handleCanMovePiece(item, xTo, yTo) {
        const position = item.xFrom + item.yFrom * 8;
        if (this.possibleMoves[position] === null) {
            if (item.type === PieceTypes.SIMPLE) 
                this.possibleMoves[position] = this.getMovesSimplePiece(item);
            else
                this.possibleMoves[position] = this.getDoubleMovesPiece(item);            
        }
        for (let p of this.possibleMoves[position]) {
            const lastMove = p.moves.slice(-1)[0];
            if (lastMove === (xTo + yTo * 8)) {
                return PossibleMoveType.LAST_MOVE;
            }
        }
        for (let p of this.possibleMoves[position]) {
            const moves = p.moves.slice(0, p.moves.length-1);
            for (let m of moves) {
                if (m === (xTo + yTo * 8)) {
                    return PossibleMoveType.PARTIAL_MOVE;
                }                
            }
        }
        return PossibleMoveType.NO_MOVE;
    }

    checkMovePossibility(color) {
        for(let position =0; position <64; position++) {
            const piece = this.state.pieces[position];
            if (piece == null) {
                continue;
            }
            const [xFrom, yFrom] = [position % 8, Math.trunc(position/8)];
            let item = { xFrom : xFrom, yFrom: yFrom, color: piece.color, type: piece.type}
            if (piece != null && piece.color === color) {
                if (this.possibleMoves[position] == null) {
                    if (piece.type === PieceTypes.SIMPLE) 
                        this.possibleMoves[position] = this.getMovesSimplePiece(item);
                    else
                        this.possibleMoves[position] = this.getDoubleMovesPiece(item);            
                }        
                if (this.possibleMoves[position].length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    renderSquareLine(lineNumber) {
        return <div > 
            {this.renderSquare((lineNumber) * 8 )}
            {this.renderSquare((lineNumber) * 8 + 1)}
            {this.renderSquare((lineNumber) * 8 + 2)}
            {this.renderSquare((lineNumber) * 8 + 3)}
            {this.renderSquare((lineNumber) * 8 + 4)}
            {this.renderSquare((lineNumber) * 8 + 5)}
            {this.renderSquare((lineNumber) * 8 + 6)}
            {this.renderSquare((lineNumber) * 8 + 7)}                                                                                                      
        </div>;
    }

    handleMovePiece(xFrom, yFrom, x, y) {
        const pieces = this.state.pieces.slice();
        const positionTarget = x + (y * 8);
        const positionOrigin = xFrom + (yFrom * 8);
        let pieceMoveChoose = null;
        for(let pm of this.possibleMoves[positionOrigin]) {
            if (pm.moves.slice(-1)[0] === positionTarget) {
                pieceMoveChoose = pm;
            }
        }
        for (let p of pieceMoveChoose.piecesTaked) {
            pieces[p] = null;
        }
        pieces[positionTarget] = pieces[positionOrigin];
        pieces[positionOrigin] = null;
        this.setState({pieces : [], ...this.state}, () => { 
            this.setState({
                pieces : pieces, 
                count:this.state.count + 1 })
        });
        this.handlePrepareNextPlay();
        this.clearPossibleMoves();
        this.putTheCrownIfNecessary(x, y);
    }

    putTheCrownIfNecessary(x, y) {
        const position = x + y * 8;
        if ((this.state.pieces[position].color === ColorTypes.BLACK && y === 0) ||
        (this.state.pieces[position].color === ColorTypes.WHITE && y === 7)) {
            const pieces = this.state.pieces.slice();
            pieces[position].type = PieceTypes.DOUBLE;
            this.setState({pieces : pieces, 
                count:this.state.count + 1 });
        }
    }

    render() {
        const winner = this.getTheWinner();
        let status;
        
        if (winner) {
          status = 'Winner: ' + winner;
        } else {
          status = 'Next player: ' + (this.state.whiteIsNext ? 'White' : 'Black');
        }
        return  <div className="game">
            <div className="game-board">
                <Board 
                whiteIsNext={this.state.whiteIsNext} 
                handleMovePiece={this.handleMovePiece}
                handleCanMovePiece={this.handleCanMovePiece}
                handlePrepareNextPlay={this.handlePrepareNextPlay}
                pieces={this.state.pieces}
                count={this.state.count} />
            </div>
            <div className="game-info">
                <div>{status}</div>
                <p>Whites: {this.state.whitesCount}</p>
                <p>Blacks: {this.state.blacksCount}</p>
            </div>                    
        </div>;
    }

    handlePrepareNextPlay() {
        let blacksCount = 0;
        let whitesCount = 0;
        for (let  piece of  this.state.pieces.filter((p) => p != null)) {
            if (piece.color === ColorTypes.BLACK) {
                blacksCount++;
            } else if (piece.color === ColorTypes.WHITE) {
                whitesCount++;
            }
        }
        this.setState({
            ...this.state, 
            whiteIsNext : !this.state.whiteIsNext,
            whitesCount: whitesCount,
            blacksCount: blacksCount            
        });
    }

    getTheWinner() {
        let whitesCount = 0;
        let blacksCount = 0;
        for(let i =0; i< 64; i++) {
            if (this.state.pieces[i] != null) {
                if (this.state.pieces[i].color === ColorTypes.WHITE) {
                    whitesCount++;
                } else if(this.state.pieces[i].color === ColorTypes.BLACK) {
                    blacksCount++;
                }
            }
        }
        if (blacksCount === 0) {
            return 'White';
        }
        if (whitesCount === 0) {
            return 'Black';
        }        
        if (this.state.whiteIsNext && !this.checkMovePossibility(ColorTypes.WHITE)) {
            return 'Black';
        } else if (!this.state.whiteIsNext && !this.checkMovePossibility(ColorTypes.BLACK)) {
            return 'White';                
        }
    }
}
