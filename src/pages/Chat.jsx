import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Send, Sparkles } from 'lucide-react';
import './Chat.css';

// ==========================================
// API KEY GEMINI DIAMBIL DARI FILE .env
// ==========================================
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const INITIAL_MESSAGES = [
    {
        id: 1,
        sender: 'bot',
        text: 'Halo! Aku MOODIFY. Aku adalah AI asisten pendamping kesehatan mentalmu. Bagaimana perasaanmu hari ini?',
    }
];

const SUGGESTIONS = [
    "Aku merasa sedih hari ini",
    "Coba teknik pernapasan",
    "Aku merasa cemas",
    "Bagaimana cara journaling?"
];

const Chat = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Load chat history from localStorage on mount
    useEffect(() => {
        const username = localStorage.getItem('moodify_currentUser');
        if (username) {
            const userKey = `moodify_data_${username}`;
            try {
                const savedData = localStorage.getItem(userKey);
                if (savedData) {
                    const userData = JSON.parse(savedData);
                    if (userData.chatHistory && userData.chatHistory.length > 0) {
                        setMessages(userData.chatHistory);
                    } else {
                        // Custom initial greeting with username
                        const personalizedGreeting = [
                            {
                                id: 1,
                                sender: 'bot',
                                text: `Halo ${username}! Aku MOODIFY. Aku adalah AI asisten pendamping kesehatan mentalmu. Bagaimana perasaanmu hari ini?`,
                            }
                        ];
                        setMessages(personalizedGreeting);
                        // Save initial greeting to history
                        userData.chatHistory = personalizedGreeting;
                        localStorage.setItem(userKey, JSON.stringify(userData));
                    }
                }
            } catch (e) {
                console.error("Error loading chat history:", e);
            }
        }
    }, []);

    // Helper to save messages to localStorage
    const saveMessagesToLocal = (newMessages) => {
        const username = localStorage.getItem('moodify_currentUser');
        if (username) {
            const userKey = `moodify_data_${username}`;
            try {
                const savedData = localStorage.getItem(userKey);
                if (savedData) {
                    const userData = JSON.parse(savedData);
                    userData.chatHistory = newMessages;
                    localStorage.setItem(userKey, JSON.stringify(userData));
                }
            } catch (e) {
                console.error("Error saving chat history:", e);
            }
        }
    };

    const getGeminiResponse = async (userText, history) => {
        if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10 || GEMINI_API_KEY === "MASUKKAN_API_KEY_DI_SINI") {
            return "⚠️ Error: API Key Gemini belum dimasukkan dengan benar di dalam kode (variabel `GEMINI_API_KEY`).";
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

            // Build conversation history format for REST API
            const formattedHistory = history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            // Append current message
            formattedHistory.push({
                role: 'user',
                parts: [{ text: userText }]
            });

            const requestBody = {
                system_instruction: {
                    parts: [{ text: "Kamu adalah MOODIFY, sebuah chatbot psikoedukatif berbasis AI untuk remaja. Tugasmu: memberikan dukungan emosional, edukasi kesehatan mental, dan strategi coping. Gaya bahasa: Ramah, empatik, suportif, menggunakan bahasa Indonesia gaul/kasual yang wajar untuk remaja SMA. Jangan memberikan diagnosa medis, sarankan ke profesional jika kondisi berat." }]
                },
                contents: formattedHistory
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (e) { /* ignore json parse error */ }

                console.error("Gemini API Error:", errorMessage);
                return `⚠️ Gagal menghubungi AI: ${errorMessage}`;
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "⚠️ Menerima respons kosong dari AI.";
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            return `⚠️ Gagal terhubung: ${error.message}. Pastikan koneksi internet lancar dan tidak ada pemblokiran CORS/ekstensi VPN.`;
        }
    };

    const handleSend = async (textToSend = inputText) => {
        if (!textToSend.trim()) return;

        // Capture history before adding current message
        const currentHistory = [...messages];

        // Add user message to UI
        const newMessage = {
            id: messages.length + 1,
            sender: 'user',
            text: textToSend
        };

        const updatedMessagesWithUser = [...currentHistory, newMessage];
        setMessages(updatedMessagesWithUser);
        saveMessagesToLocal(updatedMessagesWithUser); // Save after user message

        setInputText('');
        setIsTyping(true);

        // Get AI Response
        const aiText = await getGeminiResponse(textToSend, currentHistory);

        const botResponse = {
            id: updatedMessagesWithUser.length + 1,
            sender: 'bot',
            text: aiText
        };

        const finalUpdatedMessages = [...updatedMessagesWithUser, botResponse];
        setMessages(finalUpdatedMessages);
        saveMessagesToLocal(finalUpdatedMessages); // Save after bot response

        setIsTyping(false);
    };

    return (
        <div className="chat-container">
            {/*... header area ...*/}
            <header className="chat-header">
                <div className="chat-header-left">
                    <div className="chat-logo-mini">🤖</div>
                    <div className="chat-header-text">
                        <h2>MOODIFY</h2>
                        <p>Teman Sehat Mentalmu</p>
                    </div>
                </div>
                <div className="chat-header-actions">
                    <button className="icon-btn-rounded" onClick={() => navigate('/home')}>
                        <Home size={20} />
                    </button>
                </div>
            </header>

            {/*... messages area ...*/}
            <div className="messages-area">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                        {msg.sender === 'bot' && (
                            <div className="message-avatar">🤖</div>
                        )}
                        <div className={`message-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                            {msg.text.split('\n').map((line, i) => (
                                <span key={i}>
                                    {line}
                                    {i !== msg.text.split('\n').length - 1 && <br />}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="message-wrapper bot">
                        <div className="message-avatar">🤖</div>
                        <div className="message-bubble bubble-bot typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/*... input area ...*/}
            <div className="chat-input-wrapper">
                <div className="suggestions-container">
                    {SUGGESTIONS.map((suggestion, idx) => (
                        <button
                            key={idx}
                            className="suggestion-chip"
                            onClick={() => handleSend(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>

                <div className="input-bar">
                    <input
                        type="text"
                        placeholder="Ceritakan perasaanmu..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        className={`send-btn ${inputText.trim() ? 'active' : ''}`}
                        onClick={() => handleSend()}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
