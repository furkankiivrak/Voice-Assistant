import React from 'react';
import SpeechRecognitionComponent from './SpeechRecognition'; 
import GeminiAssistant from './GeminiAssistant'; // GeminiAssistant bileşenini 
import './App.css';

function App() {
  return (
    <div className="container">
      <div className="assistant-card">
        <SpeechRecognitionComponent />
      </div>
      <div className="assistant-card">
        <GeminiAssistant />
      </div>
    </div>
  );
}

export default App;
