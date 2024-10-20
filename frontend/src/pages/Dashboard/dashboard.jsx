import React, { useState, useEffect } from 'react';
import requestApi from "../../components/utils/axios";
import { getDecryptedCookie } from "../../components/utils/encrypt";
import { jwtDecode } from 'jwt-decode';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, FormControlLabel } from '@mui/material';
import './dashboard.css';

function Dashboard() {

  const [myRegisteredCourses, setMyRegisteredCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [previousCourseId, setPreviousCourseId] = useState(null);
  const [requestedCourses, setRequestedCourses] = useState([]);
  const [rejectedCourse, setRejectedCourse] = useState([])
  const encryptedAuthToken = getDecryptedCookie("authToken");

  if (!encryptedAuthToken) {
    throw new Error("Auth token not found");
  }

  const decodedToken = jwtDecode(encryptedAuthToken);
  const { id } = decodedToken;
  const fetchMyRegisteredCourses = async () => {
    try {
      const result = await requestApi("POST", `/stu-course`, {
        student: id
      });

      if (result.success) {
        setMyRegisteredCourses(result.data.result);
      } else {
        console.error("Error fetching registered courses", result.error);
      }
    } catch (error) {
      console.error("Error during fetch registered courses", error);
    }
  };

  const fetchRequestedCourses = async () => {
    try {
      const result = await requestApi("POST", `/stu-req`, {
        student: id
      });

      if (result.success) {
        setRequestedCourses(result.data.result);
      } else {
        console.error("Error fetching requested courses", result.error);
      }
    } catch (error) {
      console.error("Error during fetch requested courses", error);
    }
  };

  const fetchRejectedCourse = async()=>{
    try {
      const result = await requestApi("POST", `/stu-rej`, {
        student: id
      });

      if (result.success) {
        setRejectedCourse(result.data.result);
      } else {
        console.error("Error fetching rejected courses", result.error);
      }
    } catch (error) {
      console.error("Error during fetch rejected courses", error);
    }
  }
  useEffect(() => {
    fetchMyRegisteredCourses();
    fetchRequestedCourses();
    fetchRejectedCourse()
  }, [id]);

  const handleRequestEdit = async (courseId) => {
    setPreviousCourseId(courseId);
    try {
      const result = await requestApi("POST", `/stu-avail`, {
        student: id
      });

      if (result.success) {
        setAvailableCourses(result.data.result);
        setOpenDialog(true);
      } else {
        console.error("Error fetching available courses", result.error);
      }
    } catch (error) {
      console.error("Error during fetch available courses", error);
    }
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleSubmitRequest = async () => {
    try {
      const result = await requestApi("POST", `/c-request`, {
        student: id,
        f_course: previousCourseId,
        t_course: selectedCourseId
      });

      if (result.success) {
        console.log("Course edit request submitted successfully");
        setOpenDialog(false);
      } else {
        console.error("Error submitting course edit request", result.error);
      }
    } catch (error) {
      console.error("Error during course edit request", error);
    }
  };

  return (
    <div className="dashboard">
      <h3>My Registered Courses</h3>
      {myRegisteredCourses.length >0 ?(<div className="course-card-container">
        {myRegisteredCourses.map((course, index) => (
          <div className="course-card" key={index}>
            <div className='course-flex'>
              <h3 className="course-name">{course.course_type}</h3>
              <p><strong>Course:</strong> {course.code}- {course.course_name} </p>
              <p><strong>Department:</strong> {course.department}</p>
            </div>
            <button
              className="request-edit-button"
              onClick={() => handleRequestEdit(course.c_id)}
            >
              Request Edit
            </button>
          </div>
        ))}
      </div>)
    :(
      <p>No Registered Course...</p>
    )  
    }
    <br />

      <h3>Requested Course Changes</h3>
      {requestedCourses.length >0 ?(<div className="requested-course-card-container">
        {requestedCourses.map((request, index) => (
          <div className="requested-course-card" key={index}>
            {/* <h3>{request.student_name} ({request.student_reg_no})</h3> */}
            <p><strong>Registered Course:</strong> {request.f_course_code} - {request.f_course_name} ({request.f_course_type})</p>
            <p><strong>Requested Course:</strong> {request.t_course_code} - {request.t_course_name} ({request.t_course_type})</p>
            <p><strong>Requested Count:</strong> {request.count}</p>
          </div>
        ))}
      </div>)
      :(
        <p>No Requested Course records...</p>
      )}
  <br />
      <h3>Rejected Course Changes</h3>
      { rejectedCourse.length >0 ? (<div className="requested-course-card-container">
        {rejectedCourse.map((request, index) => (
          <div className="requested-course-card" key={index}>
            {/* <h3>{request.student_name} ({request.student_reg_no})</h3> */}
            <p><strong>Course Registered:</strong> {request.f_course_code} - {request.f_course_name} ({request.f_course_type})</p>
            <p><strong>Requested Course:</strong> {request.t_course_code} - {request.t_course_name} ({request.t_course_type})</p>
            <p><strong>Requested Count:</strong> {request.count}</p>
            <p><strong>Reason:</strong> {request.reason}</p>
          </div>
        ))}
      </div>)
    :(
      <div>No Rejected Course records...</div>
    )  
    }

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Select New Course</DialogTitle>
        <DialogContent>
          {availableCourses.map((course) => (
            <FormControlLabel
              key={course.id}
              control={
                <Checkbox
                  checked={selectedCourseId === course.id}
                  onChange={() => handleCourseSelect(course.id)}
                />
              }
              label={`${course.code} - ${course.name} (Max Count: ${course.max_count})`}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitRequest} color="primary" disabled={!selectedCourseId}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Dashboard;
