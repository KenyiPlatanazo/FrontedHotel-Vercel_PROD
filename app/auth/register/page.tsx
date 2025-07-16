// app/register/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone } from "lucide-react";
import Link from "next/link";
//import api from "../../gateway-services/ConnectionService";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    secondName: "",
    lastName: "",
    username: "",
    email: "",
    cellPhone: "",
    password: "",
  });
  const [usernameError, setUsernameError] = useState<string>("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === "username") {
      setUsernameError("");
    }
  };

  const checkUsername = async (e: React.FocusEvent<HTMLInputElement>) => {
    const username = e.target.value.trim();
    if (!username) return;
    try {
      const { data } = await axios.get<{ available: boolean }>(
        `${API_URL}/users/check-username`,
        { params: { username } },
      );
      if (!data.available) {
        setUsernameError("Username already exists. Please choose another.");
      }
    } catch {
      setUsernameError("Could not verify username. Try again later.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, lastName, username, email, cellPhone, password } = formData;

    if (!name || !lastName || !username || !email || !cellPhone || !password) {
      alert("Please complete all required fields.");
      return;
    }
    if (usernameError) {
      alert(usernameError);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/users`,
        { ...formData },
        { headers: { "Content-Type": "application/json" } },
      );

      // Después de registrar, redirige al login:
      router.push("/auth/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(
          error?.response?.data?.message ||
            "Registration failed. Please try again",
        );
      } else {
        console.error(error);
        alert("Error inesperado");
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>
        <form onSubmit={handleRegister} className="space-y-5">
          {/* First Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <div className="mt-1 flex items-center border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <input
                id="name"
                type="text"
                className="flex-1 outline-none"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Second Name */}
          <div>
            <label
              htmlFor="secondName"
              className="block text-sm font-medium text-gray-700"
            >
              Second Name (optional)
            </label>
            <div className="mt-1 flex items-center border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <input
                id="secondName"
                type="text"
                className="flex-1 outline-none"
                value={formData.secondName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <div className="mt-1 flex items-center border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <input
                id="lastName"
                type="text"
                className="flex-1 outline-none"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <div className="mt-1">
              <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
                <User className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  id="username"
                  type="text"
                  className="flex-1 outline-none"
                  placeholder="JohnDoe1"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={checkUsername}
                  required
                />
              </div>
              {usernameError && (
                <p className="mt-1 text-sm text-red-500">{usernameError}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="mt-1 flex items-center border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
              <Mail className="w-5 h-5 text-gray-400 mr-2" />
              <input
                id="email"
                type="email"
                className="flex-1 outline-none"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Cell Phone */}
          <div>
            <label
              htmlFor="cellPhone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone
            </label>
            <div className="mt-1 flex items-center border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
              <Phone className="w-5 h-5 text-gray-400 mr-2" />
              <input
                id="cellPhone"
                type="tel"
                className="flex-1 outline-none"
                placeholder="912345678"
                pattern="^[1-9]+$"
                title="Only digits 1–9 are allowed."
                value={formData.cellPhone}
                onChange={handleChange}
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity(
                    "Please enter only digits 1–9.",
                  )
                }
                onInput={(e) => e.currentTarget.setCustomValidity("")}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1 flex items-center border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                id="password"
                type="password"
                className="flex-1 outline-none"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={!!usernameError}
            className={`w-full py-2 px-4 rounded-xl transition ${
              usernameError
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            Register
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
