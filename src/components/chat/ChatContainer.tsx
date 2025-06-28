import React, { useState } from 'react';
import { ChatWidget } from './ChatWidget';

export const ChatContainer: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(true);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <ChatWidget
        isMinimized={isMinimized}
        onToggleMinimize={toggleMinimize}
        className={isMinimized ? '' : 'shadow-xl border'}
      />
    </div>
  );
};