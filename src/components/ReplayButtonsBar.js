import React from 'react';
import { FaStop, FaForward, FaBackward  } from 'react-icons/fa';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

export default function ReplayBar(props) {
  const forwardBtIcon = <FaForward />;
  const stopCircleBtIcon = <FaStop />;
  const backwardBtIcon = <FaBackward />;

  const handleClickFFButton = () => {
    props.onButtonClick('forward');
  }
  
  const hadleClickStop = () => {
    props.onButtonClick('stop');
  }
  
  const hadleClickbackward = () => {
    props.onButtonClick('backward');
  }
  const gameReplay = props.gameReplay;
  const hideBefore = gameReplay.currentPlay === 0;
  const hideNext = gameReplay.currentPlay === gameReplay.totalPlays;
  return (
    <div>
      <span>{gameReplay.currentPlay}/{gameReplay.totalPlays}</span>
    <ButtonGroup aria-label="Basic example">
      <Button size="sm" variant="secondary" hidden={hideBefore} onClick={hadleClickbackward}>{backwardBtIcon}</Button>       
      <Button size="sm" variant="secondary" onClick={hadleClickStop}>{stopCircleBtIcon}</Button>
      <Button size="sm" variant="secondary" hidden={hideNext} onClick={handleClickFFButton}>{forwardBtIcon}</Button>     
    </ButtonGroup>
    </div>
  );
}