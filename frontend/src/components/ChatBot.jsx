import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import '../styles/UI.css';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    const bottomOfMessagesRef = useRef(null);

    const scrollToLatestMessage = () => {
        bottomOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadConversationHistory = async () => {
        try {
            const response = await axios.get('/api/ai/history');
            if (response.data.length > 0) {
                const formattedMessages = response.data.map(chatRecord => ({ 
                    role: chatRecord.role, 
                    text: chatRecord.message 
                }));
                setMessages(formattedMessages);
            } else {
                setMessages([{ role: 'ai', text: 'Hey there! I am your HR assistant. Ask me anything about your records, leaves, or company assets!' }]);
            }
        } catch (err) {
            console.error('Could not load chat history:', err);
        }
    };

    const clearAllChatHistory = async () => {
        if (!window.confirm('Are you sure you want to delete our entire chat history? This cannot be undone.')) return;
        try {
            await axios.delete('/api/ai/history');
            setMessages([{ role: 'ai', text: 'Fresh start! History has been cleared. How can I help you now?' }]);
        } catch (err) {
            alert('Something went wrong while trying to clear the history.');
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadConversationHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToLatestMessage();
    }, [messages, isAILoading]);

    const sendMessageToAI = async (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        const newUserMessage = { role: 'user', text: userInput };
        setMessages(currentMessages => [...currentMessages, newUserMessage]);
        setUserInput('');
        setIsAILoading(true);

        try {
            const response = await axios.post('/api/ai/chat', { message: userInput });
            const aiReply = { role: 'ai', text: response.data.response };
            setMessages(currentMessages => [...currentMessages, aiReply]);
        } catch (err) {
            const errorMessage = { role: 'ai', text: 'I hit a snag while thinking. Could you try asking that again in a moment?' };
            setMessages(currentMessages => [...currentMessages, errorMessage]);
        } finally {
            setIsAILoading(false);
        }
    };

    return (
        <div className="chatbot-wrapper">
            {!isOpen ? (
                <button onClick={() => setIsOpen(true)} className="chatbot-trigger glass-card">
                    <Sparkles className="sparkle-icon" size={24} />
                    <MessageSquare size={24} />
                </button>
            ) : (
                <div className="glass-card chatbot-window">
                    <div className="chatbot-header">
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <div className="bot-avatar">
                                <Bot size={18} />
                            </div>
                            <div>
                                <p style={{fontWeight: 700, fontSize: '0.9rem', margin: 0}}>AI HR Guide</p>
                                <span style={{fontSize: '0.7rem', opacity: 0.6}}>Always here to help</span>
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button onClick={clearAllChatHistory} className="btn-icon" title="Delete History" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>
                                <Trash2 size={16} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="btn-icon">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((message, index) => (
                            <div key={index} className={`message-wrapper ${message.role}`}>
                                <div className={`message-bubble ${message.role}`}>
                                    {message.text}
                                </div>
                            </div>
                        ))}
                        {isAILoading && (
                            <div className="message-wrapper ai">
                                <div className="message-bubble ai loading">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomOfMessagesRef} />
                    </div>

                    <form onSubmit={sendMessageToAI} className="chatbot-input-area">
                        <input 
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Type a message..." 
                            className="input-field"
                            disabled={isAILoading}
                        />
                        <button type="submit" disabled={isAILoading} className="btn-icon send-btn">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatBot;
