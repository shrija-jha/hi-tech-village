const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Bot is completely connected and ready!');
});

client.initialize();

app.post('/send-whatsapp', async (req, res) => {
    try {
        const data = req.body;
        
        // Backend Validation Check for safety
        if (!data.mobile || data.mobile.length !== 10) {
            return res.status(400).json({ success: false, error: "Malformed mobile sequence" });
        }

        // ---------------------------------------------------------
        // PIPELINE 1: SEND LEAD REGISTRATION TO YOU (ADMIN)
        // ---------------------------------------------------------
        const adminMessage = `*NEW PROPERTY REGISTRATION* 🏢\n` +
                             `━━━━━━━━━━━━━━━━━━━━━━\n` +
                             `*Name:* ${data.name}\n` +
                             `*Mobile:* ${data.mobile}\n` +
                             `*Address:* ${data.address}\n\n` +
                             `*Plot Number:* ${data.plotNo}\n` +
                             `*Plot Area:* ${data.plotArea}\n` +
                             `*Property Rate:* ₹${data.propertyRate}\n` +
                             `*Advance Amount:* ₹${data.advanceAmount}\n` +
                             `*Schedule Plan:* ${data.paymentPlan}\n` +
                             `*Reference Name:* ${data.reference}\n` +
                             `━━━━━━━━━━━━━━━━━━━━━━`;
        
        const adminNumber = '919310575003'; 
        const adminJid = await client.getNumberId(adminNumber);

        if (adminJid) {
            await client.sendMessage(adminJid._serialized, adminMessage);
            console.log('✅ Admin Notification Sent.');
        }

        // ---------------------------------------------------------
        // PIPELINE 2: WHATSAPP RECEIPT FOR CLIENT 
        // ---------------------------------------------------------
        const clientMessage = `Hello ${data.name}, 👋\n\n` +
                              `Thank you for choosing HI-TECH VILLAGE presented by Infinites Horizons Opportunities PVT LTD. This is a secure receipt confirming your digital registration.\n\n` +
                              `*TRANSACTION SUMMARY:*\n` +
                              `• *Allocated Unit:* Plot No. ${data.plotNo} (${data.plotArea})\n` +
                              `• *Advance Received:* ₹${data.advanceAmount}\n` +
                              `• *Payment Scheme:* ${data.paymentPlan}\n\n` +
                              `Our executive team will reach out directly to your registered phone number (${data.mobile}) to initialize the document deeds.\n\n` +
                              `_This is an automated system confirmation._`;

        const customerNumber = `91${data.mobile}`; 
        const customerJid = await client.getNumberId(customerNumber);

        // Explicit structural verification to assert user possesses an active WhatsApp profile
        if (customerJid) {
            await client.sendMessage(customerJid._serialized, clientMessage);
            console.log(`✅ Automated client receipt dispatched successfully to: ${customerNumber}`);
            return res.status(200).json({ success: true });
        } else {
            console.log(`❌ Fail: Number 91${data.mobile} is not registered on WhatsApp.`);
            return res.status(400).json({ success: false, error: "The provided mobile number is not on WhatsApp." });
        }

    } catch (error) {
        console.error('System Pipeline Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
