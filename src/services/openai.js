const OpenAI = require('openai');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function fetchUnsplashImage(query) {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query,
        per_page: 1,
        orientation: 'landscape',
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const result = response.data.results[0];
    return result?.urls?.small || null;
  } catch (error) {
    console.error(`Unsplash error for query "${query}":`, error.message);
    return null;
  }
}

async function generateGiftSuggestions(recipient) {
  try {
    const prompt = `
      I need gift suggestions for someone with the following characteristics:
      - Name: ${recipient.name}
      - Age: ${recipient.age}
      - Gender: ${recipient.gender}
      - Relationship: ${recipient.relationship}
      - Interests: ${recipient.interests.join(', ')}
      - Occasion: ${recipient.occasion}
      - Budget: Rupees ${recipient.budget.min} - Rupees ${recipient.budget.max}

      Please suggest 6 personalized gift ideas that match these criteria. For each gift, provide:
      1. Name
      2. Description
      3. Estimated price (within the budget range)
      4. Category

      Format the response as JSON with the following structure:
      {
        "gifts": [
          {
            "name": "Gift name",
            "description": "Gift description",
            "price": 99.99,
            "category": "Category"
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content || '{"gifts": []}');

    // return response.gifts.map((gift, index) => ({
    //   ...gift,
    //   id: `gift-${index + 1}`,
    //   image: `https://source.unsplash.com/800x600/?${encodeURIComponent(gift.imageUrl)}`,
    //   link: `https://www.google.com/search?q=${encodeURIComponent(gift.name)}`,
    // }));
    const giftsWithImages = await Promise.all(
      response.gifts.map(async (gift, index) => {
        const image = await fetchUnsplashImage(gift.name);
        return {
          ...gift,
          id: `gift-${index + 1}`,
          imageUrl: image || `https://via.placeholder.com/400x300?text=${encodeURIComponent(gift.name)}`,
          link: `https://www.amazon.in/s?k=${encodeURIComponent(gift.name)}`,
        };
      })
    );
    return giftsWithImages;
  } catch (error) {
    console.error('Error generating gift suggestions:', error);

    if (error?.error?.type === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your API key and billing details.');
    }

    throw new Error('Failed to generate gift suggestions. Please try again later.');
  }
}

module.exports = { generateGiftSuggestions };
