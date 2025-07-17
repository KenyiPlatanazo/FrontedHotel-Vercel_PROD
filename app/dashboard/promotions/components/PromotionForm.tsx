"use client";
import { motion } from "framer-motion";
import * as service from "../../promotions/service/promotionService";
type PromotionProps = {
  mode: "create" | "edit";
  promotion: service.PromotionRequest;
  setPromotion: React.Dispatch<
    React.SetStateAction<service.PromotionRequest | null>
  >;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCancel: () => void;
  roomTypes: service.RoomType[];
};

const PromotionForm: React.FC<PromotionProps> = ({
  mode,
  promotion,
  setPromotion,
  onSubmit,
  onCancel,
  roomTypes,
}) => {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setPromotion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: name === "isActive" ? value === "true" : value,
      };
    });
  };
  const handleRoomTypeToggle = (roomTypeId: number) => {
    setPromotion((prev) => {
      if (!prev) return prev;
      const roomsIds = prev.roomsIds.includes(roomTypeId)
        ? prev.roomsIds.filter((id) => id !== roomTypeId)
        : [...prev.roomsIds, roomTypeId];
      return { ...prev, roomsIds };
    });
  };

  //Code to be returned
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="bg-white p-8 rounded shadow mb-8"
    >
      <h2 className="text-xl font-semibold mb-6">
        {mode === "create" ? "Create New Promotion" : "Edit Promotion"}
      </h2>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Promotion Title *
            </label>
            <input
              type="text"
              name="name"
              className="w-full p-3 border border-gray-300 rounded"
              value={promotion.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type *
            </label>
            <select
              name="type"
              className="w-full p-3 border border-gray-300 rounded"
              value={promotion.type}
              onChange={handleChange}
              required
            >
              <option value="percentage">Percentage Off</option>
              <option value="fixed">Fixed Amount Off</option>
              <option value="added_value">
                Value Added (No direct discount)
              </option>
            </select>
          </div>

          {promotion.type !== "added_value" && (
            <div className="block text-sm font-medium text-gray-700 mb-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {promotion.type === "percentage"
                  ? "Discount Percentage (%)"
                  : "Discount Amount ($)"}
              </label>
              <input
                type="number"
                name="discountValue"
                className="w-full p-3 border border-gray-300 rounded"
                value={promotion.discountValue}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
          )}

          <div className="block text-sm font-medium text-gray-700 mb-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              className="w-full p-3 border border-gray-300 rounded"
              value={promotion.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="block text-sm font-medium text-gray-700 mb-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              className="w-full p-3 border border-gray-300 rounded"
              value={promotion.endDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="block text-sm font-medium text-gray-700 mb-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimun Stay (Nights)
            </label>
            <input
              type="number"
              name="minStay"
              className="w-full p-3 border border-gray-300 rounded"
              value={promotion.minStay}
              onChange={handleChange}
              min="1"
            />
          </div>

          <div className="block text-sm font-medium text-gray-700 mb-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="isActive"
              className="w-full p-3 border border-gray-300 rounded"
              value={String(promotion.isActive)}
              onChange={handleChange}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="block text-sm font-medium text-gray-700 mb-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            className="w-full p-3 border border-gray-300 rounded resize-y min-h-[120px]"
            value={promotion.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Applicable Rooms
          </label>
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2">
              <input
                type="radio"
                id="allRooms"
                name="roomApplicability"
                value="all"
                checked={promotion.roomApplicability === "all"}
                onChange={handleChange}
              />
              <label htmlFor="allRooms">All Rooms</label>
            </div>

            <div className="inline-flex items-center gap-2">
              <input
                type="radio"
                id="selectedRooms"
                name="roomApplicability"
                value="selected"
                checked={promotion.roomApplicability === "selected"}
                onChange={handleChange}
              />
              <label htmlFor="selectedRooms">Selected Rooms Only</label>
            </div>

            {promotion.roomApplicability === "selected" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {roomTypes?.map((room) => (
                  <label
                    key={room.id}
                    className="inline-flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={promotion.roomsIds.includes(room.id)}
                      onChange={() => {
                        handleRoomTypeToggle(room.id);
                      }}
                    />
                    {room.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
          >
            Save
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PromotionForm;
