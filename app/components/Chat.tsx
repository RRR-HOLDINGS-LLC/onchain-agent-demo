import { useCallback, useEffect, useRef, useState } from 'react';
import { AgentMessage, Language, StreamEntry } from '../types';
import ChatInput from './ChatInput';
import useChat from '../hooks/useChat';
import StreamItem from './StreamItem';
import { notoSansThai } from '../constants';
import { cn } from '@coinbase/onchainkit/theme';

type ChatProps = {
  currentLanguage: Language;
  enableLiveStream?: boolean;
  className?: string;
};

export default function Chat({ className, currentLanguage }: ChatProps) {
  const [userInput, setUserInput] = useState('');
  const [streamEntries, setStreamEntries] = useState<StreamEntry[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  // TODO: revisit this logic
  const handleSuccess = useCallback((messages: AgentMessage[]) => {
    // const message = messages.find((res) => res.event === "agent");
    const filteredMessages = messages.filter(
      (msg) => msg.event !== 'completed',
    );
    const streams = filteredMessages.map((msg) => {
      return {
        timestamp: new Date(),
        content: msg?.data || '',
        type: msg?.event,
      };
    });
    // const streamEntry = {
    //   timestamp: new Date(),
    //   content: message?.data || "",
    // };
    setStreamEntries((prev) => [...prev, ...streams]);
  }, []);

  const { postChat, isLoading } = useChat({ onSuccess: handleSuccess });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userInput.trim()) {
        return;
      }

      setUserInput('');

      const userMessage: StreamEntry = {
        timestamp: new Date(),
        type: 'user',
        content: userInput.trim(),
      };

      setStreamEntries((prev) => [...prev, userMessage]);

      postChat(userInput);
    },
    [postChat, userInput],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  useEffect(() => {
    // scrolls to the bottom of the chat when messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamEntries]);

  return (
    <div className={cn('flex flex-col w-1/2 grow md:flex h-full', className)}>
      <div className="flex flex-col overflow-y-auto p-4 pb-20 grow">
        <p
          className={`text-zinc-500 ${
            currentLanguage === 'th' ? notoSansThai.className : ''
          }`}
        >
          Ask me something...
        </p>
        <div className="mt-4 space-y-2" role="log" aria-live="polite">
          {streamEntries.map((entry, index) => (
            <StreamItem
              key={`${entry.timestamp.toDateString()}-${index}`}
              entry={entry}
              currentLanguage={currentLanguage}
            />
          ))}
        </div>

        <div className="mt-3" ref={bottomRef} />
      </div>

      <ChatInput
        currentLanguage={currentLanguage}
        userInput={userInput}
        handleKeyPress={handleKeyPress}
        handleSubmit={handleSubmit}
        setUserInput={setUserInput}
      />
    </div>
  );
}
