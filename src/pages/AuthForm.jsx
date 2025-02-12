import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Use this for redirection
import { fetchWithAuth } from "../utlis/api";

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: "", email: "", password: "", password2: "" });
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Reset error before request
        const endpoint = isLogin ? "token" : "register";
        const payload = isLogin
            ? { email: formData.email, password: formData.password }
            : { username: formData.username, email: formData.email, password: formData.password, password2: formData.password2 };

        try {
            const response = await fetch(`${apiBaseUrl}${endpoint}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Something went wrong");
            }

            const data = await response.json();

            if (isLogin) {
                localStorage.setItem("token", data.access); // Store token
                localStorage.setItem("refresh", data.refresh);
                navigate("/timetable"); // Redirect to Timetable page after login
            } else {
                alert("Registration successful. Please log in.");
                setIsLogin(true); // Switch to login form after registration
            }
        } catch (error) {
            console.error("Error:", error);
            setError(error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200">
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Register"}</h2>
            {error && <p className="text-red-500">{error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                {!isLogin && (
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        className="p-2 border rounded-md"
                        required
                    />
                )}
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="p-2 border rounded-md"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="p-2 border rounded-md"
                    required
                />
                {!isLogin && (
                    <input
                        type="password"
                        name="password2"
                        placeholder="Confirm Password"
                        value={formData.password2}
                        onChange={handleChange}
                        className="p-2 border rounded-md"
                        required
                    />
                )}
                <button type="submit" className="p-2 bg-blue-500 text-white rounded-md">
                    {isLogin ? "Login" : "Register"}
                </button>
            </form>
            <button
                onClick={() => setIsLogin(!isLogin)}
                className="mt-4 text-blue-500 underline"
            >
                {isLogin ? "Switch to Register" : "Switch to Login"}
            </button>
        </div>
        </div>
    );
};

export default AuthForm;
