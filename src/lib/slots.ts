import moment from "moment";

export const generateVirtualSlots = (
  start: string, // "09:00"
  end: string,   // "18:00"
  interval: number // 30
): string[] => {
  const slots: string[] = [];
  let current = moment(start, "HH:mm");
  const endTime = moment(end, "HH:mm");

  while (current.isBefore(endTime)) {
    slots.push(current.format("HH:mm"));
    current.add(interval, "minutes");
  }
  
  return slots;
};
