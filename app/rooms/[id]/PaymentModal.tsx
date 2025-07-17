"use client";

import { useState } from "react";
import api from "../../gateway-services/ConnectionService";
import type { BookingPayload } from "./page";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingPayload;
  totalPrice: number;
  onSuccess: () => void;
}

/*interface BookingData {
  id: number;
  userId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  total: number;
  status: string;
  discount: number;
}*/

type PaymentMethod = "card" | "yape" | "plin";

export default function PaymentModal({
  isOpen,
  onClose,
  bookingData,
  totalPrice,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [billing, setBilling] = useState({
    address: "",
    apt: "",
    city: "",
    region: "",
    postal: "",
    country: "Perú",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (val: string) =>
    val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (val: string) =>
    val
      .replace(/\D/g, "")
      .slice(0, 4)
      .replace(/(\d{2})(\d{1,2})/, "$1/$2");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agree) return setError("Please accept the terms and conditions.");

    if (paymentMethod === "card") {
      if (
        !cardNumber ||
        cardNumber.replace(/\s/g, "").length !== 16 ||
        !cardName ||
        !expiry ||
        !cvv ||
        !billing.address ||
        !billing.city ||
        !billing.region ||
        !billing.postal ||
        !billing.country
      ) {
        return setError("Please complete all card and billing fields.");
      }
    }

    if (
      (paymentMethod === "yape" || paymentMethod === "plin") &&
      !phoneNumber
    ) {
      return setError("Phone number is required.");
    }

    setLoading(true);
    try {
      await api.post(`/bookings/save`, bookingData);
      await api.put(`/rooms/${bookingData.roomId}/status?status=BOOKED`);
      onSuccess();
      onClose();
    } catch {
      setError("Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-auto max-h-[90vh]">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-800">
            Select a payment method
          </h2>

          <div className="flex justify-center gap-2">
            {["card", "yape", "plin"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method as PaymentMethod)}
                className={`px-4 py-2 rounded border ${paymentMethod === method ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                {method.toUpperCase()}
              </button>
            ))}
          </div>

          {paymentMethod === "card" && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Card Number"
                maxLength={19}
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(formatCardNumber(e.target.value))
                }
                className="w-full px-4 py-2 border rounded-md"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Expiry (MM/YY)"
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className="w-full px-4 py-2 border rounded-md"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
              <input
                type="text"
                placeholder="Name on Card"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
              <h3 className="text-sm font-medium text-gray-700">
                Billing Address
              </h3>
              <input
                type="text"
                placeholder="Address"
                value={billing.address}
                onChange={(e) =>
                  setBilling({ ...billing, address: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Apartment or suite"
                value={billing.apt}
                onChange={(e) =>
                  setBilling({ ...billing, apt: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="City"
                value={billing.city}
                onChange={(e) =>
                  setBilling({ ...billing, city: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="State/Region"
                  value={billing.region}
                  onChange={(e) =>
                    setBilling({ ...billing, region: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={billing.postal}
                  onChange={(e) =>
                    setBilling({ ...billing, postal: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
              <select
                value={billing.country}
                onChange={(e) =>
                  setBilling({ ...billing, country: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-md"
              >
                <option value="Perú">Perú</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {(paymentMethod === "yape" || paymentMethod === "plin") && (
            <div className="space-y-2">
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, ""))
                }
                className="w-full px-4 py-2 border rounded-md"
              />
              <p className="text-sm text-center text-gray-600">
                Receiver: <strong>MUNAY WASI</strong>
              </p>
            </div>
          )}

          <div className="flex items-center">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="agree" className="ml-2 text-sm">
              I agree to the{" "}
              <a href="/terms" className="text-blue-600 underline">
                Terms & Conditions
              </a>
            </label>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div className="bg-gray-100 p-4 rounded text-center">
            <p className="text-gray-700 font-medium mb-1">Total</p>
            <p className="text-xl font-bold text-gray-900">
              ${totalPrice.toFixed(2)}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing…" : "Complete Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
