const submitInformation = document.getElementById("submit");
const responseParagraph = document.getElementById("geminiResponseParagraph");
const userInput = document.getElementById("searchInput");

submitInformation.addEventListener('click', async () => {
    const userPrompt = userInput.value.trim();

    if (!userPrompt) {
        responseParagraph.textContent = "Please enter some text before submitting.";
        return;
    }

    try {
        const googleApiKey = "AIzaSyDQQ-ohHyG1192SEAu4xtZTpqQ3d9qDORE";
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`;

        const supabaseUrl = "https://oaohqolwqwolffipeude.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2hxb2x3cXdvbGZmaXBldWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTM5NjEsImV4cCI6MjA2NTg2OTk2MX0.KqitRtYpveFERToZOt0l-Wn7qMTmcNaqRq70ypk-0l4"; // Your Supabase anon (public) key

        const tableName = "userData";
        const supabaseFetchUrl = `${supabaseUrl}/rest/v1/${tableName}?select=id,name,tags`;

        responseParagraph.textContent = "Fetching data from Supabase...";
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

        let formattedSupabaseData = "Available items:\n";
        if (supabaseData.length > 0) {
            supabaseData.forEach(item => {
                formattedSupabaseData += `- ID: ${item.id}, Name: "${item.name}", Tags: [${item.tags}]\n`;
            });
        } else {
            formattedSupabaseData += "No items found in the database.\n";
        }

        const fullPrompt = `${formattedSupabaseData}\n\nUser query: "${userPrompt}"\n\nBased on the available items and my query, identify any items that match my intent or provide relevant information. Be concise and helpful. Only state Potential Match Found! new line, Name: (name), new line,and Relevant Interests: (list all tags)`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: fullPrompt }
                    ]
                }
            ]
        };

        responseParagraph.textContent = "Sending data to Gemini AI...";
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const geminiResult = await geminiResponse.json();
        console.log("Gemini AI Response:", geminiResult);

        if (geminiResult.candidates && geminiResult.candidates.length > 0 && geminiResult.candidates[0].content && geminiResult.candidates[0].content.parts && geminiResult.candidates[0].content.parts.length > 0) {
            responseParagraph.textContent = geminiResult.candidates[0].content.parts[0].text;
        } else {
            responseParagraph.textContent = "No content generated from Gemini AI or an unexpected response format.";
        }
    } catch (error) {
        console.error("Operation failed: ", error);
        responseParagraph.textContent = `An error occurred: ${error.message}. Check the console for more details.`;
    }
});