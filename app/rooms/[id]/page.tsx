"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../gateway-services/ConnectionService";
import PaymentModal from "./PaymentModal";
import axios from "axios";

interface Room {
  roomId: number;
  roomNumber: number;
  roomType: {
    id: number;
    name: string;
    description: string;
    maxOccupancy: number;
    createdAt: string;
    updatedAt: string;
  };
  pricePerNight: number;
  availabilityStatus: string;
  createdAt: string;
  updatedAt: string;
  capacity: number;
  roomSize: number;
  description: string;
  images: { id: number; filename: string; main: boolean }[];
  tags: { id: number; name: string }[];
}

export interface BookingPayload {
  userId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
}

function getToken(): string {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("access_token="));
  return raw ? raw.split("=")[1] : "";
}
export default function RoomDetailPage() {
  const { id } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [totalNights, setTotalNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState<BookingPayload>();

  useEffect(() => {
    if (!id) return;
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/rooms/${id}`);
        setRoom(response.data);
        setTotalPrice(response.data.pricePerNight);
        setTotalNights(1);
      } catch (error) {
        console.error("Error loading room", error);
      }
    };

    fetchRoom();
  }, [id]);

  useEffect(() => {
    if (checkInDate && checkOutDate && room) {
      const startDate = new Date(checkInDate);
      const endDate = new Date(checkOutDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (nights > 0) {
        setTotalNights(nights);
        setTotalPrice(nights * room.pricePerNight);
      }
    }
  }, [checkInDate, checkOutDate, room]);

  const handleBooking = async () => {
    if (!checkInDate || !checkOutDate || !room) return;

    setLoading(true);
    setBookingMessage(null);

    if (totalNights <= 0) {
      setBookingMessage({
        type: "error",
        text: "Check-out date must be after check-in date.",
      });
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Leer token y extraer username
      /*
      const raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith("access_token="));
      const token = raw ? raw.split("=")[1] : "";
      */
      const token = getToken();
      const payload = JSON.parse(atob(token.split(".")[1])) as { sub: string };
      const username = payload.sub;

      // 2️⃣ Llamar a /api/users/username/{username} -> NO doblar /api
      const userResp = await api.get<{ id: number }>(
        `/users/username/${encodeURIComponent(username)}`,
      );
      const userId = userResp.data.id;

      // 3️⃣ Crear payload con userId dinámico
      //
      /*
      const bookingPayload = {
        userId,
        roomId: room.roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
      };
      */

      setBookingData({
        userId: userId,
        roomId: room.roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests,
      });
      //setBookingData(bookingPayload);
      setIsPaymentModalOpen(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Error al preparar la reserva:", err);
        setBookingMessage({
          type: "error",
          text: "No se pudo procesar la reserva. Intenta de nuevo.",
        });
      } else {
        console.error(err);
        alert("Error inesperado");
        setBookingMessage({
          type: "error",
          text: "No se pudo procesar la reserva. Intenta de nuevo.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    setBookingMessage({
      type: "success",
      text: "Booking confirmed! Thank you for your reservation.",
    });
    if (room) {
      setRoom({
        ...room,
        availabilityStatus: "BOOKED",
      });
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading room details...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden">
          {room.images.map((img) => (
            <img
              key={img.id}
              src={`${process.env.NEXT_PUBLIC_API_URL}/rooms/images/${img.filename}`}
              alt={`Room ${room.roomNumber} - View ${img.id}`}
              className="w-full h-56 md:h-64 object-cover rounded-lg transition-transform duration-300 hover:scale-105 cursor-zoom-in"
            />
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Room {room.roomNumber} – {room.roomType.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-semibold text-gray-700">
                  ${room.pricePerNight.toFixed(2)}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    / night
                  </span>
                </span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                room.availabilityStatus === "AVAILABLE"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {room.availabilityStatus === "AVAILABLE" ? "Available" : "Booked"}
            </span>
          </div>

          <p className="text-gray-600 mb-6">{room.description}</p>

          <div className="flex flex-wrap gap-4 text-gray-700 mb-6">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>
                {room.capacity} Guest{room.capacity !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              <span>{room.roomSize} m²</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {room.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-8 border border-gray-200 rounded-2xl shadow-md p-6 bg-white space-y-6 h-fit">
        <h2 className="text-2xl font-bold text-gray-900">Book Your Stay</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in
              </label>
              <input
                type="date"
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out
              </label>
              <input
                type="date"
                min={checkInDate || today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guests
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            >
              {[...Array(room.capacity)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Guest{i > 0 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">
              ${room.pricePerNight.toFixed(2)} × {totalNights} night
              {totalNights !== 1 ? "s" : ""}
            </span>
            <span className="font-medium">${totalPrice.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 my-2"></div>
          <div className="flex justify-between font-bold text-lg mt-3">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {bookingMessage && (
          <div
            className={`p-3 rounded-lg text-sm ${
              bookingMessage.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {bookingMessage.text}
          </div>
        )}

        <button
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleBooking}
          disabled={
            loading ||
            !checkInDate ||
            !checkOutDate ||
            totalNights <= 0 ||
            room.availabilityStatus === "BOOKED"
          }
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              {room.availabilityStatus === "BOOKED"
                ? "Already Booked"
                : "Book Now"}
            </>
          )}
        </button>

        {totalNights > 0 && checkInDate && checkOutDate && (
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
            <p className="font-medium mb-1">Your reservation details:</p>
            <p>• Check-in: {new Date(checkInDate).toLocaleDateString()}</p>
            <p>• Check-out: {new Date(checkOutDate).toLocaleDateString()}</p>
            <p>
              • Duration: {totalNights} night{totalNights !== 1 ? "s" : ""}
            </p>
            <p>• Guests: {guests}</p>
          </div>
        )}
      </div>
      {bookingData && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          bookingData={bookingData}
          totalPrice={totalPrice}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
