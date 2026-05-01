import ChatWindow from "../../components/chat-window";
import { redirect } from "next/navigation";
import { getServerUser } from '@/src/lib/auth/server';

async function page() {
    const user = await getServerUser();
    
    if (!user) {
        redirect("/login");
    }

  return (
    <>
    <ChatWindow username={user.username} id={user.id}></ChatWindow>
    </>
  )
}

export default page