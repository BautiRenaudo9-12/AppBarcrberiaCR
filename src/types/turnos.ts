import { BlockedSlot } from "@/services/blocks";

export interface Slot {
  time: string;
  status: 'free' | 'reserved' | 'blocked';
  appointment?: any;
  blockedRule?: BlockedSlot;
  isException?: boolean;
}
