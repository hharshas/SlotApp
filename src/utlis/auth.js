
export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refresh");
    if (!refreshToken) {
        throw new Error("No refresh token found");
    }
    try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Refresh token expired. Please log in again.");
            }
            throw new Error("Failed to refresh access token");
        }

        const data = await response.json();
        localStorage.setItem("token", data.access); 
        localStorage.setItem("refresh", data.refresh);
        return data.access; 
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw error;
    }
};