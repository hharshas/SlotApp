import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { Rnd } from "react-rnd";
import dayjs from "dayjs";
import CustomDatePicker from "../components/CustomDatePicker";
import { fetchWithAuth } from "../utlis/api";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const scale = 1; // 1 pixel per minute


export default function SearchPage() {
  const { username } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate(); // Hook for navigation
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetchWithAuth(`${apiBaseUrl}timetable/${username}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setEventsByDate(transformEvents(data));
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [username]);

  const transformEvents = (backendEvents) => {
    const transformed = {};

    backendEvents.forEach((event) => {
      const date = event.date;
      const start = convertTimeToMinutes(event.start_time);
      const end = convertTimeToMinutes(event.end_time);
      const duration = end - start;

      if (!transformed[date]) {
        transformed[date] = [];
      }

      transformed[date].push({
        text: event.event_name,
        start,
        end,
        height: duration,
        id: event.id,
      });
    });

    return transformed;
  };

  const convertTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
  const events = eventsByDate[formattedDate] || [];

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const handleDateChange = (days) => {
    setSelectedDate(dayjs(selectedDate).add(days, "day").toDate());
  };

  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  return (
    <div className="fw-screen min-h-screen bg-gray-200">
      <div className="flex flex-col gap-4 p-4">
        {/* timetable grid */}
        <div className="flex gap-4">
        <div className="w-1/4 p-4 bg-gray-100 rounded-lg min-h-screen">
        {/* Back Button */}
        <button
          className="w-full p-2 mb-4 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => navigate("/timetable")} 
        >
          Back to Timetable
        </button>
        
        {/* <AddEventForm addEvent={addEvent} showCalendar={showCalendar} selectedDate={selectedDate} /> */}
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
                  onClick={handleCalendarToggle}
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
              <div>
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
                    default={{
                      x: 0,
                      y: event.start * scale,
                      width: "100%",
                      height: event.height * scale,
                    }}
                    position={{ x: 0, y: event.start * scale }}
                    size={{ width: "100%", height: event.height * scale }}
                    bounds="parent"
                    enableResizing={{ top: false, right: false, bottom: false, left: false }}
                    disableDragging={true}
                    className="absolute bg-blue-300 p-2 rounded shadow-md cursor-pointer"
                  >
                    <div className="text-sm text-center font-bold">{event.text}</div>
                    <div className="text-xs text-center mt-1">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                  </Rnd>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}