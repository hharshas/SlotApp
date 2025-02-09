import { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import dayjs from "dayjs";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const scale = 1; // I have currently set 1 pixel per minute

export default function Timetable() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [eventsByDate, setEventsByDate] = useState({});

  const events = eventsByDate[selectedDate] || [];

  const addEvent = (text, start, duration) => {
    let end = start + duration;
    let hasCollision = events.some(event => !(event.end <= start || event.start >= end));

    if (!hasCollision) {
      const newEvents = [...events, { text, start, end, height: duration, id: Date.now() }];
      setEventsByDate({ ...eventsByDate, [selectedDate]: newEvents });
    } else {
      alert("Slot already filled! Please choose a different time.");
    }
  };

  const handleDragStop = (index, d) => {
    const newStart = Math.round(d.y / scale);
    const newEvents = events.map((event, i) => (i === index ? { ...event, start: newStart, end: newStart + event.height } : event));
    resolveCollisions(newEvents);
  };

  const handleResizeStop = (index, ref) => {
    const newHeight = Math.round(ref.offsetHeight / scale);
    const newEvents = events.map((event, i) => (i === index ? { ...event, height: newHeight, end: event.start + newHeight } : event));
    resolveCollisions(newEvents);
  };

  const resolveCollisions = (newEvents) => {
    newEvents.sort((a, b) => a.start - b.start);
    let hasCollision = newEvents.some((event, i, arr) => i > 0 && arr[i - 1].end > event.start);

    setEventsByDate({ ...eventsByDate, [selectedDate]: hasCollision ? events : newEvents });
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const handleDateChange = (days) => {
    setSelectedDate(dayjs(selectedDate).add(days, "day").format("YYYY-MM-DD"));
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* date navigation bar (I am using dayjs)*/}
      <div className="flex justify-between items-center bg-gray-200 p-2 rounded">
        <button className="px-4 py-1 bg-gray-500 text-white rounded" onClick={() => handleDateChange(-1)}>
          Prev
        </button>
        <div className="font-bold">{dayjs(selectedDate).format("MMM DD, YYYY")}</div>
        <button className="px-4 py-1 bg-gray-500 text-white rounded" onClick={() => handleDateChange(1)}>
          Next
        </button>
      </div>

      {/* timetable grid for the seelectedDay*/}
      <div className="flex gap-4">
        <div className="w-1/4 p-4 bg-gray-100 rounded-lg">
          <AddEventForm addEvent={addEvent} />
        </div>

        <div className="w-3/4 relative border border-gray-300">
          {hours.map((hour, i) => (
            <div key={i} className="border-b border-gray-200 flex items-center px-2 text-gray-600" style={{ height: `${60 * scale}px` }}>
              {hour}
            </div>
          ))}

          {events.map((event, index) => (
            <Rnd
              key={event.id}
              default={{ x: 0, y: event.start * scale, width: "100%", height: event.height * scale }}
              position={{ x: 0, y: event.start * scale }}
              size={{ width: "100%", height: event.height * scale }}
              bounds="parent"
              enableResizing={{ top: false, right: false, bottom: true, left: false }}
              onDragStop={(e, d) => handleDragStop(index, d)}
              onResizeStop={(e, direction, ref) => handleResizeStop(index, ref)}
              className="absolute bg-blue-300 p-2 rounded shadow-md cursor-pointer"
            >
              <div className="text-sm text-center font-bold">{event.text}</div>
              <div className="text-xs text-center mt-1">{formatTime(event.start)} - {formatTime(event.end)}</div>
            </Rnd>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddEventForm({ addEvent }) {
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
    setEventText(""); setStartTime(""); setEndTime("");
  };

  return (
    <>
      <input type="text" placeholder="Event Name" className="w-full p-2 border rounded mb-2" value={eventText} onChange={(e) => setEventText(e.target.value)} />
      <input type="time" className="w-full p-2 border rounded mb-2" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      <input type="time" className="w-full p-2 border rounded mb-2" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      <button className="p-2 bg-blue-500 text-white rounded w-full" onClick={handleAddEvent}>Add Event</button>
    </>
  );
}
