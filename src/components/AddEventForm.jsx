import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { fetchWithAuth } from "../utlis/api";

export default function AddEventForm({ addEvent, showCalendar, selectedDate }) {
  const [eventText, setEventText] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [searchUsername, setSearchUsername] = useState(""); // State for search input
  const navigate = useNavigate(); // Hook for navigation
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const convertToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const handleAddEvent = async () => {
    if (!eventText.trim() || !startTime || !endTime) {
      alert("Please fill in all fields: Event Name, Start Time, and End Time.");
      return;
    }

    const startMinutes = convertToMinutes(startTime);
    const endMinutes = convertToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      alert("Start time must be earlier than end time!");
      return;
    }

    const eventData = {
      event_name: eventText,
      date: selectedDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      start_time: startTime + ":00", // Add seconds to match Django TimeField format
      end_time: endTime + ":00",
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User is not authenticated.");
      }

      const response = await fetchWithAuth(`${apiBaseUrl}timetable/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add event.");
      }

      const data = await response.json();

      addEvent(eventText, startMinutes, endMinutes - startMinutes, data.id); // Update local state
      setEventText("");
      setStartTime("");
      setEndTime("");
      setError("");
    } catch (error) {
      console.error("Error adding event:", error);
      setError(error.message);
    }
  };

  // Function to handle search
  const handleSearch = () => {
    if (searchUsername.trim()) {
      navigate(`/timetable/${searchUsername}`); // Navigate to the searched user's timetable
    } else {
      alert("Please enter a username to search.");
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token
    localStorage.removeItem("refresh"); // Clear refresh token
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="space-y-4">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>

      {/* Search User by Username Section */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Search User Timetable</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter username"
            className="w-full p-2 border rounded"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
          />
          <button
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">Book Slot</h3>
      {/* Add Event Form */}
      {showCalendar && (
        <div className="absolute rounded-lg inset-0 bg-white/80 shadow-lg ring-1 ring-black/5 flex items-center justify-center z-10 ">
          <p className="text-gray-600 text-lg font-semibold text-center">
            Select the date to fill a slot
          </p>
        </div>
      )}
      <input
        type="text"
        placeholder="Event Name"
        className="w-full p-2 border rounded mb-2"
        value={eventText}
        onChange={(e) => setEventText(e.target.value)}
      />
      <input
        type="time"
        className="w-full p-2 border rounded mb-2"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      <input
        type="time"
        className="w-full p-2 border rounded mb-2"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />
      <button className="p-2 bg-blue-500 text-white rounded w-full" onClick={handleAddEvent}>
        Add Event
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}