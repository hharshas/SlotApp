import { useState } from "react";
import { motion } from "framer-motion";
import { fetchWithAuth } from "../utlis/api";



const  UpdateEventForm = ({setEventsByDate, selectedDate, apiBaseUrl, isModalOpen, setIsModalOpen, setModalEvent, modalEvent, transformEvents}) => {

  const closeModal = () => {
    setIsModalOpen(false);
    setModalEvent(null);
  };

  const formatDateTime = (date) => {
   // (+5:30)
   const istOffset = 5.5 * 60 * 60 * 1000; 
   const utcDate = date.getTime() + date.getTimezoneOffset() * 60 * 1000; // local time to UTC
   const istDate = new Date(utcDate + istOffset); // apply offset
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

    const handleEventUpdate = async () => {
        console.log(modalEvent);
        let start = new Date(modalEvent.start_time);
        let end = new Date(modalEvent.end_time);
      
        if (start >= end) {
          alert("Start time must be earlier than end time!");
          return;
        }
      
        try {
          const token = localStorage.getItem("token");
          console.log("this is eventDate", selectedDate);
          const response = await fetchWithAuth(`${apiBaseUrl}timetable/${modalEvent.id}/`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              "event_name": modalEvent.event_name,
              "start_time": formatDateTime(start), 
              "end_time": formatDateTime(end),  
            }),
          });
      
          if (!response.ok) {
            if (response.status === 500) {
              alert("Error: The selected time slot overlaps with another event.");
              return;
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
      
          let data = await response.json();
          console.log("event updated successfully!", data);
          await fetchEvents();
          closeModal();
        } catch (error) {
          console.error("error updating event:", error);
        }
      };
      

  return (
    <div>
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center h-screen w-screen z-20">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Update Event</h2>
            <input
              type="text"
              className="w-full p-2 border rounded mb-2"
              value={modalEvent.event_name}
              onChange={(e) => setModalEvent({ ...modalEvent, event_name: e.target.value })}
            />
            <input
              type="datetime-local"
              className="w-full p-2 border rounded mb-2"
              value={modalEvent.start_time}
              onChange={(e) => setModalEvent({ ...modalEvent, start_time: e.target.value })}
            />
            <input
              type="datetime-local"
              className="w-full p-2 border rounded mb-2"
              value={modalEvent.end_time}
              onChange={(e) => setModalEvent({ ...modalEvent, end_time: e.target.value })}
            />
            <button className="p-2 bg-blue-500 text-white rounded w-full" onClick={handleEventUpdate}>
              Update Event
            </button>
            <button className="p-2 bg-gray-500 text-white rounded w-full mt-2" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateEventForm;
