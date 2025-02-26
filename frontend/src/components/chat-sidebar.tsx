import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type ChatSidebarProps = {
  chatMessages: string[];
  sendMsg: (message: string) => void;
  isSocketConnected: boolean;
};

const ChatSidebar = ({
  chatMessages,
  sendMsg,
  isSocketConnected,
}: ChatSidebarProps) => {
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLUListElement>(null);

  const handleSendMessage = () => {
    sendMsg(message);
    setMessage("");
  };

  // optionally auto scroll to the bottom if the user has not
  // scrolled up to view previous chats
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const threshold = 100;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom <= threshold) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <aside className="w-full h-full flex flex-col p-4 bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-800">Chat</h2>

      <ul
        className="flex-1 overflow-y-auto p-2 rounded bg-gray-100"
        ref={chatContainerRef}
      >
        {chatMessages.map((msg, index) => (
          <li key={index} className="mb-2 p-3 bg-white rounded shadow-sm">
            {msg}
          </li>
        ))}
      </ul>

      <form className="flex gap-3 mt-3" onSubmit={handleSubmit}>
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="border-2 border-gray-300 flex-1 p-3 rounded bg-white focus:outline-none focus-visible:ring-transparent"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!isSocketConnected || !message}
          className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Send
        </Button>
      </form>
    </aside>
  );
};

export default ChatSidebar;
