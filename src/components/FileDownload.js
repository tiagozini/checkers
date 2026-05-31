import React from 'react';
import { FaDownload } from 'react-icons/fa';

export default function FileDownload(props) {
  const handleButtonClick = () => {
    downloadFile(props.fileName, props.contentFile());
  };

  const downloadFile = (filename, text) => {
    const element = document.createElement('a');
    const blob = new Blob([text], { type: 'text/plain' });
    
    element.href = URL.createObjectURL(blob);
    element.download = filename;
    
    document.body.appendChild(element); // Required for Firefox
    element.click();
    document.body.removeChild(element);
  }

  const downloadButtonIcon = <FaDownload />;

  return (
    <div>
      <button onClick={handleButtonClick} className='btn-link'>{downloadButtonIcon}</button>
    </div>
  );
}