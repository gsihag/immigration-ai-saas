
import React, { useState } from 'react';
import { GeminiChatWidget } from './GeminiChatWidget';

export const GeminiChatContainer: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(true);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <GeminiChatWidget
        isMinimized={isMinimized}
        onToggleMinimize={toggleMinimize}
        className={isMinimized ? '' : 'shadow-xl border'}
      />
    </div>
  );
};
