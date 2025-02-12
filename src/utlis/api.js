import { refreshAccessToken } from "./auth";


export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            try {
                const newAccessToken = await refreshAccessToken();
                headers.Authorization = `Bearer ${newAccessToken}`;
                const retryResponse = await fetch(url, { ...options, headers });
                return retryResponse;
            } catch (refreshError) {
                if (refreshError.message === "Refresh token expired. Please log in again.") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refresh");
                    window.location.href = "/auth";
                }
                throw refreshError;
            }
        }

        return response;
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
};