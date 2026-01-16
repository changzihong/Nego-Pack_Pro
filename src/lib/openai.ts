import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    console.warn('OpenAI API Key is missing in .env');
}

export const openai = new OpenAI({
    apiKey: apiKey || '',
    dangerouslyAllowBrowser: true // Note: In production, AI calls should be handled via backend to protect API keys
});
