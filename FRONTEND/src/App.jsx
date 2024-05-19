import React, { useContext, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Appointment from "./Pages/Appointment";
import AboutUs from "./Pages/AboutUs";
import Register from "./Pages/Register";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Context } from "./main";
import Login from "./Pages/Login";
import { socket } from "./socket";

let patientId = "";

const App = () => {

  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const handleSocket = () => {
    socket.on("connect", () => {
      console.log("socket connected", socket.id)
    });

    // socket.onAny((eventName, ...args) => {
    //   console.log(eventName,args)
    // });

    socket.on("appointmentStatusUpdated", (data, callback) => {
      console.log(data)
      if (data.patientId == patientId) {
        if (data.status === "Pending") {
          toast.info("Appointment for doctor " + data.doctor.firstName + data.doctor.lastName + " Status " + data.status + "!", {
            position: "top-center",
          });
        }
        if (data.status === "Accepted") {
          toast.success("Appointment for doctor " + data.doctor.firstName + data.doctor.lastName + " Status " + data.status + "!", {
            position: "top-center",
          });
        }
        if (data.status === "Rejected") {
          toast.error("Appointment for doctor " + data.doctor.firstName + data.doctor.lastName + " Status " + data.status + "!", {
            position: "top-center",
          });
        }
      }
      // also send browser notification 
      window.Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const notification = new Notification('Appointment Status Updated!', {
            body: `Appointment for doctor ${data.doctor.firstName} ${data.doctor.lastName} Status ${data.status}!`,
            icon: 'https://img.icons8.com/ios/452/medical-doctor.png'
          });
          notification.onclick = () => {
            window.open('http://localhost:5173/');
          }
        }
        callback(true);
      }
      );
    })

  }

  useEffect(() => {
    handleSocket();

    return () => {
      socket.off("appointmentStatusUpdated");
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/v1/user/patient/me",
          {
            withCredentials: true,
          }
        );
        setIsAuthenticated(true);
        setUser(response.data.user);
        socket.emit("connection_id", {
          user: response.data.user,
          id: socket.id
        })
        patientId = response.data.user._id;

        socket.emit("pendingNotifications", { id: patientId }, (data) => {
          if (data) {
            if (data.status === "Pending") {
              toast.info("Appointment for doctor " + data.doctor.firstName + data.doctor.lastName + " Status " + data.status + "!", {
                position: "top-center",
              });
            }
            if (data.status === "Accepted") {
              toast.success("Appointment for doctor " + data.doctor.firstName + data.doctor.lastName + " Status " + data.status + "!", {
                position: "top-center",
              });
            }
            if (data.status === "Rejected") {
              toast.error("Appointment for doctor " + data.doctor.firstName + data.doctor.lastName + " Status " + data.status + "!", {
                position: "top-center",
              });
            }
          }
        }
        );

      } catch (error) {
        setIsAuthenticated(false);
        setUser({});
      }
    };
    fetchUser();

  }, [isAuthenticated]);

  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

        </Routes>
        <Footer />
        <ToastContainer position="top-center" />
      </Router>
    </>
  );
};

export default App;
