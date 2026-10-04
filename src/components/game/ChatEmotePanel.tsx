'use client';

import { useState } from 'react';
import { Send, Smile } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

type ChatEmotePanelProps = {
  messages: ChatMessage[];
  onSendMessage: (text: string, emote?: string) => void;
  onSendEmote: (emote: string) => void;
};

const EMOTES = ['😊', '😂', '😎', '🎲', '🐍', '🪜', '🏆', '🔥', '😭', '👍', '👎', '💥'];
const QUICK_PHRASES = [
  'Good luck!',
  'Nice roll! 🎲',
  'Watch out for snakes! 🐍',
  'Great ladder climb! 🪜',
  'GG! 🏆'
];

export function ChatEmotePanel({ messages, onSendMessage, onSendEmote }: ChatEmotePanelProps) {
  const [inputText, setInputText] = useState('');
  const [showEmotePicker, setShowEmotePicker] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="card p-3.5 flex flex-col gap-3 border border-slate-200 shadow-card bg-white text-slate-800">
      {/* Quick Emote Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-display font-extrabold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Smile className="h-4 w-4 text-brand-yellow" /> Quick Emotes
          </span>
          <button
            type="button"
            className="text-[11px] font-bold text-brand-purple hover:underline"
            onClick={() => setShowEmotePicker((prev) => !prev)}
          >
            {showEmotePicker ? 'Hide Emotes' : 'Show All'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {EMOTES.slice(0, showEmotePicker ? EMOTES.length : 8).map((emote) => (
            <button
              key={emote}
              type="button"
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-lg transition-transform hover:scale-115 active:scale-95 shadow-sm shrink-0"
              onClick={() => onSendEmote(emote)}
              title={`Send ${emote}`}
            >
              {emote}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Phrases */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 whitespace-nowrap shadow-xs transition-transform hover:scale-102"
            onClick={() => onSendMessage(phrase)}
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1 log-scroll border-t border-b border-slate-100 py-2">
        {messages.length === 0 ? (
          <div className="text-xs text-slate-400 italic text-center py-2 font-body">
            No messages yet. Say hi to other players!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 text-xs">
              <span className="text-base select-none shrink-0">{msg.playerAvatar}</span>
              <div className="flex-1 min-w-0">
                <span className="font-display font-extrabold text-slate-900 mr-1.5">
                  {msg.playerName}:
                </span>
                <span className="font-body text-slate-700 font-medium">
                  {msg.emote ? <span className="text-lg mr-1">{msg.emote}</span> : null}
                  {msg.text}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-purple"
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm !px-3 shadow-md"
          title="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
