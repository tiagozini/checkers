import React from 'react';
import BoardSquare from './BoardSquare';
import Piece from './Piece';
import { PieceDraggable } from '../models/PieceDraggable';

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend';

export class Board extends React.Component {
    constructor(props) {
        super(props);
        this.possibleMoves = [];
        for(let i = 0; i < props.numRows; i++) {
            this.possibleMoves.push(null);
        }
        this.movePiece = props.handleMovePiece.bind(this);
        this.handleCanMovePiece = props.handleCanMovePiece.bind(this);
        this.handleCanDragPiece = props.handleCanDragPiece.bind(this);
    }    

    renderSquare(position) {
      const piece = this.props.pieces[position];
      return (
        <div key={""+position+"-"+this.props.count+"-" +this.props.whiteIsNext} 
            style={{ width: '12.5%', height: '12.5%', display:"table-cell" }}>
            <BoardSquare 
                position={position} 
                handleMovePiece={this.movePiece}
                handleCanMovePiece={this.handleCanMovePiece}
                whiteIsNext={this.props.whiteIsNext}
                count={this.props.count}
                piece={piece} >
                {piece != null && <Piece color={piece.color} 
                    type={piece.type} 
                    xFrom={position % this.props.numRowsByLine}
                    yFrom ={Math.trunc(position / this.props.numRowsByLine)}
                    canDrag={this.handleCanDragPiece(new PieceDraggable(piece.color, piece.type,
                        position % this.props.numRowsByLine, Math.trunc(position / this.props.numRowsByLine)))}
                    />}
            </BoardSquare>
        </div>
      );
    }

    renderSquareLine(lineNumber) {
        return <div key={"squareline-"+this.props.count+"-"+lineNumber}> 
            {Array.from(Array(this.props.numRowsByLine).keys()).map((i) => 
                this.renderSquare((lineNumber) * this.props.numRowsByLine + i ))
            }
        </div>;
    }

    render() {
        return (
            <DndProvider backend={HTML5Backend}>
                <div className="board-row">
                    {Array.from(Array(this.props.numRowsByLine).keys()).map((i)=> 
                        this.renderSquareLine(i))
                    }
                </div>  
            </DndProvider>          
        );
    }
}
