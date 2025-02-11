import { useState } from "react";
import { Rnd } from "react-rnd";
import dayjs from "dayjs";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import CustomDatePicker from "../components/CustomDatePicker";
import AddEventForm from "../components/AddEventForm";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const scale = 1; // 1 pixel per minute

export default function Timetable() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState({});
  const [showCalendar, setShowCalendar] = useState(false); // State to control calendar visibility

  const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
  const events = eventsByDate[formattedDate] || [];

  const addEvent = (text, start, duration) => {
    let end = start + duration;
    let hasCollision = events.some((event) => !(event.end <= start || event.start >= end));

    if (!hasCollision) {
      const newEvents = [...events, { text, start, end, height: duration, id: Date.now() }];
      setEventsByDate({ ...eventsByDate, [formattedDate]: newEvents });
    } else {
      alert("Slot already taken! Please choose a different time.");
    }
  };

  const handleDragStop = (index, d) => {
    const newStart = Math.round(d.y / scale);
    const newEvents = events.map((event, i) =>
      i === index ? { ...event, start: newStart, end: newStart + event.height } : event
    );
    resolveCollisions(newEvents);
  };

  const handleResizeStop = (index, ref) => {
    const newHeight = Math.round(ref.offsetHeight / scale);
    const newEvents = events.map((event, i) =>
      i === index ? { ...event, height: newHeight, end: event.start + newHeight } : event
    );
    resolveCollisions(newEvents);
  };

  const resolveCollisions = (newEvents) => {
    newEvents.sort((a, b) => a.start - b.start);
    let hasCollision = newEvents.some((event, i, arr) => i > 0 && arr[i - 1].end > event.start);
    setEventsByDate({ ...eventsByDate, [formattedDate]: hasCollision ? events : newEvents });
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const handleDateChange = (days) => {
    setSelectedDate(dayjs(selectedDate).add(days, "day").toDate());
  };

  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar); // Toggle calendar visibility
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date); // Update selected date
    setShowCalendar(false); // Hide calendar after selection
  };

  return (
    <div className="fw-screen min-h-screen bg-gray-200">
      <div className="flex flex-col gap-4 p-4">
        {/* timetable grid */}
        <div className="flex gap-4">
          <div className="w-1/4 p-4 bg-gray-100 rounded-lg min-h-screen fixed">
            <AddEventForm addEvent={addEvent} showCalendar={showCalendar} />
          </div>
          <div className="w-1/4 p-4">
            {/* <AddEventForm addEvent={addEvent} /> */}
          </div>

          <div className="w-3/4 relative border border-gray-300">
            {/* Date Navigation Bar */}
            {true && (

              <div className="flex justify-between bg-gray-200 p-2 rounded">
                <button
                  className="px-4 py-1 bg-gray-500 text-white rounded cursor-pointer"
                  onClick={() => handleDateChange(-1)}
                >
                  Prev
                </button>
                <button
                  className="p-2 border rounded text-center cursor-pointer"
                  onClick={handleCalendarToggle} // Toggle calendar visibility
                >
                  {dayjs(selectedDate).format("MMM DD, YYYY")}
                </button>
                <button 
                  className="px-4 py-1 bg-gray-500 text-white rounded cursor-pointer"
                  onClick={() => handleDateChange(1)}
                >
                  Next
                </button>
              </div>
            )}

            {/* Full-Screen Calendar Modal */}
            {showCalendar && (
                <>
                  <div className="w-full p-4 h-[calc(100vh-10vh)]">
                    <CustomDatePicker selectedDate={selectedDate} handleDateSelect={handleDateSelect} eventsByDate={eventsByDate} />
                  </div>
                </>
            )}

            {/* Timetable Hours */}
            {!showCalendar && (
              <>
                {hours.map((hour, i) => (
                  <div
                    key={i}
                    className="border-b border-gray-300 flex items-center px-2 text-gray-600"
                    style={{ height: `${60 * scale}px` }}
                  >
                    {hour}
                  </div>
                ))}

                {/* Draggable Events */}
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
                    <div className="text-xs text-center mt-1">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                  </Rnd>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

