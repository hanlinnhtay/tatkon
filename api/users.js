import fetch from 'node-fetch';

const FIREBASE_BASE_URL = "https://tatkone-13cd1.firebaseio.com";

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    // ၁။ ဒေတာ သိမ်းဆည်းခြင်း (POST)
    if (req.method === 'POST') {
        try {
            const data = req.body;
            if (!data.id) {
                return res.status(400).json({ error: "MySQL Flow အရ 'id' ကွင်းပြင် (Field) မဖြစ်မနေ ပါရပါမည်။" });
            }

            const response = await fetch(`${FIREBASE_BASE_URL}/users/${data.id}.json`, {
                method: 'PUT',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // ၂။ ဒေတာ ပြန်ခေါ်ခြင်း (GET)
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${FIREBASE_BASE_URL}/users.json`);
            const firebaseData = await response.json();

            // Firebase ဘက်ကနေ ဒေတာမရှိရင် သို့မဟုတ် Error Message String ပြန်လာရင် [] ပေးမည်
            if (!firebaseData || typeof firebaseData === 'string' || firebaseData.error) {
                return res.status(200).json([]);
            }

            // Firebase Object Structure ကို MySQL Row Style Array ပြောင်းလဲခြင်း
            const flatArray = Object.keys(firebaseData).map(key => ({
                id: key,
                ...firebaseData[key]
            }));

            return res.status(200).json(flatArray);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ message: "Method not allowed" });
}
