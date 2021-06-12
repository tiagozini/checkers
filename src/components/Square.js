import React from 'react';
import { ColorTypes } from '../Constants';

export class Square extends React.Component {
    constructor(props) {
        super(props);   
        this.state = { 
            position :  Number.parseInt(this.props.position, 10),
            piece : this.props.piece,
            children : this.props.children
        };
        this.onClick = this.props.onClick;
    }

    handleOnClick(position) {
        this.onClick(position);
    }

    render() {
        const posicaoInt = Number.parseInt(this.props.position, 10);
        const lineNumberRest = Math.trunc((posicaoInt) / 8);
        const even = ((lineNumberRest + posicaoInt) % 2) === 0;
        const bgColor = even ? ColorTypes.WHITE : ColorTypes.BLACK ;
        const piece = this.state.piece;
        if (piece != null) {
            return (
                <div className="square"
                    style={{backgroundColor: bgColor}}>    
                    {this.state.children}                
                </div>            
            );
            } else {
            return (
                <div className="square"
                    style={{backgroundColor: bgColor}} >&nbsp;</div>
            );
        }
    }
}
