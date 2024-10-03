import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Tarayıcıda Ses Tanıma API'sini başlat
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

const GeminiAssistant = () => {
  const [userMessage, setUserMessage] = useState(''); // Kullanıcı mesajı durumu
  const [botResponse, setBotResponse] = useState(''); // Bot yanıtı durumu
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
  const [isListening, setIsListening] = useState(false); // Dinleme durumu

  // Sesle algılama ve mesaj gönderme işlemi
  const startListening = () => {
    setIsListening(true); // Dinleme durumunu aktif et
    recognition.start(); // Ses tanımayı başlat
  };

  const stopListening = () => {
    setIsListening(false); // Dinleme durumunu pasif et
    recognition.stop(); // Ses tanımayı durdur
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript; // Algılanan metni al
    setUserMessage(transcript); // Algılanan metni duruma kaydet
    await handleUserMessage(transcript); // Mesajı işleyerek yanıt al
  };

  // Kullanıcı mesajını işleyen fonksiyon
  const handleUserMessage = async (message) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 100 },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    setBotResponse(response.text()); // Bot yanıtını duruma kaydet
    speak(response.text()); // Bot yanıtını sesli olarak söyle
  };

  // Sesli yanıt verme fonksiyonu
  const speak = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'tr-TR';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="assistant-card">
      <h1>Sohbet asistanı</h1>
      <button onClick={startListening} disabled={isListening}>
        Dinlemeye Başla
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        Dinlemeyi Durdur
      </button>
      <div>
        <h3>Kullanıcı Mesajı:</h3>
        <p>{userMessage}</p>
      </div>
      <div>
        <h3>Yanıt:</h3>
        <p>{botResponse}</p>
      </div>
    </div>
  );
};

export default GeminiAssistant;
