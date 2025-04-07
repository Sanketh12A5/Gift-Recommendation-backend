const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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
      - Budget: $${recipient.budget.min} - $${recipient.budget.max}

      Please suggest 6 personalized gift ideas that match these criteria. For each gift, provide:
      1. Name
      2. Description
      3. Estimated price (within the budget range)
      4. Category
      5. imageURL
      6. A relevant image search term for Unsplash

      Format the response as JSON with the following structure:
      {
        "gifts": [
          {
            "name": "Gift name",
            "description": "Gift description",
            "price": 99.99,
            "category": "Category",
            "imageUrl": "url for image to display in react",
            "imageQuery": "search term for unsplash"
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

    return response.gifts.map((gift, index) => ({
      ...gift,
      id: `gift-${index + 1}`,
      image: `https://source.unsplash.com/800x600/?${encodeURIComponent(gift.imageUrl)}`,
      link: `https://www.google.com/search?q=${encodeURIComponent(gift.name)}`,
    }));
  } catch (error) {
    console.error('Error generating gift suggestions:', error);

    if (error?.error?.type === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your API key and billing details.');
    }

    throw new Error('Failed to generate gift suggestions. Please try again later.');
  }
}

module.exports = { generateGiftSuggestions };
