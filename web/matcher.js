const submitInformation = document.getElementById("submit");
const userInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("resultsContainer");
const loadingIndicator = document.getElementById("loadingIndicator");

async function getConnections() {
    const userPrompt = userInput.value.trim();
    if (!userPrompt) {
        resultsContainer.innerHTML = `<p class="text-gray-400 text-center">Please enter some text before searching.</p>`;
        return;
    }

    resultsContainer.innerHTML = ''; // Clear previous results
    loadingIndicator.classList.remove('hidden'); // Show loading indicator

    try {
        const googleApiKey = "AIzaSyDQQ-ohHyG1192SEAu4xtZTpqQ3d9qDORE"; // Replace with your actual API key
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`;

        const supabaseUrl = "https://oaohqolwqwolffipeude.supabase.co"; // Your Supabase URL
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2hxb2x3cXdvbGZmaXBldWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTM5NjEsImV4cCI6MjA2NTg2OTk2MX0.KqitRtYpveFERToZOt0l-Wn7qMTmcNaqRq70ypk-0l4"; // Your Supabase anon (public) key

        const tableName = "userData";
        // ONLY select the fields you want to use/display
        const supabaseFetchUrl = `${supabaseUrl}/rest/v1/${tableName}?select=id,name,university,tags,linkedin`;

        // Fetch data from Supabase
        const supabaseResponse = await fetch(supabaseFetchUrl, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        if (!supabaseResponse.ok) {
            const errorData = await supabaseResponse.json();
            throw new Error(`Supabase fetch failed: ${errorData.message || 'Unknown error'}`);
        }

        const supabaseData = await supabaseResponse.json();
        console.log("Data from Supabase:", supabaseData);

        let formattedSupabaseData = "Available users data:\n";
        if (supabaseData.length > 0) {
            supabaseData.forEach(item => {
                formattedSupabaseData += `- ID: ${item.id}, Name: "${item.name}", University: "${item.university}", Tags: [${item.tags}], LinkedIn: "${item.linkedin}"\n`;
            });
        } else {
            formattedSupabaseData += "No users found in the database.\n";
        }

        // Construct the prompt for Gemini, focusing on Name, University, Tags, LinkedIn
        const fullPrompt = `${formattedSupabaseData}\n\nUser query: "${userPrompt}"\n\nBased on the available users and my query, identify any users that match my intent or provide relevant information. For each matched user, output their details in this exact format: "Name: [Name]|University: [University Name]|Interests: [Comma separated tags]|LinkedIn: [LinkedIn URL]". If no match is found, just say "No matches found."`;


        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: fullPrompt }
                    ]
                }
            ]
        };

        // Send data to Gemini AI
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const geminiResult = await geminiResponse.json();
        console.log("Gemini AI Response:", geminiResult);

        loadingIndicator.classList.add('hidden'); // Hide loading indicator

        if (geminiResult.candidates && geminiResult.candidates.length > 0 && geminiResult.candidates[0].content && geminiResult.candidates[0].content.parts && geminiResult.candidates[0].content.parts.length > 0) {
            const geminiText = geminiResult.candidates[0].content.parts[0].text;
            
            if (geminiText.includes("No matches found.")) {
                resultsContainer.innerHTML = `<p class="text-gray-400 text-center">No matches found for your query.</p>`;
                return;
            }

            // Attempt to parse the Gemini response into individual user objects
            const userStrings = geminiText.split('\n').filter(line => line.startsWith('Name:'));
            
            if (userStrings.length === 0) {
                 resultsContainer.innerHTML = `<p class="text-gray-400 text-center">Could not parse a valid user from the AI response. Try a different query or refine the prompt.</p>`;
                 return;
            }

            userStrings.forEach(userStr => {
                const parts = userStr.split('|').map(part => part.trim());
                let name = '';
                let university = '';
                let interests = [];
                let linkedin = '';

                parts.forEach(part => {
                    if (part.startsWith('Name:')) {
                        name = part.substring('Name:'.length).trim();
                    } else if (part.startsWith('University:')) {
                        university = part.substring('University:'.length).trim();
                    } else if (part.startsWith('Interests:')) {
                        interests = part.substring('Interests:'.length).split(',').map(tag => tag.trim()).filter(tag => tag);
                    } else if (part.startsWith('LinkedIn:')) {
                        linkedin = part.substring('LinkedIn:'.length).trim();
                    }
                });

                // Create the user box element
                const userBox = document.createElement('div');
                userBox.classList.add('user-box'); // Apply custom CSS class
                
                // Construct the HTML for the box, displaying Name, University, Interests, and LinkedIn
                userBox.innerHTML = `
                    <div class="flex flex-col">
                        <span class="name">${name || 'Unknown Name'}</span>
                        ${university ? `<span class="details">${university}</span>` : ''}
                    </div>
                    <div class="flex flex-col text-right">
                        ${interests.length > 0 ? `<span class="details text-xs text-gray-400">${interests.join(', ')}</span>` : ''}
                        ${linkedin ? `<a href="${linkedin}" target="_blank" class="text-blue-300 hover:text-blue-200 text-sm mt-1">LinkedIn Profile</a>` : ''}
                    </div>
                `;
                resultsContainer.appendChild(userBox);
            });

        } else {
            resultsContainer.innerHTML = `<p class="text-gray-400 text-center">No relevant connections found for your query. Try searching for different interests or skills!</p>`;
        }
    } catch (error) {
        console.error("Operation failed: ", error);
        loadingIndicator.classList.add('hidden'); // Hide loading indicator on error
        resultsContainer.innerHTML = `<p class="text-red-400 text-center">An error occurred: ${error.message}. Check the console for more details.</p>`;
    }
}

submitInformation.addEventListener('click', getConnections);

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission if input is in a form
        getConnections();
    }
});