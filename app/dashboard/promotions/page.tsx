"use client";

import { useState, useEffect, useCallback } from "react";
import * as service from "../promotions/service/promotionService";
import { format } from "date-fns";
import { useDebounce } from "./hooks/useDebounce";
import PromotionForm from "./components/PromotionForm";
import PromotionDetails from "./components/DetailsModal";

export default function PromotionsPage() {
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<service.Promotion[]>([]);
  const [roomTypes, setRoomTypes] = useState<service.RoomType[]>([]);
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedProm, setSelectedProm] = useState<service.Promotion | null>(
    null,
  );
  const [promToBeEdited, setPromToBeEdited] =
    useState<service.Promotion | null>(null);
  const [editPromotion, setEditPromotion] =
    useState<service.PromotionRequest | null>(null);
  const [showEditPromotion, setShowEditPromotion] = useState(false);
  const [showAddPromotion, setShowAddPromotion] = useState(false);
  const [newPromotion, setNewPromotion] = useState<service.PromotionRequest>({
    name: "",
    description: "",
    discountValue: 0,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(
      new Date(new Date().setMonth(new Date().getMonth() + 1)),
      "yyyy-MM-dd",
    ),
    type: "percentage",
    isActive: true,
    minStay: 1,
    roomApplicability: "all",
    roomsIds: [],
  });

  const fetchFilteredPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const sanitizedSearch = debouncedSearch.trim();
      const sanitizedStatus =
        filter === "All" ? undefined : filter === "Active";
      const results = await service.searchPromotionsByNameAndOrStatus(
        sanitizedSearch === "" ? undefined : sanitizedSearch,
        sanitizedStatus,
      );
      setPromotions(results);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to get promotions", error);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter]);

  useEffect(() => {
    fetchFilteredPromotions();
  }, [fetchFilteredPromotions]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const data = await service.getAllRoomTypes();
        setRoomTypes(data);
      } catch (error) {
        console.error("Failed to get roomTypes", error);
      }
    };
    fetchRoomTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newPromotion) return;
      await service.savePromotionRequest(newPromotion);
      setShowAddPromotion(false);
      await fetchFilteredPromotions();
    } catch (error) {
      console.error("Saving promotion failed", error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPromotion || !promToBeEdited) return;
    try {
      await service.updatePromotion(promToBeEdited.promotionId, editPromotion);
      await fetchFilteredPromotions();
      setShowAddPromotion(false);
      setPromToBeEdited(null);
    } catch (err) {
      console.error("Failed to update the promotion:", err);
    }
  };

  const openEditModal = (promo: service.Promotion) => {
    setPromToBeEdited(promo);
    setEditPromotion({
      name: promo.name,
      description: promo.description,
      discountValue: promo.discountValue,
      startDate: promo.startDate,
      endDate: promo.endDate,
      type: promo.type,
      isActive: promo.isActive,
      minStay: promo.minStay,
      roomApplicability: promo.roomApplicability,
      roomsIds: promo.rooms?.map((rt) => rt.id) ?? [],
    });
    setShowEditPromotion(true);
  };

  if (!loading) {
    return (
      <>
        <div className="p-6 space-y-6">
          {/* Title and button */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Promotions & Discounts</h1>
            <button
              onClick={() => setShowAddPromotion(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Add New Promotion
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            placeholder="Search promotions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/3"
          />
          <div className="space-x-2">
            {(["All", "Active", "Inactive"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-3 py-1 rounded-full border ${
                  filter === option
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        {/* Panel to create a new promotion */}
        {showAddPromotion && (
          <PromotionForm
            mode="create"
            promotion={newPromotion}
            setPromotion={
              setNewPromotion as React.Dispatch<
                React.SetStateAction<service.PromotionRequest | null>
              >
            }
            onSubmit={handleSubmit}
            onCancel={() => setShowAddPromotion(false)}
            roomTypes={roomTypes}
          />
        )}
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                {[
                  "Title",
                  "Discount type",
                  "Discount",
                  "Start date",
                  "End date",
                  "Minimum Stay",
                  "Applicable Rooms",
                  "Status",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-sm font-medium text-gray-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr
                  key={promo.promotionId}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{promo.name}</div>
                    <div className="text-gray-500 text-xs">
                      {promo.description.substring(0, 60)}...
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{promo.type}</td>
                  <td className="px-4 py-3 text-sm">
                    {promo.type === "percentage"
                      ? `${promo.discountValue}% off`
                      : promo.type === "fixed"
                        ? `${promo.discountValue} off`
                        : "Added value"}
                  </td>
                  <td className="px-4 py-3 text-sm">{promo.startDate}</td>
                  <td className="px-4 py-3 text-sm">{promo.endDate}</td>
                  <td className="px-4 py-3 text-sm">{promo.minStay}</td>
                  <td className="px-4 py-3 text-sm">
                    {promo.roomApplicability}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        promo.isActive === true
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {promo.isActive === true ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      className="text-blue-600 underline text-xs"
                      onClick={() => openEditModal(promo)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-blue-600 underline text-xs"
                      onClick={() => setSelectedProm(promo)}
                    >
                      Details
                    </button>
                    <button className="text-red-600 underline text-xs">
                      {promo.isActive === true ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedProm && (
          <PromotionDetails
            promotion={selectedProm}
            onClose={() => setSelectedProm(null)}
          />
        )}

        {showEditPromotion && editPromotion && (
          <PromotionForm
            mode="edit"
            promotion={editPromotion}
            setPromotion={setEditPromotion}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditPromotion(false)}
            roomTypes={roomTypes}
          />
        )}
      </>
    );
  } else {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }
}
