import { motion } from "framer-motion";
import * as service from "../service/promotionService";

export default function PromotionDetails({
  promotion,
  onClose,
}: {
  promotion: service.Promotion;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[999] grid h-screen w-screen place-items-center bg-gray-900/50 backdrop-blur-sm"
    >
      <div
        data-dialog="animated-modal"
        data-dialog-mount="opacity-100 translate-y-0 scale-100"
        data-dialog-unmount="opacity-0 -translate-y-28 scale-90 pointer-events-none"
        data-dialog-transition="transition-all duration-300"
        className="relative m-4 p-4 w-2/5 min-w-[40%] max-w-[40%] rounded-lg bg-white shadow-sm"
      >
        <div className="text-center pb-4 text-xl font-medium text-slate-800">
          {promotion.name}
        </div>
        <div className="relative border-t border-slate-200 py-4 leading-normal text-slate-600 font-light space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-slate-800">
              Description
            </h4>
            <p>{promotion.description}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-800">
              Applied Room Types
            </h4>
            <ul className="list-disc list-inside">
              {promotion.rooms?.map((room) => (
                <li key={room.id}>{room.name}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}
