import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { MessageCircle } from "lucide-react";

export default function ConsumerChats() {
  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold flex items-center gap-2"><MessageCircle className="w-5 h-5"/> Chats</h1>
        <p className="text-white/75 mt-1 text-sm">Your active conversations</p>
      </div>

      <div className="p-4 flex flex-col items-center justify-center mt-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <MessageCircle className="w-10 h-10" />
        </div>
        <div>
          <h2 className="font-bold text-lg mb-1">No Active Chats</h2>
          <p className="text-sm text-muted-foreground max-w-[250px]">When you assign a vendor to a job, your chat will appear here.</p>
        </div>
      </div>
    </ConsumerLayout>
  );
}
