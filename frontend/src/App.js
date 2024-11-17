
import './App.css';

async function getRemainingTime(id) {
  const url = `https://grozad.onrender.com/device/${id}`;
  const token = process.env.SMARTTHINGS_ACCESS_TOKEN; // Replace with your actual token
  
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
      return response.status;
    }

    // Parse the response body as JSON
    const data = await response.json();

    // Assuming 'remainingTime' is part of the response body, adjust as needed
    return data.remainingTime;

  } catch (error) {
    console.error('Error:', error);
    return null; // Return null or handle the error as needed
  }
}


function App() {
  const machineBlock = (id) => (
    <div class='machine'>
      <div class='block-header'>
        <span>Masina nr {id}</span>
      </div>
      <div class='block-body'>
        <span>Timp ramas: {getRemainingTime(id)}</span>
      </div>
    </div>
  );

  return (
    <div id="page">
      {[...Array(4)].map((_, i) => machineBlock(i+1))}
    </div>
  );
}

export default App;
