import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import RoomMembers from './RoomMembers';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐',
  '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕',
  '💖', '💗', '💘', '💝', '💞', '💟', '🤎', '🧡', '💯', '🔥',
  '⭐', '🌟', '✨', '💫', '💥', '💢', '💤', '💨', '👀', '🎉',
  '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '✅', '❌', '⚠️',
  '🚀', '💡', '🎯', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵'
];

const Chat = ({ ydoc, provider, user, userColor, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const messagesEndRef = useRef(null);
  const chatArrayRef = useRef(null);
  const awarenessRef = useRef(null);

  useEffect(() => {
    if (!ydoc || !provider || !user) return;

    try {
      // Create Y.Array for chat messages
      const yarray = ydoc.getArray('chat');
      chatArrayRef.current = yarray;

      // Listen to chat array changes
      const updateMessages = () => {
        try {
          const chatMessages = yarray.toArray();
          setMessages(chatMessages);
          scrollToBottom();
        } catch (error) {
          console.error('Error updating messages:', error);
        }
      };

      updateMessages();
      yarray.observe(updateMessages);
      setIsReady(true);

      // Get awareness for online users
      let updateOnlineUsers = null;
      if (provider && provider.awareness) {
        try {
          awarenessRef.current = provider.awareness;
          
          // Listen to awareness changes (users joining/leaving)
          updateOnlineUsers = () => {
            try {
              if (!awarenessRef.current) return;
              const states = Array.from(awarenessRef.current.getStates().values());
              const users = states
                .map(state => state.user)
                .filter(user => user && user.name)
                .map((user, index) => ({
                  id: index,
                  name: user.name,
                  color: user.color || '#6366f1'
                }));
              setOnlineUsers(users);
            } catch (error) {
              console.error('Error updating online users:', error);
            }
          };

          updateOnlineUsers();
          awarenessRef.current.on('change', updateOnlineUsers);
        } catch (error) {
          console.error('Error setting up awareness:', error);
        }
      }

      return () => {
        try {
          if (awarenessRef.current && updateOnlineUsers) {
            awarenessRef.current.off('change', updateOnlineUsers);
          }
          if (yarray) {
            yarray.unobserve(updateMessages);
          }
        } catch (error) {
          console.error('Error cleaning up chat:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }, [ydoc, provider, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Don't render if required props are missing
  if (!ydoc || !provider || !user) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Loading chat...</p>
      </div>
    );
  }

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !chatArrayRef.current) return;

    try {
      const message = {
        id: Date.now().toString(),
        user: user?.name || 'Guest',
        userColor: userColor || '#6366f1',
        text: input.trim(),
        timestamp: new Date().toISOString()
      };

      chatArrayRef.current.push([message]);
      setInput('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const insertEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border-l border-gray-700">
      {/* Chat Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">💬 Chat</h3>
          {onlineUsers.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
            </p>
          )}
        </div>
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 3).map((u, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: u.color }}
              title={u.name}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {onlineUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-gray-800 bg-gray-600 flex items-center justify-center text-xs text-white">
              +{onlineUsers.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-center space-x-2 mb-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: msg.userColor }}
                >
                  {msg.user.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white">{msg.user}</span>
                <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="ml-8 bg-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Room Members */}
      {roomId && (
        <RoomMembers
          roomId={roomId}
          currentUserEmail={user?.email || 'guest@example.com'}
        />
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 right-4 bg-gray-700 rounded-lg p-4 border border-gray-600 shadow-xl max-h-48 overflow-y-auto">
          <div className="grid grid-cols-10 gap-2">
            {EMOJIS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="text-2xl hover:bg-gray-600 rounded p-1 transition"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-3 py-2 text-2xl hover:bg-gray-700 rounded transition"
            title="Add emoji"
          >
            😊
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                sendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

