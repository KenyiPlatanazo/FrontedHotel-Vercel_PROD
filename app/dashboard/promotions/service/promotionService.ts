import api from "../../../gateway-services/ConnectionService";

export type PromotionType = 'percentage' | 'fixed' | 'added_value';
export type RoomApplicability = 'all' | 'selected';

//Promotions fetched from the DB
export interface Promotion{
  promotionId: number;
  name: string;
  description: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  type: PromotionType;
  isActive: boolean;
  minStay: number;
  roomApplicability: RoomApplicability;
  roomsTypes: RoomType[];
}

//Promotion to be registered or updated
export interface PromotionRequest{
  name: string;
  description: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  type: PromotionType;
  isActive: boolean;
  minStay: number;
  roomApplicability: RoomApplicability;
  roomsIds: number[];
}

export interface RoomType{
  roomTypeId: number;
  name: string;
}

export const getAllPromotions = async (): Promise<Promotion[]> =>{
  const res  = await api.get<Promotion[]>(`/api/promotions/all`);
  return res.data;
}
export const searchPromotionsByName = async (name: string): Promise<Promotion[]> =>{
  const res  = await api.get<Promotion[]>(`/api/promotions/name/${name}`);
  return res.data;
}
export const searchPromotionsByNameAndOrStatus = async (name?: string, isActive?: boolean): Promise<Promotion[]> =>{
  const params: Partial<{name: string; isActive: boolean}> = {};
  if(name) params.name = name;
  if(isActive !== undefined) params.isActive = isActive;
  const res = await api.get<Promotion[]>(`/api/promotions/find`, {params});
  return res.data;
}
export const savePromotionRequest = async (promotion: PromotionRequest) =>{
  const res = await api.post(`/api/promotions/save`, promotion);
  return res.data;
}
export const updatePromotion = async (id: number, promotion: PromotionRequest) => {
  const res = await api.put(`/api/promotions/update/${id}`, promotion);
  return res.data;
}
export const getAllRoomTypes = async (): Promise<RoomType[]> =>{
  const res = await api.get<RoomType[]>(`/api/rooms/rooms/type/all`);
  return res.data;
}
