import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyWaitlist, joinWaitlist, leaveWaitlist } from "@/services/waitlist";
import { useUser } from "@/context/UserContext";

// Lista de espera del cliente logueado + acciones para anotarse/salir de un día.
export const useWaitlist = () => {
  const { user, userProfile } = useUser();
  const email = user?.email || undefined;
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["waitlist", email],
    queryFn: () => getMyWaitlist(email!),
    enabled: !!email,
    staleTime: 1000 * 60,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["waitlist", email] });

  const isInWaitlist = (date: string) => entries.some((e) => e.date === date);

  const join = async (date: string) => {
    if (!email) return;
    const name = userProfile?.name || user?.displayName || "Cliente";
    await joinWaitlist(email, name, date);
    await invalidate();
  };

  const leave = async (date: string) => {
    if (!email) return;
    await leaveWaitlist(email, date);
    await invalidate();
  };

  return { entries, isLoading, isInWaitlist, join, leave };
};
