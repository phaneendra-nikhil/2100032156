const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 9876;

// Constants
const WINDOW_SIZE = 10;
let numbers = [];

// Function to calculate average of an array
const calculateAverage = (arr) => {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((acc, curr) => acc + curr, 0);
    return sum / arr.length;
};

// Middleware to handle JSON parsing
app.use(express.json());

// Endpoint to handle /numbers/:numberid
app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    // Validate numberid
    if (!['p', 'f', 'e', 'r'].includes(numberid)) {
        return res.status(400).json({ error: 'Invalid number ID' });
    }

    // Get access token from environment variables
    const accessToken = process.env.ACCESS_TOKEN;

    try {
        // Fetch numbers from third-party server based on numberid
        let apiUrl;
        switch (numberid) {
            case 'p':
                apiUrl = 'http://20.244.56.144/test/primes';
                break;
            case 'f':
                apiUrl = 'http://20.244.56.144/test/fibo';
                break;
            case 'e':
                apiUrl = 'http://20.244.56.144/test/even';
                break;
            case 'r':
                apiUrl = 'http://20.244.56.144/test/random';
                break;
            default:
                apiUrl = '';
        }

        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data from third-party server (${response.status})`);
        }

        const responseData = await response.text(); // Read response as text first

        // Attempt to parse JSON
        let fetchedNumbers;
        try {
            fetchedNumbers = JSON.parse(responseData).numbers; // Extract 'numbers' array from JSON
        } catch (error) {
            console.error('Error parsing JSON:', error);
            throw new Error('Invalid JSON received from third-party server');
        }

        // Validate fetchedNumbers is an array
        if (!Array.isArray(fetchedNumbers)) {
            throw new Error('Expected array of numbers from third-party server');
        }

        // Filter out duplicates and ensure uniqueness
        const uniqueNumbers = [...new Set([...numbers, ...fetchedNumbers])];

        // Limit to WINDOW_SIZE
        numbers = uniqueNumbers.slice(-WINDOW_SIZE);

        // Calculate average of numbers
        const avg = calculateAverage(numbers);

        // Prepare response in the required format
        const responseObj = {
            windowPrevState: numbers.length > fetchedNumbers.length ? numbers.slice(0, -fetchedNumbers.length) : [],
            windowCurrState: numbers,
            numbers: fetchedNumbers,
            avg: avg.toFixed(2),
        };

        // Respond with JSON
        res.json(responseObj);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
