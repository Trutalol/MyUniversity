const submitInformation = document.getElementById("submit");
const responseParagraph = document.getElementById("response");
const userInput = document.getElementById("userInput");

submitInformation.addEventListener('click', async () => {
  const userTags = userInput.value.trim();

  if (!userTags) {
    responseParagraph.textContent = "Please enter some text before submitting.";
    return;
  }

  try {
    const apiKey = "AIzaSyDQQ-ohHyG1192SEAu4xtZTpqQ3d9qDORE";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const supabaseUrl = "https://oaohqolwqwolffipeude.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2hxb2x3cXdvbGZmaXBldWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTM5NjEsImV4cCI6MjA2NTg2OTk2MX0.KqitRtYpveFERToZOt0l-Wn7qMTmcNaqRq70ypk-0l4";
    const accessToken = "sbp_48eeac920a98933cec331c48ddf81db9c6ded1c9";
    const tableName = "userData";
    const url = "${supabaseURL}/rest/v1/${tableName}?select=*";

    const requestBody = {   
      contents: [
        {
          parts: [
            {
              text: userTags
            }
          ]
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
    responseParagraph.textContent = result.candidates[0].content.parts[0].text;
    } else {
      responseParagraph.textContent = "No content generated or an unexpected response format.";
    }
  } catch (error) {
    console.error("Error calling Gemini AI: ", error);
    responseParagraph.textContent = "An error occurred while connecting to Gemini AI. Check the console for more details.";
  }
});