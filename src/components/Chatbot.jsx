import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm the Jemrald assistant. How can I help you today?", isBot: true },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = { id: Date.now(), text: inputMessage, isBot: false };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const response = getBotResponse(userMessage.text.toLowerCase());
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: response, isBot: true }]);
    }, 600);
  };

  const getBotResponse = (text) => {
    if (text.includes('menu') || text.includes('food')) {
      return "You can check out our full menu by clicking the 'Menu' button at the top! We serve fresh sushi, rice meals, and takoyaki.";
    }
    if (text.includes('hour') || text.includes('open') || text.includes('time')) {
      return 'We are open from 10:00 AM to 10:00 PM every day!';
    }
    if (text.includes('location') || text.includes('where') || text.includes('address')) {
      return 'We are located at 123 Sushi Lane, Metroville.';
    }
    if (text.includes('delivery') || text.includes('order')) {
      return 'Yes, we offer delivery! You can place an order directly through our website by adding items to your cart and proceeding to checkout.';
    }
    return 'Thanks for your message! If you need further assistance, please call us at (555) 123-4567.';
  };

  return (
    <>
      <button
        className={`chatbot-toggle-btn ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="chatbot-window"
          >
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="chatbot-avatar">
                  <Bot size={20} />
                </div>
                <div>
                  <h4>Jemrald Support</h4>
                  <p>Online</p>
                </div>
              </div>
              <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="chatbot-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.isBot ? 'bot' : 'user'}`}>
                  {msg.isBot && (
                    <div className="chat-bot-icon">
                      <Bot size={14} />
                    </div>
                  )}
                  <div className="chat-bubble">{msg.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chatbot-input-area" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button type="submit" disabled={!inputMessage.trim()}>
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
