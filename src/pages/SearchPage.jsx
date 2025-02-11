import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Rnd } from "react-rnd";
import dayjs from "dayjs";
import CustomDatePicker from "../components/CustomDatePicker";
import AddEventForm from "../components/AddEventForm";
import SearchBar from "../components/SearchBar";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const scale = 1; // 1 pixel per minute

export default function SearchPage() {
  const { username } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/timetable/${username}/`);
        const data = await response.json();
        const formattedEvents = data.reduce((acc, event) => {
          const date = dayjs(event.date).format("YYYY-MM-DD");
          if (!acc[date]) acc[date] = [];
          acc[date].push({
            text: event.event_name,
            start: dayjs(event.start_time).diff(dayjs(event.start_time).startOf("day"), "minutes"),
            end: dayjs(event.end_time).diff(dayjs(event.end_time).startOf("day"), "minutes"),
            height: dayjs(event.end_time).diff(dayjs(event.start_time), "minutes"),
            id: event.id,
          });
          return acc;
        }, {});
        setEventsByDate(formattedEvents);
      } catch (error) {
        console.error("Error fetching timetable:", error);
      }
    };

    fetchTimetable();
  }, [username]);

  const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
  const events = eventsByDate[formattedDate] || [];

  return (
    <div className="fw-screen min-h-screen bg-gray-200">
      <SearchBar />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex gap-4">
          <div className="w-1/4 p-4 bg-gray-100 rounded-lg min-h-screen fixed">
            {isCurrentUser && <AddEventForm addEvent={addEvent} showCalendar={showCalendar} />}
          </div>
          <div className="w-3/4 relative border border-gray-300">
            {/* Timetable Grid */}
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
                {events.map((event, index) => (
                  <Rnd
                    key={event.id}
                    default={{ x: 0, y: event.start * scale, width: "100%", height: event.height * scale }}
                    position={{ x: 0, y: event.start * scale }}
                    size={{ width: "100%", height: event.height * scale }}
                    bounds="parent"
                    enableResizing={{ top: false, right: false, bottom: true, left: false }}
                    className="absolute bg-blue-300 p-2 rounded shadow-md cursor-pointer"
                  >
                    <div className="text-sm text-center font-bold">{event.text}</div>
                    <div className="text-xs text-center mt-1">
                      {dayjs().startOf("day").add(event.start, "minutes").format("HH:mm")} -{" "}
                      {dayjs().startOf("day").add(event.end, "minutes").format("HH:mm")}
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