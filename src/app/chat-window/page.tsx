import React from 'react'
import ChatWindow from "../../components/chat-window";

function page() {
    const email = 'user@example.com';
    const id = 1;

  return (
    <ChatWindow email={email} id={id}></ChatWindow>
  )
}

export default page