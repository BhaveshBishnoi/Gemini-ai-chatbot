import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, MessageSquare, Trash2 } from "lucide-react";

interface SidebarProps {
  chats: { id: string; title: string }[];
  activeChat: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export function Sidebar({ chats, activeChat, onNewChat, onSelectChat, onDeleteChat }: SidebarProps) {
  return (
    <aside className="w-80 bg-[#1a1b1e] border-r border-white/10 flex flex-col h-full">
      <div className="p-3">
        <Button
          onClick={onNewChat}
          variant="secondary"
          className="w-full bg-white/10 hover:bg-white/20 text-white border-0"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 pb-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer ${
                activeChat === chat.id ? 'bg-white/10' : ''
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-center space-x-3 text-white/80">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm truncate">{chat.title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-8 w-8 text-white/60 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
} 