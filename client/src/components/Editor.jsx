import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { roomsAPI, invitesAPI } from '../api';
import InviteModal from './InviteModal';
import Chat from './Chat';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:1234';

const EditorPage = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [userColor, setUserColor] = useState('');
  const [roomMembers, setRoomMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  useEffect(() => {
    fetchRoom();
    return () => {
      // Cleanup Yjs connections
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
    };
  }, [id]);

  const fetchRoom = async () => {
    try {
      const res = await roomsAPI.getOne(id);
      setRoom(res.data);
      setLanguage(res.data.language);
      
      // Set room members and check if user is admin
      if (res.data.members) {
        setRoomMembers(res.data.members);
      }
      
      // Check if user is admin
      const userEmail = user.email || 'guest@example.com';
      const adminMember = res.data.members?.find(
        m => (m.email === userEmail || m.email === 'guest@example.com') && m.role === 'admin'
      );
      
      // User is admin if:
      // 1. They're in the members list as admin
      // 2. They're the room owner (by email match)
      // 3. No members exist yet (room creator is admin)
      const isRoomOwner = res.data.owner?.email === userEmail || 
                          res.data.owner?.email === 'guest@example.com' ||
                          !res.data.members || res.data.members.length === 0;
      
      setIsAdmin(!!adminMember || isRoomOwner);
      
      initializeYjs(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching room:', error);
      alert('Room not found');
      navigate('/');
    }
  };

  const initializeYjs = (roomData) => {
    // Clean up existing connections
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create Y.Text for the editor content
    const ytext = ydoc.getText('monaco');

    // Connect to WebSocket provider
    const provider = new WebsocketProvider(WS_URL, `room-${roomData._id}`, ydoc);
    providerRef.current = provider;

    // Bind immediately if editor is already mounted, otherwise wait
    if (editorRef.current && editorRef.current.getModel()) {
      bindMonacoToYjs(ydoc, provider, roomData);
    } else {
      // Wait for editor to mount, then bind
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkEditor = setInterval(() => {
        attempts++;
        if (editorRef.current && editorRef.current.getModel()) {
          clearInterval(checkEditor);
          bindMonacoToYjs(ydoc, provider, roomData);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkEditor);
          console.error('Editor failed to mount after 5 seconds');
        }
      }, 100);
    }
  };

  const bindMonacoToYjs = (ydoc, provider, roomData) => {
    // Prevent duplicate binding
    if (bindingRef.current) {
      console.warn('Binding already exists, skipping duplicate binding');
      return;
    }

    try {
      const editor = editorRef.current;
      if (!editor || !editor.getModel()) {
        console.error('Editor or model not available for binding');
        return;
      }

      const ytext = ydoc.getText('monaco');
      const model = editor.getModel();
      
      // Bind Monaco editor to Yjs
      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness
      );
      bindingRef.current = binding;

      // Set initial content if empty
      if (ytext.length === 0) {
        const defaultContent = getDefaultContent(roomData.language);
        ytext.insert(0, defaultContent);
      }
    } catch (error) {
      console.error('Error binding Monaco to Yjs:', error);
    }
  };

  const getDefaultContent = (lang) => {
    const defaults = {
      javascript: '// Welcome to Collab Editor!\n// Start coding together...\n\nfunction hello() {\n  console.log("Hello, World!");\n}',
      python: '# Welcome to Collab Editor!\n# Start coding together...\n\ndef hello():\n    print("Hello, World!")',
      java: '// Welcome to Collab Editor!\n// Start coding together...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      cpp: '// Welcome to Collab Editor!\n// Start coding together...\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
      html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Welcome</title>\n</head>\n<body>\n    <h1>Welcome to Collab Editor!</h1>\n</body>\n</html>',
      css: '/* Welcome to Collab Editor! */\n/* Start styling together... */\n\nbody {\n    font-family: Arial, sans-serif;\n}',
      typescript: '// Welcome to Collab Editor!\n// Start coding together...\n\nfunction hello(): void {\n  console.log("Hello, World!");\n}'
    };
    return defaults[lang] || defaults.javascript;
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // If Yjs is already initialized and no binding exists, bind now
    if (ydocRef.current && providerRef.current && !bindingRef.current) {
      bindMonacoToYjs(ydocRef.current, providerRef.current, room || { language: 'javascript' });
    }
    
    // Configure user presence
    if (providerRef.current) {
      const awareness = providerRef.current.awareness;
      const color = userColor || `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      if (!userColor) {
        setUserColor(color);
      }
      
      awareness.setLocalStateField('user', {
        name: user.name,
        color: color
      });
    }
  };

  const copyRoomLink = async () => {
    try {
      // Use room ID from URL params (id is from useParams)
      const roomId = id || room?._id;
      if (!roomId) {
        alert('Room ID not available yet. Please wait a moment.');
        return;
      }

      // Copy direct room link (users can access directly)
      const link = `${window.location.origin}/room/${roomId}`;
      
      console.log('Copying link:', link); // Debug log
      
      // Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(link);
          console.log('Link copied successfully via clipboard API');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (clipboardError) {
          console.error('Clipboard API error:', clipboardError);
          // Fallback to execCommand
          fallbackCopy(link);
        }
      } else {
        // Fallback for older browsers
        fallbackCopy(link);
      }
    } catch (error) {
      console.error('Error copying link:', error);
      const roomId = id || room?._id;
      const link = `${window.location.origin}/room/${roomId}`;
      // Show link in alert as last resort
      alert(`Please copy this link manually:\n\n${link}`);
    }
  };

  const fallbackCopy = (link) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('Link copied successfully via execCommand');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      // Show link in prompt as last resort
      const userInput = prompt('Copy this link (Ctrl+C to copy):', link);
      if (userInput) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    try {
      await roomsAPI.update(id, { language: newLang });
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-300 hover:text-white px-3 py-1 rounded hover:bg-gray-700 transition"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-2">
            <h2 className="text-white font-semibold">{room?.name}</h2>
            {isAdmin && (
              <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded font-semibold">
                👑 Admin
              </span>
            )}
          </div>
          <span className="text-gray-400 text-sm">Room ID: {id}</span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={copyRoomLink}
            className="text-gray-300 hover:text-white px-4 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2"
          >
            <span>📋</span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition flex items-center space-x-2"
            title={isAdmin ? "Invite Members (Admin)" : "Invite Members"}
          >
            <span>📧</span>
            <span>Invite Members</span>
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`px-4 py-2 rounded transition ${
              showChat
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title={showChat ? 'Hide Chat' : 'Show Chat'}
          >
            💬 Chat
          </button>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="typescript">TypeScript</option>
          </select>
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'vs' : 'vs-dark')}
            className="text-gray-300 hover:text-white px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            {theme === 'vs-dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Editor and Chat */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language}
            theme={theme}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              readOnly: false
            }}
          />
        </div>
        
        {/* Chat Sidebar */}
        {showChat && ydocRef.current && providerRef.current && userColor && (
          <div className="w-80 border-l border-gray-700 flex-shrink-0 relative">
            <Chat
              ydoc={ydocRef.current}
              provider={providerRef.current}
              user={user}
              userColor={userColor}
              roomId={id}
            />
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          roomId={id}
          roomName={room?.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

export default EditorPage;

