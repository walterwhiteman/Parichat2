import React, { useState } from 'react';
import { Heart, MessageCircle, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (roomId: string, username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !username.trim()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      onLogin(roomCode.trim(), username.trim());
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500 rounded-full p-4 shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Parichat</h1>
          <p className="text-gray-600 text-sm">A private space for intimate conversations</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your private room code"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageCircle className="inline w-4 h-4 mr-1" />
                Your Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="How should we call you?"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !roomCode.trim() || !username.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Enter Chat Room'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 text-center">
              🔒 Your conversations are private and secure. Share the room code only with someone special.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;