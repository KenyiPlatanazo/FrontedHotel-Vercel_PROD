"use client";

import { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

export default function ChatPage() {
  //  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");

  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    const socket = new SockJS(
      "https://microservice-messages-n26r.onrender.com/ws-message",
    );
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        //        setConnected(true);
        client.subscribe("/topic/messages", onMessageReceived);
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      //      setConnected(false);
    };
  }, []);

  const onMessageReceived = (message: IMessage) => {
    const payload = JSON.parse(message.body);
    setMessages((prev) => [...prev, payload.content]);
  };

  const sendMessage = () => {
    if (
      stompClientRef.current &&
      stompClientRef.current.connected &&
      input.trim() !== "" &&
      name.trim() !== "" &&
      email.trim() !== "" &&
      subject.trim() !== ""
    ) {
      const chatMessage = {
        name: name,
        email: email,
        subject: `${subject} de ${name}`,
        content: `${input} Atte: ${name}`,
      };

      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(chatMessage),
      });

      setInput("");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Live Chat</h1>

      <div className="grid gap-2 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="border px-4 py-2 rounded w-full"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu correo electrónico"
          className="border px-4 py-2 rounded w-full"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto del mensaje"
          className="border px-4 py-2 rounded w-full"
        />
      </div>

      <div className="border p-4 h-64 overflow-y-auto bg-white rounded shadow mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 text-gray-800">
            {msg}
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="border px-4 py-2 rounded w-full"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
