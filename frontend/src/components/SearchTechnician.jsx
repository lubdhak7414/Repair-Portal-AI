// frontend/src/components/SearchTechnicians.js (React Component)
import React, { useState} from "react";
import axios from "axios";
import Navbar from '../sections/navbar.jsx'
import logo from '../assets/construction_14716868.png'
import ChatBox from '../components/Chatbox.jsx';
import {useAuth} from '../context/AuthContext.jsx'


const SearchTechnicians = () => {

  const {user} = useAuth();
  const [FilterCounts,setFilterCounts] = useState(0);
  const [currentChat, setCurrentChat] = useState(null);
  const [filters, setFilters] = useState({
    services: "",
    minRating: "",
    city: "",
    area: "",
    experience: "",
    name: "",
  });
  const [results, setResults] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL;



  const handleSearch = async (e) => {
    console.log('Clicked');
    console.log('current', filters);
    e.preventDefault();

    try {
      const cleanFilters = {
        services: filters.services || undefined,
        minRating: filters.minRating || undefined,
        area: filters.area || undefined,
        city: filters.city || undefined,
        experience: filters.experience || undefined,
        name: filters.name || undefined,
      };
      const res = await axios.post(
        `${apiUrl}/technicians/search`, // <-- Use backticks and apiUrl variable
        cleanFilters,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(res.data.length);
      setFilterCounts(res.data.length)
   

      setResults(res.data);
      console.log(res.data);
    } catch (error) {
      console.error("Error searching technicians:", error);
      setResults([]);
    }
  };


  return (
    <>
    <Navbar />
    <div className="search-container">
      <div className="header">
        
        <div className="header-title">
          <img src={logo} alt="" />

          <div className="header-title-content">
            <h2>Our Services</h2>
            <p>We Provide All Types of Repair Services</p>
          </div>



        </div>

      </div>
      <div className="count_result">
            <p>Remaining number of results {FilterCounts}</p>
      </div>

      <form onSubmit={handleSearch} >
        <div className="form-search">
            <select
            className="filter"
            value={filters.services}
            onChange={(e) => setFilters(prev=>({ ...prev, services: e.target.value }))}
          >


            <option value="">Filter</option>
            <option value="carpentry">Carpentry</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="maintenance">Maintenance</option>
            <option value="appliance Repair">Appliance Repair</option>
          </select>

          <input
            type="text"
            placeholder="Search Technician's Name"
            value={filters.name}
            className="search-bar"
            onChange={(e) => setFilters(prev=>({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="Searchinput">
            <input
              type="number"
              placeholder="Min Rating(1-5)"
              min="1"
              max="5"
              step="0.1"
              value={filters.minRating}
             
              onChange={(e) =>
                setFilters(prev=>({ ...prev, minRating: e.target.value }))
              }
            />

            <input
              type="number"
              placeholder="Experience(in Years)"
              min="0"
              
              value={filters.experience}
         
              onChange={(e) =>
                setFilters(prev=>({ ...prev,experience: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="City"
              value={filters.city}
          
              onChange={(e) => setFilters(prev=>({ ...prev, city: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Area"
              value={filters.area}

              onChange={(e) => setFilters(prev=>({ ...prev, area: e.target.value }))}
            />

            <button type="submit"  onClick={handleSearch}>Submit </button>    
        </div>
        

      </form>
      {results.length === 0 ? (
        <p>No technicians found matching your criteria</p>
      ) : (
        <ul className="tech-results">
          {results.map((tech) => (
            <li key={tech.id}>
              <img
                // src={tech.user.picture}
                // src='../assets/'
                alt="Profile"
              />
              <div className="tech-profile">
                <h3><span style={{fontWeight:'700',fontSize:'1.4rem',marginRight:'30px'}}>Name:</span>{tech.user.name}</h3>

                <h3><span style={{fontWeight:'700',fontSize:'1.4rem',marginRight:'10px'}}>Services:</span>
                   {tech.services?.map(service => service.name).join(" , ") || "No services listed"}
                </h3>
                <h3><span style={{fontWeight:'700',fontSize:'1.4rem',marginRight:'10px'}}>Experience:</span> {tech.experience} years</h3>
                <p>
                  <span style={{fontWeight:'700'}}>Rating:  </span> {tech.rating.average.toFixed(1)} ({tech.rating.count}{" "}
                  reviews)
                </p>
                {tech.serviceArea?.length > 0 && (
                  <>
                    <p><span style={{fontWeight:'700'}}>City:  </span>{tech.serviceArea[0].city}</p>
                    <p style={{textTransform:'capitalize'}}><span style={{fontWeight:'700'}}>Areas:  </span>{tech.serviceArea[0].areas.join(", ")}</p>
                  </>
                )}
                {/* <p>City: {tech.serviceArea[0].city}</p> */}
            

                <p><span style={{fontWeight:'700'}}>Hourly Rate:  </span> {tech.hourlyRate} Tk</p>
                <h3><span style={{fontWeight:'700',fontSize:'1.4rem',marginRight:'10px'}}>Is Available: </span>{tech.isAvailable ? "Yes" : "No"}</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginTop:'30px'}}>
                  <button style={{backgroundColor:'#707070' }} onClick={() => setCurrentChat(tech.user)}>Chat</button>
                  <button style={{backgroundColor:'#2f72cb'}}>Book Now</button>
                </div>

              </div>

            </li>
          ))}
        </ul>
      )}

      {currentChat && (
        <ChatBox 
          currentUser={user}
          otherUser={currentChat}
          onClose={() => setCurrentChat(null)}
        />
      )}
    </div>
    </>
  );
};

export default SearchTechnicians;
