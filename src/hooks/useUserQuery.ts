import { useQuery } from "@tanstack/react-query";
import { getHistoryCount, getUserInfo } from "@/services/users";
import { useUser } from "@/context/UserContext";

export const useHistoryCount = () => {
  const { user } = useUser();
  const email = user?.email;

  return useQuery({
    queryKey: ["history", "count", email],
    queryFn: async () => {
        const count = await getHistoryCount();
        if (email) {
            localStorage.setItem(`HISTORY_COUNT_${email}`, String(count));
        }
        return count;
    },
    enabled: !!email,
    staleTime: 1000 * 60 * 30, // 30 minutes
    initialData: () => {
        if (!email) return undefined;
        const stored = localStorage.getItem(`HISTORY_COUNT_${email}`);
        return stored ? Number(stored) : undefined;
    }
  });
};

export const useUserInfo = () => {
    const { user } = useUser();
    // getUserInfo service already handles localStorage caching internally
    return useQuery({
        queryKey: ["user", "info", user?.email],
        queryFn: getUserInfo,
        enabled: !!user?.email,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
