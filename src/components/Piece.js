import React from 'react'
import imgPieceWhite from '../img/piece-white.png';
import imgPieceBlack from '../img/piece-black.png';
import imgDoublePieceWhite from '../img/double-piece-white.png';
import imgDoublePieceBlack from '../img/double-piece-black.png';
import { ColorTypes, PieceTypes, ItemTypes } from '../Constants';
import { useDrag } from 'react-dnd';
import { PieceDraggable } from '../models/PieceDraggable';

export default function Piece(props) {
  const type = props.type;
  const color = props.color;
  const draggable = props.canDrag;

  let url = null;
 
  const [{isDragging}, drag] = useDrag(() => ({
    type: ItemTypes.PIECE,
    item: new PieceDraggable(props.color, props.type, props.xFrom, props.yFrom),
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

  if (PieceTypes.SIMPLE === type) {
    url = (color === ColorTypes.WHITE ? imgPieceWhite : imgPieceBlack);
  } else if (PieceTypes.DOUBLE === type) {
    url = (color === ColorTypes.WHITE ? imgDoublePieceWhite : imgDoublePieceBlack);
  }   
  return <img
    ref={drag} alt=""
    style={getStyle(drag)}
    src={url} width="50px"
  />
}