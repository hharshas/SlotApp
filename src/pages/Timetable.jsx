import { useState, useEffect} from "react";
import { Rnd } from "react-rnd";
import dayjs from "dayjs";
import UpdateEventForm from "../components/UpdateEventForm";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import CustomDatePicker from "../components/CustomDatePicker";
import AddEventForm from "../components/AddEventForm";
import { fetchWithAuth } from "../utlis/api";
import {motion, AnimatePresence} from "framer-motion";
import { X, PencilLine } from "lucide-react"; 

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const scale = 1; // 1 pixel per minute

export default function Timetable() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState(null);


  const openModal = (event) => {
    setModalEvent({...modalEvent, id: event});
    setIsModalOpen(true);
  };

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
  
      Object.keys(transformedEvents).forEach(date => {
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

  const formatTimeForBackend = (date, minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
  
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
 
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const istDate = new Date(utcDate.getTime() + istOffset);
  
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const day = String(istDate.getDate()).padStart(2, "0");
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(mins).padStart(2, "0");
  
    return `${year}-${month}-${day}T${formattedHours}:${formattedMinutes}:00Z`;
};

  
  const resolveCollisions = async (newEvents, index) => {
    newEvents.sort((a, b) => a.start - b.start);
    const hasCollision = newEvents.some((event, i, arr) => i > 0 && arr[i - 1].end > event.start);
    setEventsByDate({ ...eventsByDate, [formattedDate]: hasCollision ? events : newEvents });
  
    if (!hasCollision) {
      const event = newEvents[index];
      const originalEvent = events[index];
  
      if (event.start !== originalEvent.start || event.end !== originalEvent.end) {
        try {
          const token = localStorage.getItem("token");
          console.log("this is eventDate", selectedDate);
          const response = await fetchWithAuth(`${apiBaseUrl}timetable/${event.id}/`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              // "YYYY-MM-DDTHH:MM:SSZ"
              "start_time": formatTimeForBackend(selectedDate, event.start), 
              "end_time": formatTimeForBackend(selectedDate, event.end),  
            }),
          });
  
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          let data = await response.json();
          console.log("Event updated successfully!", data);
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
  const handleUpdate = async(index) => {
    const newEvents = events.map((event, i) =>
      i === index ? { ...event, start: newStart, end: newEnd } : event
    );
    resolveCollisions(newEvents, index);
  }
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
  const handleDelete = async (eventId) => {
    console.log("handledelete is callinng");
    try {
      const token = localStorage.getItem("token"); 
      const response = await fetchWithAuth(`${apiBaseUrl}timetable/delete/${eventId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });
  
      if (response.status === 204) {
        setEventsByDate((prevEventsByDate) => {
          let updatedEvents = { ...prevEventsByDate };
          Object.keys(updatedEvents).forEach(date => {
            updatedEvents[date] = updatedEvents[date].filter(event => event.id !== eventId);
            if (updatedEvents[date].length === 0) {
              delete updatedEvents[date];
            }
          });
          return updatedEvents;
        });
  
        console.log("Event deleted successfully");
      } else {
        const errorData = await response.json();
        console.error("Error deleting event:", errorData);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };
  const [isNearRightButton, setIsNearRightButton] = useState(false);

  const [
    mousePosition,
    setMousePosition
  ] = useState({ x: null, y: null });
    useEffect(() => {
    const updateMousePosition = ev => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  useEffect(()=>{
    setIsNearRightButton(mousePosition.x >1700);
  }, [mousePosition])

  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="min-h-screen bg-gray-200"
  >
    <UpdateEventForm setEventsByDate = {setEventsByDate} apiBaseUrl = {apiBaseUrl} isModalOpen = {isModalOpen} setIsModalOpen = {setIsModalOpen} setModalEvent={setModalEvent} modalEvent={modalEvent} transformEvents={transformEvents} />
    <div
     className="fw-screen min-h-screen bg-gray-200 ">
      {/* {mousePosition.x} */}
      <div className="flex flex-col gap-4 p-4">
        {/* timetable grid */}
        <div className="flex gap-4">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-1/4 p-4 bg-gray-100 rounded-lg min-h-screen fixed bg-gradient-to-tl from-gray-200 to-gray-00"
          >
            <AddEventForm
              addEvent={addEvent}
              showCalendar={showCalendar}
              selectedDate={selectedDate}
            />
          </motion.div>
          <div className="w-1/4 p-4">
            {/* <AddEventForm addEvent={addEvent} /> */}
          </div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-3/4 relative border border-gray-300"
          >
            {/* Date Navigation Bar */}
            {true && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex justify-between bg-gray-200 p-2 rounded"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-1 bg-gray-500 text-white rounded cursor-pointer"
                  onClick={() => handleDateChange(-1)}
                >
                  Prev
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 border rounded text-center cursor-pointer"
                  onClick={handleCalendarToggle}
                >
                  {dayjs(selectedDate).format('MMM DD, YYYY')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-1 bg-gray-500 text-white rounded cursor-pointer"
                  onClick={() => handleDateChange(1)}
                >
                  Next
                </motion.button>
              </motion.div>
            )}
              {/* Full-Screen Calendar Modal */}
              {showCalendar && (
                <>
                  <motion.div
                    className="w-full p-4 h-[calc(100vh-10vh)]"
                  >
                    <CustomDatePicker
                      selectedDate={selectedDate}
                      handleDateSelect={handleDateSelect}
                      eventsByDate={eventsByDate}
                    />
                  </motion.div>
                </>
              )}

            {/* Timetable Hours */}
            {!showCalendar && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
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
                  <>{!isNearRightButton && (
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
                    enableResizing={{
                      top: false,
                      right: false,
                      bottom: true,
                      left: false,
                    }}
                    onDragStop={(e, d) => handleDragStop(index, d)}
                    onResizeStop={(e, direction, ref) => handleResizeStop(index, ref)}
                    className="absolute p-2 rounded shadow-md cursor-pointer overflow-hidden bg-blue-500/30 backdrop-blur-xs border border-blue-200/30"
                  >
                    {/* Delete Button */}
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("this is clalling ");
                      handleDelete(event.id);
                    }}
                    className="absolute top-1 right-1 p-1 bg-white rounded-full shadow hover:bg-gray-200"
                  >
                    <X size={12} className="text-red-500" />
                    {/* kutta ja bai hu */}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("this is clalling ");
                      handleDelete(event.id);
                    }}
                    className="absolute top-1 right-8 p-1 bg-white rounded-full shadow hover:bg-gray-200"
                  >
                    <PencilLine size={12} className="text-red-500" />
                    {/* kutta ja bai hu */}
                  </button>
                    {/* Event Details */}
                    <div className="text-sm text-center font-bold">{event.text}</div>
                    <div className="text-xs text-center mt-1">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                  </Rnd>
                  )}

{isNearRightButton && (
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
                    disableDragging
                    enableResizing={{
                      top: false,
                      right: false,
                      bottom: true,
                      left: false,
                    }}
                    onDragStop={(e, d) => handleDragStop(index, d)}
                    onResizeStop={(e, direction, ref) => handleResizeStop(index, ref)}
                    className="absolute p-2 rounded shadow-md cursor-pointer overflow-hidden bg-blue-500/30 backdrop-blur-xs border border-blue-200/30"
                  >
                    {/* Delete Button */}
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("this is clalling ");
                      handleDelete(event.id);
                    }}
                    className="absolute top-1 right-1 p-1 bg-white rounded-full shadow hover:bg-gray-200"
                  >
                    <X size={12} className="text-red-500" />
                    {/* kutta ja bai hu */}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("this is clalling ");
                      openModal(event.id);
                    }}
                    className="absolute top-1 right-8 p-1 bg-white rounded-full shadow hover:bg-gray-200"
                  >
                    <PencilLine size={12} className="text-red-500" />
                    {/* kutta ja bai hu */}
                  </button>
                    {/* Event Details */}
                    <div className="text-sm text-center font-bold">{event.text}</div>
                    <div className="text-xs text-center mt-1">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                  </Rnd>
                  )}
                  
                  </>

))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  </motion.div>
  );
}

