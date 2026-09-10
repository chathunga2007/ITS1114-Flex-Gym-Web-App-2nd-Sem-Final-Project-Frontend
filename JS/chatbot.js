(function () {
    const GEMINI_API_KEY = "AQ.Ab8RN6JsnPbD5nhEbWCrbp9OhEmYnEa0fg_vEQJZQQ5aCWPsMg";
    const GEMINI_MODEL = "gemini-2.5-flash";

    const SYSTEM_INSTRUCTION = `
You are "FlexBot", the official AI Fitness Coach & Customer Support Assistant for "Flex Gym" (Colombo, Sri Lanka).

=== YOUR ROLE & IDENTITY ===
- Name: FlexBot
- Organization: Flex Gym (Sri Lanka's leading high-performance fitness center)
- Tone: Energetic, motivating, professional, polite, and fitness-focused (use gym emojis like ⚡, 💪, 🏋️, 🥗, 🔥, 🏆).
- Language: English (you can also understand and politely respond in Sinhala or Singlish if the user asks in Sinhala).

=== COMPREHENSIVE FLEX GYM KNOWLEDGE BASE ===
1. MEMBERSHIP PACKAGES & PRICING:
   - Basic Monthly Plan: LKR 6,500 / month (Gym floor access, basic lockers, cardio + weight zones).
   - Standard Quarterly Plan: LKR 17,500 / 3 months (Full gym floor + free fitness assessment).
   - VIP Annual Platinum: LKR 55,000 / year (Unlimited 24/7 access, 2 free personal training sessions/month, VIP smart locker, 10% discount on supplements).
   - Student Fitness Pass: LKR 4,500 / month (Requires valid student ID).
   - Joining is fast online via our Signup page or at the front desk reception.

2. WORKING HOURS & LOCATION:
   - Location: 123 Galle Road, Kollupitiya, Colombo 03, Sri Lanka.
   - Monday to Friday: 5:30 AM – 10:00 PM
   - Saturday & Sunday: 6:00 AM – 8:00 PM
   - Public Holidays: 7:00 AM – 6:00 PM
   - Contact: info@flexgym.lk | Phone: +94 11 234 5678

3. GYM FACILITIES & AMENITIES:
   - High-Tech Cardio Zone: Matrix & LifeFitness treadmills, rowing machines, assault bikes, stair climbers.
   - Heavy Iron & Free Weights Arena: Dumbbells from 2.5kg to 50kg, Olympic barbells, power cages, squat racks, Smith machines.
   - Functional & Cross-Training Turf: Kettlebells, battle ropes, plyo boxes, sled track.
   - Contactless RFID Turnstiles: Instant QR code / card check-in.
   - Secure Smart Lockers: Free locker access for all active members.
   - Fuel Bar & Supplement Shop: Serving pre-workouts, chilled protein shakes, BCAA energy drinks, and clean snacks.

4. WORKOUT PLANS & COACHING:
   - Beginner Full Body Routine: 3 days/week focus on compound movements (Squats, Bench, Rows, Overhead Press).
   - Hypertrophy / Muscle Building: 4-5 day Upper/Lower or Push/Pull/Legs splits.
   - Fat Loss & HIIT Conditioning: Circuit training, cardio intervals, metabolic conditioning.
   - Personal Training (PT): 1-on-1 certified trainers available for personalized meal plans, form correction, and body composition tracking.

5. SUPPLEMENT STORE:
   - 100% authentic Whey Isolate, Creatine Monohydrate, Pre-workouts, BCAAs, Multivitamins, Flex Gym lifting straps, and shaker bottles.
   - Members can order online via the Shop page or purchase at the front desk.

6. ONLINE DASHBOARDS & ACCESS:
   - Member Dashboard: View active membership status, track attendance streak, view workout plans, and generate your Digital Gym Pass with QR code.
   - Trainers & Receptionists have specialized dashboards to manage clients and front-desk turnstiles.

=== STRICT GUARDRAIL & TRAINING CONSTRAINTS ===
- YOU ARE STRICTLY TRAINED FOR FLEX GYM AND FITNESS ONLY.
- If the user asks ANY question unrelated to Flex Gym, fitness, workouts, exercises, gym memberships, personal training, sports nutrition, diet, supplements, or healthy lifestyle (such as math calculations like 10+10, programming, coding, politics, general world history, video games, movie trivia, mathematics, or random general AI tasks):
  YOU MUST POLITELY DECLINE AND SAY:
  "I am FlexBot, your Flex Gym Assistant! ⚡ I cannot assist with math calculations, coding, or unrelated general tasks. I can only assist you with Flex Gym packages, workout routines, trainers, memberships, facilities, and fitness advice! 💪"
- Do NOT break character or act as a general AI. Keep answers concise, helpful, and formatted with bullet points for readability.
`;

    let conversationHistory = [];

    function formatBotMessage(text) {
        if (!text) return "";
        let formatted = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
        formatted = formatted.replace(/^• (.*?)$/gm, "<li>$1</li>");
        formatted = formatted.replace(/^\* (.*?)$/gm, "<li>$1</li>");
        formatted = formatted.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
        formatted = formatted.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="flexbot-link" target="_self">$1</a>');

        return formatted;
    }

    async function sendToGeminiApi(userMessage, apiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const contents = [];

        conversationHistory.slice(-8).forEach(turn => {
            contents.push({
                role: turn.role === "user" ? "user" : "model",
                parts: [{ text: turn.text }]
            });
        });

        contents.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        const requestBody = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 600,
                topP: 0.85
            }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${response.status} ${response.statusText}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const candidate = data.candidates && data.candidates[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error("No response generated by AI model.");
        }
        return text.trim();
    }

    function isOffTopicQuery(message) {
        if (!message) return false;
        const raw = message.trim();
        const lower = raw.toLowerCase();

        const isMathPattern = /^[\d\s\+\-\*\/\^\%\=\.\(\)]+$/.test(raw) ||
            /(\d+\s*[\+\-\*\/]\s*\d+)/.test(raw) ||
            /\b(calculate|solve|multiply|divide|square root|sin|cos|tan|log|derivative|integral|equation)\b/.test(lower);

        if (isMathPattern && !lower.includes("kg") && !lower.includes("lbs") && !lower.includes("reps") && !lower.includes("sets") && !lower.includes("calories")) {
            return true;
        }

        const offTopicKeywords = [
            "python", "javascript", "java", "c++", "html", "css", "sql", "php", "coding", "programming", "algorithm",
            "politics", "president", "minister", "election", "parliament", "war", "government",
            "movie", "cinema", "actor", "actress", "song", "lyrics", "singer", "hollywood", "bollywood",
            "capital of", "weather today", "stock market", "bitcoin", "crypto",
            "write a poem", "write code", "essay about", "history of", "geography"
        ];

        const hasOffTopicKeyword = offTopicKeywords.some(k => lower.includes(k));
        if (hasOffTopicKeyword && !lower.includes("gym") && !lower.includes("fitness") && !lower.includes("flex")) {
            return true;
        }

        return false;
    }

    function initFlexBotUI() {
        const widgetHtml = `
        <!-- FlexBot AI Floating Trigger Button -->
        <div id="flexbotFloatingBtn" class="flexbot-floating-btn" title="Chat with FlexBot AI Fitness Assistant">
            <div class="flexbot-btn-pulse"></div>
            <div class="flexbot-btn-icon">
                <span class="bot-emoji">🤖</span>
                <span class="bot-sparkle">✨</span>
            </div>
        </div>

        <!-- FlexBot AI Chat Window Container -->
        <div id="flexbotChatWindow" class="flexbot-chat-window" style="display: none;">
            <!-- Header -->
            <div class="flexbot-header">
                <div class="flexbot-header-left">
                    <div class="flexbot-avatar-wrap">
                        <div class="flexbot-avatar">⚡</div>
                        <span class="flexbot-status-dot"></span>
                    </div>
                    <div class="flexbot-title-info">
                        <h4>FlexBot AI</h4>
                        <span class="flexbot-subtitle">Flex Gym Official AI Coach</span>
                    </div>
                </div>
                <div class="flexbot-header-actions">
                    <button id="flexbotBtnClear" class="flexbot-header-btn" title="Clear Chat History">🗑️</button>
                    <button id="flexbotBtnClose" class="flexbot-header-btn" title="Minimize Chat">✕</button>
                </div>
            </div>

            <!-- Chat Messages Container -->
            <div id="flexbotMessages" class="flexbot-messages">
                <!-- Welcome Message -->
                <div class="flexbot-msg flexbot-msg-bot">
                    <div class="flexbot-msg-avatar">⚡</div>
                    <div class="flexbot-msg-content">
                        <p>Hey champion! 🏋️ Welcome to <strong>Flex Gym</strong>! I'm <strong>FlexBot</strong>, your AI Fitness Advisor powered by Google Gemini AI.</p>
                        <p>Ask me anything about our membership plans, opening hours, workout routines, certified trainers, or nutrition! 💪</p>
                    </div>
                </div>
            </div>

            <!-- Quick Suggestion Chips -->
            <div class="flexbot-chips-wrap">
                <div class="flexbot-chips" id="flexbotChips">
                    <button class="flexbot-chip" data-query="What are your membership packages and prices?">🏋️ Membership Packages</button>
                    <button class="flexbot-chip" data-query="What are Flex Gym opening hours and location?">⏰ Opening Hours</button>
                    <button class="flexbot-chip" data-query="Can you suggest a workout routine for beginners?">💪 Workout Plans</button>
                    <button class="flexbot-chip" data-query="How do I get a certified personal trainer?">🏆 Personal Trainers</button>
                    <button class="flexbot-chip" data-query="What supplements and protein powders do you have?">🥤 Fuel & Supplements</button>
                </div>
            </div>

            <!-- Typing Indicator (hidden by default) -->
            <div id="flexbotTyping" class="flexbot-typing" style="display: none;">
                <div class="flexbot-typing-avatar">⚡</div>
                <div class="flexbot-typing-dots">
                    <span></span><span></span><span></span>
                </div>
                <span class="flexbot-typing-text">FlexBot is thinking...</span>
            </div>

            <!-- Chat Footer Input Area -->
            <div class="flexbot-footer">
                <form id="flexbotForm" class="flexbot-form">
                    <input 
                        type="text" 
                        id="flexbotInput" 
                        class="flexbot-input" 
                        placeholder="Ask about workouts, packages, trainers..." 
                        autocomplete="off" 
                        maxlength="300"
                    />
                    <button type="submit" id="flexbotSendBtn" class="flexbot-send-btn" title="Send message">
                        <span>➤</span>
                    </button>
                </form>
            </div>
        </div>
        `;

        $('body').append(widgetHtml);
        bindEvents();
    }

    function appendUserMessage(text) {
        const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const msgHtml = `
        <div class="flexbot-msg flexbot-msg-user">
            <div class="flexbot-msg-content">
                <p>${escaped}</p>
            </div>
        </div>
        `;
        $('#flexbotMessages').append(msgHtml);
        scrollToBottom();
    }

    function appendBotMessage(markdownText) {
        const formatted = formatBotMessage(markdownText);
        const msgHtml = `
        <div class="flexbot-msg flexbot-msg-bot">
            <div class="flexbot-msg-avatar">⚡</div>
            <div class="flexbot-msg-content">
                ${formatted}
            </div>
        </div>
        `;
        $('#flexbotMessages').append(msgHtml);
        scrollToBottom();
    }

    function scrollToBottom() {
        const container = document.getElementById('flexbotMessages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Handle Sending User Message
    async function handleSendMessage(messageText) {
        const text = (messageText || $('#flexbotInput').val() || '').trim();
        if (!text) return;

        $('#flexbotInput').val('');
        appendUserMessage(text);

        $('#flexbotTyping').show();
        scrollToBottom();

        if (isOffTopicQuery(text)) {
            await new Promise(r => setTimeout(r, 400));
            $('#flexbotTyping').hide();
            appendBotMessage("I am FlexBot, your Flex Gym Assistant! ⚡ I cannot assist with math calculations, coding, or unrelated general tasks. I can only assist you with Flex Gym packages, workout routines, trainers, memberships, facilities, and fitness advice! 💪");
            return;
        }

        const activeApiKey = (typeof GEMINI_API_KEY === "string" ? GEMINI_API_KEY.trim() : "");

        if (!activeApiKey) {
            await new Promise(r => setTimeout(r, 400));
            $('#flexbotTyping').hide();
            appendBotMessage("⚠️ **Gemini API Key Missing:** FlexBot AI requires a valid Google Gemini API Key to chat. Please add your API key in `JS/chatbot.js` (line 6) to enable AI responses.");
            return;
        }

        try {
            const botReply = await sendToGeminiApi(text, activeApiKey);
            $('#flexbotTyping').hide();
            appendBotMessage(botReply);

            conversationHistory.push({ role: "user", text: text });
            conversationHistory.push({ role: "model", text: botReply });
        } catch (err) {
            $('#flexbotTyping').hide();
            console.error("[FlexBot Error]:", err);
            appendBotMessage(`⚠️ **Gemini AI Connection Error:** ${err.message || "Failed to communicate with Google Gemini AI."}\n\n*Please ensure your Gemini API Key in \`JS/chatbot.js\` is valid and active.*`);
        }
    }

    function bindEvents() {
        $('#flexbotFloatingBtn').on('click', function () {
            const win = $('#flexbotChatWindow');
            if (win.is(':visible')) {
                win.fadeOut(200);
            } else {
                win.fadeIn(250);
                scrollToBottom();
                $('#flexbotInput').focus();
            }
        });

        $('#flexbotBtnClose').on('click', function () {
            $('#flexbotChatWindow').fadeOut(200);
        });

        $('#flexbotForm').on('submit', function (e) {
            e.preventDefault();
            handleSendMessage();
        });

        $(document).on('click', '.flexbot-chip', function () {
            const query = $(this).attr('data-query');
            if (query) {
                handleSendMessage(query);
            }
        });

        $('#flexbotBtnClear').on('click', function () {
            conversationHistory = [];
            $('#flexbotMessages').html(`
                <div class="flexbot-msg flexbot-msg-bot">
                    <div class="flexbot-msg-avatar">⚡</div>
                    <div class="flexbot-msg-content">
                        <p>Chat cleared! ⚡ How else can I help your fitness journey at <strong>Flex Gym</strong> today? 💪</p>
                    </div>
                </div>
            `);
        });
    }

    $(document).ready(function () {
        if ($(".dash-layout").length === 0 && $("#flexbotFloatingBtn").length === 0) {
            initFlexBotUI();
        }
    });
})();