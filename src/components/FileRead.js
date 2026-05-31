import React, { useRef } from 'react';
import { FaUpload } from 'react-icons/fa';

export default function FileRead(props) {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        props.onReadFile(e.target.result);
      };
      reader.readAsText(file);      
    }
  };
  const uploadButtonIcon = <FaUpload />;

  return (
    <div>
      <button onClick={handleButtonClick} className='btn-link'>{uploadButtonIcon}</button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  );
}