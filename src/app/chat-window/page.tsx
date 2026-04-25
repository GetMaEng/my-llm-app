import ChatWindow from "../../components/chat-window";
import { redirect } from "next/navigation";
import { getServerUser } from '@/src/lib/auth/server';

async function page() {
    const email = 'user@example.com';
    const id = 1;

    const user = await getServerUser();
    
    if (!user) {
        redirect("/login");
    }

  return (
    <>
    <ChatWindow email={email} id={id}></ChatWindow>
    </>
  )
}

export default page