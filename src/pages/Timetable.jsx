import { useState, useEffect} from "react";
import { Rnd } from "react-rnd";
import dayjs from "dayjs";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import CustomDatePicker from "../components/CustomDatePicker";
import AddEventForm from "../components/AddEventForm";
import { fetchWithAuth } from "../utlis/api";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const scale = 1; // 1 pixel per minute

export default function Timetable() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
      const fetchEvents = async () => {
        try {
          const token = localStorage.getItem("token"); 
          const response = await fetchWithAuth(`${apiBaseUrl}timetable/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
    
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
    
          const data = await response.json();
          
          const transformedEvents = transformEvents(data);
          setEventsByDate(transformedEvents);
        } catch (error) {
          console.error("Error fetching events:", error);
        }
      };
    
      fetchEvents();
    }, []);
    
  
    // Function to transform backend data into frontend format
    const transformEvents = (backendEvents) => {
      const transformed = {};
    
      // user's time zone
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
      backendEvents.forEach((event) => {
        console.log(event.start_time);
        // const [datePart, timePart] = event.start_time.replace(" IST", "").split("T");
        // const [endDatePart, endTimePart] = event.end_time.replace(" IST", "").split("T");
    
        const [datePart, timePart] = event.start_time.replace("Z", "").split("T");
        const [endDatePart, endTimePart] = event.end_time.replace("Z", "").split("T");

        console.log(datePart);
        const [year, month, day] = datePart.split("-").map(Number);
        const [endYear, endMonth, endDay] = endDatePart.split("-").map(Number);
        const [startHour, startMinute, startSecond] = timePart.split(":").map(Number);
        const [endHour, endMinute, endSecond] = endTimePart.split(":").map(Number);
    
        const startUTC = new Date(Date.UTC(year, month - 1, day, startHour - 5, startMinute - 30, startSecond));
        const endUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, endHour - 5, endMinute - 30, endSecond));

        console.log("startUTC: ", startUTC);
        console.log("endUTC", endUTC);
        const startDate = new Date(startUTC.toLocaleString("en-US", { timeZone: userTimeZone }));
        const endDate = new Date(endUTC.toLocaleString("en-US", { timeZone: userTimeZone }));
    
        while (startDate <= endDate) {
          let nextDay = new Date(startDate);
          nextDay.setHours(23, 59, 59, 999);

          let currentEnd = nextDay < endDate ? nextDay : endDate;
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, "0");
          const day = String(startDate.getDate()).padStart(2, "0");
          const date = `${year}-${month}-${day}`;
    
          const start = convertTimeToMinutes(startDate.toTimeString().split(" ")[0]);
          const end = convertTimeToMinutes(currentEnd.toTimeString().split(" ")[0]);
          const duration = end - start;
    
          if (!transformed[date]) {
            transformed[date] = [];
          }
          console.log(date);
          console.log(start);
          console.log(startDate);
          console.log(endDate);
          transformed[date].push({
            text: event.event_name,
            start,
            end,
            height: duration,
            id: event.id,
          });
    
          startDate.setDate(startDate.getDate() + 1);
          startDate.setHours(0, 0, 0, 0);
        }
      });
  
      return transformed;
    };  
    
    // HH:mm:ss to minutes
    const convertTimeToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
  

  const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
  const events = eventsByDate[formattedDate] || [];

  const addEvent = (data) => {
    const transformedEvents = transformEvents([data]);
    
    setEventsByDate((prevEventsByDate) => {
      const updatedEvents = { ...prevEventsByDate };
  
      // Iterate over each date in transformedEvents
      Object.keys(transformedEvents).forEach(date => {
        // If the date already exists, push the new event; if not, create a new array
        updatedEvents[date] = updatedEvents[date] 
          ? [...updatedEvents[date], ...transformedEvents[date]]
          : [...transformedEvents[date]];
      });
  
      return updatedEvents;
    });
  };
  
  

  // const handleDragStop = (index, d) => {
  //   const newStart = Math.round(d.y / scale);
  //   const newEvents = events.map((event, i) =>
  //     i === index ? { ...event, start: newStart, end: newStart + event.height } : event
  //   );
  //   resolveCollisions(newEvents);
  // };

  const formatTimeForBackend = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
  };

  const resolveCollisions = async (newEvents, index) => {
    newEvents.sort((a, b) => a.start - b.start);
    const hasCollision = newEvents.some((event, i, arr) => i > 0 && arr[i - 1].end > event.start);
    setEventsByDate({ ...eventsByDate, [formattedDate]: hasCollision ? events : newEvents });
  
    if (!hasCollision) {
      const event = newEvents[index];
      const originalEvent = events[index];
  
      // chk if the event's starttime or endtime has changed
      if (event.start !== originalEvent.start || event.end !== originalEvent.end) {
        try {
          // console.log(event);
          const token = localStorage.getItem("token");
          const response = await fetchWithAuth(`${apiBaseUrl}timetable/${event.id}/`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              "start_time": formatTimeForBackend(event.start), // "HH:MM:SS"
              "end_time": formatTimeForBackend(event.end), // "HH:MM:SS"
            }),
          });
  
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
  
          console.log("Event updated successfully!");
        } catch (error) {
          console.error("Error updating event:", error);
        }
      }
    }
  };
  
  const handleDragStop = async (index, d) => {
    const newStart = Math.round(d.y / scale);
    const newEnd = newStart + events[index].height;
  
    const newEvents = events.map((event, i) =>
      i === index ? { ...event, start: newStart, end: newEnd } : event
    );
  
    resolveCollisions(newEvents, index);
  };
  const handleResizeStop = (index, ref) => {
    const newHeight = Math.round(ref.offsetHeight / scale);
    const newEvents = events.map((event, i) =>
      i === index ? { ...event, height: newHeight, end: event.start + newHeight } : event
    );
    resolveCollisions(newEvents, index);
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
          <div className="w-1/4 p-4 bg-gray-100 rounded-lg min-h-screen fixed">
            <AddEventForm addEvent={addEvent} showCalendar={showCalendar} selectedDate={selectedDate} />
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

