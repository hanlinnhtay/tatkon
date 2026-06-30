import fetch from 'node-fetch';

const FIREBASE_BASE_URL = "https://tatkone-13cd1.firebaseio.com";

export default async function handler(req, res) {
    // Browser CORS Preflight အဆင်ပြေစေရန်
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ၁။ ဒေတာအသစ်သိမ်းဆည်းခြင်း (POST METHOD) -> Local မှ Server သို့ ပို့ချိန် သုံးမည်
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data.id) {
                return res.status(400).json({ error: "Missing 'id' field for MySQL-ready flat structure." });
            }

            // Firebase ထဲသို့ သွားသိမ်းမည့် လမ်းကြောင်း (Flat ID ပုံစံဖြင့် သိမ်းသည်)
            const targetUrl = `${FIREBASE_BASE_URL}/users/${data.id}.json`;

            const response = await fetch(targetUrl, {
                method: 'PUT', // PUT ကိုသုံးမှ ဒေတာက ထပ်မနေဘဲ Flat Row ဖြစ်မည်
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            return res.status(200).json({ success: true, database: "Firebase-Proxy", data: result });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // ၂။ ဒေတာပြန်ခေါ်ခြင်း (GET METHOD) -> Local ကနေ Server ဒေတာ ဆွဲချချိန် သုံးမည်
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${FIREBASE_BASE_URL}/users.json`);
            const firebaseData = await response.json();

            // ဒေတာ လုံးဝမရှိသေးပါက Empty Array [] ပြန်ပေးမည် (MySQL Table ကဲ့သို့)
            if (!firebaseData) {
                return res.status(200).json([]);
            }

            // Firebase Object Structure ကို MySQL Row format (Array of Objects) သို့ ပြောင်းလဲခြင်း Logic
            const flatArray = Object.keys(firebaseData).map(key => {
                // အကယ်၍ ဒေတာထဲမှာ id မပါလာခဲ့ရင် Firebase Key ကို ID အဖြစ် ယူမယ်
                return {
                    id: key,
                    ...firebaseData[key]
                };
            });

            return res.status(200).json(flatArray);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ message: "Method not allowed" });
}
