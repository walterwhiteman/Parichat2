import React, { useState } from 'react';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));
  const [username, setUsername] = useState('');

  const handleLogin = (roomCode: string, userName: string) => {
    setRoomId(roomCode);
    setUsername(userName);
    setIsLoggedIn(true);
  };

  const handleLeaveRoom = () => {
    setIsLoggedIn(false);
    setRoomId('');
    setUsername('');
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <ChatRoom
          roomId={roomId}
          userId={userId}
          username={username}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;