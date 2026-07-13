import { useQuery } from "@tanstack/react-query";
import { getBookingConfig } from "@/services/config";
import { DEFAULT_MAX_DAYS } from "@/types/config";

// Config global de reservas (rango máximo de días). Cache larga: cambia muy de vez en
// cuando y solo desde el panel de Configuración.
export const useBookingConfig = () => {
  return useQuery({
    queryKey: ["config", "booking"],
    queryFn: getBookingConfig,
    staleTime: 1000 * 60 * 30, // 30 min
    placeholderData: { maxDays: DEFAULT_MAX_DAYS },
  });
};
