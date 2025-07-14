"use client";

import { useEffect, useState } from "react";
import { BedDouble, Tags, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../gateway-services/ConnectionService";

interface RoomType {
  id: number;
  name: string;
}

interface Image {
  id: number;
  filename: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Room {
  roomId: number;
  roomNumber: number;
  roomType: RoomType;
  pricePerNight: number;
  availabilityStatus: string;
  capacity: number;
  roomSize: number;
  description: string;
  images: Image[];
  tags: Tag[];
}

const availabilityMap: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "Available", color: "text-green-600" },
  BOOKED: { label: "Booked", color: "text-red-500" },
  MAINTENANCE: { label: "Maintenance", color: "text-yellow-500" },
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check login status by cookie
    const hasToken = document.cookie
      .split("; ")
      .some((c) => c.startsWith("access_token="));
    setIsLoggedIn(hasToken);
    api
      .get<Room[]>(`/rooms`)
      .then((res) => {
        setRooms(res.data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError("Failed to fetch rooms.");
        console.error(err);
        setLoading(false);
      });

    api
      .get<RoomType[]>(`/roomtype`)
      .then((res) => setRoomTypes(res.data))
      .catch((err) => {
        console.error("Failed to fetch room types:", err);
        setRoomTypes([]);
      });
  }, []);

  const filteredRooms = selectedType
    ? rooms.filter((room) => room.roomType.name === selectedType)
    : rooms;

  const handleLogout = () => {
    // Remove access token cookie by setting expiration in the past
    document.cookie = `access_token=; Path=/; Expires=${new Date(0).toUTCString()}; SameSite=Strict`;
    // For localhost (no HTTPS), don't include Secure flag when deleting
    setIsLoggedIn(false);
    // Optional: verify deletion in console
    console.log("Cookie after deletion:", document.cookie);
    router.push("/oauth/login");
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <BedDouble className="w-7 h-7 text-green-600" />
          Available Rooms
        </h1>
        {/* Conditionally show Sign Out only if logged in */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}

        <select
          className="border border-gray-300 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setSelectedType(e.target.value)}
          value={selectedType}
        >
          <option value="">All Room Types</option>
          {roomTypes.map((type) => (
            <option key={type.id} value={type.name}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-600 text-center py-12">Loading rooms...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-12">{error}</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-gray-600 text-center py-12">No rooms found.</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => {
            const status = availabilityMap[room.availabilityStatus] || {
              label: "Unknown",
              color: "text-gray-500",
            };

            return (
              <div
                key={`room-${room.roomId}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-all overflow-hidden flex flex-col"
              >
                <img
                  src={
                    room.images[0]
                      ? `${process.env.NEXT_PUBLIC_API_URL}/rooms/images/${room.images[0].filename}`
                      : "/images/rooms/default.jpg"
                  }
                  alt={`Room ${room.roomNumber}`}
                  className="w-full h-56 object-cover transition-transform duration-300 hover:scale-105"
                />

                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Room {room.roomNumber} – {room.roomType.name}
                  </h2>

                  <p className={`text-sm font-medium mb-2 ${status.color}`}>
                    {status.label}
                  </p>

                  <p className="text-gray-700 text-md font-medium mb-1">
                    S/ {room.pricePerNight.toFixed(2)}{" "}
                    <span className="text-sm font-normal">per night</span>
                  </p>

                  <p className="text-sm text-gray-500 mb-2">
                    Capacity: {room.capacity} guests | Size: {room.roomSize} m²
                  </p>

                  <p className="text-sm text-gray-600 mb-4 flex-grow">
                    {room.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.tags.map((tag) => (
                      <span
                        key={`tag-${room.roomId}-${tag.id}`}
                        className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1"
                      >
                        <Tags className="w-3 h-3" />
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => router.push(`/rooms/${room.roomId}`)}
                    className="mt-auto w-full bg-green-600 text-white text-sm font-medium py-2 rounded-md hover:bg-green-700 transition"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
