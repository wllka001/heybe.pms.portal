import { useMemo } from 'react';

export default function useAuthUser() {
    const authUser = useMemo(() => {
        const stored = sessionStorage.getItem("authUser");
        if (!stored) return null;

        try {
            const parsed = JSON.parse(stored);
            const sessionData = parsed?.data || parsed || {};
            const user = sessionData?.user || sessionData?.staff || {};
            const token = sessionData?.accessToken || parsed?.accessToken || parsed?.token || null;
            const firstName = user?.firstName || "Admin";
            const lastName = user?.lastName || "";

            return {
                id: user?.id || user?._id || null,
                email: user?.email || null,
                username: user?.username || user?.email || null,
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`.trim(),
                role: user?.role || "Admin",
                organizationId: user?.organizationId || null,
                accessibleBuildings: user?.accessibleBuildings || [],
                status: user?.status || null,
                token,
                raw: parsed  // full object if needed
            };
        } catch (e) {
            console.error("Failed to parse authUser from session:", e);
            return null;
        }
    }, []);

    return authUser;
}
