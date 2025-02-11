import { useState } from "react";



export default function AddEventForm({ addEvent, showCalendar }) { 
    const [eventText, setEventText] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const convertToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    const handleAddEvent = () => {
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

      addEvent(eventText, startMinutes, endMinutes - startMinutes);
      setEventText("");
      setStartTime("");
      setEndTime("");
    };

    return (
      <>
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
      </>
    );
  }