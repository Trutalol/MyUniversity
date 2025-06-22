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
        // *** IMPORTANT CHANGE HERE ***
        // Instead of hardcoding API keys and directly calling Gemini/Supabase,
        // we now call YOUR Vercel API Route.
        const apiEndpoint = '/api/connections'; // This path depends on where you place your api/connections.ts file in your Vercel project

        // Send the user's prompt to your Vercel API Route
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userPrompt: userPrompt }) // Send the user input to the backend
        });

        // Check if the response from YOUR Vercel API Route was successful
        if (!response.ok) {
            const errorData = await response.json();
            // The error message now comes from your Vercel function
            throw new Error(`API request failed: ${errorData.error || 'Unknown error'}`);
        }

        // The response from your Vercel API Route will be the Gemini result
        const geminiResult = await response.json();
        console.log("Gemini AI Response received from Vercel API:", geminiResult);

        loadingIndicator.classList.add('hidden'); // Hide loading indicator

        // The parsing and display logic for the Gemini response remains the same
        if (geminiResult.candidates && geminiResult.candidates.length > 0 && geminiResult.candidates[0].content && geminiResult.candidates[0].content.parts && geminiResult.candidates[0].content.parts.length > 0) {
            const geminiText = geminiResult.candidates[0].content.parts[0].text;
            
            if (geminiText.includes("No matches found.")) {
                resultsContainer.innerHTML = `<p class="text-gray-400 text-center">No matches found for your query.</p>`;
                return;
            }

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

                const userBox = document.createElement('div');
                userBox.classList.add('user-box'); // Apply custom CSS class
                
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
