"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../gateway-services/ConnectionService";

interface RoomType {
  id: number;
  name: string;
}
interface Tag {
  id: number;
  name: string;
}
interface Image {
  id: number;
  filename: string;
  isMain?: boolean;
}

interface Room {
  roomId: number;
  roomNumber: number;
  roomType: RoomType;
  pricePerNight: number;
  capacity: number;
  roomSize: number;
  description: string;
  availabilityStatus: string;
  tags: Tag[];
  images: Image[];
}

export default function EditRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({
    roomNumber: "",
    pricePerNight: "",
    capacity: "",
    roomSize: "",
    description: "",
  });
  //const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [toRemove, setToRemove] = useState<Set<number>>(new Set());
  const [newImages, setNewImages] = useState<File[]>([]);
  const [mainImageId, setMainImageId] = useState<number | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<Room>(`/rooms/${id}`).then((res) => {
      const r = res.data;
      setRoom(r);
      setForm({
        roomNumber: String(r.roomNumber),
        pricePerNight: String(r.pricePerNight),
        capacity: String(r.capacity),
        roomSize: String(r.roomSize),
        description: r.description,
      });
      setSelectedTags(r.tags.map((t) => t.name));
      const main = r.images.find((img) => img.isMain);
      setMainImageId(main?.id ?? null);
    });
    /*
    api
      .get<RoomType[]>(`/api/rooms/roomtype`)
      .then((res) => setRoomTypes(res.data));
    */
    api.get<Tag[]>(`/tags`).then((res) => setTags(res.data));
  }, [id]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const toggleTag = (name: string, checked: boolean) => {
    setSelectedTags((ts) =>
      checked ? [...ts, name] : ts.filter((t) => t !== name),
    );
  };

  const toggleRemove = (imgId: number) => {
    setToRemove((s) => {
      const copy = new Set(s);
      if (copy.has(imgId)) {
        copy.delete(imgId);
      } else {
        copy.add(imgId);
      }
      //copy.has(imgId) ? copy.delete(imgId) : copy.add(imgId);
      //It was made into a normal if-else statement 'cause the nom run build would complain'
      return copy;
    });
  };

  const onNewImages = (e: ChangeEvent<HTMLInputElement>) => {
    setNewImages(Array.from(e.target.files || []));
    setMainImageIndex(null); // reiniciar selección entre las nuevas
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!room) return;

    const payload = {
      roomNumber: parseInt(form.roomNumber),
      roomType: { id: room.roomType.id },
      pricePerNight: parseFloat(form.pricePerNight),
      capacity: parseInt(form.capacity),
      roomSize: parseFloat(form.roomSize),
      description: form.description,
    };

    const data = new FormData();
    data.append(
      "room",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );

    toRemove.forEach((id) => data.append("removeImageIds", String(id)));
    newImages.forEach((f) => data.append("newImages", f));
    selectedTags.forEach((t) => data.append("tags", t));

    // Solo uno: imagen nueva o existente como principal
    if (mainImageIndex !== null) {
      data.append("mainImageIndex", String(mainImageIndex));
    } else if (mainImageId !== null) {
      data.append("mainImageId", String(mainImageId));
    }

    try {
      await api.put(`/rooms/${room.roomId}`, data);
      alert("Habitación actualizada");
      router.back();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar habitación");
    }
  };

  if (!room) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">
        Editar Habitación {room.roomNumber}
      </h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            name="roomNumber"
            value={form.roomNumber}
            onChange={onChange}
            required
            className="border p-2 rounded"
            placeholder="Número"
          />
          <select
            value={room.roomType.id}
            disabled
            className="border p-2 rounded bg-gray-100"
          >
            <option>{room.roomType.name}</option>
          </select>
          <input
            type="number"
            name="pricePerNight"
            value={form.pricePerNight}
            onChange={onChange}
            required
            className="border p-2 rounded"
            placeholder="Precio"
          />
          <input
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={onChange}
            required
            className="border p-2 rounded"
            placeholder="Capacidad"
          />
          <input
            type="number"
            name="roomSize"
            value={form.roomSize}
            onChange={onChange}
            className="border p-2 rounded"
            placeholder="Tamaño (m²)"
          />
        </div>

        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={3}
          className="w-full border p-2 rounded"
          placeholder="Descripción"
        />

        <div>
          <p className="font-medium mb-1">Etiquetas</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <label key={t.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(t.name)}
                  onChange={(e) => toggleTag(t.name, e.target.checked)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>

        {/* Imágenes actuales */}
        <div>
          <p className="font-medium mb-1">
            Imágenes actuales (clic para marcar principal / checkbox para
            eliminar)
          </p>
          <div className="flex gap-4 overflow-x-auto">
            {room.images.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/rooms/images/${img.filename}?t=${Date.now()}`}
                  className={`w-32 h-24 object-cover rounded border cursor-pointer ${
                    mainImageId === img.id ? "ring-4 ring-blue-500" : ""
                  }`}
                  onClick={() => setMainImageId(img.id)}
                />
                <label className="absolute top-1 right-1 bg-white p-1 rounded">
                  <input
                    type="checkbox"
                    checked={toRemove.has(img.id)}
                    onChange={() => toggleRemove(img.id)}
                  />
                </label>
                {mainImageId === img.id && (
                  <div className="absolute bottom-0 left-0 bg-blue-600 text-white text-xs px-2 py-1">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nuevas imágenes */}
        <div>
          <p className="font-medium mb-1">
            Agregar nuevas imágenes (clic para marcar una como principal)
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onNewImages}
            className="w-full"
          />
          {newImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {newImages.map((file, index) => (
                <div
                  key={index}
                  className={`relative border rounded overflow-hidden cursor-pointer ${
                    mainImageIndex === index ? "ring-4 ring-green-500" : ""
                  }`}
                  onClick={() => {
                    setMainImageIndex(index);
                    setMainImageId(null);
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    className="w-full h-24 object-cover"
                  />
                  {mainImageIndex === index && (
                    <div className="absolute top-0 left-0 bg-green-600 text-white text-xs px-2 py-1">
                      Principal
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
