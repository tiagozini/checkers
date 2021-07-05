import React from 'react'
import { useDrag } from 'react-dnd';
import { PositionedPiece } from '../models/PositionedPiece';
import { ColorTypes, PieceTypes, ItemTypes } from '../Constants';
import imgPieceManWhite from '../img/piece-man-white.png';
import imgPieceManBlack from '../img/piece-man-black.png';
import imgPieceKingWhite from '../img/piece-king-white.png';
import imgPieceKingBlack from '../img/piece-king-black.png';

export default function Piece(props) {
  const type = props.type;
  const color = props.color;
  const draggable = props.canDrag;

  let url = null;
 
  const [{isDragging}, drag] = useDrag(() => ({
    type: ItemTypes.PIECE,
    item: new PositionedPiece(props.color, props.type, props.position),
    canDrag: ((monitor) => {
      return draggable;
    }),
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
      canDrag: !!monitor.canDrag()
    }),
  }));

  const getStyle = (d) => {
    let style = {
      opacity: isDragging ? 0.5 : 1,
      fontSize: 25,
      fontWeight: 'bold',
      cursor: 'move',
    };
    if (draggable) {
      style.backgroundColor="pink";
    }   
    return style; 
  };

  if (PieceTypes.MAN === type) {
    url = (color === ColorTypes.WHITE ? imgPieceManWhite : imgPieceManBlack);
  } else if (PieceTypes.KING === type) {
    url = (color === ColorTypes.WHITE ? imgPieceKingWhite : imgPieceKingBlack);
  }   
  return <img
    ref={drag} alt=""
    style={getStyle(drag)}
    src={url} width="50px" height="50px"
  />
}