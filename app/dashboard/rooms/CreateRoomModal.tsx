"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import api from "../../gateway-services/ConnectionService";
import axios from "axios";
//import { AxiosError } from "axios";

interface RoomType {
  id: number;
  name: string;
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
  capacity: number;
  roomSize: number;
  description: string;
  images: { filename: string; isMain: boolean }[];
  tags: Tag[];
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  room,
}: {
  isOpen: boolean;
  onClose: () => void;
  room?: Room;
}) {
  const [formData, setFormData] = useState({
    roomNumber: "",
    pricePerNight: "",
    capacity: "",
    roomSize: "",
    description: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [roomTypeSelected, setRoomTypeSelected] = useState<RoomType | null>(
    null,
  );
  const [tagsSelected, setTagsSelected] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);

  // Extrae token de cookie
  function getToken(): string {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith("access_token="));
    return raw ? raw.split("=")[1] : "";
  }

  useEffect(() => {
    api.get(`/roomtype`).then((res) => {
      setRoomTypes(res.data);
    });

    api.get(`/tags`).then((res) => {
      setTags(res.data);
    });
  }, []);

  useEffect(() => {
    if (room) {
      // Precarga datos en modo edición
      setFormData({
        roomNumber: room.roomNumber.toString(),
        pricePerNight: room.pricePerNight.toString(),
        capacity: room.capacity.toString(),
        roomSize: room.roomSize.toString(),
        description: room.description,
      });
      setRoomTypeSelected(room.roomType);
      setTagsSelected(room.tags.map((t) => t.name));
      setMainImageIndex(room.images.findIndex((img) => img.isMain));
    }
  }, [room]);
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    setImageFiles(files);
    setMainImageIndex(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!room && imageFiles.length === 0) {
      alert("Faltan imágenes para crear");
      return;
    }
    if (!roomTypeSelected) {
      alert("Selecciona un tipo de habitación");
      return;
    }

    const payload = {
      roomNumber: parseInt(formData.roomNumber, 10),
      roomType: { id: roomTypeSelected.id, name: roomTypeSelected.name },
      pricePerNight: parseFloat(formData.pricePerNight),
      capacity: parseInt(formData.capacity, 10),
      roomSize: parseFloat(formData.roomSize),
      description: formData.description,
    };

    const data = new FormData();
    data.append(
      "room",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
    imageFiles.forEach((file) => data.append("images", file));
    tagsSelected.forEach((tag) => data.append("tags", tag));

    try {
      const token = getToken();
      if (room) {
        // PUT con /api/rooms
        await api.put(`/rooms/${room.roomId}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Habitación actualizada");
      } else {
        // POST con /api/rooms
        await api.post(`/rooms`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Habitación creada");
      }
      onClose();
      window.location.reload();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Error al guardar habitación:", err.response?.data);
        alert(err.response?.data?.message || "Error al guardar habitación");
      } else {
        console.error(err);
        alert("Error inesperado");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 relative">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {room ? "Editar Habitación" : "Crear Habitación"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              name="roomNumber"
              placeholder="Número"
              value={formData.roomNumber}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            />
            <select
              value={roomTypeSelected?.id || ""}
              onChange={(e) => {
                const sel = roomTypes.find((rt) => rt.id === +e.target.value);
                setRoomTypeSelected(sel || null);
              }}
              required
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Tipo de habitación</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="pricePerNight"
              placeholder="Precio por noche"
              value={formData.pricePerNight}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="number"
              name="capacity"
              placeholder="Capacidad"
              value={formData.capacity}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="number"
              name="roomSize"
              placeholder="Tamaño (m²)"
              value={formData.roomSize}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <textarea
            name="description"
            placeholder="Descripción"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="border rounded px-3 py-2 w-full"
          />

          <div>
            <label className="text-sm font-medium">Imágenes (múltiples)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full mt-1"
            />
            {imageFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {imageFiles.map((file, idx) => (
                  <div
                    key={idx}
                    onClick={() => setMainImageIndex(idx)}
                    className={`relative border rounded overflow-hidden cursor-pointer ${mainImageIndex === idx ? "ring-4 ring-blue-500" : ""}`}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`img-${idx}`}
                      className="w-full h-24 object-cover"
                    />
                    {mainImageIndex === idx && (
                      <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-2 py-1">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Etiquetas</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    value={tag.name}
                    checked={tagsSelected.includes(tag.name)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setTagsSelected([...tagsSelected, tag.name]);
                      else
                        setTagsSelected(
                          tagsSelected.filter((t) => t !== tag.name),
                        );
                    }}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}
