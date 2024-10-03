import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // CSS dosyasını dahil et

// Tarayıcıda Ses Tanıma API'sini başlat
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

const SpeechRecognitionComponent = () => {
  const [text, setText] = useState(''); // Algılanan metin durumu
  const [response, setResponse] = useState(''); // Asistanın yanıtı
  const [isListening, setIsListening] = useState(false); // Dinleme durumu
  const apiKeyWeather = process.env.REACT_APP_WEATHER_API_KEY; // Hava durumu API anahtarı
  const apiKeyNews = process.env.REACT_APP_NEWS_API_KEY; // Haber API anahtarı
  const youtubeApiKey = process.env.REACT_APP_YOUTUBE_API_KEY; // YouTube API anahtarı
  const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY; // Gemini API Anahtarı

  // Dinlemeyi başlatan fonksiyon
  const startListening = () => {
    recognition.start();
    setIsListening(true);
  };

  // Dinlemeyi durduran fonksiyon
  const stopListening = () => {
    recognition.stop();
    setIsListening(false);
  };

  // Ses tanıma sonucu alındığında çalışacak fonksiyon
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase(); // Algılanan metni al
    setText(transcript); // Algılanan metni duruma kaydet
    handleCommand(transcript); // Komutu işle
  };

  // Sesli asistanın komutlarını işleyen fonksiyon
  const handleCommand = (command) => {
    if (command.includes('hava durumu')) {
      const city = command.split('hava durumu')[1]?.trim();
      if (city) {
        getWeather(city); // Hava durumunu al
      } else {
        const message = 'Lütfen bir şehir adı belirtin.';
        setResponse(message);
        speak(message);
      }
    } else if (command.includes('haberler')) {
      getNews(); // Güncel haberleri al
    } else if (command.includes('şarkı çal')) {
      const songQuery = command.split('şarkı çal')[1]?.trim();
      if (songQuery) {
        playSongOnYouTube(songQuery); // Şarkıyı çal
      } else {
        const message = 'Lütfen çalmak istediğiniz şarkının adını belirtin.';
        setResponse(message);
        speak(message);
      }
    } else if (command.includes('internette ara') || command.includes("web'de ara")) {
      const searchQuery = command.includes('internette ara')
        ? command.split('internette ara')[1]?.trim()
        : command.split("web'de ara")[1]?.trim();

      if (searchQuery) {
        performWebSearch(searchQuery);
        const message = `İnternette şunu arıyorum: ${searchQuery}`;
        setResponse(message);
        speak(message);
      } else {
        const message = 'Lütfen aramak istediğiniz konuyu belirtin.';
        setResponse(message);
        speak(message);
      }
    } else {
      handleGeminiResponse(command); // Gemini API ile yanıt al
    }
  };

  // Gemini API ile yanıt alma fonksiyonu
  const handleGeminiResponse = async (userMessage) => {
    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage', // Gemini API endpoint'i
        {
          prompt: {
            messages: [{ content: userMessage }],
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${geminiApiKey}`, // .env'deki API anahtarı
          },
        }
      );

      const botResponse = response.data.candidates[0].content; // API'den gelen yanıt
      setResponse(botResponse);
      speak(botResponse);
    } catch (error) {
      console.error('Gemini API ile iletişimde hata:', error.response ? error.response.data : error.message);
      const message = 'Gemini API ile iletişimde bir hata oluştu.';
      setResponse(message);
      speak(message);
    }
  };

  // Hava durumu alma fonksiyonu
  const getWeather = async (city) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKeyWeather}&units=metric`
      );
      const { main, weather } = response.data;
      const temperature = Math.round(main.temp);
      const weatherDescription = translateWeatherDescription(weather[0].description);

      const message = `${city.charAt(0).toUpperCase() + city.slice(1)} için hava durumu: ${weatherDescription}, sıcaklık: ${temperature} derece.`;
      setResponse(message);
      speak(message);
    } catch (error) {
      const message = `${city.charAt(0).toUpperCase() + city.slice(1)} için hava durumu bilgisi alınamadı. Lütfen doğru bir şehir adı belirtin.`;
      setResponse(message);
      speak(message);
    }
  };

  // Güncel haberleri alma fonksiyonu
  const getNews = async () => {
    try {
      const response = await axios.get(
        `https://newsapi.org/v2/top-headlines?country=tr&apiKey=${apiKeyNews}`
      );
      if (response.data.status === 'ok' && response.data.totalResults > 0) {
        const articles = response.data.articles;
        const news = articles.map((article, index) => `${index + 1}. ${article.title}`).join('. ');
        setResponse(news);
        speak(`Güncel haberler: ${news}`);
      } else {
        const message = 'Güncel haber bulunamadı.';
        setResponse(message);
        speak(message);
      }
    } catch (error) {
      const message = 'Haberleri alırken bir hata oluştu.';
      setResponse(message);
      speak(message);
    }
  };

  // Hava durumu açıklamalarını çeviren fonksiyon
  const translateWeatherDescription = (description) => {
    const translations = {
      'clear sky': 'açık hava',
      'few clouds': 'az bulutlu',
      'scattered clouds': 'dağınık bulutlu',
      'broken clouds': 'parçalı bulutlu',
      'shower rain': 'sağanak yağış',
      'rain': 'yağmur',
      'thunderstorm': 'gök gürültülü fırtına',
      'snow': 'kar',
      'mist': 'sis',
    };
    return translations[description] || description;
  };

  // Web'de arama yapan fonksiyon
  const performWebSearch = (query) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank'); // Yeni sekmede arama yap
  };

  // Sesli yanıt verme fonksiyonu
  const speak = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'tr-TR';
    window.speechSynthesis.speak(utterance);
  };

  // YouTube'da şarkı arayan ve çalan fonksiyon
  const playSongOnYouTube = async (songQuery) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          songQuery
        )}&type=video&key=${youtubeApiKey}`
      );

      if (response.data.items.length > 0) {
        const videoId = response.data.items[0].id.videoId;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        window.open(videoUrl, '_blank'); // Yeni sekmede şarkıyı çal
      } else {
        const message = 'Şarkı bulunamadı.';
        setResponse(message);
        speak(message);
      }
    } catch (error) {
      const message = 'YouTube ile iletişimde bir hata oluştu.';
      setResponse(message);
      speak(message);
    }
  };

  return (
    <div className="app-container">
      <h1>Bilgi ve Komut Asistanı</h1>
      <button onClick={startListening} disabled={isListening}>
        Dinlemeye Başla
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        Dinlemeyi Durdur
      </button>
      <h3>Kullanıcı Mesajı : {text}</h3>
      <h3>Asistan Yanıtı : {response}</h3>
    </div>
  );
};

export default SpeechRecognitionComponent;
