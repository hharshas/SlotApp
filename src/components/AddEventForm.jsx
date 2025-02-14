import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { fetchWithAuth } from "../utlis/api";

export default function AddEventForm({ addEvent, showCalendar, selectedDate }) {
  const [eventText, setEventText] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [error, setError] = useState("");
  const [searchUsername, setSearchUsername] = useState(""); // State for search input
  const navigate = useNavigate(); // Hook for navigation
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const handleAddEvent = async () => {
  if (!eventText.trim() || !startDateTime || !endDateTime) {
    alert("Please fill in all fields: Event Name, Start Time, and End Time.");
    return;
  }

  let start = new Date(startDateTime);
  let end = new Date(endDateTime);

  if (start >= end) {
    alert("Start time must be earlier than end time!");
    return;
  }

  const formatDateTime = (date) => {
    // (+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const utcDate = date.getTime() + date.getTimezoneOffset() * 60 * 1000; // local time to UTC
    const istDate = new Date(utcDate + ((date.getTimezoneOffset() < 0) ? +istOffset : -istOffset)); // apply offset
    console.log("pffset", istOffset);
    console.log("timezone", date.getTimezoneOffset() * 60 * 1000);
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const day = String(istDate.getDate()).padStart(2, "0");
    const hours = String(istDate.getHours()).padStart(2, "0");
    const minutes = String(istDate.getMinutes()).padStart(2, "0");
    const seconds = String(istDate.getSeconds()).padStart(2, "0");
    // 2024-02-14T12:00:00Z
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  };

  const eventData = {
    event_name: eventText,
    start_time: formatDateTime(start),
    end_time: formatDateTime(end),
  };

  console.log("before API call: ", eventData);

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

    const data = await response.json();
    console.log("API response: ", data);

    // const [startHour, startMinute] = data.start_time.split("T")[1].split(":").map(Number);
    // const [endHour, endMinute] = data.end_time.split("T")[1].split(":").map(Number);

    // const startMinutes = startHour * 60 + startMinute;
    // const endMinutes = endHour * 60 + endMinute;
    // const duration = endMinutes - startMinutes;

    addEvent(eventData);

    setEventText("");
    setStartDateTime("");
    setEndDateTime("");
    setError("");
  } catch (error) {
    console.error("Error adding event:", error);
    setError(error.message);
  }
};

  return (
    <div className="space-y-4">
      {/* Logout Button */}
      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
          navigate("/login");
        }}
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
            onClick={() => {
              if (searchUsername.trim()) {
                navigate(`/timetable/${searchUsername}`);
              } else {
                alert("Please enter a username to search.");
              }
            }}
          >
            Search
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">Book Slot</h3>
      {/* {showCalendar && (
        <div className="absolute rounded-lg inset-0 bg-white/80 shadow-lg ring-1 ring-black/5 flex items-center justify-center z-10 ">
          <p className="text-gray-600 text-lg font-semibold text-center">
            Select the date to fill a slot
          </p>
        </div>
      )} */}
      <input
        type="text"
        placeholder="Event Name"
        className="w-full p-2 border rounded mb-2"
        value={eventText}
        onChange={(e) => setEventText(e.target.value)}
      />
      <input
        type="datetime-local"
        className="w-full p-2 border rounded mb-2"
        value={startDateTime}
        onChange={(e) => setStartDateTime(e.target.value)}
      />
      <input
        type="datetime-local"
        className="w-full p-2 border rounded mb-2"
        value={endDateTime}
        onChange={(e) => setEndDateTime(e.target.value)}
      />
      <button className="p-2 bg-blue-500 text-white rounded w-full" onClick={handleAddEvent}>
        Add Event
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
