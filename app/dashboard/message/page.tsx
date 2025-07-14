"use client";

import api from "../../gateway-services/ConnectionService";
import { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
//import axios from "axios";

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  content: string;
  sentDate: string;
  read: boolean;
}

export default function GuestMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    api.get("/messages");
    //.get("http://localhost:54518/api/messages")
    api
      .get("http://localhost:52432/api/messages")
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error loading messages", err));
  }, []);

  useEffect(() => {
    const socket = new SockJS("http://localhost:52432/ws-message");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
      onConnect: () => {
        client.subscribe("/topic/messages", (msg: IMessage) => {
          const newMessage: Message = JSON.parse(msg.body);

          // Actualizar si ya existe o agregar al inicio
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === newMessage.id);
            if (exists) {
              return prev.map((m) => (m.id === newMessage.id ? newMessage : m));
            }
            return [newMessage, ...prev];
          });
          //setMessages((prev) => [newMessage, ...prev]);
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error: ", frame.headers["message"]);
        console.error("Details: ", frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  const filteredMessages = messages.filter((msg) => {
    if (filter === "all") return true;
    if (filter === "read") return msg.read;
    return !msg.read;
  });

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);

    if (!msg.read) {
      api
        //.put(`http://localhost:53431/api/messages/${msg.id}/read`)
        .put(`/api/messages/${msg.id}/read`)
        .then(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)),
          );
        })
        .catch((err) => console.error("Error marking as read", err));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Guest Messages</h1>

      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search messages..."
          className="border px-4 py-2 rounded-md w-72"
        />

        <div className="space-x-2">
          {(["all", "unread", "read"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={
                "px-4 py-1 rounded-full border " +
                (filter === type ? "bg-blue-600 text-white" : "text-blue-700")
              }
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex border rounded-lg overflow-hidden shadow-md"
        style={{ minHeight: "400px" }}
      >
        {/* Lista de mensajes */}
        <div className="w-1/3 border-r p-4 space-y-4 bg-white">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => handleSelectMessage(msg)}
              className={`cursor-pointer p-3 rounded-lg border hover:bg-blue-50 ${
                !msg.read ? "border-l-4 border-blue-600" : ""
              }`}
            >
              <div className="font-semibold flex justify-between">
                <span>{msg.name}</span>
                <span className="text-sm text-gray-400">
                  {new Date(msg.sentDate).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700">{msg.subject}</p>
              <p className="text-xs text-gray-500 truncate">{msg.content}</p>
            </div>
          ))}
        </div>

        <div className="w-2/3 p-6 bg-gray-50">
          {selectedMessage ? (
            <div>
              <h2 className="text-xl font-bold mb-2">
                {selectedMessage.subject}
              </h2>
              <p className="text-gray-600 mb-2">
                From: {selectedMessage.name} (
                {new Date(selectedMessage.sentDate).toLocaleString()})
              </p>
              <hr className="my-2" />
              <p className="text-gray-800 whitespace-pre-line">
                {selectedMessage.content}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📩</div>
                <p>Select a message to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
