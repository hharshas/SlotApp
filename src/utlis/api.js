import { refreshAccessToken } from "./auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    return toast.promise(
        (async () => {
            try {
                const response = await fetch(url, { ...options, headers });

                if (response.status === 401) {
                    toast.warn("Session expired. Refreshing token...");
                    try {
                        const newAccessToken = await refreshAccessToken();
                        headers.Authorization = `Bearer ${newAccessToken}`;

                        toast.info("Retrying request with new token...");
                        const retryResponse = await fetch(url, { ...options, headers });

                        return retryResponse;
                    } catch (refreshError) {
                        if (refreshError.message === "Refresh token expired. Please log in again.") {
                            localStorage.removeItem("token");
                            localStorage.removeItem("refresh");
                            toast.error("Session expired. Please log in again.");
                            window.location.href = "/auth";
                        }
                        throw refreshError;
                    }
                }

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} - ${response.statusText}`);
                }

                return response;
            } catch (error) {
                console.error("API request failed:", error);
                throw error;
            }
        })(),
        {
            pending: "Loading...",
            success: "Request Performed successfully!",
            error: "Request failed. Please try again.",
        }
    );
};
