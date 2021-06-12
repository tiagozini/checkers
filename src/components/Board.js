import React from 'react';
import BoardSquare from './BoardSquare';
import Piece from './Piece';

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ColorTypes } from '../Constants';

export class Board extends React.Component {
    constructor(props) {
        super(props);
        this.possibleMoves = [];
        for(let i = 0; i < 64; i++) {
            this.possibleMoves.push(null);
        }
        this.movePiece = props.handleMovePiece.bind(this);
        this.handleCanMovePiece = props.handleCanMovePiece.bind(this);
    }    

    renderSquare(position) {
      const piece = this.props.pieces[position];
      return <div key={""+position+"-"+this.props.count+"-" +this.props.whiteIsNext} style={{ width: '12.5%', height: '12.5%', display:"table-cell" }}>
        <BoardSquare 
            position={position} 
            handleMovePiece={this.movePiece}
            handleCanMovePiece={this.handleCanMovePiece}
            whiteIsNext={this.props.whiteIsNext}
            piece={piece} >
            {piece != null && <Piece color={piece.color} 
                type={piece.type} 
                xFrom={position % 8}
                yFrom ={Math.trunc(position / 8)}
                canDrag={piece != null && (
                    (this.props.whiteIsNext && ColorTypes.WHITE === piece.color) ||
                    (!this.props.whiteIsNext && ColorTypes.BLACK === piece.color)
                 ) } 
                />}
        </BoardSquare>
        </div>;
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

    render() {
        return (
            <DndProvider backend={HTML5Backend}>
                <div className="board-row">
                    {this.renderSquareLine(0)}
                    {this.renderSquareLine(1)}
                    {this.renderSquareLine(2)}
                    {this.renderSquareLine(3)}
                    {this.renderSquareLine(4)}
                    {this.renderSquareLine(5)}
                    {this.renderSquareLine(6)}
                    {this.renderSquareLine(7)}
                </div>  
            </DndProvider>          
        );
    }
}
