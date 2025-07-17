"use client";

import { useEffect, useState } from "react";
import api from "../../gateway-services/ConnectionService";
import axios from "axios";
//import { useDebounce } from "../promotions/hooks/useDebounce";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  joinDate: string; // ⇢ ya formateado a algo legible
  bookings: number;
  totalSpent: number;
  status: "Active" | "Inactive";
}

interface RawStat {
  id: number;
  userName: string;
  userLastName: string;
  userEmail: string;
  cellPhone: string;
  firstBookingDate: string; // ISO‐8601
  totalBookings: number;
  totalAmount: number;
  status: "ACTIVE" | "INACTIVE";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //const [search, setSearch] = useState("");
  //const debouncedSearch = useDebounce(search, 500);

  /* useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        let data: RawStat[] = [];

        if (debouncedSearch.trim()) {
          const res = await api.get<RawStat[]>(
            `/users/username/${debouncedSearch.trim()}`,
            {
              signal: controller.signal,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
          data = Array.isArray(res.data) ? res.data : [res.data];
        } else {
          const res = await api.get<RawStat[]>("/bookings/stats", {
            signal: controller.signal,
            headers: {
              "Cache-Control": "no-store",
            },
          });
          data = res.data;
        }

        const mapped: User[] = data.map((s) => ({
          id: s.id,
          name: `${s.userName} ${s.userLastName}`,
          email: s.userEmail,
          phone: s.cellPhone,
          joinDate: new Date(s.firstBookingDate).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          bookings: s.totalBookings,
          totalSpent: s.totalAmount,
          status: s.status === "ACTIVE" ? "Active" : "Inactive",
        }));

        setUsers(mapped);
        setError(null);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.code !== "ERR_CANCELED") {
            console.error(err);
            setError(
              err.response?.data?.message ??
                err.message ??
                "Error al cargar datos",
            );
          }
        } else if (err instanceof Error) {
          console.error(err);
          setError(err.message ?? "Error al cargar los datos");
        }
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [debouncedSearch]);
*/

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const res = await api.get<RawStat[]>("/bookings/stats", {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-store",
          },
        });
        const data = res.data;
        const mapped: User[] = data.map((s) => ({
          id: s.id,
          name: `${s.userName} ${s.userLastName}`,
          email: s.userEmail,
          phone: s.cellPhone,
          joinDate: new Date(s.firstBookingDate).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          bookings: s.totalBookings,
          totalSpent: s.totalAmount,
          status: s.status === "ACTIVE" ? "Active" : "Inactive",
        }));
        setUsers(mapped);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.code != "ERR_CANCELED") {
            console.error(err);
            setError(
              err.response?.data?.message ??
                err.message ??
                "Error al cargar datos",
            );
          }
        } else if (err instanceof Error) {
          console.error(err);
          setError(err.message ?? "Error al cargar los datos");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const filtered =
    filter === "All" ? users : users.filter((u) => u.status === filter);
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Registered Users</h1>

      {loading && <p className="mb-4">Cargando…</p>}
      {error && (
        <p className="mb-4 text-red-600">
          {error} (revisa consola y CORS en el backend)
        </p>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          className="w-full md:w-1/2 border px-4 py-2 rounded-md"
          //value={search}
          //onChange={(e) => setSearch(e.target.value)}
          // TODO: Implementar búsqueda si la necesitas
        />
        <div className="flex gap-2">
          {(["All", "Active", "Inactive"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-md border ${
                filter === value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border-blue-600"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-left font-semibold">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Join Date</th>
              <th className="px-4 py-2">Bookings</th>
              <th className="px-4 py-2">Total Spent</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium">#{u.id}</td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">
                  <div>{u.email}</div>
                  <div className="text-xs text-gray-500">{u.phone}</div>
                </td>
                <td className="px-4 py-2">{u.joinDate}</td>
                <td className="px-4 py-2">{u.bookings}</td>
                <td className="px-4 py-2">${u.totalSpent}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button className="px-3 py-1 border rounded text-blue-600 hover:bg-blue-50">
                    View
                  </button>
                  <button className="px-3 py-1 border rounded text-green-600 hover:bg-green-50">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
