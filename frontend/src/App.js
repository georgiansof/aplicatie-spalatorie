import React, { useState, useEffect } from 'react';
import './App.css';

async function getRemainingTime(id) {
  const url = `http://localhost:3000/device/${id}`;
  const token = process.env.REACT_APP_SMARTTHINGS_ACCESS_TOKEN; // Replace with your actual token
  
  try {
    const response = await fetch(url, {
      method: 'POST', // HTTP method
      headers: {
        'Content-Type': 'application/json', // Set the content type
        'Authorization': `Bearer ${token}`, // Include the authorization token in the header
      },
      body: JSON.stringify({}) // If you need to send a body, include it here (currently sending an empty object)
    });
    
    // Check if the request was successful (status 200-299)
    if (!response.ok) {
      if(response.status === 500) {
        const body = await response.json();
        if(body.error === "Eroare de conexiune")
          return body.error;
      }
      return "Eroare interna";
    }

    // Parse the response body as JSON
    const data = await response.json();
    if(data.stopped === undefined)
      return "Eroare interna";
      
    const finishDate = data.completionTime.value;
    const sampleDate = data.completionTime.timestamp;
    const minsRemaining = parseInt((new Date(finishDate) - new Date()) / (1000 * 60));
    const minsLastUpdate = parseInt((new Date() - new Date(sampleDate)) / (1000 * 60));
    const minsEstimatedRemaining = minsRemaining - minsLastUpdate;
    if(minsEstimatedRemaining > 0)
      return "Timp estimat ramas: " + (minsRemaining - minsLastUpdate).toString() + "\nUltima actualizare acum " + minsLastUpdate.toString() + " minute";

    return "Oprita (Actualizat acum " + minsLastUpdate.toString() + " minute)";

  } catch (error) {
    console.error('Error:', error);
    return null; // Return null or handle the error as needed
  }
}

function MachineBlock({ id }) {
  const [remainingTime, setRemainingTime] = useState(null);

  useEffect(() => {
    const fetchTime = async () => {
      const time = await getRemainingTime(id);
      setRemainingTime(time);
    };

    fetchTime();

     const interval = setInterval(fetchTime, 30000);

     return () => clearInterval(interval);
  }, [id]);

  return (
    <div className="machine">
      <div className="block-header">
        <span>Masina nr {id}</span>
      </div>
      <div className="block-body">
        <span>
          {remainingTime !== null ? remainingTime : 'Se incarca...'}
        </span>
      </div>
    </div>
  );
}

function App() {
  return (
    <div id="page">
      {[...Array(4)].map((_, i) => (
        <MachineBlock key={i} id={i + 1} />
      ))}
    </div>
  );
}

export default App;
